'use client';

import React, { useState } from 'react';
import { SimulationScenario } from '@/lib/engine/simulator';
import { RefreshCw, Play, AlertTriangle, ShieldCheck, Waves, X, CheckCircle2 } from 'lucide-react';

interface SimulatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulationComplete: () => void;
}

export default function SimulatorDrawer({
  isOpen,
  onClose,
  onSimulationComplete,
}: SimulatorDrawerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const scenarios: Array<{
    id: SimulationScenario;
    name: string;
    targetWard: string;
    expectedSeverity: string;
    description: string;
    icon: string;
  }> = [
    {
      id: 'NORMAL_STEADY_STATE',
      name: 'Normal Steady-State Operation',
      targetWard: 'All 8 Bengaluru Wards',
      expectedSeverity: 'NO_ALERTS',
      description: 'Injects standard diurnal flow and pressure (1.9 bar), turbidity 0.6 NTU, chlorine 0.65 mg/L. Verifies no false alerts.',
      icon: '✅',
    },
    {
      id: 'PRESSURE_DROP_BACK_SIPHONAGE',
      name: 'Pressure Collapse & Sewage Ingress',
      targetWard: 'Koramangala (Ward 151)',
      expectedSeverity: 'HIGH / CRITICAL',
      description: 'Collapses line pressure to 0.38 bar during morning supply, triggering cross-contamination sewage back-siphonage with 3.65 NTU turbidity.',
      icon: '⚠️',
    },
    {
      id: 'PIPE_BURST_RUPTURE',
      name: 'Major Trunk Line Burst / Rupture',
      targetWard: 'Indiranagar (Ward 80)',
      expectedSeverity: 'CRITICAL',
      description: 'Simulates instantaneous pipe fracture on 100ft Road DMA: flow surges by +74% while pressure collapses to 0.28 bar.',
      icon: '💥',
    },
    {
      id: 'HIGH_TURBIDITY_INTRUSION',
      name: 'Monsoon Silt & Turbidity Spike',
      targetWard: 'City-wide GLR Feeder Grid',
      expectedSeverity: 'HIGH',
      description: 'Simulates heavy silt infiltration after stormwater flooding, raising optical turbidity to 4.85 NTU (IS 10500 breach).',
      icon: '🟤',
    },
    {
      id: 'CHLORINATOR_PUMP_FAILURE',
      name: 'Hypochlorite Dosing Pump Trip',
      targetWard: 'Central Balancing Reservoirs',
      expectedSeverity: 'HIGH',
      description: 'Simulates electrical breaker trip on GLR chlorination feed, decaying free chlorine to 0.05 mg/L (statutory minimum 0.20 mg/L).',
      icon: '🧪',
    },
    {
      id: 'GLR_TANK_DEPLETION',
      name: 'Reservoir Critical Low Level (<15%)',
      targetWard: 'Whitefield Hope Farm GLR',
      expectedSeverity: 'MEDIUM',
      description: 'Simulates Cauvery Stage V transmission curtailment leading to water level dropping below 0.65m.',
      icon: '📉',
    },
  ];

  const handleRunScenario = async (scenario: SimulationScenario) => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/v1/simulator/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        onSimulationComplete();
      } else {
        setError(data.error || 'Simulation failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Simulation network error.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm('Reset all demonstration sensors, complaints, and incidents to baseline initial state?')) {
      return;
    }
    try {
      await fetch('/api/v1/system/reset', { method: 'POST' });
      alert('Database restored to initial state.');
      onSimulationComplete();
      onClose();
    } catch (err: any) {
      alert('Reset failed: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="font-extrabold text-sm tracking-wide">
                Physical Hydraulic & Anomaly Simulator
              </h3>
              <p className="text-[10px] text-slate-400">
                Test detection engine with synthetic Bengaluru distribution scenarios
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Provenance Disclosure */}
          <div className="p-3 bg-purple-50 text-purple-900 rounded-xl border border-purple-200 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-[11px] block">SIMULATED DATA DISCLOSURE</span>
              <p className="text-[10px] text-purple-800 leading-relaxed">
                All measurements generated here are explicitly flagged as <strong>DEMONSTRATION DATA (SYNTHETIC)</strong> 
                in database audit trails. They are not live field measurements.
              </p>
            </div>
          </div>

          {/* Execution Feedback */}
          {result && (
            <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Simulation Executed Successfully!</span>
              </div>
              <p className="text-[11px] text-emerald-900">{result.description}</p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                <div className="bg-white/80 p-2 rounded">
                  Readings Ingested: <strong>{result.readingsGenerated}</strong>
                </div>
                <div className="bg-white/80 p-2 rounded">
                  Alerts Triggered: <strong className="text-rose-600 font-bold">{result.alertsTriggered}</strong>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg">
              ✕ {error}
            </div>
          )}

          {/* Scenario Cards */}
          <div className="space-y-2.5">
            <span className="font-bold text-slate-700 text-xs block uppercase tracking-wider">
              Select Hydraulic Stress Scenario:
            </span>

            {scenarios.map(sc => (
              <div
                key={sc.id}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white shadow-xs space-y-2 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{sc.icon}</span>
                    <div>
                      <div className="font-bold text-slate-800">{sc.name}</div>
                      <div className="text-[10px] text-slate-500">{sc.targetWard}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    sc.expectedSeverity === 'CRITICAL'
                      ? 'bg-red-100 text-red-800'
                      : sc.expectedSeverity === 'HIGH' || sc.expectedSeverity.includes('HIGH')
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {sc.expectedSeverity}
                  </span>
                </div>

                <p className="text-slate-600 text-[11px] leading-relaxed">{sc.description}</p>

                <button
                  onClick={() => handleRunScenario(sc.id)}
                  disabled={isRunning}
                  className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-sky-400" />
                  <span>{isRunning ? 'Injecting Telemetry...' : 'Inject Scenario'}</span>
                </button>
              </div>
            ))}
          </div>

          {/* Reset Baseline Button */}
          <div className="pt-3 border-t border-slate-200">
            <button
              onClick={handleResetDatabase}
              className="w-full py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
            >
              Reset Platform to Initial Demonstration State
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

