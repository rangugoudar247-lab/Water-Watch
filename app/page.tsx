'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserRole, 
  GeographicArea, 
  WaterAsset, 
  Sensor, 
  IncidentAlert, 
  CitizenComplaint, 
  WaterSample, 
  LaboratoryResult, 
  AggregatedHealthSignal, 
  PublicAdvisory, 
  DataSourceStatus, 
  NotificationItem, 
  DetectionRule, 
  AuditLogItem, 
  SensorReading 
} from '@/types';

import Header from '@/components/ui/Header';
import BengaluruMap from '@/components/map/BengaluruMap';
import CitizenPortal from '@/components/citizen/CitizenPortal';
import EngineerDashboard from '@/components/engineer/EngineerDashboard';
import QualityOfficerDashboard from '@/components/quality/QualityOfficerDashboard';
import SupervisorDashboard from '@/components/supervisor/SupervisorDashboard';
import HealthOfficerDashboard from '@/components/health/HealthOfficerDashboard';
import AdminDashboard from '@/components/admin/AdminDashboard';
import LeadershipDashboard from '@/components/leadership/LeadershipDashboard';
import SimulatorDrawer from '@/components/simulator/SimulatorDrawer';

import { 
  initialWards, 
  initialAssets, 
  initialSensors, 
  initialIncidents, 
  initialComplaints, 
  initialSamples, 
  initialLabResults, 
  initialHealthSignals, 
  initialAdvisories, 
  initialDataSources, 
  initialNotifications, 
  initialDetectionRules 
} from '@/lib/db/initialData';

export default function HomePage() {
  const [currentRole, setCurrentRole] = useState<UserRole>('CITIZEN');
  const [language, setLanguage] = useState<'en' | 'kn'>('en');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [selectedWardId, setSelectedWardId] = useState<string>('');

  // Core Data State
  const [wards, setWards] = useState<GeographicArea[]>(initialWards);
  const [assets, setAssets] = useState<WaterAsset[]>(initialAssets);
  const [sensors, setSensors] = useState<Sensor[]>(initialSensors);
  const [incidents, setIncidents] = useState<IncidentAlert[]>(initialIncidents);
  const [complaints, setComplaints] = useState<CitizenComplaint[]>(initialComplaints);
  const [samples, setSamples] = useState<WaterSample[]>(initialSamples);
  const [labResults, setLabResults] = useState<LaboratoryResult[]>(initialLabResults);
  const [healthSignals, setHealthSignals] = useState<AggregatedHealthSignal[]>(initialHealthSignals);
  const [advisories, setAdvisories] = useState<PublicAdvisory[]>(initialAdvisories);
  const [dataSources, setDataSources] = useState<DataSourceStatus[]>(initialDataSources);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [rules, setRules] = useState<DetectionRule[]>(initialDetectionRules);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [recentReadings, setRecentReadings] = useState<SensorReading[]>([]);

  // Fetch updated data from API
  const refreshData = async () => {
    try {
      const [
        sensorsRes, 
        incidentsRes, 
        complaintsRes, 
        samplesRes, 
        healthRes, 
        advisoriesRes, 
        sourcesRes, 
        notifsRes, 
        rulesRes,
        auditRes
      ] = await Promise.all([
        fetch('/api/v1/sensors').then(r => r.json()),
        fetch('/api/v1/incidents').then(r => r.json()),
        fetch('/api/v1/complaints').then(r => r.json()),
        fetch('/api/v1/samples').then(r => r.json()),
        fetch('/api/v1/health-signals').then(r => r.json()),
        fetch('/api/v1/advisories').then(r => r.json()),
        fetch('/api/v1/data-sources').then(r => r.json()),
        fetch('/api/v1/notifications').then(r => r.json()),
        fetch('/api/v1/rules').then(r => r.json()),
        fetch('/api/v1/audit-logs').then(r => r.json()),
      ]);

      if (sensorsRes.success) setSensors(sensorsRes.data);
      if (incidentsRes.success) setIncidents(incidentsRes.data);
      if (complaintsRes.success) setComplaints(complaintsRes.data);
      if (samplesRes.success) {
        setSamples(samplesRes.samples);
        setLabResults(samplesRes.labResults);
      }
      if (healthRes.success) setHealthSignals(healthRes.data);
      if (advisoriesRes.success) setAdvisories(advisoriesRes.data);
      if (sourcesRes.success) setDataSources(sourcesRes.data);
      if (notifsRes.success) setNotifications(notifsRes.data);
      if (rulesRes.success) setRules(rulesRes.data);
      if (auditRes.success) setAuditLogs(auditRes.data);

      // Fetch readings for default selected sensor
      if (sensorsRes.data?.[0]) {
        const readingsRes = await fetch(`/api/v1/sensors/${sensorsRes.data[0].id}/readings`).then(r => r.json());
        if (readingsRes.success) setRecentReadings(readingsRes.data);
      }
    } catch (err) {
      console.warn('Using baseline state. API fetch notice:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleUpdateIncidentStatus = async (id: string, status: any, notes?: string) => {
    try {
      await fetch(`/api/v1/incidents/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes, changedBy: 'Logged-in Officer' }),
      });
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignIncident = async (incidentId: string, userId: string, deptId: string) => {
    try {
      await fetch(`/api/v1/incidents/${incidentId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedUserId: userId, assignedDepartmentId: deptId, changedBy: 'Zonal Supervisor' }),
      });
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublishAdvisory = async (advisoryData: any) => {
    try {
      await fetch('/api/v1/advisories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(advisoryData),
      });
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Application Header */}
      <Header
        currentRole={currentRole}
        onSelectRole={role => setCurrentRole(role)}
        language={language}
        onToggleLanguage={() => setLanguage(language === 'en' ? 'kn' : 'en')}
        notifications={notifications}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Geographic Information System (GIS) Bengaluru Map */}
        <section className="space-y-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>📍</span>
                <span>Bengaluru Urban Water Infrastructure & Telemetry GIS</span>
              </h2>
              <p className="text-xs text-slate-500">
                Interactive spatial visualization of Cauvery distribution mains, GLRs, sensors, incidents, and complaint clusters.
              </p>
            </div>

            {/* Ward Locality Dropdown Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Zoom Ward:</span>
              <select
                value={selectedWardId}
                onChange={e => setSelectedWardId(e.target.value)}
                className="text-xs p-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 shadow-xs focus:outline-none"
              >
                <option value="">-- All Bengaluru Wards --</option>
                {wards.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.zone} Zone)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <BengaluruMap
            wards={wards}
            assets={assets}
            sensors={sensors}
            incidents={incidents}
            complaints={complaints}
            advisories={advisories}
            selectedWardId={selectedWardId}
          />
        </section>

        {/* Dynamic Role-Based View */}
        <section className="pt-2">
          {currentRole === 'CITIZEN' && (
            <CitizenPortal
              wards={wards}
              advisories={advisories}
              complaints={complaints}
              language={language}
              onComplaintSubmitted={refreshData}
            />
          )}

          {currentRole === 'WATER_ENGINEER' && (
            <EngineerDashboard
              incidents={incidents}
              sensors={sensors}
              complaints={complaints}
              readings={recentReadings}
              onUpdateIncidentStatus={handleUpdateIncidentStatus}
              onRefresh={refreshData}
            />
          )}

          {currentRole === 'WATER_QUALITY_OFFICER' && (
            <QualityOfficerDashboard
              incidents={incidents}
              samples={samples}
              labResults={labResults}
              onRefresh={refreshData}
            />
          )}

          {currentRole === 'ZONAL_SUPERVISOR' && (
            <SupervisorDashboard
              incidents={incidents}
              complaints={complaints}
              advisories={advisories}
              wards={wards}
              onAssignIncident={handleAssignIncident}
              onPublishAdvisory={handlePublishAdvisory}
              onRefresh={refreshData}
            />
          )}

          {currentRole === 'PUBLIC_HEALTH_OFFICER' && (
            <HealthOfficerDashboard
              signals={healthSignals}
              incidents={incidents}
              onRefresh={refreshData}
            />
          )}

          {currentRole === 'ADMIN' && (
            <AdminDashboard
              rules={rules}
              dataSources={dataSources}
              auditLogs={auditLogs}
              onRefresh={refreshData}
            />
          )}

          {currentRole === 'LEADERSHIP' && (
            <LeadershipDashboard
              incidents={incidents}
              complaints={complaints}
              wards={wards}
            />
          )}
        </section>
      </main>

      {/* Slide-out Physical Sensor Simulator Drawer */}
      <SimulatorDrawer
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSimulationComplete={refreshData}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="font-bold text-slate-200">
              Water Watch Bengaluru (ಜಲ ದೃಷ್ಟಿ ಬೆಂಗಳೂರು)
            </div>
            <p className="text-[11px] text-slate-500">
              Developed for BWSSB, BBMP, and Karnataka State Public Health Monitoring. Built to IS 10500:2012 specifications.
            </p>
          </div>
          <div className="text-[11px] text-slate-400 text-center sm:text-right">
            <span>Pilot Demonstration Architecture | </span>
            <span className="font-mono text-sky-400">Next.js 14 • Supabase / PostgreSQL • Leaflet</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
