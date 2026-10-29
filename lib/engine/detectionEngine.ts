// Water Watch Bengaluru - Early-Warning and Anomaly Detection Engine
// Engineering implementation of transparent, configurable rules & statistical baselines

import { 
  Sensor, 
  SensorReading, 
  DetectionRule, 
  IncidentAlert, 
  CitizenComplaint,
  Severity 
} from '@/types';

export interface EvaluationResult {
  isAnomaly: boolean;
  validationStatus: 'VALID' | 'SUSPECT' | 'INVALID';
  triggeredAlert?: Omit<IncidentAlert, 'id' | 'incidentNumber' | 'detectedAt' | 'status' | 'dataCategory' | 'auditTrail'>;
}

export interface ClusterEvaluationResult {
  isClusterMember: boolean;
  clusterId?: string;
  clusterCount: number;
  triggerAlert: boolean;
  memberTickets: string[];
}

/**
 * Calculates Haversine distance between two coordinates in kilometers
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Compute Exponentially Weighted Moving Average (EWMA)
 */
export function computeEWMA(values: number[], alpha = 0.3): number {
  if (values.length === 0) return 0;
  let ewma = values[0];
  for (let i = 1; i < values.length; i++) {
    ewma = alpha * values[i] + (1 - alpha) * ewma;
  }
  return ewma;
}

/**
 * Compute mean and standard deviation for Z-Score anomaly detection
 */
export function computeZScore(current: number, history: number[]): { zScore: number; mean: number; stdDev: number } {
  if (history.length < 3) return { zScore: 0, mean: current, stdDev: 0 };
  const mean = history.reduce((a, b) => a + b, 0) / history.length;
  const variance = history.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (history.length - 1);
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return { zScore: 0, mean, stdDev: 0 };
  const zScore = (current - mean) / stdDev;
  return { zScore, mean, stdDev };
}

/**
 * Evaluates an incoming sensor reading against configured rules & statistical bounds
 */
export function evaluateSensorReading(
  sensor: Sensor,
  currentReading: SensorReading,
  historicalReadings: SensorReading[],
  rules: DetectionRule[]
): EvaluationResult {
  const val = currentReading.value;
  const unit = currentReading.unit;

  // 1. Physical Plausibility and Unit Sanity Check
  if (
    (sensor.sensorType === 'TURBIDITY' && val < 0) ||
    (sensor.sensorType === 'CHLORINE' && val < 0) ||
    (sensor.sensorType === 'PRESSURE' && val < -1.0) ||
    (sensor.sensorType === 'PH' && (val < 0 || val > 14)) ||
    (sensor.sensorType === 'WATER_LEVEL' && val < 0)
  ) {
    return {
      isAnomaly: true,
      validationStatus: 'INVALID',
      triggeredAlert: {
        alertCategory: 'SENSOR_MALFUNCTION',
        severity: 'MEDIUM',
        wardId: sensor.wardId,
        assetId: sensor.assetId,
        title: `Implausible Sensor Reading on ${sensor.sensorCode}`,
        description: `Sensor reading of ${val} ${unit} is physically implausible for ${sensor.sensorType}. Transmitter fault or wire break suspected.`,
        evidencePayload: {
          sensorId: sensor.id,
          measurements: [{ parameter: sensor.sensorType, value: val, unit }],
          anomalyType: 'PHYSICALLY_IMPLAUSIBLE_TELEMETRY',
        },
        confidenceLevel: 'CONFIRMED_INCIDENT',
        recommendedActions: [
          'Inspect analog-to-digital transmitter and 4-20mA loop wiring',
          'Perform physical zero/span calibration test'
        ],
      }
    };
  }

  // 2. Turbidity Exceedance Rule (IS 10500:2012)
  if (sensor.sensorType === 'TURBIDITY') {
    const rule = rules.find(r => r.ruleCode === 'RULE_HIGH_TURBIDITY' && r.isEnabled);
    const warningNtu = rule?.thresholdConfig?.warningNtu ?? 2.0;
    const criticalNtu = rule?.thresholdConfig?.criticalNtu ?? 5.0;

    if (val >= warningNtu) {
      const isCritical = val >= criticalNtu;
      const severity: Severity = isCritical ? 'CRITICAL' : 'HIGH';
      return {
        isAnomaly: true,
        validationStatus: 'SUSPECT',
        triggeredAlert: {
          alertCategory: 'WATER_QUALITY_ANOMALY',
          severity,
          triggeredRuleId: rule?.id,
          wardId: sensor.wardId,
          assetId: sensor.assetId,
          title: `Turbidity Exceedance: ${val.toFixed(2)} NTU (Limit: ${warningNtu} NTU)`,
          description: `Nephelometric turbidity at ${sensor.sensorCode} reached ${val.toFixed(2)} NTU, exceeding Indian Standard IS 10500 acceptable limit. High risk of particulate intrusion, biofilm detachment, or main line scouring.`,
          evidencePayload: {
            sensorId: sensor.id,
            measurements: [
              { parameter: 'Turbidity', value: val, unit: 'NTU', threshold: warningNtu }
            ],
            anomalyType: 'TURBIDITY_THRESHOLD_BREACH'
          },
          confidenceLevel: isCritical ? 'CONFIRMED_INCIDENT' : 'HIGH_EVIDENCE_CLUSTER',
          recommendedActions: [
            'Dispatch field quality officer to collect 1L sample for laboratory microbiological analysis',
            'Perform secondary on-site grab sample with calibrated handheld turbidimeter',
            'Inspect upstream pipeline for construction excavation or burst damage'
          ]
        }
      };
    }
  }

  // 3. Free Residual Chlorine Depletion Rule (IS 10500:2012)
  if (sensor.sensorType === 'CHLORINE') {
    const rule = rules.find(r => r.ruleCode === 'RULE_CHLORINE_DEPLETION' && r.isEnabled);
    const minChlorine = rule?.thresholdConfig?.minChlorineMgL ?? 0.20;
    const maxChlorine = rule?.thresholdConfig?.maxChlorineMgL ?? 2.50;

    if (val < minChlorine) {
      return {
        isAnomaly: true,
        validationStatus: 'SUSPECT',
        triggeredAlert: {
          alertCategory: 'WATER_QUALITY_ANOMALY',
          severity: 'HIGH',
          triggeredRuleId: rule?.id,
          wardId: sensor.wardId,
          assetId: sensor.assetId,
          title: `Free Chlorine Residual Depleted: ${val.toFixed(3)} mg/L (Min: ${minChlorine} mg/L)`,
          description: `Chlorine residual dropped to ${val.toFixed(3)} mg/L, below the statutory 0.20 mg/L required to prevent bacterial re-growth. Water in distribution network is vulnerable to contamination.`,
          evidencePayload: {
            sensorId: sensor.id,
            measurements: [
              { parameter: 'Free Chlorine', value: val, unit: 'mg/L', threshold: minChlorine }
            ],
            anomalyType: 'CHLORINE_DEPLETION'
          },
          confidenceLevel: 'HIGH_EVIDENCE_CLUSTER',
          recommendedActions: [
            'Verify hypochlorite dosing pump operation at upstream Ground Level Reservoir',
            'Conduct DPD pocket photometer field swab along downstream distribution nodes',
            'Initiate precautionary chlorine booster dosing'
          ]
        }
      };
    } else if (val > maxChlorine) {
      return {
        isAnomaly: true,
        validationStatus: 'SUSPECT',
        triggeredAlert: {
          alertCategory: 'WATER_QUALITY_ANOMALY',
          severity: 'MEDIUM',
          triggeredRuleId: rule?.id,
          wardId: sensor.wardId,
          assetId: sensor.assetId,
          title: `Excessive Chlorination: ${val.toFixed(2)} mg/L (Max: ${maxChlorine} mg/L)`,
          description: `Free residual chlorine is abnormally high at ${val.toFixed(2)} mg/L. May cause intense chlorinous odor, taste complaints, and formation of trihalomethanes.`,
          evidencePayload: {
            sensorId: sensor.id,
            measurements: [
              { parameter: 'Free Chlorine', value: val, unit: 'mg/L', threshold: maxChlorine }
            ],
            anomalyType: 'OVER_CHLORINATION'
          },
          confidenceLevel: 'MODERATE_CONFIDENCE',
          recommendedActions: [
            'Check dosing calibration at chlorinator feed station',
            'Inspect dosing stroke rate controller'
          ]
        }
      };
    }
  }

  // 4. Sudden Pressure Drop and Back-Siphonage Risk (CPHEEO Standard)
  if (sensor.sensorType === 'PRESSURE') {
    const rule = rules.find(r => r.ruleCode === 'RULE_SUDDEN_PRESSURE_DROP' && r.isEnabled);
    const minPressure = rule?.thresholdConfig?.minPressureBar ?? 0.5;

    // Check rate of change against historical window
    if (historicalReadings.length >= 2) {
      const recent = historicalReadings.slice(-5);
      const baselineVals = recent.map(r => r.value);
      const avgBaseline = baselineVals.reduce((a, b) => a + b, 0) / baselineVals.length;

      const dropPct = avgBaseline > 0 ? ((avgBaseline - val) / avgBaseline) * 100 : 0;

      if (val < minPressure || dropPct >= (rule?.thresholdConfig?.maxDropPct ?? 30)) {
        return {
          isAnomaly: true,
          validationStatus: 'SUSPECT',
          triggeredAlert: {
            alertCategory: 'HYDRAULIC_ANOMALY',
            severity: val < 0.3 ? 'CRITICAL' : 'HIGH',
            triggeredRuleId: rule?.id,
            wardId: sensor.wardId,
            assetId: sensor.assetId,
            title: `Sudden Pressure Drop to ${val.toFixed(2)} bar (Baseline: ${avgBaseline.toFixed(2)} bar)`,
            description: `Distribution line pressure collapsed by ${dropPct.toFixed(1)}%. Operating pressure below 0.5 bar poses imminent risk of back-siphonage ingress from adjacent sewage or drainage lines.`,
            evidencePayload: {
              sensorId: sensor.id,
              measurements: [
                { parameter: 'Pressure', value: val, unit: 'bar', baseline: avgBaseline, threshold: minPressure }
              ],
              anomalyType: 'SUDDEN_PRESSURE_COLLAPSE_BACK_SIPHONAGE_RISK'
            },
            confidenceLevel: 'HIGH_EVIDENCE_CLUSTER',
            recommendedActions: [
              'Check for unauthorized valve closure or mainline rupture in sector',
              'Alert distribution crew to inspect low-lying chambers for cross-contamination',
              'Prioritize water quality testing if pressure remains depressed'
            ]
          }
        };
      }
    }
  }

  // 5. Statistical Z-Score Outlier Check (EWMA & Rolling Variance)
  if (historicalReadings.length >= 8) {
    const histVals = historicalReadings.map(r => r.value);
    const { zScore, mean, stdDev } = computeZScore(val, histVals);

    if (Math.abs(zScore) >= 3.5) {
      return {
        isAnomaly: true,
        validationStatus: 'SUSPECT',
        triggeredAlert: {
          alertCategory: 'STATISTICAL_ANOMALY',
          severity: 'MEDIUM',
          wardId: sensor.wardId,
          assetId: sensor.assetId,
          title: `Statistical Outlier on ${sensor.sensorCode} (Z-Score: ${zScore.toFixed(2)})`,
          description: `Reading of ${val} ${unit} deviates significantly from rolling 24h baseline (Mean: ${mean.toFixed(2)}, σ: ${stdDev.toFixed(2)}).`,
          evidencePayload: {
            sensorId: sensor.id,
            measurements: [
              { parameter: sensor.sensorType, value: val, unit, baseline: mean }
            ],
            anomalyType: 'STATISTICAL_Z_SCORE_DIVERGENCE'
          },
          confidenceLevel: 'MODERATE_CONFIDENCE',
          recommendedActions: [
            'Cross-check reading against adjacent telemetry stations in same DMA',
            'Verify sensor health and battery telemetry'
          ]
        }
      };
    }
  }

  return { isAnomaly: false, validationStatus: 'VALID' };
}

/**
 * Evaluates citizen complaint spatial clustering and duplicate detection
 */
export function evaluateComplaintClustering(
  newComplaint: CitizenComplaint,
  existingComplaints: CitizenComplaint[],
  rules: DetectionRule[]
): ClusterEvaluationResult {
  const clusterDistanceRadiusKm = 0.8; // 800 meters
  const timeWindowMs = 24 * 60 * 60 * 1000; // 24 hours
  const now = new Date(newComplaint.reportedAt).getTime();

  // Find existing complaints in same category/ward within 24 hours
  const nearby = existingComplaints.filter(c => {
    if (c.id === newComplaint.id) return false;
    const complaintTime = new Date(c.reportedAt).getTime();
    if (now - complaintTime > timeWindowMs) return false;

    // Check same ward or physical distance <= 800m
    const isSameWard = c.wardId === newComplaint.wardId;
    const dist = calculateDistanceKm(newComplaint.latitude, newComplaint.longitude, c.latitude, c.longitude);
    const isClose = dist <= clusterDistanceRadiusKm;

    return isSameWard || isClose;
  });

  if (nearby.length === 0) {
    return {
      isClusterMember: false,
      clusterCount: 1,
      triggerAlert: false,
      memberTickets: [newComplaint.ticketNumber],
    };
  }

  // Related complaints found
  const clusterId = nearby[0].duplicateClusterId || `cluster-${newComplaint.wardId}-${Date.now()}`;
  const clusterCount = nearby.length + 1;
  const memberTickets = [newComplaint.ticketNumber, ...nearby.map(c => c.ticketNumber)];

  // Trigger alert if cluster count >= 3 for quality or sewage mixing
  const rule = rules.find(r => r.ruleCode === 'RULE_CITIZEN_QUALITY_CLUSTER' && r.isEnabled);
  const minComplaints = rule?.thresholdConfig?.minComplaints ?? 3;

  const triggerAlert = clusterCount >= minComplaints && 
    (newComplaint.category === 'DIRTY_WATER' || newComplaint.category === 'FOUL_SMELL' || newComplaint.category === 'SEWAGE_MIXING');

  return {
    isClusterMember: true,
    clusterId,
    clusterCount,
    triggerAlert,
    memberTickets,
  };
}

