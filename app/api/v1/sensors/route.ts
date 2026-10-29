import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wardId = searchParams.get('wardId') || undefined;
    const sensorType = searchParams.get('sensorType') || undefined;
    const status = searchParams.get('status') || undefined;

    const sensors = db.getSensors({ wardId, sensorType, status });
    return NextResponse.json({
      success: true,
      count: sensors.length,
      data: sensors,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch sensors' },
      { status: 500 }
    );
  }
}

