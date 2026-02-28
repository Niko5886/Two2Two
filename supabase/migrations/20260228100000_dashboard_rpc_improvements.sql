create or replace function public.get_registered_users()
returns table (
  id uuid,
  username text,
  age integer,
  avatar_url text,
  is_online boolean,
  city text,
  gender text
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
    coalesce(p.is_online, false) as is_online,
    p.city,
    p.gender
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.deleted_at is null
  order by username;
$$;

grant execute on function public.get_registered_users() to anon, authenticated;
