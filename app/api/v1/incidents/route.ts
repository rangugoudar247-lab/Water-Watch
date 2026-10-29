import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const severity = searchParams.get('severity') || undefined;
    const wardId = searchParams.get('wardId') || undefined;

    const incidents = db.getIncidents({ status, severity, wardId });

    return NextResponse.json({
      success: true,
      count: incidents.length,
      data: incidents,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}

