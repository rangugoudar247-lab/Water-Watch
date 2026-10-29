'use client';

import React, { useState } from 'react';
import { UserRole, NotificationItem } from '@/types';
import { Bell, Droplets, Shield, Languages, RefreshCw, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  language: 'en' | 'kn';
  onToggleLanguage: () => void;
  notifications: NotificationItem[];
  onOpenSimulator: () => void;
}

export default function Header({
  currentRole,
  onSelectRole,
  language,
  onToggleLanguage,
  notifications,
  onOpenSimulator,
}: HeaderProps) {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const roleLabels: Record<UserRole, { en: string; kn: string; icon: string }> = {
    CITIZEN: { en: 'Citizen Portal', kn: 'ನಾಗರಿಕ ದೂರು ಪೋರ್ಟಲ್', icon: '👤' },
    WATER_ENGINEER: { en: 'BWSSB Water Engineer', kn: 'BWSSB ನೀರು ಎಂಜಿನಿಯರ್', icon: '🔧' },
    WATER_QUALITY_OFFICER: { en: 'Water Quality & Lab Officer', kn: 'ಗುಣಮಟ್ಟ & ಲ್ಯಾಬ್ ಅಧಿಕಾರಿ', icon: '🔬' },
    ZONAL_SUPERVISOR: { en: 'Zonal Supervisor / Control Room', kn: 'ವಲಯ ನಿಯಂತ್ರಣ ಕೊಠಡಿ', icon: '🏢' },
    PUBLIC_HEALTH_OFFICER: { en: 'Public Health Officer (BBMP)', kn: 'ಸಾರ್ವಜನಿಕ ಆರೋಗ್ಯ ಅಧಿಕಾರಿ', icon: '🩺' },
    ADMIN: { en: 'System Administrator', kn: 'ವ್ಯವಸ್ಥಾಪಕರು (Admin)', icon: '⚙️' },
    LEADERSHIP: { en: 'Government Leadership', kn: 'ಸರ್ಕಾರಿ ಆಡಳಿತ ಮಂಡಳಿ', icon: '🏛️' },
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-sky-100 to-sky-300 bg-clip-text text-transparent">
                  WATER WATCH BENGALURU
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/80">
                  PILOT v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {language === 'kn' ? 'ಸ್ಮಾರ್ಟ್ ನೀರು ಮೇಲ್ವಿಚಾರಣೆ ಮತ್ತು ಸಾರ್ವಜನಿಕ ದೂರು ನಿರ್ವಹಣಾ ವೇದಿಕೆ' : 'Smart Water Telemetry, Early-Warning & Citizen Grievance Platform'}
              </p>
            </div>
          </div>

          {/* Right Controls: Role Switcher, Simulator, Language, Notifications */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Quick Simulator Trigger Button */}
            <button
              onClick={onOpenSimulator}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-sm transition-all"
              title="Open Anomaly & Sensor Simulator"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Simulator</span>
            </button>

            {/* Language Toggle */}
            <button
              onClick={onToggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Toggle Language"
            >
              <Languages className="w-3.5 h-3.5 text-sky-400" />
              <span>{language === 'kn' ? 'ಕನ್ನಡ' : 'English'}</span>
            </button>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <select
                value={currentRole}
                onChange={e => onSelectRole(e.target.value as UserRole)}
                className="bg-slate-800 text-xs text-sky-200 font-medium pl-3 pr-8 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer appearance-none"
              >
                {Object.entries(roleLabels).map(([role, label]) => (
                  <option key={role} value={role} className="bg-slate-900 text-white">
                    {label.icon} {language === 'kn' ? label.kn : label.en}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400 text-xs">
                ▼
              </div>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer Popover */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-sky-400" />
                      <span className="font-bold text-xs uppercase tracking-wider">Alert Notifications</span>
                    </div>
                    <span className="text-[10px] bg-sky-950 text-sky-300 px-2 py-0.5 rounded-full border border-sky-800">
                      {notifications.length} Total
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">No active notifications</div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className={`p-3 text-xs hover:bg-slate-50 transition ${!notif.isRead ? 'bg-sky-50/50' : ''}`}>
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                              {new Date(notif.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] leading-relaxed">{notif.message}</p>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                            <span>Channel: {notif.channel}</span>
                            <span className="font-mono">{notif.deliveryStatus}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
