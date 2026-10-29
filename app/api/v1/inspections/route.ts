import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const incidentId = searchParams.get('incidentId') || undefined;
    const inspections = db.getFieldInspections(incidentId);

    return NextResponse.json({
      success: true,
      count: inspections.length,
      data: inspections,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch field inspections' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { incidentId, inspectorName, findings, rootCause, actionTaken, photoUrl, followUpRequired } = body;

    if (!incidentId || !inspectorName || !findings || !rootCause || !actionTaken) {
      return NextResponse.json(
        { success: false, error: 'Validation Error: incidentId, inspectorName, findings, rootCause, and actionTaken are required' },
        { status: 400 }
      );
    }

    const inspection = db.addFieldInspection({
      incidentId,
      inspectorName,
      findings,
      rootCause,
      actionTaken,
      photoUrl,
      followUpRequired: Boolean(followUpRequired),
    });

    return NextResponse.json({
      success: true,
      message: 'Field inspection logged successfully',
      data: inspection,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record inspection' },
      { status: 500 }
    );
  }
}

