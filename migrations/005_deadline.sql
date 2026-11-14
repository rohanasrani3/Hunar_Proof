BEGIN;
ALTER TABLE commissions ADD COLUMN deadline text NOT NULL DEFAULT '';
-- Existing commissions predate structured deadlines. Their dates remain unknown.
-- PostgreSQL privileges
COMMIT;
