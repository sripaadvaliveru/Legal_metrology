-- ============================================================================
-- migrate_to_nomenclature_ids.sql
-- ----------------------------------------------------------------------------
-- Rewrites every primary key in the database from a random UUID to a readable
-- nomenclature ID, and rewrites all 25 foreign keys plus the three non-FK
-- reference columns to match.
--
--   users                9debf1b4-2544-474d-8b67-5c1877b1e9e3  ->  USR-2026-01
--   jurisdictions        c0000001-0000-0000-0000-000000000001  ->  JUR-HYD-EAST
--   instrument_types     b0000001-0000-0000-0000-000000000001  ->  CMP-2026-000001
--   instruments          f0000001-0000-0000-0000-000000000001  ->  USR-2026-01-INST-0001
--   applications         aa000001-...                          ->  APP-2026-000001
--   certificates         (uses its existing certificate_number)
--
-- Run it ONCE, by hand, before starting the new backend:
--
--   PGPASSWORD=change_me_in_production \
--   psql -h localhost -U lm_admin -d legal_metrology \
--        -v ON_ERROR_STOP=1 -f db/migrate_to_nomenclature_ids.sql
--
-- ON_ERROR_STOP matters: any failure rolls the whole thing back.
--
-- WHY THIS MUST BE PAIRED WITH data.sql
--   data.sql runs on EVERY startup (spring.sql.init.mode=always) and inserts
--   seed rows with ON CONFLICT (id) DO NOTHING/UPDATE. If the IDs produced here
--   do not match the IDs data.sql declares, the seeds are treated as brand-new
--   rows and inserted a second time on every restart. The explicit mappings
--   below therefore mirror data.sql exactly, and the script aborts up front if
--   it looks like it has already been run.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Refuse to run twice.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE id LIKE 'USR-%') THEN
        RAISE EXCEPTION 'Aborting: users already use USR-%% ids, so this migration has already been applied.';
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 1. Capture every foreign key (list + definition) before dropping them.
--    Rewriting 25 FK columns is far safer with the constraints out of the way;
--    they are restored in step 7 and verified in step 8.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fk_list (child_tbl text NOT NULL, col text NOT NULL, parent_tbl text NOT NULL);
DELETE FROM fk_list;
INSERT INTO fk_list
SELECT child.relname, a.attname, parent.relname
FROM pg_constraint c
         JOIN pg_class child ON child.oid = c.conrelid
         JOIN pg_class parent ON parent.oid = c.confrelid
         JOIN unnest(c.conkey) WITH ORDINALITY AS ck(attnum, ord) ON true
         JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ck.attnum
WHERE c.contype = 'f'
  AND c.connamespace = 'public'::regnamespace;

CREATE TABLE IF NOT EXISTS fk_backup (tbl text NOT NULL, conname text NOT NULL, def text NOT NULL);
DELETE FROM fk_backup;
INSERT INTO fk_backup
SELECT child.relname, c.conname, pg_get_constraintdef(c.oid)
FROM pg_constraint c
         JOIN pg_class child ON child.oid = c.conrelid
WHERE c.contype = 'f'
  AND c.connamespace = 'public'::regnamespace;

DO $$
DECLARE r record;
BEGIN
    FOR r IN SELECT conrelid, conname FROM pg_constraint
             WHERE contype = 'f' AND connamespace = 'public'::regnamespace LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.conrelid::regclass, r.conname);
    END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Build the mapping table.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS id_map (table_name text NOT NULL, old_id text NOT NULL, new_id text NOT NULL,
                                   PRIMARY KEY (table_name, old_id));
DELETE FROM id_map;

-- 2a. Users. The eight seeded accounts are pinned BY EMAIL so they receive the
--     same sequence numbers data.sql declares; everything else continues from 09.
--     The WHERE clause mirrors the CASE so new_id is never NULL (it is NOT NULL).
INSERT INTO id_map (table_name, old_id, new_id)
SELECT 'users', id,
       CASE email
           WHEN 'business@test.com' THEN 'USR-2026-01'
           WHEN 'lmo@test.com'      THEN 'USR-2026-02'
           WHEN 'gatc@test.com'     THEN 'USR-2026-03'
           WHEN 'district@test.com' THEN 'USR-2026-04'
           WHEN 'state@test.com'    THEN 'USR-2026-05'
           WHEN 'admin@test.com'    THEN 'USR-2026-06'
           WHEN 'lmo2@test.com'     THEN 'USR-2026-07'
           WHEN 'lmo3@test.com'     THEN 'USR-2026-08'
           END
FROM users
WHERE email IN ('business@test.com', 'lmo@test.com', 'gatc@test.com', 'district@test.com',
                'state@test.com', 'admin@test.com', 'lmo2@test.com', 'lmo3@test.com')
ON CONFLICT (table_name, old_id) DO NOTHING;

-- Any user not in that list (registered through the UI) continues the sequence
-- from 09. This has to INSERT rather than UPDATE: the block above only created
-- rows for the eight seeded accounts.
INSERT INTO id_map (table_name, old_id, new_id)
SELECT 'users', id,
       'USR-2026-' || CASE WHEN n < 10 THEN '0' || n::text ELSE n::text END
FROM (SELECT id, (ROW_NUMBER() OVER (ORDER BY created_at, id)) + 8 AS n
      FROM users
      WHERE id NOT IN (SELECT old_id FROM id_map WHERE table_name = 'users')) extra
ON CONFLICT (table_name, old_id) DO NOTHING;

-- 2b. Jurisdictions are identified by their human-readable code.
INSERT INTO id_map (table_name, old_id, new_id)
SELECT 'jurisdictions', id, 'JUR-' || jurisdiction_code
FROM jurisdictions
ON CONFLICT (table_name, old_id) DO NOTHING;

-- 2c. Applications and certificates already carry a business number; that number
--     simply becomes the primary key.
INSERT INTO id_map (table_name, old_id, new_id)
SELECT 'applications', id, application_number FROM applications
ON CONFLICT (table_name, old_id) DO NOTHING;

INSERT INTO id_map (table_name, old_id, new_id)
SELECT 'certificates', id, certificate_number FROM certificates
ON CONFLICT (table_name, old_id) DO NOTHING;

-- 2d. Seed rows that data.sql pins by literal ID. Mapped first, and every later
--     pass uses ON CONFLICT DO NOTHING, so these always win over heuristics.
INSERT INTO id_map (table_name, old_id, new_id) VALUES
    ('businesses',         'd0000001-0000-0000-0000-000000000001', 'BIZ-2026-000001'),
    ('establishments',     'e0000001-0000-0000-0000-000000000001', 'EST-2026-000001'),
    ('establishments',     'e0000001-0000-0000-0000-000000000002', 'EST-2026-000002'),
    ('instrument_types',   'b0000001-0000-0000-0000-000000000001', 'CMP-2026-000001'),
    ('instrument_types',   'b0000001-0000-0000-0000-000000000002', 'CMP-2026-000002'),
    ('instrument_types',   'b0000001-0000-0000-0000-000000000003', 'CMP-2026-000003'),
    ('instrument_types',   'b0000001-0000-0000-0000-000000000004', 'CMP-2026-000004'),
    ('instrument_types',   'b0000001-0000-0000-0000-000000000005', 'CMP-2026-000005'),
    ('checklist_templates','cc000001-0000-0000-0000-000000000001', 'CHK-2026-000001'),
    ('checklist_templates','cc000001-0000-0000-0000-000000000002', 'CHK-2026-000002'),
    ('checklist_templates','cc000001-0000-0000-0000-000000000003', 'CHK-2026-000003'),
    ('checklist_templates','cc000001-0000-0000-0000-000000000004', 'CHK-2026-000004'),
    ('checklist_templates','cc000001-0000-0000-0000-000000000005', 'CHK-2026-000005')
ON CONFLICT (table_name, old_id) DO NOTHING;

-- 2e. Everything else: PREFIX-<year>-<6 digit sequence>, oldest row first.
--     Rows already mapped by the pins above are skipped, and the sequence is
--     offset past them, so a pinned row can never be shadowed or duplicated.
DO $$
DECLARE
    t   record;
    ord text;
    off bigint;
BEGIN
    FOR t IN SELECT * FROM (VALUES
                 ('businesses', 'BIZ'), ('establishments', 'EST'), ('assignments', 'ASG'),
                 ('instrument_types', 'CMP'), ('checklist_templates', 'CHK'),
                 ('appointments', 'APT'), ('inspections', 'INS'), ('verification_rules', 'VRU'),
                 ('complaints', 'CMB'), ('notifications', 'NTF'), ('audit_logs', 'AUD'),
                 ('measurements', 'MSR'), ('violations', 'VLN'), ('equipment', 'EQP'),
                 ('application_status_history', 'ASH')
             ) AS v(tbl, prefix) LOOP
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = t.tbl AND column_name = 'created_at') THEN
            ord := 'created_at, id';
        ELSE
            ord := 'id';
        END IF;

        EXECUTE format('SELECT count(*) FROM id_map WHERE table_name = %L', t.tbl) INTO off;

        EXECUTE format(
                'INSERT INTO id_map (table_name, old_id, new_id) '
                    || 'SELECT %L, id, %L || ''-'' || %L || ''-'' || lpad((row_number() OVER (ORDER BY %s) + %s)::text, 6, ''0'') '
                    || 'FROM %I WHERE id NOT IN (SELECT old_id FROM id_map WHERE table_name = %L) '
                    || 'ON CONFLICT (table_name, old_id) DO NOTHING',
                t.tbl, t.prefix, to_char(current_date, 'YYYY'), ord, off, t.tbl, t.tbl);
    END LOOP;
END $$;

-- 2f. Instruments: <owner user id>-INST-<per-owner sequence>. Depends on step 2a,
--     so the owner's NEW id is what gets embedded.
WITH owner AS (
    SELECT i.id AS instrument_id,
           i.created_at,
           (SELECT m.new_id
            FROM establishments e
                     JOIN businesses b ON e.business_id = b.id
                     JOIN users u ON u.business_id = b.id
                     JOIN id_map m ON m.table_name = 'users' AND m.old_id = u.id
            WHERE e.id = i.establishment_id
            ORDER BY u.created_at, u.id
            LIMIT 1) AS owner_id
    FROM instruments i
), ranked AS (
    SELECT instrument_id,
           owner_id,
           -- Oldest first, so the instrument seeded by data.sql claims INST-0001 for
           -- its owner. Ordering by the old UUID instead would sort it last.
           ROW_NUMBER() OVER (PARTITION BY COALESCE(owner_id, '~none~')
                              ORDER BY created_at, instrument_id) AS rn
    FROM owner
)
INSERT INTO id_map (table_name, old_id, new_id)
SELECT 'instruments', ranked.instrument_id,
       COALESCE(ranked.owner_id, 'ORG') || '-INST-' || lpad(ranked.rn::text, 4, '0')
FROM ranked
ON CONFLICT (table_name, old_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Nothing may have been skipped: every row of every table with an id column
--    must have a mapping, or its FKs would be orphaned below.
--    Row counts have to be read per-table at runtime, so this needs dynamic SQL.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    r       record;
    total   bigint;
    mapped  bigint;
    missing text := '';
BEGIN
    FOR r IN SELECT c.relname AS tbl
             FROM pg_class c
                      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
             WHERE c.relnamespace = 'public'::regnamespace
               AND c.relkind = 'r'
               AND a.attname = 'id'
             GROUP BY c.relname
             ORDER BY c.relname
        LOOP
            EXECUTE format('SELECT count(*) FROM %I', r.tbl) INTO total;
            SELECT count(*) INTO mapped FROM id_map WHERE table_name = r.tbl;
            IF total <> mapped THEN
                missing := missing || format('%s (rows=%s, mapped=%s), ', r.tbl, total, mapped);
            END IF;
        END LOOP;

    IF missing <> '' THEN
        RAISE EXCEPTION 'Aborting, unmapped rows remain in: %', missing;
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Rewrite every primary key.
-- ---------------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
    FOR r IN SELECT DISTINCT table_name FROM id_map LOOP
        EXECUTE format('UPDATE %I c SET id = m.new_id FROM id_map m '
                           || 'WHERE m.table_name = %L AND m.old_id = c.id',
                       r.table_name, r.table_name);
    END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Rewrite every foreign key column from the parent's mapping.
-- ---------------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
    FOR r IN SELECT child_tbl, col, parent_tbl FROM fk_list LOOP
        EXECUTE format('UPDATE %I c SET %I = m.new_id FROM id_map m '
                           || 'WHERE m.table_name = %L AND m.old_id = c.%I AND c.%I IS NOT NULL',
                       r.child_tbl, r.col, r.parent_tbl, r.col, r.col);
    END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 6. Rewrite the three reference columns that are NOT foreign keys.
--    (assignments.previous_assignee_id, inspections.previous_inspection_id and
--     jurisdictions.parent_id are all NULL in this database and are skipped by
--     the IS NOT NULL guard anyway.)
-- ---------------------------------------------------------------------------
UPDATE users u
SET jurisdiction_id = m.new_id
FROM id_map m
WHERE m.table_name = 'jurisdictions'
  AND m.old_id = u.jurisdiction_id;

UPDATE jurisdictions j
SET parent_id = m.new_id
FROM id_map m
WHERE m.table_name = 'jurisdictions'
  AND m.old_id = j.parent_id;

UPDATE assignments a
SET previous_assignee_id = m.new_id
FROM id_map m
WHERE m.table_name = 'users'
  AND m.old_id = a.previous_assignee_id;

UPDATE inspections i
SET previous_inspection_id = m.new_id
FROM id_map m
WHERE m.table_name = 'inspections'
  AND m.old_id = i.previous_inspection_id;

-- notifications.entity_id is polymorphic: entity_type says which table it points at.
UPDATE notifications n
SET entity_id = CASE TRIM(COALESCE(n.entity_type, ''))
                    WHEN 'Application' THEN (SELECT m.new_id FROM id_map m WHERE m.table_name = 'applications' AND m.old_id = n.entity_id)
                    WHEN 'Appointment' THEN (SELECT m.new_id FROM id_map m WHERE m.table_name = 'appointments' AND m.old_id = n.entity_id)
                    WHEN 'Assignment'  THEN (SELECT m.new_id FROM id_map m WHERE m.table_name = 'assignments'   AND m.old_id = n.entity_id)
                    ELSE n.entity_id
                    END
WHERE n.entity_id IS NOT NULL;

-- audit_logs.entity_id is polymorphic too, but that table is empty here.
UPDATE audit_logs a
SET entity_id = COALESCE((SELECT m.new_id FROM id_map m WHERE m.table_name = 'audit_logs' AND m.old_id = a.entity_id), a.entity_id)
WHERE a.entity_id IS NOT NULL;

-- instruments.instrument_id mirrors the primary key, as does certificates' number.
-- This must compare against the NEW id: step 4 has already rewritten instruments.id,
-- so matching on old_id here would silently update zero rows.
UPDATE instruments
SET instrument_id = id;

-- ---------------------------------------------------------------------------
-- 7. Restore every foreign key exactly as it was.
-- ---------------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
    FOR r IN SELECT * FROM fk_backup LOOP
        EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s', r.tbl, r.conname, r.def);
    END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 8. Verification. Any failure RAISEs, which with ON_ERROR_STOP=1 aborts psql
--    and rolls the entire migration back — so a bad run leaves no trace.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    r    record;
    n    bigint;
    bad  text;
BEGIN
    -- 8a. Every foreign key column must still resolve to a real parent id.
    FOR r IN SELECT * FROM fk_list LOOP
        EXECUTE format(
                'SELECT count(*) FROM %I c WHERE c.%I IS NOT NULL '
                    || 'AND NOT EXISTS (SELECT 1 FROM %I p WHERE p.id = c.%I)',
                r.child_tbl, r.col, r.parent_tbl, r.col) INTO n;
        IF n > 0 THEN
            RAISE EXCEPTION 'Aborting: % orphaned row(s) in %.%', n, r.child_tbl, r.col;
        END IF;
    END LOOP;

    -- 8b. No table may still carry any of its pre-migration ids.
    FOR r IN SELECT DISTINCT table_name FROM id_map LOOP
        EXECUTE format(
                'SELECT count(*) FROM %I WHERE id IN (SELECT old_id FROM id_map WHERE table_name = %L)',
                r.table_name, r.table_name) INTO n;
        IF n > 0 THEN
            RAISE EXCEPTION 'Aborting: % row(s) in % still carry their old id', n, r.table_name;
        END IF;
    END LOOP;

    -- 8c. Nothing may have been left behind as a UUID.
    FOR r IN SELECT DISTINCT table_name FROM id_map LOOP
        EXECUTE format(
                'SELECT count(*) FROM %I WHERE id ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$''',
                r.table_name) INTO n;
        IF n > 0 THEN
            RAISE EXCEPTION 'Aborting: % UUID-shaped id(s) remain in %', n, r.table_name;
        END IF;
    END LOOP;

    -- 8d. Generated ids must be unique within their table.
    SELECT string_agg(format('%s -> %s', d.table_name, d.new_id), ', ') INTO bad
    FROM (SELECT table_name, new_id FROM id_map
          GROUP BY table_name, new_id HAVING count(*) > 1) d;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'Aborting: duplicate generated id(s): %', bad;
    END IF;

    RAISE NOTICE 'Verification passed: no orphans, no stale ids, no UUIDs, no duplicates';
END $$;

COMMIT;

-- A readable snapshot of the result.
SELECT m.table_name, m.old_id, m.new_id
FROM id_map m
ORDER BY m.table_name, m.new_id;
