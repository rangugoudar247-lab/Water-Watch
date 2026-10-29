-- Water Watch Bengaluru - Schema Migration 001
-- PostgreSQL / Supabase Relational Database Schema
-- Verified for Production and Pilot Deployments

-- Extension for UUID generation and GIS (if PostGIS enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Departments
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    jurisdiction_zone VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Roles
CREATE TABLE IF NOT EXISTS roles (
    role_key VARCHAR(50) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb
);

-- 3. Users (Compatible with Supabase Auth or Local RBAC)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID, -- References auth.users(id) in Supabase
    email VARCHAR(150) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    role_key VARCHAR(50) REFERENCES roles(role_key),
    department_id UUID REFERENCES departments(id),
    jurisdiction_zone VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Geographic Areas (Bengaluru Wards and Administrative Zones)
CREATE TABLE IF NOT EXISTS geographic_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    zone VARCHAR(100) NOT NULL,
    ward_number INT,
    division VARCHAR(100),
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    population_est INT,
    water_supply_source VARCHAR(100) DEFAULT 'Cauvery Stage IV / Ground Water',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Water Assets (GLRs, Pumping Stations, Distribution Mains, ATMs)
CREATE TABLE IF NOT EXISTS water_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_code VARCHAR(50) UNIQUE NOT NULL,
    asset_type VARCHAR(50) NOT NULL, -- GLR, MBR, PUMP_STATION, DISTRIBUTION_MAIN, OHT, WATER_ATM
    name VARCHAR(150) NOT NULL,
    ward_id UUID REFERENCES geographic_areas(id),
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    capacity_litres NUMERIC(15, 2),
    commission_year INT,
    status VARCHAR(30) DEFAULT 'OPERATIONAL', -- OPERATIONAL, MAINTENANCE, OFFLINE, DECOMMISSIONED
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Sensors
CREATE TABLE IF NOT EXISTS sensors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_code VARCHAR(50) UNIQUE NOT NULL,
    asset_id UUID REFERENCES water_assets(id),
    ward_id UUID REFERENCES geographic_areas(id),
    sensor_type VARCHAR(50) NOT NULL, -- PRESSURE, FLOW, TURBIDITY, CHLORINE, PH, WATER_LEVEL, PUMP_STATUS
    model VARCHAR(100),
    serial_number VARCHAR(100),
    install_date DATE,
    last_calibrated_at TIMESTAMPTZ,
    calibration_due_date DATE,
    sampling_interval_sec INT DEFAULT 300,
    power_type VARCHAR(50) DEFAULT 'SOLAR_BATTERY',
    comm_type VARCHAR(50) DEFAULT 'CELLULAR_NBIOT',
    status VARCHAR(30) DEFAULT 'ONLINE', -- ONLINE, DEGRADED, OFFLINE, CALIBRATION_DUE
    data_category VARCHAR(30) DEFAULT 'DEMO', -- REAL, DEMO, PUBLIC, UNVERIFIED
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Sensor Readings
CREATE TABLE IF NOT EXISTS sensor_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_id UUID REFERENCES sensors(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    value NUMERIC(12, 4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    data_category VARCHAR(30) NOT NULL, -- REAL, DEMO, PUBLIC, UNVERIFIED
    validation_status VARCHAR(20) DEFAULT 'VALID', -- VALID, SUSPECT, INVALID
    raw_payload JSONB,
    anomaly_flag BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_ts ON sensor_readings(sensor_id, timestamp DESC);

-- 8. Sensor Health Events
CREATE TABLE IF NOT EXISTS sensor_health_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_id UUID REFERENCES sensors(id),
    event_type VARCHAR(50) NOT NULL, -- HEARTBEAT_MISSING, BATTERY_LOW, CALIBRATION_EXPIRED, OUT_OF_BOUNDS
    severity VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    details JSONB,
    resolved_at TIMESTAMPTZ
);

-- 9. External Data Sources & Health Monitor
CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_name VARCHAR(150) NOT NULL,
    source_category VARCHAR(30) NOT NULL, -- REAL, DEMO, PUBLIC, UNVERIFIED
    organization VARCHAR(150) NOT NULL,
    endpoint_url TEXT,
    sync_frequency_mins INT DEFAULT 60,
    last_sync_at TIMESTAMPTZ,
    last_sync_status VARCHAR(30) DEFAULT 'CONNECTED', -- CONNECTED, DEGRADED, FAILED, SIMULATED
    connection_health NUMERIC(5, 2) DEFAULT 100.00,
    stale_threshold_hours INT DEFAULT 4,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Citizen Complaints
CREATE TABLE IF NOT EXISTS citizen_complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(30) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL, -- DIRTY_WATER, FOUL_SMELL, NO_WATER, LOW_PRESSURE, PIPELINE_LEAK, EMPTY_WATER_POINT, SEWAGE_MIXING
    status VARCHAR(30) DEFAULT 'NEW', -- NEW, TRIAGED, ASSIGNED, ACKNOWLEDGED, FIELD_INSPECTION, ACTION_IN_PROGRESS, RESOLVED, VERIFIED, CLOSED, REOPENED
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    ward_id UUID REFERENCES geographic_areas(id),
    address_text TEXT NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT NOT NULL,
    photo_url TEXT,
    language VARCHAR(10) DEFAULT 'en', -- en, kn
    complainant_name VARCHAR(100),
    complainant_phone VARCHAR(20),
    consent_given BOOLEAN DEFAULT TRUE,
    is_anonymized BOOLEAN DEFAULT TRUE,
    merged_into_id UUID REFERENCES citizen_complaints(id),
    duplicate_cluster_id UUID,
    data_category VARCHAR(30) DEFAULT 'UNVERIFIED',
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_complaints_ward ON citizen_complaints(ward_id, reported_at DESC);

-- 11. Complaint Attachments & Evidence
CREATE TABLE IF NOT EXISTS complaint_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID REFERENCES citizen_complaints(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Detection Rules
CREATE TABLE IF NOT EXISTS detection_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_code VARCHAR(50) UNIQUE NOT NULL,
    rule_name VARCHAR(150) NOT NULL,
    rule_category VARCHAR(50) NOT NULL, -- HYDRAULIC, QUALITY, ASSET, CITIZEN_CLUSTER, HEALTH_SIGNAL
    description TEXT NOT NULL,
    threshold_config JSONB NOT NULL,
    time_window_seconds INT DEFAULT 3600,
    severity VARCHAR(20) DEFAULT 'HIGH', -- LOW, MEDIUM, HIGH, CRITICAL
    is_enabled BOOLEAN DEFAULT TRUE,
    technical_basis TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Incidents & Alerts
CREATE TABLE IF NOT EXISTS incidents_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_number VARCHAR(30) UNIQUE NOT NULL,
    alert_category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- INFO, LOW, MEDIUM, HIGH, CRITICAL
    triggered_rule_id UUID REFERENCES detection_rules(id),
    ward_id UUID REFERENCES geographic_areas(id),
    asset_id UUID REFERENCES water_assets(id),
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(30) DEFAULT 'NEW', -- NEW, TRIAGED, ASSIGNED, ACKNOWLEDGED, FIELD_INSPECTION, ACTION_IN_PROGRESS, RESOLVED, VERIFIED, CLOSED, REOPENED
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    evidence_payload JSONB NOT NULL,
    data_category VARCHAR(30) NOT NULL,
    confidence_level VARCHAR(30) DEFAULT 'MODERATE_CONFIDENCE',
    recommended_actions TEXT,
    assigned_department_id UUID REFERENCES departments(id),
    assigned_user_id UUID REFERENCES users(id),
    sla_deadline TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents_alerts(status, severity);

-- 14. Incident Status History & Audit Timeline
CREATE TABLE IF NOT EXISTS incident_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents_alerts(id) ON DELETE CASCADE,
    changed_by_user_id UUID REFERENCES users(id),
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    comment TEXT,
    evidence_urls JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Water Sampling & Chain of Custody
CREATE TABLE IF NOT EXISTS water_samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sample_code VARCHAR(50) UNIQUE NOT NULL,
    incident_id UUID REFERENCES incidents_alerts(id),
    asset_id UUID REFERENCES water_assets(id),
    ward_id UUID REFERENCES geographic_areas(id),
    collected_by_user_id UUID REFERENCES users(id),
    collected_at TIMESTAMPTZ DEFAULT NOW(),
    sample_location_text TEXT NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    chain_of_custody_notes TEXT,
    lab_status VARCHAR(30) DEFAULT 'COLLECTED' -- COLLECTED, IN_TRANSIT, ANALYSIS_IN_PROGRESS, COMPLETED
);

-- 16. Laboratory Results (IS 10500:2012 Compliance)
CREATE TABLE IF NOT EXISTS laboratory_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sample_id UUID REFERENCES water_samples(id) ON DELETE CASCADE,
    lab_name VARCHAR(150) NOT NULL,
    tested_by_officer VARCHAR(150) NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    ph_value NUMERIC(4, 2),
    turbidity_ntu NUMERIC(6, 2),
    free_chlorine_mg_l NUMERIC(6, 3),
    total_coliform_cfu_100ml INT,
    e_coli_cfu_100ml INT,
    tds_mg_l NUMERIC(8, 2),
    nitrates_mg_l NUMERIC(6, 2),
    fluorides_mg_l NUMERIC(6, 2),
    meets_is10500 BOOLEAN NOT NULL,
    official_certification_pdf_url TEXT,
    certified_by_signature VARCHAR(150),
    data_category VARCHAR(30) DEFAULT 'DEMO',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Field Inspections
CREATE TABLE IF NOT EXISTS field_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents_alerts(id) ON DELETE CASCADE,
    inspector_user_id UUID REFERENCES users(id),
    inspected_at TIMESTAMPTZ DEFAULT NOW(),
    findings TEXT NOT NULL,
    root_cause VARCHAR(100), -- PIPE_BURST, SEWAGE_BACK_SIPHONAGE, CHLORINATOR_FAILURE, VALVE_MALFUNCTION, DRY_BOREWELL, UNFOUND
    action_taken TEXT,
    photos JSONB,
    follow_up_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Corrective Actions
CREATE TABLE IF NOT EXISTS corrective_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents_alerts(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- PIPE_REPAIR, VALVE_REPLACEMENT, FLUSHING_SCOURING, CHLORINE_BOOST, TANKER_DISPATCH, BOIL_WATER_NOTICE
    description TEXT NOT NULL,
    executed_by VARCHAR(150) NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    verification_notes TEXT
);

-- 19. Aggregated Health Signals (Privacy-Conscious)
CREATE TABLE IF NOT EXISTS aggregated_health_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    signal_code VARCHAR(50) UNIQUE NOT NULL,
    ward_id UUID REFERENCES geographic_areas(id),
    date_recorded DATE NOT NULL,
    report_count INT NOT NULL,
    symptom_types JSONB NOT NULL,
    baseline_comparison_pct NUMERIC(6, 2),
    signal_strength VARCHAR(30) DEFAULT 'LOW', -- LOW, ELEVATED, UNUSUAL_CLUSTER
    review_status VARCHAR(30) DEFAULT 'PENDING_REVIEW', -- PENDING_REVIEW, UNDER_INVESTIGATION, REFERRED_TO_IDSP, RESOLVED
    reviewed_by_user_id UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    assessment_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Public Advisories
CREATE TABLE IF NOT EXISTS public_advisories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advisory_code VARCHAR(50) UNIQUE NOT NULL,
    title_en VARCHAR(200) NOT NULL,
    title_kn VARCHAR(250) NOT NULL,
    content_en TEXT NOT NULL,
    content_kn TEXT NOT NULL,
    advisory_type VARCHAR(50) NOT NULL, -- BOIL_WATER, WATER_SAVING, SUPPLY_SHUTDOWN, TANKER_SCHEDULE
    affected_wards JSONB,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    issued_by_officer_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    data_category VARCHAR(30) DEFAULT 'PUBLIC',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Notifications & Audit Logs
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_user_id UUID REFERENCES users(id),
    recipient_role VARCHAR(50),
    channel VARCHAR(20) NOT NULL, -- IN_APP, EMAIL, SMS, WHATSAPP
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    incident_id UUID REFERENCES incidents_alerts(id),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivery_status VARCHAR(20) DEFAULT 'SIMULATED', -- DELIVERED, SIMULATED, FAILED, RETRYING
    error_message TEXT,
    is_read BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    change_details JSONB,
    ip_address VARCHAR(50),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

