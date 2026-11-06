-- Remove semester payment deadlines while preserving historical dated records.
-- The effective_from date on course fee versions is retained for price-version auditing.
BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE OR REPLACE FUNCTION public.fee_schedule_valid(total integer, semesters integer, schedule jsonb)
RETURNS boolean
LANGUAGE plpgsql IMMUTABLE STRICT
SET search_path = pg_catalog
AS $$
DECLARE
  item jsonb;
  n integer := 0;
  fee bigint := 0;
  summed bigint := 0;
BEGIN
  IF total <= 0 OR semesters NOT BETWEEN 1 AND 24 OR jsonb_typeof(schedule) <> 'array'
     OR jsonb_array_length(schedule) <> semesters THEN
    RETURN false;
  END IF;
  FOR item IN SELECT jsonb_array_elements(schedule) LOOP
    n := n + 1;
    IF jsonb_typeof(item) <> 'object'
       OR NOT (item ?& ARRAY['semester','amount'])
       OR jsonb_typeof(item->'semester') <> 'number'
       OR jsonb_typeof(item->'amount') <> 'number' THEN
      RETURN false;
    END IF;
    IF (item->>'semester')::numeric <> trunc((item->>'semester')::numeric)
       OR (item->>'amount')::numeric <> trunc((item->>'amount')::numeric) THEN
      RETURN false;
    END IF;
    fee := (item->>'amount')::bigint;
    IF (item->>'semester')::integer <> n OR fee < 100 OR fee > 1000000000 THEN
      RETURN false;
    END IF;
    summed := summed + fee;
  END LOOP;
  RETURN summed = total;
EXCEPTION WHEN others THEN
  RETURN false;
END $$;
-- Retain previously configured due dates as historical metadata, but no longer
-- require one for any newly created semester payment obligation.
ALTER TABLE public.fee_obligations ALTER COLUMN due_date DROP NOT NULL;
REVOKE ALL ON FUNCTION public.fee_schedule_valid(integer,integer,jsonb)
  FROM PUBLIC,anon,authenticated;
COMMIT;
