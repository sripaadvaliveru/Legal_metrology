-- Seed data for Legal Metrology Verification System
-- Run this after the application starts and Hibernate creates the tables

-- Password: password123 (BCrypt hashed)
-- Hash generated with: BCryptPasswordEncoder.encode("password123")

-- Test Users (ON CONFLICT DO NOTHING to prevent duplicate key errors on restart)
INSERT INTO users (id, name, email, password, role, phone, is_active, created_at, updated_at) VALUES
('a0000001-0000-0000-0000-000000000001', 'Rajesh Kumar', 'business@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'BUSINESS', '9876543210', true, NOW(), NOW()),
('a0000001-0000-0000-0000-000000000002', 'Suresh Verma', 'lmo@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'LMO', '9876543211', true, NOW(), NOW()),
('a0000001-0000-0000-0000-000000000003', 'GATC Test Center', 'gatc@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'GATC', '9876543212', true, NOW(), NOW()),
('a0000001-0000-0000-0000-000000000004', 'Priya Sharma', 'district@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'DISTRICT_OFFICER', '9876543213', true, NOW(), NOW()),
('a0000001-0000-0000-0000-000000000005', 'Amit Patel', 'state@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'STATE_OFFICER', '9876543214', true, NOW(), NOW()),
('a0000001-0000-0000-0000-000000000006', 'Admin User', 'admin@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'SUPER_ADMIN', '9876543215', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

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

-- Instruments
INSERT INTO instruments (id, instrument_id, manufacturer, model, serial_number, capacity_range, accuracy, year_of_manufacture, usage, status, instrument_type_id, establishment_id, created_at, updated_at) VALUES
('f0000001-0000-0000-0000-000000000001', 'LM-INST-2026-000001', 'Avery India', 'WS-500', 'SN-12345', '0-500kg', 'Class III', 2024, 'Commercial weighing', 'REGISTERED', 'b0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
