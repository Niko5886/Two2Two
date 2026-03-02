-- Fix admin_notifications FKs to cascade on delete
DO $$
BEGIN
  -- Drop existing constraints if they exist (handling likely names)
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_notifications_target_user_id_fkey') THEN
    ALTER TABLE public.admin_notifications DROP CONSTRAINT admin_notifications_target_user_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_notifications_target_photo_id_fkey') THEN
    ALTER TABLE public.admin_notifications DROP CONSTRAINT admin_notifications_target_photo_id_fkey;
  END IF;

  -- Re-add with ON DELETE CASCADE
  ALTER TABLE public.admin_notifications
    ADD CONSTRAINT admin_notifications_target_user_id_fkey
    FOREIGN KEY (target_user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

  ALTER TABLE public.admin_notifications
    ADD CONSTRAINT admin_notifications_target_photo_id_fkey
    FOREIGN KEY (target_photo_id)
    REFERENCES public.profile_photos(id)
    ON DELETE CASCADE;

END $$;

-- Fix admin_audit_log FKs to cascade or set null on delete (Set NULL is probably better for audit log to keep history)
DO $$
BEGIN
  -- Drop existing constraints
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_audit_log_target_user_id_fkey') THEN
    ALTER TABLE public.admin_audit_log DROP CONSTRAINT admin_audit_log_target_user_id_fkey;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_audit_log_target_photo_id_fkey') THEN
    ALTER TABLE public.admin_audit_log DROP CONSTRAINT admin_audit_log_target_photo_id_fkey;
  END IF;

  -- Re-add with ON DELETE SET NULL to preserve audit history even if user is deleted
  ALTER TABLE public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_target_user_id_fkey
    FOREIGN KEY (target_user_id)
    REFERENCES auth.users(id)
    ON DELETE SET NULL;

  ALTER TABLE public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_target_photo_id_fkey
    FOREIGN KEY (target_photo_id)
    REFERENCES public.profile_photos(id)
    ON DELETE SET NULL;
END $$;
