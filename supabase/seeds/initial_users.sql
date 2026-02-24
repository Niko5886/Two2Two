-- Seed data: Initial users
-- NOTE: This file is for reference only. Users were created directly in Supabase.
-- Default password for all users: Password123!
-- Users should change their password on first login.

-- nik@gmail.com (Admin)
-- User ID: 1c409ae1-0cf6-4683-a111-aba1adb200bc
-- Roles: admin, user

-- maria@gmail.com (Regular User)
-- User ID: 098735b4-48c4-4794-88ca-c416cba5c330
-- Roles: user

-- To manually recreate users (if needed):
/*
create extension if not exists pgcrypto;

-- Insert nik@gmail.com
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  email_change_sent_at,
  recovery_sent_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '1c409ae1-0cf6-4683-a111-aba1adb200bc',
    'authenticated',
    'authenticated',
    'nik@gmail.com',
    crypt('Password123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Nik"}',
    false
  );

-- Add admin role to nik
insert into public.user_roles (user_id, role)
values ('1c409ae1-0cf6-4683-a111-aba1adb200bc', 'admin'::public.user_role);

-- Insert maria@gmail.com
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  email_change_sent_at,
  recovery_sent_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '098735b4-48c4-4794-88ca-c416cba5c330',
    'authenticated',
    'authenticated',
    'maria@gmail.com',
    crypt('Password123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Maria"}',
    false
  );
*/
