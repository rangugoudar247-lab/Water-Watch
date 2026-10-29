'use client';

import React, { useState } from 'react';
import { IncidentAlert, WaterSample, LaboratoryResult } from '@/types';
import { SeverityBadge, StatusBadge, DataCategoryBadge } from '../ui/Badge';
import { 
  FlaskConical, 
  FileCheck2, 
  AlertOctagon, 
  CheckCircle2, 
  FileText, 
  Scale, 
  ShieldAlert,
  Send
} from 'lucide-react';

interface QualityOfficerDashboardProps {
  incidents: IncidentAlert[];
  samples: WaterSample[];
  labResults: LaboratoryResult[];
  onRefresh: () => void;
}

export default function QualityOfficerDashboard({
  incidents,
  samples,
  labResults,
  onRefresh,
}: QualityOfficerDashboardProps) {
  // Lab Result Certification Form State
  const [selectedSampleId, setSelectedSampleId] = useState<string>(samples[0]?.id || '');
  const [labName, setLabName] = useState('BWSSB Central Water Quality Laboratory, High Grounds');
  const [testedByOfficer, setTestedByOfficer] = useState('Dr. Savitha Rao, Senior Chemist');
  const [phValue, setPhValue] = useState<number>(7.2);
  const [turbidityNtu, setTurbidityNtu] = useState<number>(1.4);
  const [freeChlorineMgL, setFreeChlorineMgL] = useState<number>(0.45);
  const [totalColiformCfu, setTotalColiformCfu] = useState<number>(0);
  const [eColiCfu, setEColiCfu] = useState<number>(0);
  const [tdsMgL, setTdsMgL] = useState<number>(240);
  const [nitratesMgL, setNitratesMgL] = useState<number>(8.5);
  const [signature, setSignature] = useState('Dr. Savitha Rao (KMC-QC-88412)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const qualityIncidents = incidents.filter(i => 
    i.alertCategory.includes('QUALITY') || 
    i.alertCategory.includes('CONTAMINATION') || 
    i.alertCategory.includes('CLUSTER')
  );

  const handleSubmitLabResult = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/v1/samples/lab-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleId: selectedSampleId,
          labName,
          testedByOfficer,
          phValue,
          turbidityNtu,
          freeChlorineMgL,
          totalColiformCfu100ml: totalColiformCfu,
          eColiCfu100ml: eColiCfu,
          tdsMgL,
          nitratesMgL,
          certifiedBySignature: signature,
          dataCategory: 'DEMO',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFormSuccess(
          data.meetsIs10500
            ? '✓ Laboratory Certificate Generated: Sample MEETS Indian Standard IS 10500:2012.'
            : '⚠️ Laboratory Certificate Generated: Sample FAILS IS 10500:2012 specification.'
        );
        onRefresh();
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: IS 10500 Statutory Standard Reference */}
      <div className="bg-gradient-to-r from-sky-900 to-slate-900 text-white p-5 rounded-xl shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-sky-400" />
              <h2 className="font-extrabold text-base sm:text-lg">
                Official Water Quality Certification & Chain of Custody
              </h2>
            </div>
            <p className="text-xs text-sky-200/80 mt-1">
              Indian Standard IS 10500:2012 Compliance Enforcement. Only accredited Quality Officers can sign off official lab results.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block">Acceptable Turbidity</span>
              <span className="font-bold text-emerald-400">≤ 1.0 NTU</span>
            </div>
            <div className="border-l border-slate-700 pl-3">
              <span className="text-[10px] text-slate-400 block">Min Free Chlorine</span>
              <span className="font-bold text-sky-400">≥ 0.20 mg/L</span>
            </div>
            <div className="border-l border-slate-700 pl-3">
              <span className="text-[10px] text-slate-400 block">E. Coli Limit</span>
              <span className="font-bold text-rose-400">0 / 100 mL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Lab Certification Form & Certified Results History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Certified Laboratory Entry Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-sky-600" />
              <h3 className="font-bold text-slate-800 text-sm">Issue Laboratory Compliance Certificate</h3>
            </div>
            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">
              ACCREDITED LAB WORKFLOW
            </span>
          </div>

          {formSuccess && (
            <div className={`p-3.5 rounded-lg text-xs font-medium border ${
              formSuccess.includes('MEETS')
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleSubmitLabResult} className="space-y-4 text-xs">
            {/* Sample Picker */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Sample Chain of Custody Record</label>
              <select
                value={selectedSampleId}
                onChange={e => setSelectedSampleId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-800 focus:outline-none"
              >
                {samples.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.sampleCode} - {s.sampleLocationText} (Status: {s.labStatus})
                  </option>
                ))}
              </select>
            </div>

            {/* Officer & Lab */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Testing Laboratory Name</label>
                <input
                  type="text"
                  required
                  value={labName}
                  onChange={e => setLabName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-800"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Certifying Chemist / QC Officer</label>
                <input
                  type="text"
                  required
                  value={testedByOfficer}
                  onChange={e => setTestedByOfficer(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-800"
                />
              </div>
            </div>

            {/* Physical & Chemical Parameters */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <span className="font-bold text-slate-800 block text-xs border-b border-slate-200 pb-1">
                Measured Water Quality Parameters (IS 10500:2012)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">pH (6.5 - 8.5)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={phValue}
                    onChange={e => setPhValue(parseFloat(e.target.value))}
                    className="w-full p-2 rounded border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Turbidity (NTU)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={turbidityNtu}
                    onChange={e => setTurbidityNtu(parseFloat(e.target.value))}
                    className="w-full p-2 rounded border border-slate-300 font-mono font-bold text-amber-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Free Cl (mg/L)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={freeChlorineMgL}
                    onChange={e => setFreeChlorineMgL(parseFloat(e.target.value))}
                    className="w-full p-2 rounded border border-slate-300 font-mono font-bold text-sky-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">TDS (mg/L)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={tdsMgL}
                    onChange={e => setTdsMgL(parseFloat(e.target.value))}
                    className="w-full p-2 rounded border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Microbiological Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
                  <label className="block font-bold text-rose-900 mb-1">E. Coli (CFU/100mL) [Limit: 0]</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={eColiCfu}
                    onChange={e => setEColiCfu(parseInt(e.target.value, 10))}
                    className="w-full p-2 rounded border border-rose-300 font-mono font-bold text-rose-700 bg-white"
                  />
                </div>
                <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                  <label className="block font-bold text-amber-900 mb-1">Total Coliform (CFU/100mL)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={totalColiformCfu}
                    onChange={e => setTotalColiformCfu(parseInt(e.target.value, 10))}
                    className="w-full p-2 rounded border border-amber-300 font-mono font-bold text-amber-700 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Officer Digital Signature Registration */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">Digital Certification Signature ID</label>
              <input
                type="text"
                required
                value={signature}
                onChange={e => setSignature(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 text-slate-800 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              <FileCheck2 className="w-4 h-4" />
              {isSubmitting ? 'Signing & Certifying...' : 'Officially Sign & Issue Laboratory Report'}
            </button>
          </form>
        </div>

        {/* Right Column: Certified Reports & Quality Alerts History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Certified Results Feed */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Certified Lab Test Certificates
              </h4>
              <span className="text-[10px] text-slate-400">Total: {labResults.length}</span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {labResults.map(res => (
                <div key={res.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800">{res.sampleId}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      res.meetsIs10500 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {res.meetsIs10500 ? 'PASSED IS 10500' : 'FAILED IS 10500'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px] bg-white p-2 rounded border border-slate-100">
                    <div>
                      <span className="text-[9px] text-slate-400 block">Turbidity</span>
                      <span className="font-bold text-slate-700">{res.turbidityNtu} NTU</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">Free Cl</span>
                      <span className="font-bold text-slate-700">{res.freeChlorineMgL} mg/L</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">E. Coli</span>
                      <span className={`font-bold ${res.eColiCfu100ml > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {res.eColiCfu100ml} CFU
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 flex items-center justify-between">
                    <span>Certified by: {res.testedByOfficer}</span>
                    <span>{new Date(res.completedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quality Alerts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Active Water-Quality Incidents
              </h4>
              <span className="text-[10px] text-slate-400">{qualityIncidents.length} Active</span>
            </div>

            <div className="space-y-2">
              {qualityIncidents.map(q => (
                <div key={q.id} className="p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800">{q.incidentNumber}</span>
                    <SeverityBadge severity={q.severity} />
                  </div>
                  <div className="font-medium text-slate-700">{q.title}</div>
                  <div className="text-[10px] text-slate-400">Confidence: {q.confidenceLevel.replace(/_/g, ' ')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

