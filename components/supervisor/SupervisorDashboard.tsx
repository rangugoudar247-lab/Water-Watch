'use client';

import React, { useState } from 'react';
import { IncidentAlert, CitizenComplaint, PublicAdvisory, GeographicArea } from '@/types';
import { SeverityBadge, StatusBadge, DataCategoryBadge } from '../ui/Badge';
import { 
  Building2, 
  UserCheck, 
  Clock, 
  AlertTriangle, 
  Send, 
  Megaphone, 
  Layers, 
  TrendingUp 
} from 'lucide-react';

interface SupervisorDashboardProps {
  incidents: IncidentAlert[];
  complaints: CitizenComplaint[];
  advisories: PublicAdvisory[];
  wards: GeographicArea[];
  onAssignIncident: (incidentId: string, userId: string, deptId: string) => Promise<void>;
  onPublishAdvisory: (advisory: any) => Promise<void>;
  onRefresh: () => void;
}

export default function SupervisorDashboard({
  incidents,
  complaints,
  advisories,
  wards,
  onAssignIncident,
  onPublishAdvisory,
  onRefresh,
}: SupervisorDashboardProps) {
  const [selectedIncident, setSelectedIncident] = useState<IncidentAlert | null>(incidents[0] || null);
  const [assigneeUser, setAssigneeUser] = useState('user-engineer-1');
  const [assigneeDept, setAssigneeDept] = useState('BWSSB_QC_LAB');
  const [isAssigning, setIsAssigning] = useState(false);

  // New Advisory State
  const [showAdvisoryModal, setShowAdvisoryModal] = useState(false);
  const [advTitleEn, setAdvTitleEn] = useState('');
  const [advTitleKn, setAdvTitleKn] = useState('');
  const [advContentEn, setAdvContentEn] = useState('');
  const [advContentKn, setAdvContentKn] = useState('');
  const [advType, setAdvType] = useState<PublicAdvisory['advisoryType']>('BOIL_WATER');
  const [advWard, setAdvWard] = useState('Koramangala (Ward 151)');

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;

    setIsAssigning(true);
    try {
      await onAssignIncident(selectedIncident.id, assigneeUser, assigneeDept);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCreateAdvisory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onPublishAdvisory({
        titleEn: advTitleEn,
        titleKn: advTitleKn,
        contentEn: advContentEn,
        contentKn: advContentKn,
        advisoryType: advType,
        affectedWards: [advWard],
        issuedByOfficer: 'Zonal Control Room & Chief Engineer',
        dataCategory: 'DEMO',
      });
      setShowAdvisoryModal(false);
      setAdvTitleEn('');
      setAdvTitleKn('');
      setAdvContentEn('');
      setAdvContentKn('');
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Zonal Control KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 block uppercase">Open Alerts</span>
          <span className="text-2xl font-extrabold text-rose-600 block mt-1">
            {incidents.filter(i => i.status !== 'CLOSED' && i.status !== 'VERIFIED').length}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Requiring triage or field crew</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 block uppercase">Unresolved Complaints</span>
          <span className="text-2xl font-extrabold text-amber-600 block mt-1">
            {complaints.filter(c => c.status === 'NEW' || c.status === 'ASSIGNED').length}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Citizen grievance backlog</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 block uppercase">Active Advisories</span>
          <span className="text-2xl font-extrabold text-sky-600 block mt-1">
            {advisories.filter(a => a.isActive).length}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Published public notices</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 block uppercase">SLA Compliance Rate</span>
          <span className="text-2xl font-extrabold text-emerald-600 block mt-1">94.2%</span>
          <span className="text-[10px] text-slate-500 mt-1 block">Triage under 2 hours</span>
        </div>
      </div>

      {/* Main Grid: Assignment Console & Jurisdictional Ticket Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Alerts Needing Assignment (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-600" />
              <h3 className="font-bold text-slate-800 text-sm">Zonal Incident Queue & Escalations</h3>
            </div>
            <button
              onClick={() => setShowAdvisoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Issue Public Advisory</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto">
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
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{inc.incidentNumber}</span>
                    <SeverityBadge severity={inc.severity} />
                  </div>
                  <StatusBadge status={inc.status} />
                </div>

                <div className="font-semibold text-slate-800">{inc.title}</div>
                <div className="text-slate-500 text-[11px] line-clamp-2">{inc.description}</div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Assigned: {inc.assignedUserId || 'UNASSIGNED'}</span>
                  <span>SLA: {inc.slaDeadline ? new Date(inc.slaDeadline).toLocaleTimeString() : '4h Standard'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Fast Assignment & Triage Station (6 cols) */}
        {selectedIncident && (
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="font-mono font-bold text-sky-800 text-xs block">
                    {selectedIncident.incidentNumber}
                  </span>
                  <h4 className="font-bold text-slate-800 text-sm mt-0.5">{selectedIncident.title}</h4>
                </div>
                <DataCategoryBadge category={selectedIncident.dataCategory} />
              </div>

              {/* Triage & Assignment Form */}
              <form onSubmit={handleAssign} className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block border-b border-slate-200 pb-1">
                  Dispatch & Assignment Routing
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Target Department Wing</label>
                    <select
                      value={assigneeDept}
                      onChange={e => setAssigneeDept(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 text-slate-800 bg-white"
                    >
                      <option value="BWSSB_CENTRAL">BWSSB Central Maintenance</option>
                      <option value="BWSSB_QC_LAB">BWSSB Central Water Quality Lab</option>
                      <option value="BWSSB_EAST">BWSSB East Distribution Division</option>
                      <option value="BBMP_HEALTH">BBMP Health Directorate (Joint)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Assigned Executive Officer</label>
                    <select
                      value={assigneeUser}
                      onChange={e => setAssigneeUser(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 text-slate-800 bg-white"
                    >
                      <option value="user-engineer-1">AEE Rajesh Kumar (Distribution Lead)</option>
                      <option value="user-engineer-2">AEE Manjunath (East Division)</option>
                      <option value="user-qc-1">Dr. Savitha Rao (Senior Chemist / Lab)</option>
                      <option value="user-health-1">Dr. Ananya Murthy (BBMP CHO Surveillance)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAssigning}
                  className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  {isAssigning ? 'Dispatching...' : 'Confirm Assignment & Dispatch Officer'}
                </button>
              </form>

              {/* Active Advisories List */}
              <div className="space-y-2 pt-2">
                <span className="font-bold text-slate-700 text-xs block">Active Advisories in Zone:</span>
                {advisories.map(adv => (
                  <div key={adv.id} className="p-3 rounded-lg border border-rose-200 bg-rose-50/50 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-900">{adv.titleEn}</span>
                      <span className="text-[10px] bg-rose-200 text-rose-800 font-bold px-2 py-0.5 rounded">
                        {adv.advisoryType}
                      </span>
                    </div>
                    <p className="text-rose-800 text-[11px]">{adv.contentEn}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Issuing New Public Advisory */}
      {showAdvisoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-rose-600" />
                Publish Official Public Water Safety Advisory
              </h3>
              <button onClick={() => setShowAdvisoryModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdvisory} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Advisory Type</label>
                <select
                  value={advType}
                  onChange={e => setAdvType(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-300"
                >
                  <option value="BOIL_WATER">Precautionary Boil-Water Advisory</option>
                  <option value="SUPPLY_SHUTDOWN">Scheduled Maintenance Supply Shutdown</option>
                  <option value="TANKER_SCHEDULE">Emergency Drinking Water Tanker Dispatch</option>
                  <option value="WATER_SAVING">Summer Water Conservation Notice</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Ward / Locality</label>
                <select
                  value={advWard}
                  onChange={e => setAdvWard(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300"
                >
                  {wards.map(w => (
                    <option key={w.id} value={w.name}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Title (English)</label>
                <input
                  type="text"
                  required
                  value={advTitleEn}
                  onChange={e => setAdvTitleEn(e.target.value)}
                  placeholder="e.g., Precautionary Boil-Water Notice: Indiranagar 100ft Road"
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Title (ಕನ್ನಡ)</label>
                <input
                  type="text"
                  required
                  value={advTitleKn}
                  onChange={e => setAdvTitleKn(e.target.value)}
                  placeholder="ಉದಾ: ಮುನ್ನೆಚ್ಚರಿಕೆ ಕುದಿಸಿ ಕುಡಿಯುವ ನೀರಿನ ಸಲಹೆ: ಇಂದಿರಾನಗರ"
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Content Details (English)</label>
                <textarea
                  required
                  rows={2}
                  value={advContentEn}
                  onChange={e => setAdvContentEn(e.target.value)}
                  placeholder="State the technical reason, precaution steps, and expected repair completion..."
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Content Details (ಕನ್ನಡ)</label>
                <textarea
                  required
                  rows={2}
                  value={advContentKn}
                  onChange={e => setAdvContentKn(e.target.value)}
                  placeholder="ಸಾರ್ವಜನಿಕರಿಗೆ ಮುನ್ನೆಚ್ಚರಿಕೆ ವಿವರ..."
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvisoryModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Confirm & Broadcast to Public
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

