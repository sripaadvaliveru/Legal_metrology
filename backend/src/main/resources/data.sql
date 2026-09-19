-- Seed data for Legal Metrology Verification System

-- Password: password123 (BCrypt hashed)
-- Hash generated with: BCryptPasswordEncoder.encode("password123")

-- Instrument Types
INSERT INTO instrument_types (id, name, description, validity_months) VALUES
('b0000001-0000-0000-0000-000000000001', 'Electronic Weighing Scale', 'Digital weighing scale for commercial use', 12),
('b0000001-0000-0000-0000-000000000002', 'Mechanical Weighing Scale', 'Traditional mechanical balance scale', 12),
('b0000001-0000-0000-0000-000000000003', 'Measuring Tape', 'Steel measuring tape for length measurement', 24),
('b0000001-0000-0000-0000-000000000004', 'Volume Measuring Instrument', 'Instruments for measuring liquid volume', 12),
('b0000001-0000-0000-0000-000000000005', 'Fuel Dispenser', 'Fuel dispensing measurement instrument', 12)
ON CONFLICT (id) DO NOTHING;

-- Jurisdictions
INSERT INTO jurisdictions (id, name, jurisdiction_code, level, state, district) VALUES
('c0000001-0000-0000-0000-000000000001', 'Hyderabad East', 'HYD-EAST', 'DISTRICT', 'Telangana', 'Hyderabad'),
('c0000001-0000-0000-0000-000000000002', 'Hyderabad West', 'HYD-WEST', 'DISTRICT', 'Telangana', 'Hyderabad'),
('c0000001-0000-0000-0000-000000000003', 'Cyberabad', 'CYB', 'DISTRICT', 'Telangana', 'Rangareddy')
ON CONFLICT (id) DO NOTHING;

-- Businesses
INSERT INTO businesses (id, name, registration_number, gst_number, address, city, state, pincode, contact_person, phone, email, created_at, updated_at) VALUES
('d0000001-0000-0000-0000-000000000001', 'Kumar Enterprises', 'REG-001', 'GST-001', '123 Main St', 'Hyderabad', 'Telangana', '500001', 'Rajesh Kumar', '9876543210', 'business@test.com', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Establishments
INSERT INTO establishments (id, name, address, city, district, state, pincode, latitude, longitude, business_id, created_at, updated_at) VALUES
('e0000001-0000-0000-0000-000000000001', 'Kumar Enterprises - Main', '123 Main St', 'Hyderabad', 'Hyderabad', 'Telangana', '500001', 17.3850, 78.4867, 'd0000001-0000-0000-0000-000000000001', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Test Users (ON CONFLICT DO NOTHING to prevent duplicate key errors on restart)
INSERT INTO users (id, name, email, password, role, phone, is_active, business_id, created_at, updated_at) VALUES
('a0000001-0000-0000-0000-000000000001', 'Rajesh Kumar', 'business@test.com', '$2a$10$w/XWDSGyuOIczrfVCtufZeibm6iHfRAhjZRJqFyknkwJPR2ScT0te', 'BUSINESS', '9876543210', true, 'd0000001-0000-0000-0000-000000000001', NOW(), NOW()),
('a0000001-0000-0000-0000-000000000002', 'Suresh Verma', 'lmo@test.com', '$2a$10$w/XWDSGyuOIczrfVCtufZeibm6iHfRAhjZRJqFyknkwJPR2ScT0te', 'LMO', '9876543211', true, NULL, NOW(), NOW()),
('a0000001-0000-0000-0000-000000000003', 'GATC Test Center', 'gatc@test.com', '$2a$10$w/XWDSGyuOIczrfVCtufZeibm6iHfRAhjZRJqFyknkwJPR2ScT0te', 'GATC', '9876543212', true, NULL, NOW(), NOW()),
('a0000001-0000-0000-0000-000000000004', 'Priya Sharma', 'district@test.com', '$2a$10$w/XWDSGyuOIczrfVCtufZeibm6iHfRAhjZRJqFyknkwJPR2ScT0te', 'DISTRICT_OFFICER', '9876543213', true, NULL, NOW(), NOW()),
('a0000001-0000-0000-0000-000000000005', 'Amit Patel', 'state@test.com', '$2a$10$w/XWDSGyuOIczrfVCtufZeibm6iHfRAhjZRJqFyknkwJPR2ScT0te', 'STATE_OFFICER', '9876543214', true, NULL, NOW(), NOW()),
('a0000001-0000-0000-0000-000000000006', 'Admin User', 'admin@test.com', '$2a$10$w/XWDSGyuOIczrfVCtufZeibm6iHfRAhjZRJqFyknkwJPR2ScT0te', 'SUPER_ADMIN', '9876543215', true, NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Instruments
INSERT INTO instruments (id, instrument_id, manufacturer, model, serial_number, capacity_range, accuracy, year_of_manufacture, usage, status, instrument_type_id, establishment_id, created_at, updated_at) VALUES
('f0000001-0000-0000-0000-000000000001', 'LM-INST-2026-000001', 'Avery India', 'WS-500', 'SN-12345', '0-500kg', 'Class III', 2024, 'Commercial weighing', 'REGISTERED', 'b0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Clean up broken test application rows (and their children) if they exist
DELETE FROM application_status_history WHERE application_id = 'aa000001-0000-0000-0000-000000000001' OR application_id IN (SELECT id FROM applications WHERE application_number = 'APP-2026-000001');
DELETE FROM assignments WHERE application_id = 'aa000001-0000-0000-0000-000000000001' OR application_id IN (SELECT id FROM applications WHERE application_number = 'APP-2026-000001');
DELETE FROM applications WHERE id = 'aa000001-0000-0000-0000-000000000001' OR application_number = 'APP-2026-000001';

-- Test Applications (for LMO workflow)
INSERT INTO applications (id, application_number, type, status, instrument_id, applicant_id, submitted_at, created_at, updated_at) VALUES
('aa000001-0000-0000-0000-000000000001', 'APP-2026-000001', 'INITIAL_VERIFICATION', 'SUBMITTED', 'f0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Checklist Templates (one per instrument type)
INSERT INTO checklist_templates (id, instrument_type_id, template_name, description, checklist_items, version) VALUES
('cc000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Electronic Weighing Scale Checklist', 'Standard verification checklist for digital weighing scales',
'[{"parameter":"Zero Error","tolerance":"±0.00%","mandatory":true},{"parameter":"Span Test (Full Load)","tolerance":"±0.1%","mandatory":true},{"parameter":"Linearity Check","tolerance":"±0.05%","mandatory":true},{"parameter":"Repeatability","tolerance":"±0.02%","mandatory":true},{"parameter":"Eccentricity Test","tolerance":"±0.1%","mandatory":true},{"parameter":"Power Supply Stability","tolerance":"Nominal ±10%","mandatory":false},{"parameter":"Display Readability","tolerance":"Clear digits","mandatory":true}]', 1),
('cc000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', 'Mechanical Weighing Scale Checklist', 'Standard verification checklist for mechanical balance scales',
'[{"parameter":"Zero Balance","tolerance":"±0.00%","mandatory":true},{"parameter":"Full Load Accuracy","tolerance":"±0.1%","mandatory":true},{"parameter":"Half Load Accuracy","tolerance":"±0.1%","mandatory":true},{"parameter":"Sensitivity Test","tolerance":"Per specification","mandatory":true},{"parameter":"Pivot Wear Check","tolerance":"No visible wear","mandatory":true},{"parameter":"Pointer Alignment","tolerance":"Within scale marks","mandatory":true}]', 1),
('cc000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000003', 'Measuring Tape Checklist', 'Standard verification checklist for steel measuring tapes',
'[{"parameter":"Zero Mark Alignment","tolerance":"±0.5mm","mandatory":true},{"parameter":"1m Mark Accuracy","tolerance":"±1.0mm","mandatory":true},{"parameter":"5m Mark Accuracy","tolerance":"±2.0mm","mandatory":true},{"parameter":"Tape Straightness","tolerance":"No kinks","mandatory":true},{"parameter":"Hook/Face Movement","tolerance":"Free play ±0.5mm","mandatory":true},{"parameter":"Marking Legibility","tolerance":"Clearly visible","mandatory":true}]', 1),
('cc000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000004', 'Volume Measuring Checklist', 'Standard verification checklist for volume measuring instruments',
'[{"parameter":"Zero Calibration","tolerance":"±0.0ml","mandatory":true},{"parameter":"Full Scale Accuracy","tolerance":"±0.5%","mandatory":true},{"parameter":"Mid Scale Accuracy","tolerance":"±0.3%","mandatory":true},{"parameter":"Meniscus Readability","tolerance":"Clear reading","mandatory":true},{"parameter":"Drainage Test","tolerance":"Complete drainage","mandatory":true},{"parameter":"Temperature Compensation","tolerance":"±0.1%/°C","mandatory":false}]', 1),
('cc000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000005', 'Fuel Dispenser Checklist', 'Standard verification checklist for fuel dispensing instruments',
'[{"parameter":"Zero Error","tolerance":"±0.00%","mandatory":true},{"parameter":"Volume Accuracy (5L)","tolerance":"±0.3%","mandatory":true},{"parameter":"Volume Accuracy (20L)","tolerance":"±0.2%","mandatory":true},{"parameter":"Flow Rate Consistency","tolerance":"±2%","mandatory":true},{"parameter":"Nozzle Shut-off","tolerance":"Auto cutoff","mandatory":true},{"parameter":"Pulse Counter Check","tolerance":"±1 pulse","mandatory":true},{"parameter":"Anti-siphon Valve","tolerance":"No backflow","mandatory":true}]', 1)
ON CONFLICT (id) DO NOTHING;
