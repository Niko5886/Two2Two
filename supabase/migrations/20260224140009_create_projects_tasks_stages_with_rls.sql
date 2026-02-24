create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table if not exists public.project_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, title),
  unique (project_id, position),
  unique (id, project_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stage_id uuid,
  title text not null,
  description_html text,
  position integer not null default 0,
  done boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_position_check check (position >= 0),
  constraint tasks_description_length_check check (description_html is null or length(description_html) <= 200000),
  constraint tasks_stage_project_fk
    foreign key (stage_id, project_id)
    references public.project_stages(id, project_id)
    on delete set null
);

create index if not exists idx_projects_owner_id on public.projects(owner_id);
create index if not exists idx_project_members_project_id on public.project_members(project_id);
create index if not exists idx_project_members_user_id on public.project_members(user_id);
create index if not exists idx_project_stages_project_position on public.project_stages(project_id, position);
create index if not exists idx_tasks_project_position on public.tasks(project_id, position);
create index if not exists idx_tasks_stage_id on public.tasks(stage_id);
create index if not exists idx_tasks_done on public.tasks(done);

create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

create trigger set_project_stages_updated_at
before update on public.project_stages
for each row
execute function public.set_updated_at();

create trigger set_tasks_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_stages enable row level security;
alter table public.tasks enable row level security;

create policy "projects_select_for_owner_or_member"
on public.projects
for select
using (
  owner_id = auth.uid()
  or exists (
    select 1
    from public.project_members pm
    where pm.project_id = projects.id
      and pm.user_id = auth.uid()
  )
);

create policy "projects_insert_owner_only"
on public.projects
for insert
with check (owner_id = auth.uid());

create policy "projects_update_owner_only"
on public.projects
for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "projects_delete_owner_only"
on public.projects
for delete
using (owner_id = auth.uid());

create policy "project_members_select_for_project_users"
on public.project_members
for select
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and (
        p.owner_id = auth.uid()
        or project_members.user_id = auth.uid()
        or exists (
          select 1
          from public.project_members pm2
          where pm2.project_id = p.id
            and pm2.user_id = auth.uid()
        )
      )
  )
);

create policy "project_members_insert_owner_only"
on public.project_members
for insert
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and p.owner_id = auth.uid()
  )
);

create policy "project_members_delete_owner_only"
on public.project_members
for delete
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and p.owner_id = auth.uid()
  )
);

create policy "project_stages_select_for_project_users"
on public.project_stages
for select
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_stages.project_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = p.id
            and pm.user_id = auth.uid()
        )
      )
  )
);

create policy "project_stages_insert_owner_only"
on public.project_stages
for insert
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_stages.project_id
      and p.owner_id = auth.uid()
  )
);

create policy "project_stages_update_owner_only"
on public.project_stages
for update
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_stages.project_id
      and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_stages.project_id
      and p.owner_id = auth.uid()
  )
);

create policy "project_stages_delete_owner_only"
on public.project_stages
for delete
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_stages.project_id
      and p.owner_id = auth.uid()
  )
);

create policy "tasks_select_for_project_users"
on public.tasks
for select
using (
  exists (
    select 1
    from public.projects p
    where p.id = tasks.project_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = p.id
            and pm.user_id = auth.uid()
        )
      )
  )
);

create policy "tasks_insert_owner_only"
on public.tasks
for insert
with check (
  exists (
    select 1
    from public.projects p
    where p.id = tasks.project_id
      and p.owner_id = auth.uid()
  )
);

create policy "tasks_update_owner_only"
on public.tasks
for update
using (
  exists (
    select 1
    from public.projects p
    where p.id = tasks.project_id
      and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = tasks.project_id
      and p.owner_id = auth.uid()
  )
);

create policy "tasks_delete_owner_only"
on public.tasks
for delete
using (
  exists (
    select 1
    from public.projects p
    where p.id = tasks.project_id
      and p.owner_id = auth.uid()
  )
);
