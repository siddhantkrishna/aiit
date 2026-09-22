-- Safe additive alignment for the existing AIIT database.
-- This migration intentionally does NOT drop columns, indexes, constraints, or policies.

ALTER TABLE IF EXISTS expenses
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS reference_number varchar(255),
  ADD COLUMN IF NOT EXISTS status varchar(50),
  ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

UPDATE expenses
SET updated_at = COALESCE(updated_at, created_at, now())
WHERE updated_at IS NULL;
