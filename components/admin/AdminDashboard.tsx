'use client';

import React, { useState, useRef } from 'react';
import { DetectionRule, DataSourceStatus, AuditLogItem } from '@/types';
import { 
  Settings, 
  Upload, 
  Radio, 
  Database, 
  ScrollText, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  FileUp, 
  RefreshCw 
} from 'lucide-react';

interface AdminDashboardProps {
  rules: DetectionRule[];
  dataSources: DataSourceStatus[];
  auditLogs: AuditLogItem[];
  onRefresh: () => void;
}

export default function AdminDashboard({
  rules,
  dataSources,
  auditLogs,
  onRefresh,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'rules' | 'csv' | 'sources' | 'audit'>('rules');

  // CSV Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] = useState<'DEMO' | 'REAL'>('DEMO');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Rule Config State
  const [editingRule, setEditingRule] = useState<DetectionRule | null>(rules[0] || null);
  const [configJson, setConfigJson] = useState<string>(
    rules[0] ? JSON.stringify(rules[0].thresholdConfig, null, 2) : '{}'
  );
  const [ruleEnabled, setRuleEnabled] = useState(rules[0]?.isEnabled ?? true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSelectRule = (rule: DetectionRule) => {
    setEditingRule(rule);
    setConfigJson(JSON.stringify(rule.thresholdConfig, null, 2));
    setRuleEnabled(rule.isEnabled);
    setSaveSuccess(false);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;

    try {
      const parsedConfig = JSON.parse(configJson);
      const res = await fetch('/api/v1/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRule.id,
          isEnabled: ruleEnabled,
          thresholdConfig: parsedConfig,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        onRefresh();
      }
    } catch (err: any) {
      alert('Invalid JSON in threshold configuration: ' + err.message);
    }
  };

  const handleCSVUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    setUploadResult(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setUploadError('Please choose a CSV file to upload.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataCategory', uploadCategory);

    try {
      const res = await fetch('/api/v1/sensors/csv-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setUploadResult(data);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onRefresh();
      } else {
        setUploadError(data.error || 'Upload failed.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Network error.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'rules'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Detection Engine Rules ({rules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('csv')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'csv'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>CSV Telemetry Ingestion</span>
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'sources'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Data Sources & Sync Health ({dataSources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'audit'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ScrollText className="w-3.5 h-3.5" />
          <span>System Audit Trail</span>
        </button>
      </div>

      {/* Tab 1: Detection Engine Rules Tuning */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b pb-2">
              Configured Early-Warning Rules
            </h3>
            <div className="space-y-2">
              {rules.map(r => (
                <div
                  key={r.id}
                  onClick={() => handleSelectRule(r)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition space-y-1 ${
                    editingRule?.id === r.id
                      ? 'border-sky-500 bg-sky-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800">{r.ruleCode}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {r.isEnabled ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900">{r.ruleName}</div>
                  <div className="text-[11px] text-slate-500 truncate">{r.description}</div>
                </div>
              ))}
            </div>
          </div>

          {editingRule && (
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <span className="font-mono text-xs font-bold text-sky-800">{editingRule.ruleCode}</span>
                  <h4 className="font-bold text-slate-800 text-sm">{editingRule.ruleName}</h4>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={ruleEnabled}
                    onChange={e => setRuleEnabled(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-0"
                  />
                  <span>Enable Rule</span>
                </label>
              </div>

              {saveSuccess && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs">
                  ✓ Threshold parameters updated and hot-reloaded into live detection engine.
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed">
                <strong>Technical Basis:</strong> {editingRule.technicalBasis}
              </div>

              <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Threshold Configuration (JSON Format):
                  </label>
                  <textarea
                    rows={6}
                    value={configJson}
                    onChange={e => setConfigJson(e.target.value)}
                    className="w-full font-mono text-xs p-3 rounded-lg border border-slate-300 text-slate-800 bg-slate-900 text-sky-200 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
                >
                  <Save className="w-4 h-4" />
                  Save & Apply Thresholds
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: CSV Telemetry Ingestion */}
      {activeTab === 'csv' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-3xl mx-auto space-y-6">
          <div className="border-b pb-4">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <FileUp className="w-5 h-5 text-sky-600" />
              Batch CSV Telemetry File Ingestion
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Upload historical or batch telemetry exports from municipal SCADA or field data loggers. 
              The detection engine evaluates all imported rows in real time.
            </p>
          </div>

          {/* Sample Format Specification */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <span className="font-bold text-slate-800 block">Required CSV Header & Format:</span>
            <code className="block bg-slate-900 text-sky-300 p-2.5 rounded font-mono text-[11px]">
              sensor_id,value,unit,timestamp<br/>
              sensor-press-kor-01,0.42,bar,2026-10-30T07:15:00Z<br/>
              sensor-turb-kor-01,3.45,NTU,2026-10-30T07:15:00Z
            </code>
          </div>

          <form onSubmit={handleCSVUpload} className="space-y-4 text-xs">
            {uploadError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                ✕ {uploadError}
              </div>
            )}

            {uploadResult && (
              <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg space-y-1">
                <div className="font-bold">✓ File Processed: {uploadResult.filename}</div>
                <div>Rows Processed: {uploadResult.rowsProcessed} | Rows Inserted: {uploadResult.rowsInserted}</div>
                <div>Alerts Triggered: {uploadResult.alertsTriggered}</div>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Provenance Category</label>
              <select
                value={uploadCategory}
                onChange={e => setUploadCategory(e.target.value as any)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-800 bg-white"
              >
                <option value="DEMO">DEMONSTRATION DATA (Synthetic Batch)</option>
                <option value="REAL">REAL DATA (Verified Utility Logger)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Choose CSV File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="w-full p-2 rounded-lg border border-slate-300 text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
              />
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? 'Validating & Processing...' : 'Upload & Ingest CSV Telemetry'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Data Sources & Connection Health Monitor */}
      {activeTab === 'sources' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">External Data Source Connections & Status</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time connection monitoring, synchronization frequency, and stale data alerts.
              </p>
            </div>
            <button
              onClick={onRefresh}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dataSources.map(ds => {
              const lastSync = new Date(ds.lastSyncAt);
              return (
                <div key={ds.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">{ds.sourceName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      {ds.lastSyncStatus}
                    </span>
                  </div>

                  <div className="text-slate-600">
                    <strong>Organization:</strong> {ds.organization}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500 truncate">
                    Endpoint: {ds.endpointUrl || 'Internal Bus'}
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Sync Interval: Every {ds.syncFrequencyMins}m</span>
                    <span>Health: <strong>{ds.connectionHealth}%</strong></span>
                  </div>

                  <div className="text-[10px] text-slate-400">
                    Last Successful Sync: {lastSync.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: System Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              System Audit Trail & Security Logs
            </h3>
            <span className="text-[10px] text-slate-400">Showing last {auditLogs.length} events</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Timestamp</th>
                  <th className="p-2.5">User</th>
                  <th className="p-2.5">Role</th>
                  <th className="p-2.5">Action</th>
                  <th className="p-2.5">Entity</th>
                  <th className="p-2.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-2.5 font-medium text-slate-800">{log.userName}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-600">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="p-2.5 font-bold text-sky-800">{log.action}</td>
                    <td className="p-2.5 font-mono text-[11px] text-slate-600">{log.entityId}</td>
                    <td className="p-2.5 text-slate-500 text-[11px] max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

