import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { IncidentStatus } from '@/types';

const VALID_STATUSES: IncidentStatus[] = [
  'NEW',
  'TRIAGED',
  'ASSIGNED',
  'ACKNOWLEDGED',
  'FIELD_INSPECTION',
  'ACTION_IN_PROGRESS',
  'RESOLVED',
  'VERIFIED',
  'CLOSED',
  'REOPENED',
];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, changedBy, notes } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const updated = db.updateIncidentStatus(
      params.id,
      status,
      changedBy || 'Authorized Officer',
      notes
    );

    return NextResponse.json({
      success: true,
      message: `Incident status updated to ${status}`,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update incident status' },
      { status: 500 }
    );
  }
}

