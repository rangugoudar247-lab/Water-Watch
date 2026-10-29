import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sensorId, value, unit, dataCategory, timestamp } = body;

    if (!sensorId) {
      return NextResponse.json(
        { success: false, error: 'Validation Error: sensorId is required' },
        { status: 400 }
      );
    }

    if (value === undefined || typeof value !== 'number' || isNaN(value)) {
      return NextResponse.json(
        { success: false, error: 'Validation Error: numeric value is required' },
        { status: 400 }
      );
    }

    const result = db.addSensorReading({
      sensorId,
      value,
      unit,
      dataCategory: dataCategory || 'DEMO',
      timestamp,
    });

    return NextResponse.json({
      success: true,
      message: 'Sensor reading ingested successfully',
      data: result.reading,
      triggeredAlerts: result.triggeredAlerts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Ingestion failed' },
      { status: 500 }
    );
  }
}

