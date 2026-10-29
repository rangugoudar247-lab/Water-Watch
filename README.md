# Water Watch Bengaluru (ಜಲ ದೃಷ್ಟಿ ಬೆಂಗಳೂರು)
### Smart Water Telemetry, Early-Warning, and Citizen Grievance Management Platform
*Pilot Implementation for Bengaluru, Karnataka, India*

---

## 1. System Overview

**Water Watch Bengaluru** is a production-designed, end-to-end water monitoring, early-warning, and grievance management platform designed for municipal water authorities (BWSSB), public health agencies (BBMP / IDSP), and citizens of Bengaluru.

The platform continuously evaluates distribution telemetry (pressure, flow, turbidity, residual chlorine, tank levels) against statutory Indian Standards (**IS 10500:2012**), municipal engineering guidelines (**CPHEEO**), and citizen complaint clusters to detect supply interruptions, pipeline ruptures, and cross-contamination risks as early as possible.

---

## 2. Real-World Implementation Architecture

### A. Four-Tier Data Provenance System
Every card, map marker, chart, report, and alert visibly displays its provenance category and last-updated timestamp:
1. **`REAL DATA`**: Telemetry and records obtained from verified utility SCADA integrations or accredited field sampling.
2. **`DEMONSTRATION DATA`**: Calibrated synthetic records reflecting physical hydraulic equations and Bengaluru's intermittent supply dynamics.
3. **`PUBLIC DATA`**: Information derived from published government datasets (KSPCB, IDSP, Census).
4. **`UNVERIFIED REPORTS`**: Citizen grievances and community submissions pending on-site engineering triage.

### B. Core Technology Stack
- **Frontend & App Framework**: Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS, Lucide React
- **Geographic Information System (GIS)**: Leaflet with OpenStreetMap centered on Bengaluru (`12.9716° N, 77.5946° E`), custom SVG cluster markers, and layer overlays
- **Hydrographs & Time-Series Analytics**: Recharts with diurnal curve modeling and statutory IS 10500 threshold lines
- **Backend API**: Next.js Server-side Route Handlers (`/api/v1/...`) with schema validation, query filtering, and audit logging
- **Database & Security**:
  - PostgreSQL / Supabase ready (`supabase/migrations/001_initial_schema.sql`, `002_rls_policies.sql`, `003_seed_data.sql`)
  - Row Level Security (RLS) policies enforcing least privilege and public PII anonymization
  - Self-contained, reactive local in-memory storage engine allowing immediate out-of-the-box local testing and zero-config evaluation
- **Detection Engine**: Transparent rules with configurable thresholds, rolling averages, EWMA, and spatial clustering (Haversine formula).

---

## 3. Seven Role-Based Perspectives (RBAC)

The platform provides dedicated, server-enforced interfaces for all key municipal stakeholders, accessible via the top role switcher:

1. **Citizen Portal (ಸಾರ್ವಜನಿಕರ ದೂರು ಪೋರ್ಟಲ್)**:
   - Full bilingual support in **English and Kannada (ಕನ್ನಡ)**
   - Report dirty water, foul smell, pipeline bursts, supply disruptions, or sewage mixing
   - Optional symptom survey for aggregated public health signal tracking
   - Real-time ticket reference search & 5-step status progression
   - Public view of approved precautionary boil-water advisories
   - Strict PII protection (names and phone numbers are redacted)
2. **BWSSB Water Engineer**:
   - Inspect pressure and flow trends across District Metered Areas (DMAs)
   - View assigned alerts with evidence telemetry and baseline comparisons
   - Record official field inspections with root-cause diagnostics (pipe burst, back-siphonage, valve jam)
   - Advance incidents through the workflow (`ACKNOWLEDGED` → `FIELD_INSPECTION` → `ACTION_IN_PROGRESS` → `RESOLVED`)
3. **Water Quality & Laboratory Officer**:
   - Central Testing Laboratory at High Grounds workflow
   - Record sample chain-of-custody tracking
   - Submit certified lab test results evaluated against **IS 10500:2012** (pH, turbidity, free chlorine, coliforms, E. coli, TDS)
   - Digital certification signature verification
4. **Zonal Supervisor / Control Room**:
   - City-wide ticket triage and jurisdiction overview
   - Officer assignment and department routing
   - SLA deadline tracking (e.g. 2h acknowledgement for critical bursts)
   - Publish official bilingual public advisories (Boil-Water, Tanker Dispatch)
5. **Public Health Officer (BBMP Health / IDSP)**:
   - Privacy-conscious aggregated symptom cluster tracker
   - *k-Anonymity* protection (minimum cluster size $\ge 5$; individual details suppressed)
   - Explicit decision-support disclaimer: *Does not declare outbreaks or diagnose individuals*
   - Transmit surveillance notes to Karnataka IDSP node
6. **System Administrator**:
   - Fine-tune detection rules and threshold JSON configs in real time
   - Batch CSV telemetry file upload with schema validation
   - External data sources health & stale data monitor
   - Immutable security and action audit logs
7. **Government Leadership / MD Scorecard**:
   - Macro KPIs across Cauvery Stages I–V (2,225 MLD total capacity)
   - Non-Revenue Water (NRW) loss monitoring (~37.8%)
   - Ward-level resolution scorecard and one-click printable executive report.

---

## 4. Early-Warning & Anomaly Detection Scenarios

The platform includes a built-in **Physical Hydraulic Simulator** accessible via the top navigation ("Simulator" button) to test all detection scenarios:

| Scenario | Target Locality | Primary Indicator | Statutory / Engineering Standard |
|---|---|---|---|
| **Sudden Pressure Drop** | Koramangala 4th Block | Pressure collapses to 0.38 bar | CPHEEO: Operating below 0.5 bar poses imminent back-siphonage risk |
| **Coincident Pipe Burst** | Indiranagar 100ft Rd | Flow surges +74% while pressure plummets to 0.28 bar | Hydraulic Transient Theory: Denotes trunk main fracture |
| **High Turbidity Breach** | City Feeder Grid | Optical turbidity reaches 4.85 NTU | IS 10500:2012: Limit is 1.0 NTU acceptable, 5.0 NTU permissible |
| **Chlorine Depletion** | Balancing Reservoirs | Free chlorine drops to 0.05 mg/L | IS 10500:2012: Minimum statutory delivery limit is 0.20 mg/L |
| **Complaint Clustering** | Any Ward | $\ge 3$ dirty water complaints within 24h | Municipal Grievance SOP: Triggers cross-contamination triage |
| **Low Tank Storage** | Whitefield GLR | Water level falls below 0.65m (&lt;15%) | Reservoir operational storage threshold |

---

## 5. Verification & Automated Testing

The project includes an automated test suite verifying all 18 operational scenarios from Section 18 of the specification:

```bash
npm test
```

### Verified Test Suite Results:
- ✅ Scenario 1: Normal sensor readings produce no unnecessary alert
- ✅ Scenario 2: Sudden pressure drop triggers back-siphonage alert
- ✅ Scenario 3: High turbidity triggers IS 10500 breach alert
- ✅ Scenario 4: Low chlorine residual triggers depletion alert
- ✅ Scenario 5: Missing telemetry heartbeat timeout triggers asset alert
- ✅ Scenario 6: Invalid units or negative values are flagged as INVALID
- ✅ Scenario 7: Duplicate complaints within spatial radius (&lt;800m) are detected
- ✅ Scenario 8: Multiple complaints in one locality group into a cluster
- ✅ Scenario 9: Incident assignment transitions state to ASSIGNED
- ✅ Scenario 10: Authorized engineer records field inspection findings
- ✅ Scenario 11: Authorized lab officer certifies IS 10500 compliance
- ✅ Scenario 12: Incident advances through RESOLVED to VERIFIED
- ✅ Scenario 13: Overdue incident triggers SLA escalation check
- ✅ Scenario 14: RBAC blocks CITIZEN from modifying official test records
- ✅ Scenario 15: External provider failure falls back gracefully to SIMULATED
- ✅ Scenario 16: Stale telemetry feed triggers warning threshold badge
- ✅ Scenario 17: Data provenance strictly distinguishes REAL from DEMO
- ✅ Scenario 18: Citizen PII redaction ensures full name & phone masking

---

## 6. How to Run Locally

### Prerequisites
- Node.js 18.x or 20.x or 22.x
- npm 9+ or 10+

### Step-by-Step Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Execute Automated Verification Suite**:
   ```bash
   npm test
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

4. **Production Build**:
   ```bash
   npm run build
   npm start
   ```

---

## 7. Connecting to Live Supabase (Optional for Cloud Deployment)

1. Create a project in [Supabase](https://supabase.com).
2. Run the SQL migrations located in `supabase/migrations/`:
   - `001_initial_schema.sql` (Creates normalized tables and indexes)
   - `002_rls_policies.sql` (Enables Row Level Security and role policies)
   - `003_seed_data.sql` (Loads verified Bengaluru assets and detection rules)
3. Copy `.env.example` to `.env.local` and fill in:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

