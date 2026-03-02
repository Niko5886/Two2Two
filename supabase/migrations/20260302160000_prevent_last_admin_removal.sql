-- Prevent removing the last admin role from the system

CREATE OR REPLACE FUNCTION public.prevent_last_admin_removal()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  remaining_admins bigint;
BEGIN
  IF OLD.role <> 'admin' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.role = 'admin' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)
  INTO remaining_admins
  FROM public.user_roles ur
  WHERE ur.role = 'admin'
    AND ur.user_id <> OLD.user_id;

  IF remaining_admins = 0 THEN
    RAISE EXCEPTION 'Cannot remove the last admin user';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_last_admin_removal ON public.user_roles;

CREATE TRIGGER trg_prevent_last_admin_removal
BEFORE DELETE OR UPDATE OF role ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_last_admin_removal();
