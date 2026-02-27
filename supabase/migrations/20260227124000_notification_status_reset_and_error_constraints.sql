-- Ensure notifications can be retried when items move back to review/pending

CREATE OR REPLACE FUNCTION public.reset_notification_on_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.approval_status IN ('pending', 'in_review')
     AND (OLD.approval_status IS DISTINCT FROM NEW.approval_status) THEN
    UPDATE public.admin_notifications
    SET status = 'pending',
        error_message = null,
        created_at = now()
    WHERE type = 'profile_pending'
      AND target_user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reset_profile_notification_on_review ON public.profiles;
CREATE TRIGGER trg_reset_profile_notification_on_review
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.reset_notification_on_review();

CREATE OR REPLACE FUNCTION public.reset_photo_notification_on_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.approval_status IN ('pending', 'in_review')
     AND (OLD.approval_status IS DISTINCT FROM NEW.approval_status) THEN
    UPDATE public.admin_notifications
    SET status = 'pending',
        error_message = null,
        created_at = now()
    WHERE type = 'photo_pending'
      AND target_photo_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reset_photo_notification_on_review ON public.profile_photos;
CREATE TRIGGER trg_reset_photo_notification_on_review
AFTER UPDATE ON public.profile_photos
FOR EACH ROW
EXECUTE FUNCTION public.reset_photo_notification_on_review();
