'use client';

import React, { useState } from 'react';
import { IncidentAlert, Sensor, SensorReading, CitizenComplaint, FieldInspection } from '@/types';
import { SeverityBadge, StatusBadge, DataCategoryBadge } from '../ui/Badge';
import TelemetryCharts from '../charts/TelemetryCharts';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  ClipboardList, 
  Activity, 
  ArrowRight, 
  Camera, 
  FileCheck 
} from 'lucide-react';

interface EngineerDashboardProps {
  incidents: IncidentAlert[];
  sensors: Sensor[];
  complaints: CitizenComplaint[];
  readings: SensorReading[];
  onUpdateIncidentStatus: (id: string, status: any, notes?: string) => Promise<void>;
  onRefresh: () => void;
}

export default function EngineerDashboard({
  incidents,
  sensors,
  complaints,
  readings,
  onUpdateIncidentStatus,
  onRefresh,
}: EngineerDashboardProps) {
  const [selectedIncident, setSelectedIncident] = useState<IncidentAlert>(incidents[0] || null);
  const [selectedSensor, setSelectedSensor] = useState<Sensor>(sensors[0] || null);

  // Field Inspection Form State
  const [inspectorName, setInspectorName] = useState('AEE Rajesh Kumar (BWSSB)');
  const [rootCause, setRootCause] = useState<FieldInspection['rootCause']>('SEWAGE_BACK_SIPHONAGE');
  const [findings, setFindings] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [followUp, setFollowUp] = useState(false);
  const [isSubmittingInspection, setIsSubmittingInspection] = useState(false);
  const [inspectionSuccess, setInspectionSuccess] = useState<string | null>(null);

  const activeSensorReadings = readings.filter(r => r.sensorId === selectedSensor?.id);

  const handleLogInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;

    setIsSubmittingInspection(true);
    try {
      const res = await fetch('/api/v1/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: selectedIncident.id,
          inspectorName,
          rootCause,
          findings,
          actionTaken,
          followUpRequired: followUp,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInspectionSuccess('Field inspection logged. Incident moved to ACTION IN PROGRESS.');
        setFindings('');
        setActionTaken('');
        onRefresh();
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmittingInspection(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Telemetry & Sensor Quick View */}
      {selectedSensor && (
        <TelemetryCharts sensor={selectedSensor} readings={activeSensorReadings} />
      )}

      {/* Sensor Picker Pills */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 pl-1">
          Select Telemetry Station:
        </span>
        {sensors.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedSensor(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium shrink-0 transition-all ${
              selectedSensor?.id === s.id
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {s.sensorCode} ({s.sensorType})
          </button>
        ))}
      </div>

      {/* Main Grid: Incident Investigation & Field Inspection Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Assigned Incidents List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-sky-600" />
              <h3 className="font-bold text-slate-800 text-sm">Active Engineering Incidents</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-mono text-slate-600">
              {incidents.length} Tickets
            </span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {incidents.map(inc => (
              <div
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all space-y-2 ${
                  selectedIncident?.id === inc.id
                    ? 'border-sky-500 bg-sky-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800">{inc.incidentNumber}</span>
                  <div className="flex items-center gap-1.5">
                    <SeverityBadge severity={inc.severity} />
                    <StatusBadge status={inc.status} />
                  </div>
                </div>

                <div className="font-semibold text-slate-900">{inc.title}</div>
                <div className="text-slate-500 line-clamp-2 leading-relaxed">{inc.description}</div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                  <span>Detected: {new Date(inc.detectedAt).toLocaleTimeString()}</span>
                  <span className="font-bold text-sky-700">{inc.confidenceLevel.replace(/_/g, ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Selected Incident Detail & Field Action (7 cols) */}
        {selectedIncident && (
          <div className="lg:col-span-7 space-y-6">
            {/* Detail Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-slate-900">
                      {selectedIncident.incidentNumber}
                    </span>
                    <SeverityBadge severity={selectedIncident.severity} />
                    <StatusBadge status={selectedIncident.status} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm mt-1">{selectedIncident.title}</h3>
                </div>
                <DataCategoryBadge category={selectedIncident.dataCategory} />
              </div>

              {/* Status Action Buttons */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-600 mr-1">Advance Status:</span>
                {selectedIncident.status === 'NEW' && (
                  <button
                    onClick={() => onUpdateIncidentStatus(selectedIncident.id, 'ACKNOWLEDGED', 'Acknowledged by Water Engineer')}
                    className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm"
                  >
                    Acknowledge Alert
                  </button>
                )}
                {selectedIncident.status === 'ACKNOWLEDGED' && (
                  <button
                    onClick={() => onUpdateIncidentStatus(selectedIncident.id, 'FIELD_INSPECTION', 'Crew dispatched to site for field inspection')}
                    className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm"
                  >
                    Start Field Inspection
                  </button>
                )}
                {(selectedIncident.status === 'FIELD_INSPECTION' || selectedIncident.status === 'ACTION_IN_PROGRESS') && (
                  <button
                    onClick={() => onUpdateIncidentStatus(selectedIncident.id, 'RESOLVED', 'Pipeline repair completed and flush tested')}
                    className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm"
                  >
                    Mark Resolved
                  </button>
                )}
                {selectedIncident.status === 'RESOLVED' && (
                  <button
                    onClick={() => onUpdateIncidentStatus(selectedIncident.id, 'VERIFIED', 'Water quality verified and normal pressure restored')}
                    className="px-3 py-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-sm"
                  >
                    Sign Off & Verify
                  </button>
                )}
              </div>

              {/* Evidence & Technical Basis */}
              <div className="space-y-2 text-xs">
                <div className="font-bold text-slate-700">Evidence Telemetry & Baseline:</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedIncident.evidencePayload?.measurements?.map((m, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">{m.parameter}</span>
                      <span className="text-sm font-bold font-mono text-slate-800">
                        {m.value} {m.unit}
                      </span>
                      {m.baseline && (
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Baseline: {m.baseline} {m.unit}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Verification Steps */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-700">Recommended Standard Operating Procedures:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                  {selectedIncident.recommendedActions?.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>

              {/* Audit Timeline */}
              <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5">
                <span className="font-bold text-slate-700 block">Incident Lifecycle History:</span>
                <div className="space-y-1">
                  {selectedIncident.auditTrail?.map((trail, i) => (
                    <div key={i} className="text-[11px] text-slate-600 flex items-center justify-between bg-slate-50 p-2 rounded">
                      <span>
                        <strong>[{trail.status}]</strong> {trail.notes || 'Status changed'} ({trail.changedBy})
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {new Date(trail.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Field Inspection Logging Form */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <ClipboardList className="w-4 h-4 text-sky-600" />
                <h4 className="font-bold text-slate-800 text-sm">Record Official Field Inspection</h4>
              </div>

              {inspectionSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs border border-emerald-200">
                  ✓ {inspectionSuccess}
                </div>
              )}

              <form onSubmit={handleLogInspection} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Inspector Officer Name</label>
                    <input
                      type="text"
                      required
                      value={inspectorName}
                      onChange={e => setInspectorName(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Diagnosed Root Cause</label>
                    <select
                      value={rootCause}
                      onChange={e => setRootCause(e.target.value as any)}
                      className="w-full p-2 rounded-lg border border-slate-300 text-slate-800 focus:outline-none"
                    >
                      <option value="SEWAGE_BACK_SIPHONAGE">Sewage Back-Siphonage (Depressurization)</option>
                      <option value="PIPE_BURST">Physical Pipe Burst / Fracture</option>
                      <option value="CHLORINATOR_FAILURE">Chlorinator Dosing Pump Fault</option>
                      <option value="VALVE_MALFUNCTION">Distribution Sluice Valve Jam</option>
                      <option value="DRY_BOREWELL">Local Borewell Depletion</option>
                      <option value="UNFOUND">No Defect Observed (Transient Fluctuation)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Field Findings & Inspection Notes</label>
                  <textarea
                    required
                    rows={2}
                    value={findings}
                    onChange={e => setFindings(e.target.value)}
                    placeholder="e.g., Excavated 2m trench along 17th Main road; confirmed circumferential crack on 150mm CI pipe..."
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Action Taken / Repairs Completed</label>
                  <textarea
                    required
                    rows={2}
                    value={actionTaken}
                    onChange={e => setActionTaken(e.target.value)}
                    placeholder="e.g., Installed stainless steel repair clamp, flushed distribution segment with 2.0 ppm chlorinated solution..."
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={followUp}
                      onChange={e => setFollowUp(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-0"
                    />
                    <span>Requires follow-up laboratory water sample</span>
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmittingInspection}
                    className="px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                  >
                    {isSubmittingInspection ? 'Submitting...' : 'Submit Field Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

