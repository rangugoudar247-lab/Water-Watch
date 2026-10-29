# Water Watch Bengaluru — Backend REST API Specification
**Protocol:** HTTP/1.1 & HTTP/2  
**Base Path:** `/api/v1`  
**Data Format:** `application/json` (or `multipart/form-data` for file uploads)  
**Authentication & Authorization:** Role-Based Access Control (RBAC) via session or Supabase JWT

---

## 1. Authentication & Role Definitions

| Role Key | Description | Accessible Endpoints |
|---|---|---|
| `CITIZEN` | Public consumer | Grievance submission, ticket tracking, active advisories, ward GIS |
| `WATER_ENGINEER` | BWSSB Operations | Telemetry ingest, alert acknowledgement, field inspections, repair logs |
| `WATER_QUALITY_OFFICER` | Central Testing Lab | Water quality alerts, sample custody, IS 10500 lab certification |
| `ZONAL_SUPERVISOR` | Zonal Control Room | Incident assignment, SLA escalation, publishing public advisories |
| `PUBLIC_HEALTH_OFFICER` | BBMP Health / IDSP | Aggregated symptom cluster trends, IDSP referral notes |
| `ADMINISTRATOR` | System Administrator | Detection rules tuning, CSV uploads, data sources health, audit logs |
| `LEADERSHIP` | Government Leadership | Macro KPIs, NRW loss analytics, executive export |

---

## 2. Sensor & Telemetry Endpoints

### 2.1 List Sensors
- **Method:** `GET`
- **Path:** `/api/v1/sensors`
- **Query Parameters:**
  - `wardId` *(string, optional)*: Filter by ward ID (e.g. `ward-koramangala`)
  - `sensorType` *(string, optional)*: `PRESSURE` | `FLOW` | `TURBIDITY` | `CHLORINE` | `PH` | `WATER_LEVEL`
  - `status` *(string, optional)*: `ONLINE` | `DEGRADED` | `OFFLINE`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "count": 8,
    "data": [
      {
        "id": "sensor-press-kor-01",
        "sensorCode": "PRESS-KOR-01",
        "sensorType": "PRESSURE",
        "unit": "bar",
        "currentValue": 1.85,
        "status": "ONLINE",
        "dataCategory": "DEMO",
        "lastSeenAt": "2026-10-30T07:15:00Z"
      }
    ]
  }
  ```

### 2.2 Ingest Real-Time Telemetry
- **Method:** `POST`
- **Path:** `/api/v1/sensors/ingest`
- **Permissions:** `WATER_ENGINEER`, `ADMIN`, or authorized IoT device API key
- **Request Body:**
  ```json
  {
    "sensorId": "sensor-press-kor-01",
    "value": 0.38,
    "unit": "bar",
    "dataCategory": "DEMO",
    "timestamp": "2026-10-30T07:15:00Z"
  }
  ```
- **Validation Rules:**
  - `sensorId` must exist in database.
  - `value` must be a valid non-NaN float.
  - Physically implausible readings (e.g. negative turbidity or pressure < -1.0) are marked `INVALID` and trigger sensor fault alerts.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Sensor reading ingested successfully",
    "data": { ... },
    "triggeredAlerts": [
      {
        "incidentNumber": "WWB-INC-2026-081",
        "alertCategory": "HYDRAULIC_ANOMALY",
        "severity": "HIGH",
        "title": "Sudden Distribution Pressure Drop to 0.38 bar"
      }
    ]
  }
  ```

### 2.3 Historical Time-Series Readings
- **Method:** `GET`
- **Path:** `/api/v1/sensors/:id/readings`
- **Query Parameters:** `limit` *(default 50, max 500)*

### 2.4 Batch CSV Telemetry Ingestion
- **Method:** `POST`
- **Path:** `/api/v1/sensors/csv-upload`
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `file`: CSV file (columns: `sensor_id,value,unit,timestamp`)
  - `dataCategory`: `DEMO` | `REAL`

---

## 3. Citizen Grievance Endpoints

### 3.1 Submit Citizen Complaint
- **Method:** `POST`
- **Path:** `/api/v1/complaints`
- **Permissions:** Public (`CITIZEN`)
- **Request Body:**
  ```json
  {
    "category": "DIRTY_WATER",
    "wardId": "ward-koramangala",
    "addressText": "4th Block, 14th Cross",
    "description": "Muddy tap water with foul smell since morning",
    "language": "en",
    "complainantName": "Ramesh Kumar",
    "complainantPhone": "+91 9845012345",
    "consentGiven": true,
    "symptomsReported": ["STOMACH_PAIN"]
  }
  ```
- **Privacy Enforcement:** Complainant name and phone are immediately redacted in public responses (`R*** K***` and `984*****45`).
- **Cluster Detection:** If $\ge 3$ complaints are received in the same ward within 24h, they are automatically linked to a localized cluster and trigger a supervisor review alert.

### 3.2 Track Complaint Status
- **Method:** `GET`
- **Path:** `/api/v1/complaints/:ticket`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "ticketNumber": "WWB-TKT-2026-881",
      "category": "DIRTY_WATER",
      "status": "FIELD_INSPECTION",
      "priority": "HIGH",
      "addressText": "4th Block, 17th Main Road",
      "reportedAt": "2026-10-30T07:30:00Z"
    }
  }
  ```

---

## 4. Incidents & Alerts Lifecycle

### 4.1 List Incidents
- **Method:** `GET`
- **Path:** `/api/v1/incidents`
- **Query Parameters:** `status`, `severity`, `wardId`

### 4.2 Update Incident Status
- **Method:** `POST`
- **Path:** `/api/v1/incidents/:id/status`
- **Allowed Transitions:**
  `NEW` → `TRIAGED` → `ASSIGNED` → `ACKNOWLEDGED` → `FIELD_INSPECTION` → `ACTION_IN_PROGRESS` → `RESOLVED` → `VERIFIED` → `CLOSED` (+ `REOPENED`)

### 4.3 Assign Incident
- **Method:** `POST`
- **Path:** `/api/v1/incidents/:id/assign`
- **Fields:** `assignedUserId`, `assignedDepartmentId`, `changedBy`

---

## 5. Water Quality & Laboratory Results

### 5.1 Certify Laboratory Result (IS 10500:2012)
- **Method:** `POST`
- **Path:** `/api/v1/samples/lab-result`
- **Permissions:** `WATER_QUALITY_OFFICER`, `ADMIN`
- **Request Body:**
  ```json
  {
    "sampleId": "sample-2026-kor-01",
    "labName": "BWSSB Central Water Quality Laboratory, High Grounds",
    "testedByOfficer": "Dr. Savitha Rao, Senior Chemist",
    "phValue": 7.25,
    "turbidityNtu": 3.20,
    "freeChlorineMgL": 0.10,
    "totalColiformCfu100ml": 18,
    "eColiCfu100ml": 4,
    "tdsMgL": 280.0,
    "certifiedBySignature": "Dr. Savitha Rao (KMC-QC-88412)",
    "dataCategory": "DEMO"
  }
  ```
- **Evaluation:** Evaluates all measurements against statutory thresholds. If $E.\,coli > 0$ or turbidity $> 5.0$ NTU or chlorine $< 0.20$ mg/L, marks `meetsIs10500: false`.

---

## 6. Public Health Surveillance & Advisories

### 6.1 Aggregated Health Signals
- **Method:** `GET`
- **Path:** `/api/v1/health-signals`
- **Safeguards:** Enforces $k$-anonymity ($\ge 5$ count threshold); suppresses individual details. Displays mandatory decision-support disclaimer.

### 6.2 Public Advisories
- **Method:** `GET` & `POST`
- **Path:** `/api/v1/advisories`
- **Bilingual Content:** Requires `titleEn`, `titleKn`, `contentEn`, `contentKn`.

---

## 7. Administrative & System Control

- `POST /api/v1/simulator/trigger`: Injects hydraulic stress scenarios (`PRESSURE_DROP_BACK_SIPHONAGE`, `PIPE_BURST_RUPTURE`, `HIGH_TURBIDITY_INTRUSION`, `CHLORINATOR_PUMP_FAILURE`, `NORMAL_STEADY_STATE`).
- `GET /api/v1/data-sources`: Real-time sync health and stale telemetry warnings.
- `GET /api/v1/audit-logs`: Complete security and action trail.
- `POST /api/v1/system/reset`: Restores pilot demonstration state.

