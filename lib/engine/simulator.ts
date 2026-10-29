// Water Watch Bengaluru - Realistic Water Distribution & Hydraulic Simulator
// Simulates hydraulic transients, diurnal demand cycles, and chlorination kinetics

import { db } from '@/lib/db/store';
import { Sensor } from '@/types';

export type SimulationScenario = 
  | 'NORMAL_STEADY_STATE'
  | 'PRESSURE_DROP_BACK_SIPHONAGE'
  | 'PIPE_BURST_RUPTURE'
  | 'HIGH_TURBIDITY_INTRUSION'
  | 'CHLORINATOR_PUMP_FAILURE'
  | 'GLR_TANK_DEPLETION';

export interface SimulationResult {
  scenario: SimulationScenario;
  readingsGenerated: number;
  alertsTriggered: number;
  description: string;
  affectedSensors: string[];
}

/**
 * Generates diurnal demand multiplier for Bengaluru (0.0 to 1.5)
 * Morning peak (6-9 AM), evening peak (6-9 PM), low night minimum (2-4 AM)
 */
export function getDiurnalFactor(hour: number): number {
  if (hour >= 6 && hour <= 9) return 1.45; // Morning peak
  if (hour >= 18 && hour <= 21) return 1.30; // Evening peak
  if (hour >= 2 && hour <= 4) return 0.25; // Minimum Night Flow (MNF)
  return 0.95; // Regular daytime baseline
}

/**
 * Runs a configured simulation scenario against the active database store
 */
export function runSimulationScenario(scenario: SimulationScenario): SimulationResult {
  const sensors = db.getSensors();
  let readingsCount = 0;
  let alertsCount = 0;
  const affected: string[] = [];
  const currentHour = new Date().getHours();
  const diurnal = getDiurnalFactor(currentHour);

  for (const sensor of sensors) {
    let targetValue = sensor.currentValue ?? 1.0;
    let dataCategory: 'DEMO' = 'DEMO';

    switch (scenario) {
      case 'NORMAL_STEADY_STATE':
        if (sensor.sensorType === 'PRESSURE') {
          targetValue = 1.9 + (Math.random() - 0.5) * 0.2;
        } else if (sensor.sensorType === 'FLOW') {
          targetValue = 220 * diurnal + (Math.random() - 0.5) * 15;
        } else if (sensor.sensorType === 'TURBIDITY') {
          targetValue = 0.65 + Math.random() * 0.25; // Safe below 1.0 NTU
        } else if (sensor.sensorType === 'CHLORINE') {
          targetValue = 0.65 + (Math.random() - 0.5) * 0.1; // Safe 0.6-0.7 mg/L
        } else if (sensor.sensorType === 'WATER_LEVEL') {
          targetValue = 5.8 + (Math.random() - 0.5) * 0.3;
        }
        break;

      case 'PRESSURE_DROP_BACK_SIPHONAGE':
        // Targets Koramangala pressure & turbidity
        if (sensor.wardId === 'ward-koramangala') {
          affected.push(sensor.sensorCode);
          if (sensor.sensorType === 'PRESSURE') {
            targetValue = 0.38; // Collapses below 0.5 bar!
          } else if (sensor.sensorType === 'TURBIDITY') {
            targetValue = 3.65; // Turbidity spikes due to sewage back-siphonage
          } else if (sensor.sensorType === 'CHLORINE') {
            targetValue = 0.08; // Chlorine depleted by organic contaminants
          }
        }
        break;

      case 'PIPE_BURST_RUPTURE':
        // Targets Indiranagar DMA
        if (sensor.wardId === 'ward-indiranagar') {
          affected.push(sensor.sensorCode);
          if (sensor.sensorType === 'PRESSURE') {
            targetValue = 0.28; // Massive pressure drop
          } else if (sensor.sensorType === 'FLOW') {
            targetValue = 375.0; // Flow surges +74% due to rupture!
          }
        }
        break;

      case 'HIGH_TURBIDITY_INTRUSION':
        if (sensor.sensorType === 'TURBIDITY') {
          affected.push(sensor.sensorCode);
          targetValue = 4.85; // Serious water clarity exceedance
        }
        break;

      case 'CHLORINATOR_PUMP_FAILURE':
        if (sensor.sensorType === 'CHLORINE') {
          affected.push(sensor.sensorCode);
          targetValue = 0.05; // Free chlorine drops near zero
        }
        break;

      case 'GLR_TANK_DEPLETION':
        if (sensor.sensorType === 'WATER_LEVEL') {
          affected.push(sensor.sensorCode);
          targetValue = 0.65; // Critical low tank level < 1.0m
        }
        break;
    }

    // Ingest reading into store and trigger detection engine
    const { triggeredAlerts } = db.addSensorReading({
      sensorId: sensor.id,
      value: parseFloat(targetValue.toFixed(2)),
      dataCategory,
      timestamp: new Date().toISOString(),
    });

    readingsCount++;
    alertsCount += triggeredAlerts.length;
  }

  let description = '';
  switch (scenario) {
    case 'NORMAL_STEADY_STATE':
      description = 'Simulated normal steady-state hydraulic distribution across all 8 zones with standard diurnal demand.';
      break;
    case 'PRESSURE_DROP_BACK_SIPHONAGE':
      description = 'Simulated severe pressure collapse (0.38 bar) in Koramangala inducing sewage back-siphonage and chlorine decay.';
      break;
    case 'PIPE_BURST_RUPTURE':
      description = 'Simulated major trunk burst on Indiranagar 100ft Rd DMA with coincident flow surge (+74%) and pressure drop.';
      break;
    case 'HIGH_TURBIDITY_INTRUSION':
      description = 'Simulated widespread suspended particulate intrusion causing turbidity to surge to 4.85 NTU.';
      break;
    case 'CHLORINATOR_PUMP_FAILURE':
      description = 'Simulated hypochlorite dosing pump mechanical tripping, resulting in rapid residual chlorine decay.';
      break;
    case 'GLR_TANK_DEPLETION':
      description = 'Simulated low reservoir storage condition (<15% capacity) due to upstream transmission curtailment.';
      break;
  }

  return {
    scenario,
    readingsGenerated: readingsCount,
    alertsTriggered: alertsCount,
    description,
    affectedSensors: Array.from(new Set(affected)),
  };
}

