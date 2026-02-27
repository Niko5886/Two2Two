-- Ensure each auth signup has a profile row
-- and can flow through moderation + admin notifications.

CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  derived_username text;
BEGIN
  derived_username := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'username', ''),
    split_part(COALESCE(NEW.email, 'user'), '@', 1)
  );

  INSERT INTO public.profiles (
    id,
    username,
    approval_status,
    is_active,
    is_online,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    derived_username,
    'pending',
    true,
    false,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_profile_on_auth_user ON auth.users;
CREATE TRIGGER trg_create_profile_on_auth_user
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_for_new_user();

-- Backfill profiles for existing users without profile rows.
INSERT INTO public.profiles (
  id,
  username,
  approval_status,
  is_active,
  is_online,
  created_at,
  updated_at
)
SELECT
  u.id,
  split_part(COALESCE(u.email, 'user'), '@', 1) AS username,
  'pending' AS approval_status,
  true AS is_active,
  false AS is_online,
  now() AS created_at,
  now() AS updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
