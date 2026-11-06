-- University-specific AIIT fee pricing; preserve existing versioned fee plans.
BEGIN;
SET LOCAL lock_timeout='5s';
-- No universal pricing: all future fee versions must explicitly name a university.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.fee_configurations WHERE university_id IS NULL) THEN
    RAISE EXCEPTION 'Review and scope legacy default fee configurations before enforcing university-specific pricing';
  END IF;
END $$;
ALTER TABLE public.fee_configurations ALTER COLUMN university_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS fee_config_uni_course_effective_idx
  ON public.fee_configurations(university_id, course_id, effective_from DESC, id DESC);
-- SDMIT was explicitly requested as a dropdown label; the full legal institution name
-- and approved fee schedule must be supplied separately.
INSERT INTO public.universities(name,short_name,enabled)
SELECT 'SDMIT','SDMIT',true
WHERE NOT EXISTS (
  SELECT 1 FROM public.universities
  WHERE lower(trim(name))='sdmit' OR lower(trim(short_name))='sdmit'
);
COMMIT;
