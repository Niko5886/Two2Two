-- Fix legacy manually-seeded auth users that contain NULL tokens
update auth.users
set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change = coalesce(email_change, '')
where confirmation_token is null
   or recovery_token is null
   or email_change_token_new is null
   or email_change is null;

-- Ensure demo users use known password for easier login in development
update auth.users
set encrypted_password = crypt('Password123!', gen_salt('bf')),
    updated_at = now()
where email in ('nik@gmail.com', 'maria@gmail.com');

-- Return all registered users, even if they don't have a row in public.profiles
create or replace function public.get_registered_users()
returns table (
  id uuid,
  username text,
  age integer,
  avatar_url text,
  is_online boolean
)
language sql
security definer
set search_path = public, auth
as $$
  select
    u.id,
    coalesce(
      nullif(p.username, ''),
      nullif(u.raw_user_meta_data->>'name', ''),
      split_part(u.email, '@', 1)
    ) as username,
    p.age,
    p.avatar_url,
    coalesce(p.is_online, false) as is_online
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.deleted_at is null
  order by username;
$$;

grant execute on function public.get_registered_users() to anon, authenticated;
