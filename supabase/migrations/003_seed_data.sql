-- Water Watch Bengaluru - Schema Migration 003
-- Seed Data for Verified Bengaluru Zones, BWSSB Water Assets, Detection Rules, and Pilot Personas

-- 1. Departments
INSERT INTO departments (id, code, name, description, contact_email, contact_phone, jurisdiction_zone) VALUES
('d1111111-1111-1111-1111-111111111101', 'BWSSB_CENTRAL', 'BWSSB Central Maintenance & Distribution', 'Core city distribution pipeline and GLR operations', 'maintenance.central@bwssb.karnataka.gov.in', '080-22238888', 'Central'),
('d1111111-1111-1111-1111-111111111102', 'BWSSB_QC_LAB', 'BWSSB Central Water Quality Laboratory', 'Central testing facility at High Grounds Reservoir', 'lab.qc@bwssb.karnataka.gov.in', '080-22238899', 'All Zones'),
('d1111111-1111-1111-1111-111111111103', 'BWSSB_EAST', 'BWSSB East Division (Indiranagar / Whitefield)', 'East zone trunk mains and DMA management', 'ee.east@bwssb.karnataka.gov.in', '080-25211916', 'East'),
('d1111111-1111-1111-1111-111111111104', 'BBMP_HEALTH', 'BBMP Public Health Directorate', 'Epidemic surveillance, IDSP node, and UPHC coordination', 'cho.bbmp@karnataka.gov.in', '080-22660000', 'All Zones')
ON CONFLICT (code) DO NOTHING;

-- 2. Roles
INSERT INTO roles (role_key, title, description, permissions) VALUES
('ADMIN', 'System Administrator', 'Full configuration, security, audit, and rule management', '["ALL"]'::jsonb),
('WATER_ENGINEER', 'BWSSB Water Engineer', 'Field inspection, telemetry review, pressure management, pipeline repair', '["VIEW_TELEMETRY", "INSPECT_INCIDENT", "LOG_REPAIR", "ACKNOWLEDGE_ALERT"]'::jsonb),
('WATER_QUALITY_OFFICER', 'Water Quality & Lab Officer', 'Sample collection, IS 10500 lab certification, chlorine/turbidity verification', '["VIEW_QUALITY_ALERTS", "LOG_SAMPLE", "CERTIFY_LAB_RESULT"]'::jsonb),
('ZONAL_SUPERVISOR', 'Zonal Executive Engineer / Control Room', 'Jurisdiction overview, ticket triage, officer assignment, SLA escalation', '["ASSIGN_TICKET", "ESCALATE_SLA", "VIEW_ZONE_METRICS", "PUBLISH_ADVISORY"]'::jsonb),
('PUBLIC_HEALTH_OFFICER', 'Public Health Surveillance Officer', 'Privacy-conscious symptom trend review, correlation analysis, IDSP notifications', '["VIEW_HEALTH_SIGNALS", "RECORD_EPIDEMIOLOGY_NOTE"]'::jsonb),
('CITIZEN', 'Citizen / Consumer', 'File grievance, check ticket status, view public boil-water notices', '["SUBMIT_COMPLAINT", "VIEW_OWN_STATUS", "VIEW_PUBLIC_ADVISORIES"]'::jsonb),
('LEADERSHIP', 'Government Leadership / MD', 'City-wide macro trends, NRW analytics, ward performance scores', '["VIEW_ANALYTICS", "EXPORT_REPORTS"]'::jsonb)
ON CONFLICT (role_key) DO NOTHING;

-- 3. Geographic Areas (Real Bengaluru Wards & Localities)
INSERT INTO geographic_areas (id, name, zone, ward_number, division, latitude, longitude, population_est, water_supply_source) VALUES
('w1111111-1111-1111-1111-111111111101', 'Koramangala (Ward 151)', 'South', 151, 'BTM Layout', 12.9352, 77.6245, 68000, 'Cauvery CWSS Stage IV / Local Borewells'),
('w1111111-1111-1111-1111-111111111102', 'Indiranagar (Ward 80)', 'East', 80, 'CV Raman Nagar', 12.9784, 77.6408, 54000, 'Cauvery CWSS Stage IV'),
('w1111111-1111-1111-1111-111111111103', 'Whitefield (Ward 84 / Hagadur)', 'Mahadevapura', 84, 'Mahadevapura', 12.9698, 77.7499, 125000, 'Cauvery Stage V / Tankers / Deep Borewells'),
('w1111111-1111-1111-1111-111111111104', 'Malleshwaram (Ward 45)', 'West', 45, 'Malleshwaram', 13.0031, 77.5643, 72000, 'Cauvery CWSS Stage II & IV'),
('w1111111-1111-1111-1111-111111111105', 'Jayanagar 4th Block (Ward 153)', 'South', 153, 'Jayanagar', 12.9250, 77.5938, 59000, 'Cauvery CWSS Stage IV'),
('w1111111-1111-1111-1111-111111111106', 'Bellandur (Ward 150)', 'Mahadevapura', 150, 'Mahadevapura', 12.9304, 77.6784, 110000, 'Cauvery Stage V / Private Tankers'),
('w1111111-1111-1111-1111-111111111107', 'Yelahanka Satellite Town (Ward 4)', 'Yelahanka', 4, 'Yelahanka', 13.1007, 77.5963, 85000, 'Cauvery Stage IV Phase 2 / GLR Network'),
('w1111111-1111-1111-1111-111111111108', 'HSR Layout (Ward 174)', 'Bommanahalli', 174, 'Bommanahalli', 12.9121, 77.6446, 92000, 'Cauvery CWSS Stage IV / Booster Station')
ON CONFLICT DO NOTHING;

-- 4. Water Assets (Realistic Master Balancing Reservoirs & GLRs)
INSERT INTO water_assets (id, asset_code, asset_type, name, ward_id, latitude, longitude, capacity_litres, commission_year, status) VALUES
('a1111111-1111-1111-1111-111111111101', 'MBR-HG-01', 'MBR', 'High Grounds Master Balancing Reservoir', 'w1111111-1111-1111-1111-111111111104', 12.9925, 77.5855, 45000000, 1974, 'OPERATIONAL'),
('a1111111-1111-1111-1111-111111111102', 'GLR-KOR-02', 'GLR', 'Koramangala 4th Block Ground Level Reservoir', 'w1111111-1111-1111-1111-111111111101', 12.9360, 77.6250, 15000000, 1996, 'OPERATIONAL'),
('a1111111-1111-1111-1111-111111111103', 'DMA-IND-01', 'DISTRIBUTION_MAIN', 'Indiranagar 100ft Road DMA Feed Line', 'w1111111-1111-1111-1111-111111111102', 12.9750, 77.6410, NULL, 2012, 'OPERATIONAL'),
('a1111111-1111-1111-1111-111111111104', 'BPS-HSR-01', 'PUMP_STATION', 'HSR Sector 2 Booster Pumping Station', 'w1111111-1111-1111-1111-111111111108', 12.9130, 77.6420, 8000000, 2018, 'OPERATIONAL'),
('a1111111-1111-1111-1111-111111111105', 'GLR-WTF-01', 'GLR', 'Whitefield Hope Farm Feeder Reservoir', 'w1111111-1111-1111-1111-111111111103', 12.9830, 77.7510, 20000000, 2024, 'OPERATIONAL')
ON CONFLICT (asset_code) DO NOTHING;

-- 5. Standard Detection Rules (Documented Technical Standards)
INSERT INTO detection_rules (id, rule_code, rule_name, rule_category, description, threshold_config, time_window_seconds, severity, technical_basis) VALUES
('r1111111-1111-1111-1111-111111111101', 'RULE_SUDDEN_PRESSURE_DROP', 'Sudden Distribution Pressure Drop', 'HYDRAULIC', 
 'Triggers when line pressure drops below 0.5 bar or experiences >30% drop within 15 minutes during active supply schedule. Carries severe back-siphonage contamination risk.',
 '{"min_pressure_bar": 0.5, "max_rate_of_change_pct": -30.0, "time_window_mins": 15}'::jsonb, 900, 'HIGH',
 'CPHEEO Manual on Water Supply and Distribution: Intermittent supply depressurization creates negative pressure back-siphonage from surrounding saturated soil/sewers.'),

('r1111111-1111-1111-1111-111111111102', 'RULE_PIPE_BURST_FLOW_PRESSURE', 'Pipeline Rupture / Burst Co-incidence', 'HYDRAULIC',
 'Triggers when pressure falls by >25% while instantaneous flow surges by >40% above baseline.',
 '{"pressure_drop_pct": 25.0, "flow_surge_pct": 40.0, "duration_mins": 10}'::jsonb, 600, 'CRITICAL',
 'Hydraulic transient theory: Concurrent pressure collapse and flow surge denotes physical pipe rupture on major feeder trunk.'),

('r1111111-1111-1111-1111-111111111103', 'RULE_HIGH_TURBIDITY', 'Excessive Turbidity Exceedance', 'QUALITY',
 'Triggers when nephelometric turbidity exceeds IS 10500 permissible limit of 2.0 NTU (Warning) or 5.0 NTU (Critical).',
 '{"warning_ntu": 2.0, "critical_ntu": 5.0, "acceptable_limit": 1.0}'::jsonb, 300, 'HIGH',
 'IS 10500:2012 Indian Drinking Water Specification: Acceptable limit is 1.0 NTU, upper permissible limit is 5.0 NTU.'),

('r1111111-1111-1111-1111-111111111104', 'RULE_CHLORINE_DEPLETION', 'Residual Chlorine Depletion / Over-Chlorination', 'QUALITY',
 'Triggers when free residual chlorine falls below 0.20 mg/L (risk of bacterial re-growth) or exceeds 2.50 mg/L (taste/disinfection byproduct risk).',
 '{"min_chlorine_mg_l": 0.20, "max_chlorine_mg_l": 2.50, "target_chlorine": 0.50}'::jsonb, 300, 'HIGH',
 'IS 10500:2012: Minimum free residual chlorine of 0.2 mg/L at consumer delivery tap is statutory requirement for microbiological safety.'),

('r1111111-1111-1111-1111-111111111105', 'RULE_CITIZEN_QUALITY_CLUSTER', 'Local Dirty Water Complaint Cluster', 'CITIZEN_CLUSTER',
 'Triggers when 3 or more independent citizen complaints reporting dirty, discolored, or smelly water occur in the same ward within 24 hours.',
 '{"min_complaints": 3, "time_window_hours": 24, "categories": ["DIRTY_WATER", "FOUL_SMELL", "SEWAGE_MIXING"]}'::jsonb, 86400, 'HIGH',
 'Municipal Grievance Protocol: Clustered complaints within identical valve boundary indicates cross-contamination plug or line scouring.'),

('r1111111-1111-1111-1111-111111111106', 'RULE_MIN_NIGHT_FLOW_LEAK', 'Abnormal Minimum Night Flow (MNF)', 'HYDRAULIC',
 'Triggers when night-time flow rate between 02:00 AM and 04:00 AM exceeds 45% of diurnal peak daytime average.',
 '{"start_hour": 2, "end_hour": 4, "max_night_to_day_ratio": 0.45}'::jsonb, 7200, 'MEDIUM',
 'IWA (International Water Association) DMA Leakage Guidelines: Excess flow during legitimate minimum domestic use indicates chronic background distribution loss.'),

('r1111111-1111-1111-1111-111111111107', 'RULE_SENSOR_HEARTBEAT_MISSING', 'Sensor Telemetry Heartbeat Timeout', 'ASSET',
 'Triggers when an active online telemetry sensor fails to submit data within 45 minutes.',
 '{"timeout_mins": 45}'::jsonb, 2700, 'MEDIUM',
 'IoT Reliability Standard: Loss of telemetry indicates power exhaustion, GSM network outage, or device tamper.'),

('r1111111-1111-1111-1111-111111111108', 'RULE_PUBLIC_HEALTH_SIGNAL_CLUSTER', 'Aggregated Gastrointestinal Symptom Spike', 'HEALTH_SIGNAL',
 'Triggers when citizen symptom signals in a ward exceed historical baseline by 200% with at least 5 reporting households.',
 '{"min_reports": 5, "baseline_multiplier": 2.0, "time_window_days": 3}'::jsonb, 259200, 'CRITICAL',
 'Public Health Epidemiological Protocol: Signal generated for authorized BBMP/IDSP assessment. Does NOT declare outbreak automatically.')
ON CONFLICT (rule_code) DO NOTHING;

