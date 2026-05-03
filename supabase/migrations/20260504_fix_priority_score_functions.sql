-- Restore priority scoring function + trigger used during report inserts/updates.
-- Some environments had only ALTER statements for these functions, which caused
-- runtime insert failures such as:
-- function calculate_priority_score(integer, timestamp without time zone) does not exist

CREATE OR REPLACE FUNCTION public.calculate_priority_score(
  p_severity integer,
  p_created_at timestamp without time zone
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_severity integer := LEAST(GREATEST(COALESCE(p_severity, 3), 1), 5);
  v_age_hours numeric := 0;
  v_recency_bonus integer := 0;
BEGIN
  IF p_created_at IS NOT NULL THEN
    v_age_hours := EXTRACT(EPOCH FROM ((NOW() AT TIME ZONE 'UTC') - p_created_at)) / 3600.0;
  END IF;

  IF v_age_hours <= 24 THEN
    v_recency_bonus := 20;
  ELSIF v_age_hours <= 72 THEN
    v_recency_bonus := 10;
  END IF;

  RETURN (v_severity * 20) + v_recency_bonus;
END;
$$;

ALTER FUNCTION public.calculate_priority_score(integer, timestamp without time zone)
  SET search_path = '';

CREATE OR REPLACE FUNCTION public.update_report_priority()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.priority_score := public.calculate_priority_score(
    NEW.severity,
    COALESCE(NEW.created_at, NOW() AT TIME ZONE 'UTC')
  );

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.update_report_priority()
  SET search_path = '';

DROP TRIGGER IF EXISTS trg_update_report_priority ON public.reports;
DROP TRIGGER IF EXISTS trigger_update_report_priority ON public.reports;

CREATE TRIGGER trg_update_report_priority
BEFORE INSERT OR UPDATE OF severity ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.update_report_priority();
