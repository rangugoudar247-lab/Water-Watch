'use client';

import React from 'react';
import { IncidentAlert, CitizenComplaint, GeographicArea } from '@/types';
import { 
  Building, 
  TrendingUp, 
  PieChart as PieIcon, 
  Printer, 
  MapPin, 
  Award, 
  AlertCircle 
} from 'lucide-react';

interface LeadershipDashboardProps {
  incidents: IncidentAlert[];
  complaints: CitizenComplaint[];
  wards: GeographicArea[];
}

export default function LeadershipDashboard({
  incidents,
  complaints,
  wards,
}: LeadershipDashboardProps) {
  // Ward performance stats
  const wardStats = wards.map(w => {
    const wardIncidents = incidents.filter(i => i.wardId === w.id);
    const wardComplaints = complaints.filter(c => c.wardId === w.id);
    const resolvedCount = wardComplaints.filter(c => c.status === 'RESOLVED' || c.status === 'VERIFIED').length;
    const resolutionRate = wardComplaints.length > 0 ? (resolvedCount / wardComplaints.length) * 100 : 100;

    return {
      ward: w.name,
      zone: w.zone,
      population: w.populationEst,
      incidents: wardIncidents.length,
      complaints: wardComplaints.length,
      resolutionRate: Math.round(resolutionRate),
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Executive Header */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest block mb-1">
              Bengaluru Urban Governance & Utility Performance
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Executive Water Distribution & Public Health Scorecard
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Macro insights across BBMP Zones, BWSSB Cauvery Stages I–V, Non-Revenue Water, and Grievance Resolution.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Export Executive Summary</span>
          </button>
        </div>
      </div>

      {/* High-Level Strategic Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Cauvery Supply</span>
          <span className="text-2xl font-black text-slate-900 block font-mono">2,225 MLD</span>
          <span className="text-[11px] text-emerald-600 font-semibold block">
            CWSS Stages I–IV (1,450) + Stage V (775)
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Non-Revenue Water (Loss)</span>
          <span className="text-2xl font-black text-rose-600 block font-mono">37.8%</span>
          <span className="text-[11px] text-slate-500 block">
            Target NRW: &lt; 25% by 2027
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Active Water Incidents</span>
          <span className="text-2xl font-black text-amber-600 block font-mono">{incidents.length}</span>
          <span className="text-[11px] text-slate-500 block">
            {incidents.filter(i => i.severity === 'CRITICAL').length} Critical Alerts
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Citizen Grievance SLA</span>
          <span className="text-2xl font-black text-sky-600 block font-mono">92.4%</span>
          <span className="text-[11px] text-emerald-600 font-semibold block">
            Resolved under 48h benchmark
          </span>
        </div>
      </div>

      {/* Ward-by-Ward Operational Scorecard Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Ward-Level Distribution & Grievance Scorecard</h3>
            <p className="text-xs text-slate-500 mt-0.5">Performance tracking across monitored Bengaluru divisions</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">8 Monitored Hubs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Ward / Locality</th>
                <th className="p-3">Zone</th>
                <th className="p-3">Population Est.</th>
                <th className="p-3">Active Alerts</th>
                <th className="p-3">Complaints Filed</th>
                <th className="p-3">Resolution Rate</th>
                <th className="p-3">Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {wardStats.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-bold text-slate-900">{row.ward}</td>
                  <td className="p-3 text-slate-600">{row.zone}</td>
                  <td className="p-3 font-mono text-slate-600">{row.population.toLocaleString()}</td>
                  <td className="p-3 font-mono font-bold">
                    <span className={row.incidents > 0 ? 'text-rose-600' : 'text-slate-400'}>
                      {row.incidents}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-700">{row.complaints}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${row.resolutionRate}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-bold text-slate-700">
                        {row.resolutionRate}%
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      row.incidents > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {row.incidents > 0 ? 'INVESTIGATING' : 'OPTIMAL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

