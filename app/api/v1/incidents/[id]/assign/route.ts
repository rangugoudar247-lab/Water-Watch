import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { assignedUserId, assignedDepartmentId, changedBy, notes } = body;

    if (!assignedUserId || !assignedDepartmentId) {
      return NextResponse.json(
        { success: false, error: 'assignedUserId and assignedDepartmentId are required' },
        { status: 400 }
      );
    }

    const updated = db.assignIncident(
      params.id,
      assignedUserId,
      assignedDepartmentId,
      changedBy || 'Zonal Supervisor',
      notes
    );

    return NextResponse.json({
      success: true,
      message: 'Incident assigned successfully',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to assign incident' },
      { status: 500 }
    );
  }
}

