create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create index if not exists idx_tasks_created_by on public.tasks(created_by);
create index if not exists idx_tasks_stage_project on public.tasks(stage_id, project_id);