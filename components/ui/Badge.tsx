import React from 'react';
import { DataCategory, Severity, IncidentStatus } from '@/types';

export function DataCategoryBadge({ category }: { category: DataCategory }) {
  switch (category) {
    case 'REAL':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
          REAL DATA (VERIFIED)
        </span>
      );
    case 'DEMO':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
          DEMONSTRATION DATA (SYNTHETIC)
        </span>
      );
    case 'PUBLIC':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
          PUBLIC DATA (OFFICIAL REPORT)
        </span>
      );
    case 'UNVERIFIED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          UNVERIFIED CITIZEN REPORT
        </span>
      );
    default:
      return null;
  }
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  switch (severity) {
    case 'CRITICAL':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-300">
          CRITICAL
        </span>
      );
    case 'HIGH':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
          HIGH
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          MEDIUM
        </span>
      );
    case 'LOW':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
          LOW
        </span>
      );
    case 'INFO':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
          INFO
        </span>
      );
  }
}

export function StatusBadge({ status }: { status: IncidentStatus }) {
  const map: Record<IncidentStatus, { label: string; bg: string; text: string }> = {
    NEW: { label: 'NEW', bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
    TRIAGED: { label: 'TRIAGED', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
    ASSIGNED: { label: 'ASSIGNED', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
    ACKNOWLEDGED: { label: 'ACKNOWLEDGED', bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' },
    FIELD_INSPECTION: { label: 'FIELD INSPECTION', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
    ACTION_IN_PROGRESS: { label: 'ACTION IN PROGRESS', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
    RESOLVED: { label: 'RESOLVED', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
    VERIFIED: { label: 'VERIFIED', bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700' },
    CLOSED: { label: 'CLOSED', bg: 'bg-gray-100 border-gray-300', text: 'text-gray-700' },
    REOPENED: { label: 'REOPENED', bg: 'bg-rose-100 border-rose-300', text: 'text-rose-800' },
  };

  const item = map[status] || { label: status, bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${item.bg} ${item.text}`}>
      {item.label}
    </span>
  );
}

