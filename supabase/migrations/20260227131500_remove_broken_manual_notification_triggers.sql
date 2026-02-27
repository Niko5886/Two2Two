-- Remove manually created broken triggers/functions that reference non-existing columns
-- Keep canonical notification triggers created by project migrations:
-- - trg_profile_pending_notification (on public.profiles)
-- - trg_photo_pending_notification   (on public.profile_photos)

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_registration();

DROP TRIGGER IF EXISTS on_photo_uploaded_pending ON public.profile_photos;
DROP FUNCTION IF EXISTS public.handle_photo_upload();
