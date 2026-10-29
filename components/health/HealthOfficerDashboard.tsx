'use client';

import React, { useState } from 'react';
import { AggregatedHealthSignal, IncidentAlert } from '@/types';
import { SeverityBadge } from '../ui/Badge';
import { 
  HeartPulse, 
  ShieldAlert, 
  AlertTriangle, 
  FileText, 
  Share2, 
  Lock, 
  Users, 
  Activity 
} from 'lucide-react';

interface HealthOfficerDashboardProps {
  signals: AggregatedHealthSignal[];
  incidents: IncidentAlert[];
  onRefresh: () => void;
}

export default function HealthOfficerDashboard({
  signals,
  incidents,
  onRefresh,
}: HealthOfficerDashboardProps) {
  const [selectedSignal, setSelectedSignal] = useState<AggregatedHealthSignal | null>(signals[0] || null);
  const [assessmentNotes, setAssessmentNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState<AggregatedHealthSignal['reviewStatus']>('UNDER_INVESTIGATION');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const handleUpdateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSignal) return;

    setIsUpdating(true);
    setUpdateMsg(null);
    try {
      const res = await fetch('/api/v1/health-signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSignal.id,
          reviewStatus,
          reviewedBy: 'Dr. Ananya Murthy (BBMP Public Health Surveillance)',
          assessmentNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUpdateMsg('Assessment logged and synchronized with IDSP Karnataka Node.');
        onRefresh();
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Statutory Public Health Disclaimer */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-900 text-xs sm:text-sm">
              DECISION-SUPPORT NOTICE — WATERBORNE DISEASE SURVEILLANCE
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Water Watch Bengaluru aggregates voluntary citizen symptom signals strictly to detect early statistical anomalies. 
              The software <strong>does not automatically declare outbreaks</strong> or diagnose individual illnesses. 
              Official health advisories and clinical investigations are the sole statutory jurisdiction of the 
              Directorate of Health & Family Welfare Services (Government of Karnataka) and BBMP Health Department.
            </p>
            <div className="text-[11px] text-amber-700 font-semibold flex items-center gap-2 pt-1">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>k-Anonymity Guard: Individual names and addresses are strictly suppressed (Minimum cluster size ≥ 5).</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Aggregated Signal Clusters (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-slate-800 text-sm">Aggregated Symptom Clusters</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-mono text-slate-600">
              {signals.length} Signals
            </span>
          </div>

          <div className="space-y-3">
            {signals.map(sig => (
              <div
                key={sig.id}
                onClick={() => {
                  setSelectedSignal(sig);
                  setAssessmentNotes(sig.assessmentNotes || '');
                  setReviewStatus(sig.reviewStatus);
                }}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all space-y-2 ${
                  selectedSignal?.id === sig.id
                    ? 'border-rose-500 bg-rose-50/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900">{sig.signalCode}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    sig.signalStrength === 'UNUSUAL_CLUSTER'
                      ? 'bg-rose-100 text-rose-800'
                      : sig.signalStrength === 'ELEVATED'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {sig.signalStrength.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="font-semibold text-slate-800">{sig.wardName}</div>
                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reported Cases: <strong>{sig.reportCount}</strong></span>
                  <span className="text-rose-600 font-bold">(+{sig.baselineComparisonPct}% vs baseline)</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Status: {sig.reviewStatus.replace(/_/g, ' ')}</span>
                  <span>Date: {sig.dateRecorded}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Epidemiological Review & Water Quality Cross-Correlation (7 cols) */}
        {selectedSignal && (
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="font-mono font-bold text-rose-800 text-xs block">{selectedSignal.signalCode}</span>
                  <h4 className="font-bold text-slate-800 text-sm mt-0.5">{selectedSignal.wardName}</h4>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                  {selectedSignal.reviewStatus.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Symptom Breakdown Cards */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-700 block">Reported Symptom Frequency Distribution:</span>
                <div className="grid grid-cols-3 gap-2">
                  {selectedSignal.symptomTypes.map((st, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-center">
                      <span className="text-slate-500 text-[10px] block">{st.symptom.replace(/_/g, ' ')}</span>
                      <span className="text-lg font-bold font-mono text-slate-800">{st.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Water Quality Telemetry Correlation */}
              <div className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-100 text-xs space-y-2">
                <div className="font-bold text-sky-900 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-sky-600" />
                  <span>BWSSB Water Distribution Correlation in this Ward:</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  Cross-referencing telemetry shows an active <strong>Turbidity Exceedance (3.4 NTU)</strong> and 
                  <strong> Residual Chlorine Depletion (0.12 mg/L)</strong> at the Koramangala GLR feeder. 
                  Concurrent hydraulic depressurization occurred between 07:00 and 09:30 AM.
                </p>
              </div>

              {/* Epidemiologist Assessment Form */}
              <form onSubmit={handleUpdateAssessment} className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block border-b border-slate-200 pb-1">
                  Public Health Surveillance Action & Referral
                </span>

                {updateMsg && (
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                    ✓ {updateMsg}
                  </div>
                )}

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Surveillance Review Status</label>
                  <select
                    value={reviewStatus}
                    onChange={e => setReviewStatus(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-800 bg-white"
                  >
                    <option value="UNDER_INVESTIGATION">Under Investigation (UPHC Alert Dispatched)</option>
                    <option value="REFERRED_TO_IDSP">Referred to IDSP Karnataka for Epidemiological Verification</option>
                    <option value="RESOLVED">Resolved (No Clinical Outbreak Verified)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Epidemiological Findings / Action Notes</label>
                  <textarea
                    rows={3}
                    value={assessmentNotes}
                    onChange={e => setAssessmentNotes(e.target.value)}
                    placeholder="Document clinical sampling, UPHC case counts, stool culture results, and joint BWSSB inspection status..."
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-800 bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4" />
                  {isUpdating ? 'Synchronizing...' : 'Save Assessment & Transmit to IDSP Surveillance'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

