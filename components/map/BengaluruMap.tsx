'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GeographicArea, WaterAsset, Sensor, IncidentAlert, CitizenComplaint, PublicAdvisory } from '@/types';
import { SeverityBadge, DataCategoryBadge } from '../ui/Badge';

interface BengaluruMapProps {
  wards: GeographicArea[];
  assets: WaterAsset[];
  sensors: Sensor[];
  incidents: IncidentAlert[];
  complaints: CitizenComplaint[];
  advisories?: PublicAdvisory[];
  selectedWardId?: string;
  onSelectIncident?: (incident: IncidentAlert) => void;
  onSelectSensor?: (sensor: Sensor) => void;
}

export default function BengaluruMap({
  wards,
  assets,
  sensors,
  incidents,
  complaints,
  advisories = [],
  selectedWardId,
  onSelectIncident,
  onSelectSensor,
}: BengaluruMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<{ [key: string]: any }>({});

  const [layersVisibility, setLayersVisibility] = useState({
    assets: true,
    sensors: true,
    incidents: true,
    complaints: true,
    advisories: true,
  });

  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      const L = (await import('leaflet')).default;

      // Clean up existing instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Default Bengaluru Center
      const map = L.map(mapContainerRef.current!, {
        center: [12.9716, 77.5946],
        zoom: 12,
        scrollWheelZoom: true,
      });

      // OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Water Watch Bengaluru',
        maxZoom: 18,
      }).addTo(map);

      // Layer Groups
      const assetGroup = L.layerGroup().addTo(map);
      const sensorGroup = L.layerGroup().addTo(map);
      const incidentGroup = L.layerGroup().addTo(map);
      const complaintGroup = L.layerGroup().addTo(map);
      const advisoryGroup = L.layerGroup().addTo(map);

      layersRef.current = {
        L,
        map,
        assets: assetGroup,
        sensors: sensorGroup,
        incidents: incidentGroup,
        complaints: complaintGroup,
        advisories: advisoryGroup,
      };

      mapInstanceRef.current = map;
      if (isMounted) setMapReady(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Render Markers when data changes or map is ready
  useEffect(() => {
    if (!mapReady || !layersRef.current.map) return;

    const { L, map, assets: assetGroup, sensors: sensorGroup, incidents: incidentGroup, complaints: complaintGroup, advisories: advisoryGroup } = layersRef.current;

    // Clear existing layers
    assetGroup.clearLayers();
    sensorGroup.clearLayers();
    incidentGroup.clearLayers();
    complaintGroup.clearLayers();
    advisoryGroup.clearLayers();

    // 1. Assets Layer
    if (layersVisibility.assets) {
      assets.forEach(asset => {
        const icon = L.divIcon({
          className: 'custom-asset-icon',
          html: `<div style="background-color: #0284c7; width: 26px; height: 26px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); font-weight: bold; font-size: 11px;">🏛️</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const marker = L.marker([asset.latitude, asset.longitude], { icon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; min-width: 200px;">
            <div style="font-weight: bold; font-size: 13px; color: #0369a1; margin-bottom: 4px;">${asset.name}</div>
            <div><strong>Code:</strong> ${asset.assetCode}</div>
            <div><strong>Type:</strong> ${asset.assetType}</div>
            <div><strong>Capacity:</strong> ${asset.capacityLitres ? (asset.capacityLitres / 1000000).toFixed(1) + ' MLD' : 'N/A'}</div>
            <div style="margin-top: 6px; display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; background: #e0f2fe; color: #0369a1;">OPERATIONAL ASSET</div>
          </div>
        `);
        assetGroup.addLayer(marker);
      });
    }

    // 2. Sensors Layer
    if (layersVisibility.sensors) {
      sensors.forEach(sensor => {
        const ward = wards.find(w => w.id === sensor.wardId);
        const lat = ward ? ward.latitude + (Math.sin(sensor.sensorCode.charCodeAt(0)) * 0.008) : 12.9716;
        const lon = ward ? ward.longitude + (Math.cos(sensor.sensorCode.charCodeAt(1)) * 0.008) : 77.5946;

        let iconColor = '#10b981'; // Green
        if (sensor.status === 'DEGRADED') iconColor = '#f59e0b';
        if (sensor.status === 'OFFLINE') iconColor = '#ef4444';

        const icon = L.divIcon({
          className: 'custom-sensor-icon',
          html: `<div style="background-color: ${iconColor}; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.25); font-size: 10px;">📡</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker([lat, lon], { icon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; min-width: 220px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-weight: bold; color: #1e293b;">${sensor.sensorCode}</span>
              <span style="font-size: 10px; padding: 1px 5px; border-radius: 4px; background: #f3f4f6;">${sensor.dataCategory} DATA</span>
            </div>
            <div><strong>Type:</strong> ${sensor.sensorType}</div>
            <div><strong>Current Value:</strong> <span style="font-size: 13px; font-weight: bold; color: #0284c7;">${sensor.currentValue ?? '--'} ${sensor.unit}</span></div>
            <div><strong>Status:</strong> ${sensor.status}</div>
            <div><strong>Model:</strong> ${sensor.model}</div>
            <div style="margin-top: 6px; font-size: 10px; color: #64748b;">Calibrated: ${sensor.lastCalibratedAt.split('T')[0]}</div>
          </div>
        `);
        sensorGroup.addLayer(marker);
      });
    }

    // 3. Incidents Layer (Alerts)
    if (layersVisibility.incidents) {
      incidents.filter(i => i.status !== 'CLOSED').forEach(inc => {
        const ward = wards.find(w => w.id === inc.wardId);
        const lat = ward ? ward.latitude + 0.003 : 12.9716;
        const lon = ward ? ward.longitude - 0.003 : 77.5946;

        let pinBg = '#f97316';
        if (inc.severity === 'CRITICAL') pinBg = '#dc2626';
        if (inc.severity === 'MEDIUM') pinBg = '#eab308';

        const icon = L.divIcon({
          className: 'custom-alert-icon',
          html: `<div style="background-color: ${pinBg}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 3px solid white; box-shadow: 0 0 10px rgba(220,38,38,0.6); font-size: 14px; animation: pulse 1.5s infinite;">⚠️</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker([lat, lon], { icon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; min-width: 250px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-weight: bold; color: #dc2626; font-size: 11px;">[${inc.severity}] ${inc.incidentNumber}</span>
              <span style="font-size: 10px; background: #fee2e2; color: #991b1b; padding: 2px 4px; border-radius: 4px;">${inc.status}</span>
            </div>
            <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px; color: #0f172a;">${inc.title}</div>
            <div style="color: #475569; font-size: 11px; margin-bottom: 6px;">${inc.description}</div>
            <div style="font-size: 10px; background: #f8fafc; padding: 4px; border-radius: 4px; border: 1px solid #e2e8f0; margin-bottom: 6px;">
              <strong>Data Provenance:</strong> ${inc.dataCategory} (DEMO)<br/>
              <strong>Confidence:</strong> ${inc.confidenceLevel.replace(/_/g, ' ')}
            </div>
          </div>
        `);
        incidentGroup.addLayer(marker);
      });
    }

    // 4. Citizen Complaints Layer
    if (layersVisibility.complaints) {
      complaints.forEach(comp => {
        const isCluster = Boolean(comp.duplicateClusterId);
        const radius = isCluster ? 14 : 9;
        const color = comp.category === 'DIRTY_WATER' || comp.category === 'SEWAGE_MIXING' ? '#ef4444' : '#3b82f6';

        const circle = L.circleMarker([comp.latitude, comp.longitude], {
          radius,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        });

        circle.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; min-width: 220px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-weight: bold; color: #1e293b;">${comp.ticketNumber}</span>
              <span style="font-size: 10px; background: #fef3c7; color: #92400e; padding: 1px 5px; border-radius: 4px;">UNVERIFIED REPORT</span>
            </div>
            <div style="font-weight: bold; color: #0284c7; margin-bottom: 2px;">Category: ${comp.category.replace(/_/g, ' ')}</div>
            <div style="color: #334155; margin-bottom: 4px;">${comp.description}</div>
            <div style="font-size: 10px; color: #64748b;">Locality: ${comp.addressText}</div>
            <div style="font-size: 10px; color: #64748b;">Reported: ${new Date(comp.reportedAt).toLocaleTimeString()}</div>
            ${isCluster ? `<div style="margin-top: 4px; font-size: 10px; color: #b45309; font-weight: bold;">⚡ Part of localized complaint cluster</div>` : ''}
          </div>
        `);
        complaintGroup.addLayer(circle);
      });
    }

    // 5. Advisories Layer
    if (layersVisibility.advisories && advisories.length > 0) {
      advisories.filter(a => a.isActive).forEach(adv => {
        // Draw warning polygon / buffer near Koramangala
        const circle = L.circle([12.9352, 77.6245], {
          radius: 1200,
          color: '#e11d48',
          fillColor: '#fda4af',
          fillOpacity: 0.25,
          dashArray: '5, 10',
        });
        circle.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; min-width: 240px;">
            <div style="font-weight: bold; color: #e11d48; margin-bottom: 4px;">⚠️ ${adv.titleEn}</div>
            <div style="font-size: 11px; color: #334155; margin-bottom: 6px;">${adv.contentEn}</div>
            <div style="font-size: 10px; color: #475569; font-style: italic;">${adv.contentKn}</div>
            <div style="margin-top: 6px; font-size: 10px; background: #ffe4e6; padding: 2px 6px; border-radius: 4px; color: #9f1239;">
              Issued by: ${adv.issuedByOfficer}
            </div>
          </div>
        `);
        advisoryGroup.addLayer(circle);
      });
    }

    // Pan to selected ward if changed
    if (selectedWardId) {
      const ward = wards.find(w => w.id === selectedWardId);
      if (ward) {
        map.setView([ward.latitude, ward.longitude], 14, { animate: true });
      }
    }
  }, [mapReady, wards, assets, sensors, incidents, complaints, advisories, layersVisibility, selectedWardId]);

  return (
    <div className="relative w-full h-[540px] rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Control & Layer Toggle Overlay */}
      <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-md border border-slate-200 text-xs w-52 space-y-2">
        <div className="font-bold text-slate-800 flex items-center justify-between border-b pb-1">
          <span>Map Overlays</span>
          <span className="text-[10px] text-slate-500">Bengaluru GIS</span>
        </div>
        <div className="space-y-1.5 pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
            <input
              type="checkbox"
              checked={layersVisibility.incidents}
              onChange={e => setLayersVisibility({ ...layersVisibility, incidents: e.target.checked })}
              className="rounded text-red-600 focus:ring-0"
            />
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
            <span>Alerts & Incidents ({incidents.length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
            <input
              type="checkbox"
              checked={layersVisibility.sensors}
              onChange={e => setLayersVisibility({ ...layersVisibility, sensors: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-0"
            />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Telemetry Sensors ({sensors.length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
            <input
              type="checkbox"
              checked={layersVisibility.complaints}
              onChange={e => setLayersVisibility({ ...layersVisibility, complaints: e.target.checked })}
              className="rounded text-blue-600 focus:ring-0"
            />
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
            <span>Citizen Grievances ({complaints.length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
            <input
              type="checkbox"
              checked={layersVisibility.assets}
              onChange={e => setLayersVisibility({ ...layersVisibility, assets: e.target.checked })}
              className="rounded text-sky-600 focus:ring-0"
            />
            <span className="w-2.5 h-2.5 rounded bg-sky-600 inline-block text-[8px] text-white text-center leading-none">🏛️</span>
            <span>GLRs & Reservoirs ({assets.length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
            <input
              type="checkbox"
              checked={layersVisibility.advisories}
              onChange={e => setLayersVisibility({ ...layersVisibility, advisories: e.target.checked })}
              className="rounded text-rose-600 focus:ring-0"
            />
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span>
            <span>Active Advisories</span>
          </label>
        </div>

        {/* Data Provenance Notice */}
        <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500">
          <div className="flex items-center gap-1 font-semibold text-slate-700 mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
            <span>Data Provenance Policy:</span>
          </div>
          Sensor telemetry is simulated for demonstration. Grievances are marked UNVERIFIED until triaged.
        </div>
      </div>

      {/* Coordinates / Datum info badge bottom left */}
      <div className="absolute bottom-2 left-2 z-10 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded text-[11px] font-mono text-slate-600 border border-slate-200">
        Projection: WGS 84 (EPSG:4326) | Datum: Bengaluru Urban (BBMP)
      </div>
    </div>
  );
}

