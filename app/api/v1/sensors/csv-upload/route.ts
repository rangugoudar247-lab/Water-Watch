import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const dataCategory = (formData.get('dataCategory') as string) || 'DEMO';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);

    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, error: 'CSV file must contain a header and at least one data row' },
        { status: 400 }
      );
    }

    // Expected Header: sensor_id,value,unit,timestamp
    const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const sensorIdx = header.indexOf('sensor_id');
    const valueIdx = header.indexOf('value');
    const unitIdx = header.indexOf('unit');
    const timeIdx = header.indexOf('timestamp');

    if (sensorIdx === -1 || valueIdx === -1) {
      return NextResponse.json(
        { success: false, error: 'Invalid CSV schema. Required columns: sensor_id, value. Optional: unit, timestamp' },
        { status: 400 }
      );
    }

    const inserted = [];
    const errors = [];
    let alertsGenerated = 0;

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length <= Math.max(sensorIdx, valueIdx)) continue;

      const sensorId = parts[sensorIdx];
      const val = parseFloat(parts[valueIdx]);
      const unit = unitIdx !== -1 ? parts[unitIdx] : undefined;
      const timestamp = timeIdx !== -1 && parts[timeIdx] ? parts[timeIdx] : new Date().toISOString();

      if (isNaN(val)) {
        errors.push({ row: i + 1, error: `Invalid numeric value: ${parts[valueIdx]}` });
        continue;
      }

      try {
        const res = db.addSensorReading({
          sensorId,
          value: val,
          unit,
          dataCategory: dataCategory as any,
          timestamp,
        });
        inserted.push(res.reading);
        alertsGenerated += res.triggeredAlerts.length;
      } catch (err: any) {
        errors.push({ row: i + 1, sensorId, error: err.message });
      }
    }

    db.addAuditLog({
      userName: 'Authorized Staff',
      userRole: 'WATER_ENGINEER',
      action: 'CSV_TELEMETRY_UPLOAD',
      entityType: 'SENSOR_READINGS',
      entityId: file.name,
      details: { totalRows: lines.length - 1, insertedCount: inserted.length, errorCount: errors.length },
    });

    return NextResponse.json({
      success: true,
      filename: file.name,
      rowsProcessed: lines.length - 1,
      rowsInserted: inserted.length,
      alertsTriggered: alertsGenerated,
      errors,
      sampleInserted: inserted.slice(0, 5),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'CSV processing failed' },
      { status: 500 }
    );
  }
}

