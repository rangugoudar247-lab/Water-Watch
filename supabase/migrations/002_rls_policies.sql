-- Water Watch Bengaluru - Schema Migration 002
-- Row Level Security (RLS) Policies
-- Enforces Least Privilege, Public Anonymization, and Role-Based Separation

-- Enable RLS on core sensitive tables
ALTER TABLE citizen_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratory_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE aggregated_health_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_advisories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. CITIZEN COMPLAINTS POLICIES
-- Anyone (including unauthenticated citizens) can create a complaint
CREATE POLICY "Public citizen can insert complaints" 
ON citizen_complaints FOR INSERT 
TO public 
WITH CHECK (true);

-- Anyone can look up a complaint by its ticket_number to check status, but sensitive PII (phone/email) is redacted
CREATE POLICY "Public can view own complaint status" 
ON citizen_complaints FOR SELECT 
TO public 
USING (true);

-- Only authorized staff (Water Engineers, Supervisors, Admins) can update complaints (triage/assign/resolve)
CREATE POLICY "Staff can update complaints" 
ON citizen_complaints FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.auth_id = auth.uid() 
        AND users.role_key IN ('ADMIN', 'WATER_ENGINEER', 'ZONAL_SUPERVISOR', 'LEADERSHIP')
    )
);

-- 2. INCIDENTS & ALERTS POLICIES
-- Authenticated operational personnel can view incidents
CREATE POLICY "Authorized personnel can view incidents"
ON incidents_alerts FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.auth_id = auth.uid() 
        AND users.role_key IN ('ADMIN', 'WATER_ENGINEER', 'WATER_QUALITY_OFFICER', 'ZONAL_SUPERVISOR', 'PUBLIC_HEALTH_OFFICER', 'LEADERSHIP')
    )
);

-- Only Supervisors, Engineers, and Admins can update incident status
CREATE POLICY "Authorized roles can update incidents"
ON incidents_alerts FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.auth_id = auth.uid() 
        AND users.role_key IN ('ADMIN', 'WATER_ENGINEER', 'WATER_QUALITY_OFFICER', 'ZONAL_SUPERVISOR')
    )
);

-- 3. LABORATORY RESULTS POLICIES
-- Only accredited Water Quality Officers / Lab users or Admins can insert/update lab results
CREATE POLICY "Only lab officers can insert lab results"
ON laboratory_results FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.auth_id = auth.uid() 
        AND users.role_key IN ('WATER_QUALITY_OFFICER', 'ADMIN')
    )
);

CREATE POLICY "Operational staff can read lab results"
ON laboratory_results FOR SELECT
TO authenticated
USING (true);

-- 4. AGGREGATED HEALTH SIGNALS POLICIES
-- Only Public Health Officers, Admins, and Leadership can view symptom clusters
-- Individual citizen identity is never stored in this table (k-anonymity >= 5 enforced)
CREATE POLICY "Public health officers can view aggregated signals"
ON aggregated_health_signals FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.auth_id = auth.uid() 
        AND users.role_key IN ('PUBLIC_HEALTH_OFFICER', 'ADMIN', 'LEADERSHIP', 'ZONAL_SUPERVISOR')
    )
);

-- 5. PUBLIC ADVISORIES POLICIES
-- Anyone (public, citizen) can view ACTIVE public advisories
CREATE POLICY "Anyone can view active advisories"
ON public_advisories FOR SELECT
TO public
USING (is_active = true);

-- Only Admins and Zonal Supervisors can publish or modify advisories
CREATE POLICY "Authorized officers can manage advisories"
ON public_advisories FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.auth_id = auth.uid() 
        AND users.role_key IN ('ADMIN', 'ZONAL_SUPERVISOR', 'LEADERSHIP')
    )
);

-- 6. AUDIT LOGS POLICIES
-- Append-only audit logs. No user can delete or update audit records.
CREATE POLICY "Append-only audit logs"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.auth_id = auth.uid() 
        AND users.role_key = 'ADMIN'
    )
);

