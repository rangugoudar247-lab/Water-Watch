'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
} from 'recharts';
import { Sensor, SensorReading } from '@/types';
import { DataCategoryBadge } from '../ui/Badge';

interface TelemetryChartsProps {
  sensor: Sensor;
  readings: SensorReading[];
}

export default function TelemetryCharts({ sensor, readings }: TelemetryChartsProps) {
  const chartData = readings.map(r => {
    const d = new Date(r.timestamp);
    const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    return {
      time: timeStr,
      fullTime: d.toLocaleString(),
      value: r.value,
      anomaly: r.anomalyFlag,
      validation: r.validationStatus,
    };
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 text-base">{sensor.sensorCode} Telemetry Hydrograph</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-600">
              {sensor.sensorType}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Model: {sensor.model} | Sampling Rate: {sensor.samplingIntervalSec}s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataCategoryBadge category={sensor.dataCategory} />
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Current Reading</span>
            <span className="text-lg font-bold text-sky-700 font-mono">
              {sensor.currentValue ?? '--'} {sensor.unit}
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            No readings recorded for this sensor.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {sensor.sensorType === 'FLOW' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis unit={` ${sensor.unit}`} tick={{ fontSize: 11, fill: '#64748b' }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  labelFormatter={(l, items) => items[0]?.payload?.fullTime || l}
                />
                <Area type="monotone" dataKey="value" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#flowGrad)" />
              </AreaChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis unit={` ${sensor.unit}`} tick={{ fontSize: 11, fill: '#64748b' }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  labelFormatter={(l, items) => items[0]?.payload?.fullTime || l}
                />

                {/* Statutory Reference Thresholds */}
                {sensor.sensorType === 'PRESSURE' && (
                  <ReferenceLine
                    y={0.5}
                    label={{ value: 'Min Pressure: 0.5 bar (CPHEEO)', fill: '#ef4444', fontSize: 10, position: 'insideBottomRight' }}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                  />
                )}
                {sensor.sensorType === 'TURBIDITY' && (
                  <>
                    <ReferenceLine
                      y={1.0}
                      label={{ value: 'IS 10500 Acceptable: 1.0 NTU', fill: '#059669', fontSize: 10, position: 'insideBottomRight' }}
                      stroke="#059669"
                      strokeDasharray="3 3"
                    />
                    <ReferenceLine
                      y={5.0}
                      label={{ value: 'IS 10500 Permissible: 5.0 NTU', fill: '#dc2626', fontSize: 10, position: 'insideTopRight' }}
                      stroke="#dc2626"
                      strokeDasharray="4 4"
                    />
                  </>
                )}
                {sensor.sensorType === 'CHLORINE' && (
                  <ReferenceLine
                    y={0.2}
                    label={{ value: 'Statutory Min: 0.20 mg/L', fill: '#dc2626', fontSize: 10, position: 'insideBottomRight' }}
                    stroke="#dc2626"
                    strokeDasharray="4 4"
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={sensor.sensorType === 'TURBIDITY' ? '#d97706' : sensor.sensorType === 'CHLORINE' ? '#0891b2' : '#0284c7'}
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Engineering notes footer */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
        <span>
          <strong>Baseline Analysis:</strong> 24-Hour Rolling Exponential Moving Average (EWMA) applied with 3.5σ outlier gate.
        </span>
        <span className="text-slate-400">
          Last Sync: {new Date(sensor.lastSeenAt).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

