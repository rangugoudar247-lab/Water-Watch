// Water Watch Bengaluru - In-Memory and State Management Engine

import {
  GeographicArea,
  WaterAsset,
  Sensor,
  SensorReading,
  DetectionRule,
  IncidentAlert,
  CitizenComplaint,
  WaterSample,
  LaboratoryResult,
  FieldInspection,
  AggregatedHealthSignal,
  PublicAdvisory,
  DataSourceStatus,
  NotificationItem,
  AuditLogItem,
  IncidentStatus,
  UserRole,
} from '@/types';

import {
  initialWards,
  initialAssets,
  initialSensors,
  initialDetectionRules,
  initialIncidents,
  initialComplaints,
  initialSamples,
  initialLabResults,
  initialFieldInspections,
  initialHealthSignals,
  initialAdvisories,
  initialDataSources,
  initialNotifications,
} from './initialData';

import { evaluateSensorReading, evaluateComplaintClustering } from '../engine/detectionEngine';

class DataStore {
  private wards: GeographicArea[] = [];
  private assets: WaterAsset[] = [];
  private sensors: Sensor[] = [];
  private sensorReadings: SensorReading[] = [];
  private rules: DetectionRule[] = [];
  private incidents: IncidentAlert[] = [];
  private complaints: CitizenComplaint[] = [];
  private samples: WaterSample[] = [];
  private labResults: LaboratoryResult[] = [];
  private inspections: FieldInspection[] = [];
  private healthSignals: AggregatedHealthSignal[] = [];
  private advisories: PublicAdvisory[] = [];
  private dataSources: DataSourceStatus[] = [];
  private notifications: NotificationItem[] = [];
  private auditLogs: AuditLogItem[] = [];

  constructor() {
    this.reset();
  }

  public reset() {
    this.wards = JSON.parse(JSON.stringify(initialWards));
    this.assets = JSON.parse(JSON.stringify(initialAssets));
    this.sensors = JSON.parse(JSON.stringify(initialSensors));
    this.rules = JSON.parse(JSON.stringify(initialDetectionRules));
    this.incidents = JSON.parse(JSON.stringify(initialIncidents));
    this.complaints = JSON.parse(JSON.stringify(initialComplaints));
    this.samples = JSON.parse(JSON.stringify(initialSamples));
    this.labResults = JSON.parse(JSON.stringify(initialLabResults));
    this.inspections = JSON.parse(JSON.stringify(initialFieldInspections));
    this.healthSignals = JSON.parse(JSON.stringify(initialHealthSignals));
    this.advisories = JSON.parse(JSON.stringify(initialAdvisories));
    this.dataSources = JSON.parse(JSON.stringify(initialDataSources));
    this.notifications = JSON.parse(JSON.stringify(initialNotifications));
    this.auditLogs = [
      {
        id: 'log-001',
        userName: 'System Orchestrator',
        userRole: 'ADMIN',
        action: 'SYSTEM_BOOTSTRAP',
        entityType: 'PLATFORM',
        entityId: 'WWB-SYS-CORE',
        details: { message: 'Initialized Water Watch Bengaluru with 8 Wards, 5 Key Assets, 8 Sensors, and Standard Rules' },
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      }
    ];

    // Generate initial historical readings for sensors
    this.sensorReadings = [];
    const now = Date.now();
    for (const sensor of this.sensors) {
      for (let i = 24; i >= 0; i--) {
        const time = new Date(now - i * 3600000).toISOString();
        let val = sensor.currentValue ?? 1.0;
        // add slight realistic jitter
        const jitter = (Math.random() - 0.5) * (val * 0.05);
        this.sensorReadings.push({
          id: `sr-${sensor.id}-${i}`,
          sensorId: sensor.id,
          sensorCode: sensor.sensorCode,
          sensorType: sensor.sensorType,
          wardId: sensor.wardId,
          timestamp: time,
          value: parseFloat((val + jitter).toFixed(2)),
          unit: sensor.unit,
          dataCategory: sensor.dataCategory,
          validationStatus: 'VALID',
          anomalyFlag: false,
        });
      }
    }
  }

  // Wards & Assets
  public getWards(): GeographicArea[] {
    return this.wards;
  }

  public getAssets(): WaterAsset[] {
    return this.assets;
  }

  // Sensors
  public getSensors(filter?: { wardId?: string; sensorType?: string; status?: string }): Sensor[] {
    return this.sensors.filter(s => {
      if (filter?.wardId && s.wardId !== filter.wardId) return false;
      if (filter?.sensorType && s.sensorType !== filter.sensorType) return false;
      if (filter?.status && s.status !== filter.status) return false;
      return true;
    });
  }

  public getSensorById(id: string): Sensor | undefined {
    return this.sensors.find(s => s.id === id || s.sensorCode === id);
  }

  public getSensorReadings(sensorId?: string, limit = 100): SensorReading[] {
    let list = this.sensorReadings;
    if (sensorId) {
      list = list.filter(r => r.sensorId === sensorId);
    }
    return list.slice(-limit);
  }

  public addSensorReading(payload: {
    sensorId: string;
    value: number;
    unit?: string;
    dataCategory?: 'REAL' | 'DEMO' | 'PUBLIC' | 'UNVERIFIED';
    timestamp?: string;
  }): { reading: SensorReading; triggeredAlerts: IncidentAlert[] } {
    const sensor = this.getSensorById(payload.sensorId);
    if (!sensor) {
      throw new Error(`Sensor not found: ${payload.sensorId}`);
    }

    const timestamp = payload.timestamp || new Date().toISOString();
    const reading: SensorReading = {
      id: `sr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sensorId: sensor.id,
      sensorCode: sensor.sensorCode,
      sensorType: sensor.sensorType,
      wardId: sensor.wardId,
      timestamp,
      value: payload.value,
      unit: payload.unit || sensor.unit,
      dataCategory: payload.dataCategory || sensor.dataCategory,
      validationStatus: 'VALID',
      anomalyFlag: false,
    };

    // Update sensor current state
    sensor.currentValue = payload.value;
    sensor.lastSeenAt = timestamp;
    if (sensor.status === 'OFFLINE') {
      sensor.status = 'ONLINE';
    }

    // Evaluate Detection Engine
    const historical = this.getSensorReadings(sensor.id, 20);
    const evaluation = evaluateSensorReading(sensor, reading, historical, this.rules);

    if (evaluation.isAnomaly) {
      reading.anomalyFlag = true;
      reading.validationStatus = evaluation.validationStatus || 'SUSPECT';
    }

    this.sensorReadings.push(reading);

    const triggeredAlerts: IncidentAlert[] = [];
    if (evaluation.triggeredAlert) {
      const newIncident: IncidentAlert = {
        ...evaluation.triggeredAlert,
        id: `inc-${Date.now()}`,
        incidentNumber: `WWB-INC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        detectedAt: timestamp,
        status: 'NEW',
        dataCategory: reading.dataCategory,
        auditTrail: [
          {
            status: 'NEW',
            changedBy: 'AUTOMATED_DETECTION_ENGINE',
            timestamp,
            notes: `Rule triggered: ${evaluation.triggeredAlert.title}`,
          }
        ]
      };
      this.incidents.unshift(newIncident);
      triggeredAlerts.push(newIncident);

      // Create notification for operational staff
      this.notifications.unshift({
        id: `notif-${Date.now()}`,
        recipientRole: 'WATER_ENGINEER',
        channel: 'IN_APP',
        title: `Anomaly Detected: ${newIncident.title}`,
        message: newIncident.description,
        incidentId: newIncident.id,
        sentAt: timestamp,
        deliveryStatus: 'DELIVERED',
        isRead: false,
      });

      this.addAuditLog({
        userName: 'Detection Engine',
        userRole: 'ADMIN',
        action: 'ALERT_TRIGGERED',
        entityType: 'INCIDENT',
        entityId: newIncident.incidentNumber,
        details: { rule: evaluation.triggeredAlert.triggeredRuleId, severity: newIncident.severity },
      });
    }

    return { reading, triggeredAlerts };
  }

  // Incidents
  public getIncidents(filter?: { status?: string; severity?: string; wardId?: string }): IncidentAlert[] {
    return this.incidents.filter(inc => {
      if (filter?.status && inc.status !== filter.status) return false;
      if (filter?.severity && inc.severity !== filter.severity) return false;
      if (filter?.wardId && inc.wardId !== filter.wardId) return false;
      return true;
    });
  }

  public getIncidentById(id: string): IncidentAlert | undefined {
    return this.incidents.find(i => i.id === id || i.incidentNumber === id);
  }

  public updateIncidentStatus(
    incidentId: string,
    newStatus: IncidentStatus,
    changedBy: string,
    notes?: string
  ): IncidentAlert {
    const inc = this.getIncidentById(incidentId);
    if (!inc) {
      throw new Error(`Incident not found: ${incidentId}`);
    }

    const prevStatus = inc.status;
    inc.status = newStatus;
    const now = new Date().toISOString();

    if (newStatus === 'ACKNOWLEDGED' && !inc.acknowledgedAt) {
      inc.acknowledgedAt = now;
    }
    if (newStatus === 'RESOLVED' && !inc.resolvedAt) {
      inc.resolvedAt = now;
    }
    if (newStatus === 'VERIFIED') {
      inc.verifiedAt = now;
    }

    inc.auditTrail.push({
      status: newStatus,
      changedBy,
      timestamp: now,
      notes: notes || `Status changed from ${prevStatus} to ${newStatus}`,
    });

    this.addAuditLog({
      userName: changedBy,
      userRole: 'WATER_ENGINEER',
      action: 'UPDATE_INCIDENT_STATUS',
      entityType: 'INCIDENT',
      entityId: inc.incidentNumber,
      details: { from: prevStatus, to: newStatus, notes },
    });

    return inc;
  }

  public assignIncident(
    incidentId: string,
    assignedUserId: string,
    assignedDepartmentId: string,
    changedBy: string,
    notes?: string
  ): IncidentAlert {
    const inc = this.getIncidentById(incidentId);
    if (!inc) throw new Error(`Incident not found: ${incidentId}`);

    inc.assignedUserId = assignedUserId;
    inc.assignedDepartmentId = assignedDepartmentId;
    inc.status = 'ASSIGNED';
    const now = new Date().toISOString();

    inc.auditTrail.push({
      status: 'ASSIGNED',
      changedBy,
      timestamp: now,
      notes: notes || `Assigned to ${assignedUserId} (${assignedDepartmentId})`,
    });

    this.addAuditLog({
      userName: changedBy,
      userRole: 'ZONAL_SUPERVISOR',
      action: 'ASSIGN_INCIDENT',
      entityType: 'INCIDENT',
      entityId: inc.incidentNumber,
      details: { assignedUserId, assignedDepartmentId },
    });

    return inc;
  }

  // Complaints
  public getComplaints(filter?: { status?: string; wardId?: string; category?: string; query?: string }): CitizenComplaint[] {
    return this.complaints.filter(c => {
      if (filter?.status && c.status !== filter.status) return false;
      if (filter?.wardId && c.wardId !== filter.wardId) return false;
      if (filter?.category && c.category !== filter.category) return false;
      if (filter?.query) {
        const q = filter.query.toLowerCase();
        const matches = c.ticketNumber.toLowerCase().includes(q) ||
          c.addressText.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }

  public getComplaintByTicket(ticketNumber: string): CitizenComplaint | undefined {
    return this.complaints.find(c => c.ticketNumber.toUpperCase() === ticketNumber.trim().toUpperCase());
  }

  public createComplaint(data: {
    category: CitizenComplaint['category'];
    wardId: string;
    addressText: string;
    latitude: number;
    longitude: number;
    description: string;
    language?: 'en' | 'kn';
    complainantName?: string;
    complainantPhone?: string;
    consentGiven: boolean;
    photoUrl?: string;
    symptomsReported?: CitizenComplaint['symptomsReported'];
  }): { complaint: CitizenComplaint; clusterFound: boolean; alertTriggered: boolean } {
    const ward = this.wards.find(w => w.id === data.wardId) || this.wards[0];
    const ticketNumber = `WWB-TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Anonymize complainant info for privacy
    let anonymizedName = 'Citizen';
    if (data.complainantName && data.complainantName.trim().length > 0) {
      const parts = data.complainantName.trim().split(' ');
      anonymizedName = parts.map(p => p[0] + '***').join(' ');
    }
    let anonymizedPhone = 'Unspecified';
    if (data.complainantPhone && data.complainantPhone.trim().length >= 4) {
      anonymizedPhone = data.complainantPhone.slice(0, 3) + '*****' + data.complainantPhone.slice(-2);
    }

    const complaint: CitizenComplaint = {
      id: `comp-${Date.now()}`,
      ticketNumber,
      category: data.category,
      status: 'NEW',
      priority: data.category === 'DIRTY_WATER' || data.category === 'SEWAGE_MIXING' ? 'HIGH' : 'MEDIUM',
      wardId: ward.id,
      wardName: ward.name,
      addressText: data.addressText,
      latitude: data.latitude,
      longitude: data.longitude,
      reportedAt: new Date().toISOString(),
      description: data.description,
      photoUrl: data.photoUrl,
      language: data.language || 'en',
      complainantName: anonymizedName,
      complainantPhone: anonymizedPhone,
      consentGiven: data.consentGiven,
      isAnonymized: true,
      dataCategory: 'UNVERIFIED',
      symptomsReported: data.symptomsReported,
    };

    // Check cluster and duplicate conditions
    const clusterResult = evaluateComplaintClustering(complaint, this.complaints, this.rules);
    if (clusterResult.isClusterMember) {
      complaint.duplicateClusterId = clusterResult.clusterId;
    }

    this.complaints.unshift(complaint);

    let alertTriggered = false;
    if (clusterResult.triggerAlert) {
      alertTriggered = true;
      const clusterIncident: IncidentAlert = {
        id: `inc-${Date.now()}`,
        incidentNumber: `WWB-INC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        alertCategory: 'CITIZEN_COMPLAINT_CLUSTER',
        severity: 'HIGH',
        triggeredRuleId: 'rule-citizen-cluster',
        wardId: ward.id,
        detectedAt: new Date().toISOString(),
        status: 'NEW',
        title: `Localized Complaint Cluster in ${ward.name}`,
        description: `${clusterResult.clusterCount} citizen reports filed in ${ward.name} regarding ${complaint.category} within 24 hours.`,
        evidencePayload: {
          complaintCount: clusterResult.clusterCount,
          category: complaint.category,
          wardName: ward.name,
          ticketNumbers: clusterResult.memberTickets,
        },
        dataCategory: 'UNVERIFIED',
        confidenceLevel: 'HIGH_EVIDENCE_CLUSTER',
        recommendedActions: [
          'Dispatch zonal field engineer to inspect distribution valves and flush hydrants',
          'Coordinate water sample collection to test for cross-contamination',
          'Notify BBMP Health Inspector if sewage mixing is suspected',
        ],
        slaDeadline: new Date(Date.now() + 3600000 * 4).toISOString(),
        auditTrail: [
          {
            status: 'NEW',
            changedBy: 'AUTOMATED_DETECTION_ENGINE',
            timestamp: new Date().toISOString(),
            notes: `Cluster of ${clusterResult.clusterCount} complaints reached threshold in ${ward.name}.`,
          }
        ]
      };
      this.incidents.unshift(clusterIncident);

      this.notifications.unshift({
        id: `notif-${Date.now()}`,
        recipientRole: 'ZONAL_SUPERVISOR',
        channel: 'IN_APP',
        title: `Complaint Cluster Alert: ${ward.name}`,
        message: clusterIncident.description,
        incidentId: clusterIncident.id,
        sentAt: new Date().toISOString(),
        deliveryStatus: 'DELIVERED',
        isRead: false,
      });
    }

    this.addAuditLog({
      userName: anonymizedName,
      userRole: 'CITIZEN',
      action: 'SUBMIT_COMPLAINT',
      entityType: 'COMPLAINT',
      entityId: complaint.ticketNumber,
      details: { category: complaint.category, ward: ward.name, hasCluster: clusterResult.isClusterMember },
    });

    return {
      complaint,
      clusterFound: clusterResult.isClusterMember,
      alertTriggered,
    };
  }

  // Water Samples & Lab Results
  public getSamples(): WaterSample[] {
    return this.samples;
  }

  public getLabResults(): LaboratoryResult[] {
    return this.labResults;
  }

  public addLabResult(data: {
    sampleId: string;
    labName: string;
    testedByOfficer: string;
    phValue: number;
    turbidityNtu: number;
    freeChlorineMgL: number;
    totalColiformCfu100ml: number;
    eColiCfu100ml: number;
    tdsMgL: number;
    nitratesMgL?: number;
    fluoridesMgL?: number;
    certifiedBySignature: string;
    dataCategory?: 'REAL' | 'DEMO';
  }): LaboratoryResult {
    // Check IS 10500:2012 compliance
    // pH: 6.5 - 8.5
    // Turbidity: <= 1.0 NTU (acceptable) or <= 5.0 NTU (permissible)
    // Free chlorine: >= 0.20 mg/L
    // E. coli: 0 cfu/100ml
    const meetsIs10500 = 
      data.phValue >= 6.5 && data.phValue <= 8.5 &&
      data.turbidityNtu <= 5.0 &&
      data.freeChlorineMgL >= 0.20 &&
      data.eColiCfu100ml === 0;

    const result: LaboratoryResult = {
      id: `lab-${Date.now()}`,
      sampleId: data.sampleId,
      labName: data.labName,
      testedByOfficer: data.testedByOfficer,
      completedAt: new Date().toISOString(),
      phValue: data.phValue,
      turbidityNtu: data.turbidityNtu,
      freeChlorineMgL: data.freeChlorineMgL,
      totalColiformCfu100ml: data.totalColiformCfu100ml,
      eColiCfu100ml: data.eColiCfu100ml,
      tdsMgL: data.tdsMgL,
      nitratesMgL: data.nitratesMgL,
      fluoridesMgL: data.fluoridesMgL,
      meetsIs10500,
      certifiedBySignature: data.certifiedBySignature,
      dataCategory: data.dataCategory || 'DEMO',
      officialCertificationPdfUrl: `/reports/BWSSB-QC-CERT-${Date.now().toString().slice(-4)}.pdf`
    };

    this.labResults.unshift(result);

    // Update corresponding sample status
    const sample = this.samples.find(s => s.id === data.sampleId);
    if (sample) {
      sample.labStatus = 'COMPLETED';
    }

    this.addAuditLog({
      userName: data.testedByOfficer,
      userRole: 'WATER_QUALITY_OFFICER',
      action: 'CERTIFY_LAB_RESULT',
      entityType: 'LAB_RESULT',
      entityId: result.id,
      details: { meetsIs10500, turbidity: data.turbidityNtu, eColi: data.eColiCfu100ml },
    });

    return result;
  }

  // Field Inspections
  public getFieldInspections(incidentId?: string): FieldInspection[] {
    if (incidentId) {
      return this.inspections.filter(i => i.incidentId === incidentId);
    }
    return this.inspections;
  }

  public addFieldInspection(data: {
    incidentId: string;
    inspectorName: string;
    findings: string;
    rootCause: FieldInspection['rootCause'];
    actionTaken: string;
    photoUrl?: string;
    followUpRequired: boolean;
  }): FieldInspection {
    const inspection: FieldInspection = {
      id: `insp-${Date.now()}`,
      incidentId: data.incidentId,
      inspectorName: data.inspectorName,
      inspectedAt: new Date().toISOString(),
      findings: data.findings,
      rootCause: data.rootCause,
      actionTaken: data.actionTaken,
      photoUrl: data.photoUrl,
      followUpRequired: data.followUpRequired,
    };

    this.inspections.unshift(inspection);

    // Advance incident status
    const inc = this.getIncidentById(data.incidentId);
    if (inc) {
      inc.status = 'ACTION_IN_PROGRESS';
      inc.auditTrail.push({
        status: 'ACTION_IN_PROGRESS',
        changedBy: data.inspectorName,
        timestamp: new Date().toISOString(),
        notes: `Field Inspection recorded: Root cause identified as ${data.rootCause}. Action: ${data.actionTaken}`,
      });
    }

    this.addAuditLog({
      userName: data.inspectorName,
      userRole: 'WATER_ENGINEER',
      action: 'RECORD_FIELD_INSPECTION',
      entityType: 'INSPECTION',
      entityId: inspection.id,
      details: { incidentId: data.incidentId, rootCause: data.rootCause },
    });

    return inspection;
  }

  // Health Signals
  public getHealthSignals(): AggregatedHealthSignal[] {
    return this.healthSignals;
  }

  public updateHealthSignal(id: string, updates: Partial<AggregatedHealthSignal>): AggregatedHealthSignal {
    const sig = this.healthSignals.find(s => s.id === id || s.signalCode === id);
    if (!sig) throw new Error(`Health signal not found: ${id}`);
    Object.assign(sig, updates);
    return sig;
  }

  // Public Advisories
  public getPublicAdvisories(): PublicAdvisory[] {
    return this.advisories;
  }

  public createPublicAdvisory(data: Omit<PublicAdvisory, 'id' | 'issuedAt' | 'advisoryCode'>): PublicAdvisory {
    const advisory: PublicAdvisory = {
      ...data,
      id: `adv-${Date.now()}`,
      advisoryCode: `WWB-ADV-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`,
      issuedAt: new Date().toISOString(),
    };
    this.advisories.unshift(advisory);
    return advisory;
  }

  // Data Sources & System Health
  public getDataSources(): DataSourceStatus[] {
    return this.dataSources;
  }

  // Notifications
  public getNotifications(role?: UserRole): NotificationItem[] {
    if (role) {
      return this.notifications.filter(n => n.recipientRole === role || n.recipientRole === 'ADMIN');
    }
    return this.notifications;
  }

  public markNotificationRead(id: string) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) notif.isRead = true;
  }

  // Audit Logs
  public getAuditLogs(): AuditLogItem[] {
    return this.auditLogs.slice(0, 100);
  }

  public addAuditLog(entry: Omit<AuditLogItem, 'id' | 'timestamp'>) {
    this.auditLogs.unshift({
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    });
  }

  // Rules
  public getRules(): DetectionRule[] {
    return this.rules;
  }

  public updateRule(id: string, updates: Partial<DetectionRule>): DetectionRule {
    const rule = this.rules.find(r => r.id === id || r.ruleCode === id);
    if (!rule) throw new Error(`Rule not found: ${id}`);
    Object.assign(rule, updates);
    return rule;
  }
}

// Global Singleton Instance across Next.js API Routes and Server Components
declare global {
  var __waterWatchStore: DataStore | undefined;
}

export const db = global.__waterWatchStore || (global.__waterWatchStore = new DataStore());
