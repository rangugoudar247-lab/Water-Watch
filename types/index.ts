// Water Watch Bengaluru - Core Domain TypeScript Types

export type DataCategory = 'REAL' | 'DEMO' | 'PUBLIC' | 'UNVERIFIED';

export type UserRole = 
  | 'ADMIN' 
  | 'WATER_ENGINEER' 
  | 'WATER_QUALITY_OFFICER' 
  | 'ZONAL_SUPERVISOR' 
  | 'PUBLIC_HEALTH_OFFICER' 
  | 'CITIZEN' 
  | 'LEADERSHIP';

export type SensorType = 
  | 'PRESSURE' 
  | 'FLOW' 
  | 'TURBIDITY' 
  | 'CHLORINE' 
  | 'PH' 
  | 'WATER_LEVEL' 
  | 'PUMP_STATUS';

export type SensorStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'CALIBRATION_DUE';

export type IncidentStatus = 
  | 'NEW' 
  | 'TRIAGED' 
  | 'ASSIGNED' 
  | 'ACKNOWLEDGED' 
  | 'FIELD_INSPECTION' 
  | 'ACTION_IN_PROGRESS' 
  | 'RESOLVED' 
  | 'VERIFIED' 
  | 'CLOSED' 
  | 'REOPENED';

export type Severity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ComplaintCategory = 
  | 'DIRTY_WATER' 
  | 'FOUL_SMELL' 
  | 'NO_WATER' 
  | 'LOW_PRESSURE' 
  | 'PIPELINE_LEAK' 
  | 'EMPTY_WATER_POINT' 
  | 'SEWAGE_MIXING';

export type HealthSymptom = 
  | 'STOMACH_PAIN' 
  | 'VOMITING' 
  | 'DIARRHEA' 
  | 'NAUSEA' 
  | 'FEVER' 
  | 'WEAKNESS' 
  | 'DEHYDRATION';

export interface GeographicArea {
  id: string;
  name: string;
  zone: string;
  wardNumber: number;
  division: string;
  latitude: number;
  longitude: number;
  populationEst: number;
  waterSupplySource: string;
}

export interface WaterAsset {
  id: string;
  assetCode: string;
  assetType: 'GLR' | 'MBR' | 'PUMP_STATION' | 'DISTRIBUTION_MAIN' | 'OHT' | 'WATER_ATM';
  name: string;
  wardId: string;
  latitude: number;
  longitude: number;
  capacityLitres?: number;
  commissionYear?: number;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'OFFLINE';
}

export interface Sensor {
  id: string;
  sensorCode: string;
  assetId?: string;
  wardId: string;
  sensorType: SensorType;
  model: string;
  serialNumber: string;
  lastCalibratedAt: string;
  calibrationDueDate: string;
  samplingIntervalSec: number;
  status: SensorStatus;
  dataCategory: DataCategory;
  unit: string;
  currentValue?: number;
  lastSeenAt: string;
}

export interface SensorReading {
  id: string;
  sensorId: string;
  sensorCode?: string;
  sensorType?: SensorType;
  wardId?: string;
  timestamp: string;
  value: number;
  unit: string;
  dataCategory: DataCategory;
  validationStatus: 'VALID' | 'SUSPECT' | 'INVALID';
  anomalyFlag: boolean;
  notes?: string;
}

export interface DetectionRule {
  id: string;
  ruleCode: string;
  ruleName: string;
  ruleCategory: 'HYDRAULIC' | 'QUALITY' | 'ASSET' | 'CITIZEN_CLUSTER' | 'HEALTH_SIGNAL';
  description: string;
  thresholdConfig: Record<string, any>;
  timeWindowSeconds: number;
  severity: Severity;
  isEnabled: boolean;
  technicalBasis: string;
}

export interface IncidentAlert {
  id: string;
  incidentNumber: string;
  alertCategory: string;
  severity: Severity;
  triggeredRuleId?: string;
  wardId: string;
  assetId?: string;
  detectedAt: string;
  status: IncidentStatus;
  title: string;
  description: string;
  evidencePayload: {
    measurements?: Array<{ parameter: string; value: number; unit: string; baseline?: number; threshold?: number }>;
    complaintCount?: number;
    sensorId?: string;
    anomalyType?: string;
    [key: string]: any;
  };
  dataCategory: DataCategory;
  confidenceLevel: 'LOW_CONFIDENCE' | 'MODERATE_CONFIDENCE' | 'HIGH_EVIDENCE_CLUSTER' | 'CONFIRMED_INCIDENT';
  recommendedActions: string[];
  assignedDepartmentId?: string;
  assignedUserId?: string;
  slaDeadline?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  verifiedAt?: string;
  auditTrail: Array<{
    status: IncidentStatus;
    changedBy: string;
    timestamp: string;
    notes?: string;
  }>;
}

export interface CitizenComplaint {
  id: string;
  ticketNumber: string;
  category: ComplaintCategory;
  status: IncidentStatus;
  priority: Severity;
  wardId: string;
  wardName?: string;
  addressText: string;
  latitude: number;
  longitude: number;
  reportedAt: string;
  description: string;
  photoUrl?: string;
  language: 'en' | 'kn';
  complainantName?: string;
  complainantPhone?: string;
  consentGiven: boolean;
  isAnonymized: boolean;
  dataCategory: DataCategory;
  duplicateClusterId?: string;
  mergedIntoId?: string;
  symptomsReported?: HealthSymptom[];
  internalNotes?: string;
}

export interface WaterSample {
  id: string;
  sampleCode: string;
  incidentId?: string;
  assetId?: string;
  wardId: string;
  collectedBy: string;
  collectedAt: string;
  sampleLocationText: string;
  latitude: number;
  longitude: number;
  chainOfCustodyNotes: string;
  labStatus: 'COLLECTED' | 'IN_TRANSIT' | 'ANALYSIS_IN_PROGRESS' | 'COMPLETED';
}

export interface LaboratoryResult {
  id: string;
  sampleId: string;
  labName: string;
  testedByOfficer: string;
  completedAt: string;
  phValue: number;
  turbidityNtu: number;
  freeChlorineMgL: number;
  totalColiformCfu100ml: number;
  eColiCfu100ml: number;
  tdsMgL: number;
  nitratesMgL?: number;
  fluoridesMgL?: number;
  meetsIs10500: boolean;
  officialCertificationPdfUrl?: string;
  certifiedBySignature: string;
  dataCategory: DataCategory;
}

export interface FieldInspection {
  id: string;
  incidentId: string;
  inspectorName: string;
  inspectedAt: string;
  findings: string;
  rootCause: 'PIPE_BURST' | 'SEWAGE_BACK_SIPHONAGE' | 'CHLORINATOR_FAILURE' | 'VALVE_MALFUNCTION' | 'DRY_BOREWELL' | 'UNFOUND';
  actionTaken: string;
  photoUrl?: string;
  followUpRequired: boolean;
}

export interface AggregatedHealthSignal {
  id: string;
  signalCode: string;
  wardId: string;
  wardName: string;
  dateRecorded: string;
  reportCount: number;
  symptomTypes: Array<{ symptom: HealthSymptom; count: number }>;
  baselineComparisonPct: number;
  signalStrength: 'LOW' | 'ELEVATED' | 'UNUSUAL_CLUSTER';
  reviewStatus: 'PENDING_REVIEW' | 'UNDER_INVESTIGATION' | 'REFERRED_TO_IDSP' | 'RESOLVED';
  reviewedBy?: string;
  reviewedAt?: string;
  assessmentNotes?: string;
}

export interface PublicAdvisory {
  id: string;
  advisoryCode: string;
  titleEn: string;
  titleKn: string;
  contentEn: string;
  contentKn: string;
  advisoryType: 'BOIL_WATER' | 'WATER_SAVING' | 'SUPPLY_SHUTDOWN' | 'TANKER_SCHEDULE';
  affectedWards: string[];
  issuedAt: string;
  expiresAt?: string;
  issuedByOfficer: string;
  isActive: boolean;
  dataCategory: DataCategory;
}

export interface DataSourceStatus {
  id: string;
  sourceName: string;
  sourceCategory: DataCategory;
  organization: string;
  endpointUrl?: string;
  syncFrequencyMins: number;
  lastSyncAt: string;
  lastSyncStatus: 'CONNECTED' | 'DEGRADED' | 'FAILED' | 'SIMULATED';
  connectionHealth: number;
  staleThresholdHours: number;
  isActive: boolean;
}

export interface NotificationItem {
  id: string;
  recipientRole: UserRole;
  channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP';
  title: string;
  message: string;
  incidentId?: string;
  sentAt: string;
  deliveryStatus: 'DELIVERED' | 'SIMULATED' | 'FAILED' | 'RETRYING';
  isRead: boolean;
}

export interface AuditLogItem {
  id: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}
