-- Seed data for Legal Metrology Verification System

-- Password: password123 (BCrypt hashed)
-- Hash generated with: BCryptPasswordEncoder.encode("password123")
--
-- ID NOMENCLATURE
-- Every primary key here follows the same scheme the application generates at runtime
-- (see com.legalmetrology.services.IdGenerator):
--
--   instrument_types   CMP-2026-000001
--   jurisdictions      JUR-<jurisdiction_code>          e.g. JUR-HYD-EAST
--   businesses         BIZ-2026-000001
--   establishments     EST-2026-000001
--   users              USR-2026-01                      (sequence: min 2 digits, grows naturally)
--   instruments        <owner user id>-INST-0001        e.g. USR-2026-01-INST-0001
--   applications       APP-2026-000001                  (id == application_number)
--   checklist          CHK-2026-000001
--
-- These IDs must stay in lockstep with the values produced by migrate_to_nomenclature_ids.sql:
-- every INSERT below uses ON CONFLICT (id), so a mismatch would insert a duplicate row on
-- EVERY startup (spring.sql.init.mode=always).

-- Instrument Types (Competency)
INSERT INTO instrument_types (id, name, description, validity_months) VALUES
('CMP-2026-000001', 'Electronic Weighing Scale', 'Digital weighing scale for commercial use', 12),
('CMP-2026-000002', 'Mechanical Weighing Scale', 'Traditional mechanical balance scale', 12),
('CMP-2026-000003', 'Measuring Tape', 'Steel measuring tape for length measurement', 24),
('CMP-2026-000004', 'Volume Measuring Instrument', 'Instruments for measuring liquid volume', 12),
('CMP-2026-000005', 'Fuel Dispenser', 'Fuel dispensing measurement instrument', 12)
ON CONFLICT (id) DO NOTHING;

-- Jurisdictions (ID is derived from the human-readable jurisdiction_code)
INSERT INTO jurisdictions (id, name, jurisdiction_code, level, state, district) VALUES
('JUR-HYD-EAST', 'Hyderabad East', 'HYD-EAST', 'DISTRICT', 'Telangana', 'Hyderabad'),
('JUR-HYD-WEST', 'Hyderabad West', 'HYD-WEST', 'DISTRICT', 'Telangana', 'Hyderabad'),
('JUR-CYB', 'Cyberabad', 'CYB', 'DISTRICT', 'Telangana', 'Rangareddy')
ON CONFLICT (id) DO NOTHING;

-- Businesses
INSERT INTO businesses (id, name, registration_number, gst_number, address, city, state, pincode, contact_person, phone, email, created_at, updated_at) VALUES
('BIZ-2026-000001', 'Kumar Enterprises', 'REG-001', 'GST-001', '123 Main St', 'Hyderabad', 'Telangana', '500001', 'Rajesh Kumar', '9876543210', 'business@test.com', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Establishments
INSERT INTO establishments (id, name, address, city, district, state, pincode, latitude, longitude, business_id, jurisdiction_id, created_at, updated_at) VALUES
('EST-2026-000001', 'Kumar Enterprises - Main', '123 Main St', 'Hyderabad', 'Hyderabad', 'Telangana', '500001', 17.3850, 78.4867, 'BIZ-2026-000001', 'JUR-HYD-EAST', NOW(), NOW()),
('EST-2026-000002', 'Westside Industries', '456 Western Ave', 'Hyderabad', 'Hyderabad', 'Telangana', '500002', 17.3650, 78.4650, 'BIZ-2026-000001', 'JUR-HYD-WEST', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Test Users (DO UPDATE to fix password hashes across deployments)
-- The 8 seeded users MUST keep the sequence numbers below: migrate_to_nomenclature_ids.sql
-- assigns the same values by email, and ON CONFLICT (id) relies on them matching exactly.
INSERT INTO users (id, name, email, password, role, phone, is_active, business_id, jurisdiction_id, competency_id, created_at, updated_at) VALUES
('USR-2026-01', 'Rajesh Kumar', 'business@test.com', '$2a$10$w/XWDSGyuOIczrfVCtufZeibm6iHfRAhjZRJqFyknkwJPR2ScT0te', 'BUSINESS', '9876543210', true, 'BIZ-2026-000001', 'JUR-CYB', NULL, NOW(), NOW()),
('USR-2026-02', 'Suresh Verma', 'lmo@test.com', '$2a$10$w/XWDSGyuOIczrfVCtufZeibm6iHfRAhjZRJqFyknkwJPR2ScT0te', 'LMO', '9876543211', true, NULL, 'JUR-HYD-EAST', 'CMP-2026-000001', NOW(), NOW()),
('USR-2026-03', 'GATC Test Center', 'gatc@test.com', '$2a$10$w/XWDSGyuOIczrfVCtufZeibm6iHfRAhjZRJqFyknkwJPR2ScT0te', 'GATC', '9876543212', true, NULL, 'JUR-HYD-WEST', NULL, NOW(), NOW()),
('USR-2026-04', 'Priya Sharma', 'district@test.com', '$2a$10$w/XWDSGyuOIczrfVCtufZeibm6iHfRAhjZRJqFyknkwJPR2ScT0te', 'DISTRICT_OFFICER', '9876543213', true, NULL, 'JUR-CYB', NULL, NOW(), NOW()),
('USR-2026-05', 'Amit Patel', 'state@test.com', '$2a$10$w/XWDSGyuOIczrfVCtufZeibm6iHfRAhjZRJqFyknkwJPR2ScT0te', 'STATE_OFFICER', '9876543214', true, NULL, 'JUR-CYB', NULL, NOW(), NOW()),
('USR-2026-06', 'Admin User', 'admin@test.com', '$2a$10$w/XWDSGyuOIczrfVCtufZeibm6iHfRAhjZRJqFyknkwJPR2ScT0te', 'SUPER_ADMIN', '9876543215', true, NULL, 'JUR-CYB', NULL, NOW(), NOW()),
('USR-2026-07', 'Lakshmi Rao', 'lmo2@test.com', '$2a$10$w/XWDSGyuOIczrfVCtufZeibm6iHfRAhjZRJqFyknkwJPR2ScT0te', 'LMO', '9876543216', true, NULL, 'JUR-HYD-WEST', 'CMP-2026-000002', NOW(), NOW()),
('USR-2026-08', 'Mohan Singh', 'lmo3@test.com', '$2a$10$w/XWDSGyuOIczrfVCtufZeibm6iHfRAhjZRJqFyknkwJPR2ScT0te', 'LMO', '9876543217', true, NULL, 'JUR-CYB', 'CMP-2026-000003', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    -- is_active intentionally NOT reset here: this script runs on every startup
    -- (spring.sql.init.mode=always), so overwriting it would silently re-enable
    -- accounts an admin has deliberately deactivated. It still defaults to true
    -- on first insert, and the DO UPDATE keeps passwords/names in sync.
    business_id = EXCLUDED.business_id,
    jurisdiction_id = EXCLUDED.jurisdiction_id,
    competency_id = EXCLUDED.competency_id,
    updated_at = NOW();

-- Instruments (id == instrument_id == owner-derived nomenclature)
INSERT INTO instruments (id, instrument_id, manufacturer, model, serial_number, capacity_range, accuracy, year_of_manufacture, usage, status, instrument_type_id, establishment_id, created_at, updated_at) VALUES
('USR-2026-01-INST-0001', 'USR-2026-01-INST-0001', 'Avery India', 'WS-500', 'SN-12345', '0-500kg', 'Class III', 2024, 'Commercial weighing', 'REGISTERED', 'CMP-2026-000001', 'EST-2026-000001', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Clean up broken test application rows (and their children) if they exist
DELETE FROM application_status_history WHERE application_id = 'APP-2026-000001' OR application_id IN (SELECT id FROM applications WHERE application_number = 'APP-2026-000001');
DELETE FROM assignments WHERE application_id = 'APP-2026-000001' OR application_id IN (SELECT id FROM applications WHERE application_number = 'APP-2026-000001');
DELETE FROM applications WHERE id = 'APP-2026-000001' OR application_number = 'APP-2026-000001';

-- Test Applications (for LMO workflow)
INSERT INTO applications (id, application_number, type, status, instrument_id, applicant_id, submitted_at, created_at, updated_at) VALUES
('APP-2026-000001', 'APP-2026-000001', 'INITIAL_VERIFICATION', 'SUBMITTED', 'USR-2026-01-INST-0001', 'USR-2026-01', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Checklist Templates (one per instrument type)
INSERT INTO checklist_templates (id, instrument_type_id, template_name, description, checklist_items, version) VALUES
('CHK-2026-000001', 'CMP-2026-000001', 'Electronic Weighing Scale Checklist', 'Standard verification checklist for digital weighing scales',
'[{"parameter":"Zero Error","tolerance":"±0.00%","mandatory":true},{"parameter":"Span Test (Full Load)","tolerance":"±0.1%","mandatory":true},{"parameter":"Linearity Check","tolerance":"±0.05%","mandatory":true},{"parameter":"Repeatability","tolerance":"±0.02%","mandatory":true},{"parameter":"Eccentricity Test","tolerance":"±0.1%","mandatory":true},{"parameter":"Power Supply Stability","tolerance":"Nominal ±10%","mandatory":false},{"parameter":"Display Readability","tolerance":"Clear digits","mandatory":true}]', 1),
('CHK-2026-000002', 'CMP-2026-000002', 'Mechanical Weighing Scale Checklist', 'Standard verification checklist for mechanical balance scales',
'[{"parameter":"Zero Balance","tolerance":"±0.00%","mandatory":true},{"parameter":"Full Load Accuracy","tolerance":"±0.1%","mandatory":true},{"parameter":"Half Load Accuracy","tolerance":"±0.1%","mandatory":true},{"parameter":"Sensitivity Test","tolerance":"Per specification","mandatory":true},{"parameter":"Pivot Wear Check","tolerance":"No visible wear","mandatory":true},{"parameter":"Pointer Alignment","tolerance":"Within scale marks","mandatory":true}]', 1),
('CHK-2026-000003', 'CMP-2026-000003', 'Measuring Tape Checklist', 'Standard verification checklist for steel measuring tapes',
'[{"parameter":"Zero Mark Alignment","tolerance":"±0.5mm","mandatory":true},{"parameter":"1m Mark Accuracy","tolerance":"±1.0mm","mandatory":true},{"parameter":"5m Mark Accuracy","tolerance":"±1.0mm","mandatory":true},{"parameter":"Tape Straightness","tolerance":"No kinks","mandatory":true},{"parameter":"Hook/Face Movement","tolerance":"Free play ±0.5mm","mandatory":true},{"parameter":"Marking Legibility","tolerance":"Clearly visible","mandatory":true}]', 1),
('CHK-2026-000004', 'CMP-2026-000004', 'Volume Measuring Checklist', 'Standard verification checklist for volume measuring instruments',
'[{"parameter":"Zero Calibration","tolerance":"±0.0ml","mandatory":true},{"parameter":"Full Scale Accuracy","tolerance":"±0.5%","mandatory":true},{"parameter":"Mid Scale Accuracy","tolerance":"±0.3%","mandatory":true},{"parameter":"Meniscus Readability","tolerance":"Clear reading","mandatory":true},{"parameter":"Drainage Test","tolerance":"Complete drainage","mandatory":true},{"parameter":"Temperature Compensation","tolerance":"±0.1%/°C","mandatory":false}]', 1),
('CHK-2026-000005', 'CMP-2026-000005', 'Fuel Dispenser Checklist', 'Standard verification checklist for fuel dispensing instruments',
'[{"parameter":"Zero Error","tolerance":"±0.00%","mandatory":true},{"parameter":"Volume Accuracy (5L)","tolerance":"±0.3%","mandatory":true},{"parameter":"Volume Accuracy (20L)","tolerance":"±0.2%","mandatory":true},{"parameter":"Flow Rate Consistency","tolerance":"±2%","mandatory":true},{"parameter":"Nozzle Shut-off","tolerance":"Auto cutoff","mandatory":true},{"parameter":"Pulse Counter Check","tolerance":"±1 pulse","mandatory":true},{"parameter":"Anti-siphon Valve","tolerance":"No backflow","mandatory":true}]', 1)
ON CONFLICT (id) DO NOTHING;
