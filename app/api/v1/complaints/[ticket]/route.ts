import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export async function GET(
  request: NextRequest,
  { params }: { params: { ticket: string } }
) {
  try {
    const complaint = db.getComplaintByTicket(params.ticket);

    if (!complaint) {
      return NextResponse.json(
        { success: false, error: `Complaint with ticket number ${params.ticket} not found` },
        { status: 404 }
      );
    }

    // Public citizen response ensures complainant name & phone are sanitized
    return NextResponse.json({
      success: true,
      data: complaint,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error retrieving complaint status' },
      { status: 500 }
    );
  }
}

