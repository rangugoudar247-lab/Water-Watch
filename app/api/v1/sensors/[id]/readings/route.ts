import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const sensor = db.getSensorById(params.id);
    if (!sensor) {
      return NextResponse.json(
        { success: false, error: 'Sensor not found' },
        { status: 404 }
      );
    }

    const readings = db.getSensorReadings(sensor.id, limit);

    return NextResponse.json({
      success: true,
      sensor,
      count: readings.length,
      data: readings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch sensor readings' },
      { status: 500 }
    );
  }
}

