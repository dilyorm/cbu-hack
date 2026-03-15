-- V5: Fix sample data integrity + link Users to Employees
-- 1. Add employee_id column to users table
-- 2. Insert missing asset_assignments for all ASSIGNED assets
-- 3. Insert missing asset_status_history for all assets
-- 4. Seed USER accounts (EMP-001 through EMP-010) linked to employees

-- ─── 1. Add employee_id to users ─────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);

-- ─── 2. Insert asset_assignments for every currently ASSIGNED asset ───────────
-- (The V3 seed set current_employee_id/status but never inserted assignment records)
INSERT INTO asset_assignments (asset_id, employee_id, department_id, branch_id, assigned_at, assigned_by, active)
SELECT a.id, a.current_employee_id, a.current_department_id, a.current_branch_id,
       (a.created_at AT TIME ZONE 'UTC'), 'admin', true
FROM assets a
WHERE a.status = 'ASSIGNED'
  AND NOT EXISTS (
    SELECT 1 FROM asset_assignments aa WHERE aa.asset_id = a.id AND aa.active = true
  );

SELECT setval('asset_assignments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM asset_assignments));

-- ─── 3. Insert asset_status_history for every asset (initial REGISTERED + ASSIGNED transition) ──
-- Initial REGISTERED record for every asset that has no history yet
INSERT INTO asset_status_history (asset_id, old_status, new_status, changed_by, reason, changed_at)
SELECT a.id, NULL, 'REGISTERED', 'SYSTEM', 'Asset registered (seeded)',
       (a.created_at AT TIME ZONE 'UTC') - INTERVAL '1 second'
FROM assets a
WHERE NOT EXISTS (
    SELECT 1 FROM asset_status_history h WHERE h.asset_id = a.id AND h.old_status IS NULL
);

-- ASSIGNED transition record for every currently ASSIGNED asset that is missing it
INSERT INTO asset_status_history (asset_id, old_status, new_status, changed_by, reason, changed_at)
SELECT a.id, 'REGISTERED', 'ASSIGNED', 'admin',
       'Assigned to ' || e.first_name || ' ' || e.last_name,
       (a.created_at AT TIME ZONE 'UTC')
FROM assets a
JOIN employees e ON e.id = a.current_employee_id
WHERE a.status = 'ASSIGNED'
  AND NOT EXISTS (
    SELECT 1 FROM asset_status_history h
    WHERE h.asset_id = a.id AND h.new_status = 'ASSIGNED'
  );

-- IN_REPAIR transition record for IN_REPAIR assets
INSERT INTO asset_status_history (asset_id, old_status, new_status, changed_by, reason, changed_at)
SELECT a.id, 'REGISTERED', 'IN_REPAIR', 'admin', 'Sent for repair (seeded)',
       (a.created_at AT TIME ZONE 'UTC')
FROM assets a
WHERE a.status = 'IN_REPAIR'
  AND NOT EXISTS (
    SELECT 1 FROM asset_status_history h
    WHERE h.asset_id = a.id AND h.new_status = 'IN_REPAIR'
  );

-- LOST transition record for LOST assets
INSERT INTO asset_status_history (asset_id, old_status, new_status, changed_by, reason, changed_at)
SELECT a.id, 'ASSIGNED', 'LOST', 'admin', 'Reported lost (seeded)',
       (a.created_at AT TIME ZONE 'UTC')
FROM assets a
WHERE a.status = 'LOST'
  AND NOT EXISTS (
    SELECT 1 FROM asset_status_history h
    WHERE h.asset_id = a.id AND h.new_status = 'LOST'
  );

-- WRITTEN_OFF transition record for WRITTEN_OFF assets
INSERT INTO asset_status_history (asset_id, old_status, new_status, changed_by, reason, changed_at)
SELECT a.id, 'REGISTERED', 'WRITTEN_OFF', 'admin', 'Written off (seeded)',
       (a.created_at AT TIME ZONE 'UTC')
FROM assets a
WHERE a.status = 'WRITTEN_OFF'
  AND NOT EXISTS (
    SELECT 1 FROM asset_status_history h
    WHERE h.asset_id = a.id AND h.new_status = 'WRITTEN_OFF'
  );

SELECT setval('asset_status_history_id_seq', (SELECT COALESCE(MAX(id), 1) FROM asset_status_history));

-- ─── 4. Seed 10 USER accounts linked to employees ────────────────────────────
-- Password for all: "user1234" (BCrypt $2a$10$ hash verified with Spring BCryptPasswordEncoder)
INSERT INTO users (username, email, password, full_name, role, enabled, created_at, updated_at, employee_id)
VALUES
  ('james.smith',    'james.smith@bankassets.com',    '$2a$10$Es1p.Q8.dBJ79UUbJ/kiPOjFORdh4Zm.0u3ctNEAQbHD9ErYzYgXO', 'James Smith',    'USER', true, NOW(), NOW(), 1),
  ('mary.johnson',   'mary.johnson@bankassets.com',   '$2a$10$Es1p.Q8.dBJ79UUbJ/kiPOjFORdh4Zm.0u3ctNEAQbHD9ErYzYgXO', 'Mary Johnson',   'USER', true, NOW(), NOW(), 2),
  ('john.williams',  'john.williams@bankassets.com',  '$2a$10$Es1p.Q8.dBJ79UUbJ/kiPOjFORdh4Zm.0u3ctNEAQbHD9ErYzYgXO', 'John Williams',  'USER', true, NOW(), NOW(), 3),
  ('patricia.brown', 'patricia.brown@bankassets.com', '$2a$10$Es1p.Q8.dBJ79UUbJ/kiPOjFORdh4Zm.0u3ctNEAQbHD9ErYzYgXO', 'Patricia Brown', 'USER', true, NOW(), NOW(), 4),
  ('robert.jones',   'robert.jones@bankassets.com',   '$2a$10$Es1p.Q8.dBJ79UUbJ/kiPOjFORdh4Zm.0u3ctNEAQbHD9ErYzYgXO', 'Robert Jones',   'USER', true, NOW(), NOW(), 5),
  ('jennifer.garcia','jennifer.garcia@bankassets.com','$2a$10$Es1p.Q8.dBJ79UUbJ/kiPOjFORdh4Zm.0u3ctNEAQbHD9ErYzYgXO', 'Jennifer Garcia','USER', true, NOW(), NOW(), 6),
  ('michael.miller', 'michael.miller@bankassets.com', '$2a$10$Es1p.Q8.dBJ79UUbJ/kiPOjFORdh4Zm.0u3ctNEAQbHD9ErYzYgXO', 'Michael Miller', 'USER', true, NOW(), NOW(), 7),
  ('linda.davis',    'linda.davis@bankassets.com',    '$2a$10$Es1p.Q8.dBJ79UUbJ/kiPOjFORdh4Zm.0u3ctNEAQbHD9ErYzYgXO', 'Linda Davis',    'USER', true, NOW(), NOW(), 8),
  ('william.rodriguez','william.rodriguez@bankassets.com','$2a$10$Es1p.Q8.dBJ79UUbJ/kiPOjFORdh4Zm.0u3ctNEAQbHD9ErYzYgXO','William Rodriguez','USER', true, NOW(), NOW(), 9),
  ('elizabeth.martinez','elizabeth.martinez@bankassets.com','$2a$10$Es1p.Q8.dBJ79UUbJ/kiPOjFORdh4Zm.0u3ctNEAQbHD9ErYzYgXO','Elizabeth Martinez','USER', true, NOW(), NOW(), 10)
ON CONFLICT (username) DO UPDATE SET employee_id = EXCLUDED.employee_id, password = EXCLUDED.password;
