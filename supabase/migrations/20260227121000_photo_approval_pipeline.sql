-- Approval workflow for profile photos with batch moderation support

-- Extend profile_photos with approval metadata
ALTER TABLE public.profile_photos
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'in_review', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS requested_primary boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profile_photos_approval_status ON public.profile_photos(approval_status);

-- Backfill existing photos as approved
UPDATE public.profile_photos
SET approval_status = 'approved', approved_at = COALESCE(approved_at, now()), requested_primary = false
WHERE approval_status IS NULL OR approval_status = 'pending';

-- Notification trigger for pending photos
CREATE OR REPLACE FUNCTION public.enqueue_photo_pending_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.approval_status = 'pending' THEN
    INSERT INTO public.admin_notifications(type, target_user_id, target_photo_id, status, created_at)
    VALUES ('photo_pending', NEW.user_id, NEW.id, 'pending', now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_photo_pending_notification ON public.profile_photos;
CREATE TRIGGER trg_photo_pending_notification
AFTER INSERT ON public.profile_photos
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_photo_pending_notification();

-- RLS rewrite for photos
DROP POLICY IF EXISTS profile_photos_select_public ON public.profile_photos;
DROP POLICY IF EXISTS profile_photos_insert_self ON public.profile_photos;
DROP POLICY IF EXISTS profile_photos_update_self ON public.profile_photos;
DROP POLICY IF EXISTS profile_photos_delete_self ON public.profile_photos;

CREATE POLICY profile_photos_select_controlled ON public.profile_photos
  FOR SELECT USING (
    approval_status = 'approved'
    OR auth.uid() = user_id
    OR public.is_admin(auth.uid())
  );

CREATE POLICY profile_photos_insert_self ON public.profile_photos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY profile_photos_update_self ON public.profile_photos
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY profile_photos_update_admin ON public.profile_photos
  FOR UPDATE
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY profile_photos_delete_self ON public.profile_photos
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Prevent non-admins from altering approval fields
CREATE OR REPLACE FUNCTION public.protect_photo_moderation_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    NEW.approval_status := OLD.approval_status;
    NEW.approved_by := OLD.approved_by;
    NEW.approved_at := OLD.approved_at;
    NEW.rejected_at := OLD.rejected_at;
    NEW.rejection_reason := OLD.rejection_reason;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_photo_moderation_fields ON public.profile_photos;
CREATE TRIGGER trg_protect_photo_moderation_fields
BEFORE UPDATE ON public.profile_photos
FOR EACH ROW
EXECUTE FUNCTION public.protect_photo_moderation_fields();
