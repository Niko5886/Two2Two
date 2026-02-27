# Supabase Database Setup

## Migrations

Database migrations are stored in `migrations/` directory. They are applied in order based on the timestamp prefix.

### Applied Migrations

1. **20260224140009_create_projects_tasks_stages_with_rls.sql**
   - Creates `projects`, `project_members`, `project_stages`, `tasks` tables
   - Sets up foreign key relationships
   - Creates indexes for performance
   - Implements Row Level Security (RLS) policies
   - Only project owners can modify data; owners and members can view

2. **20260224140114_harden_updated_at_function_and_task_fk_indexes.sql**
   - Hardens `set_updated_at()` function with `search_path` security
   - Adds additional indexes for foreign keys in `tasks` table

3. **20260224141846_create_user_roles_and_seed_users.sql**
   - Creates `user_role` enum (admin, user)
   - Creates `user_roles` table for managing user permissions
   - Implements RLS policies for role management
   - Sets up automatic trigger to assign 'user' role on signup

## Seeds

Seed data is stored in `seeds/` directory for reference.

### Initial Users

Two users have been created in Supabase Auth:

1. **nik@gmail.com** (Admin)
   - User ID: `1c409ae1-0cf6-4683-a111-aba1adb200bc`
   - Roles: `admin`, `user`
   - Password: `Password123!` (should be changed)

2. **maria@gmail.com** (Regular User)
   - User ID: `098735b4-48c4-4794-88ca-c416cba5c330`
   - Roles: `user`
   - Password: `Password123!` (should be changed)

## Applying Migrations

Migrations are automatically applied to Supabase when using the Supabase CLI or MCP tools. 

To manually apply a migration:
```sql
-- Copy the SQL content from the migration file and execute in Supabase SQL Editor
```

## Edge Function: admin-notifications

Added function path: `supabase/functions/admin-notifications/index.ts`

Purpose:
- Reads `pending` records from `public.admin_notifications`
- Sends email to admin (`lobido1988@gmail.com` by default)
- Marks each record as `sent` or `error` and persists `error_message`

Required environment variables (Supabase Edge Functions settings):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `ADMIN_NOTIFICATION_EMAIL` (optional, defaults to `lobido1988@gmail.com`)
- `EMAIL_FROM` (optional, defaults to `Two2Two <onboarding@resend.dev>`)
- `ADMIN_DASHBOARD_URL` (optional)
- `NOTIFICATION_CRON_SECRET` (recommended for protected invocation)

Invoke example (from Supabase Scheduler / external cron):

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/admin-notifications?batch=25" \
   -H "Authorization: Bearer <NOTIFICATION_CRON_SECRET>"
```

📖 **Detailed Setup Guide:** See [ADMIN_NOTIFICATIONS_SETUP.md](./ADMIN_NOTIFICATIONS_SETUP.md) for complete configuration instructions including:
- Resend API key setup
- Supabase secrets configuration
- Cron job/scheduler setup (pg_cron, external services, GitHub Actions)
- Testing and monitoring
- **project_members**: Associates users with projects
- **project_stages**: Kanban board columns for tasks
- **tasks**: Individual tasks with rich HTML descriptions
- **user_roles**: Maps users to their roles (admin, user)

### Security

All tables have Row Level Security (RLS) enabled:
- Users can only access projects they own or are members of
- Only admins can manage user roles
- Only project owners can modify project data
