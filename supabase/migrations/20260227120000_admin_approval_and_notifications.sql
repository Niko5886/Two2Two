-- Admin approval pipeline for profiles and photos, notifications, audit log, and profile change history

-- Helper: detect admin role
CREATE OR REPLACE FUNCTION public.is_admin(p_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p_uid AND ur.role = 'admin'
  );
$$;

-- Profiles: approval and active flags
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'in_review', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON public.profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Backfill existing profiles as approved
UPDATE public.profiles
SET approval_status = 'approved', approved_at = COALESCE(approved_at, now())
WHERE approval_status IS NULL OR approval_status = 'pending';

-- Profile change history
CREATE TABLE IF NOT EXISTS public.profile_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES auth.users(id),
  old_data jsonb,
  new_data jsonb,
  changed_at timestamptz DEFAULT now()
);

ALTER TABLE public.profile_change_log ENABLE ROW LEVEL SECURITY;

-- Admin-only access to profile change log
DROP POLICY IF EXISTS profile_change_log_select_admin ON public.profile_change_log;
CREATE POLICY profile_change_log_select_admin
  ON public.profile_change_log FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS profile_change_log_insert_any ON public.profile_change_log;
CREATE POLICY profile_change_log_insert_any
  ON public.profile_change_log FOR INSERT
  WITH CHECK (true);

-- Trigger to capture profile changes
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.profile_change_log(user_id, changed_by, old_data, new_data, changed_at)
    VALUES (OLD.id, auth.uid(), to_jsonb(OLD), to_jsonb(NEW), now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_change_log ON public.profiles;
CREATE TRIGGER trg_profile_change_log
AFTER UPDATE ON public.profiles
FOR EACH ROW
WHEN (OLD IS DISTINCT FROM NEW)
EXECUTE FUNCTION public.log_profile_changes();

-- Admin audit log for explicit admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id),
  target_photo_id uuid REFERENCES public.profile_photos(id),
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_audit_log_select_admin ON public.admin_audit_log;
CREATE POLICY admin_audit_log_select_admin
  ON public.admin_audit_log FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS admin_audit_log_insert_admin ON public.admin_audit_log;
CREATE POLICY admin_audit_log_insert_admin
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Admin notifications queue (to be processed by email worker)
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('profile_pending', 'photo_pending')),
  target_user_id uuid REFERENCES auth.users(id),
  target_photo_id uuid REFERENCES public.profile_photos(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'error')),
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_notifications_select_admin ON public.admin_notifications;
CREATE POLICY admin_notifications_select_admin
  ON public.admin_notifications FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS admin_notifications_insert_any ON public.admin_notifications;
CREATE POLICY admin_notifications_insert_any
  ON public.admin_notifications FOR INSERT
  WITH CHECK (true);

-- Trigger helpers for notifications
CREATE OR REPLACE FUNCTION public.enqueue_profile_pending_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.approval_status = 'pending' THEN
    INSERT INTO public.admin_notifications(type, target_user_id, status, created_at)
    VALUES ('profile_pending', NEW.id, 'pending', now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_pending_notification ON public.profiles;
CREATE TRIGGER trg_profile_pending_notification
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_profile_pending_notification();

-- Profiles RLS overhaul: only approved profiles are visible to non-owners; admins see all
DROP POLICY IF EXISTS profiles_select_public ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;

CREATE POLICY profiles_select_controlled ON public.profiles
  FOR SELECT USING (
    (approval_status = 'approved' AND is_active = true)
    OR auth.uid() = id
    OR public.is_admin(auth.uid())
  );

CREATE POLICY profiles_insert_self ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Prevent non-admins from editing moderation fields on profiles
CREATE OR REPLACE FUNCTION public.protect_profile_moderation_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    NEW.approval_status := OLD.approval_status;
    NEW.approved_by := OLD.approved_by;
    NEW.approved_at := OLD.approved_at;
    NEW.rejection_reason := OLD.rejection_reason;
    NEW.is_active := OLD.is_active;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_moderation_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_moderation_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_moderation_fields();
