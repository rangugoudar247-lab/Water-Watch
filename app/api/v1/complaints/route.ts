import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wardId = searchParams.get('wardId') || undefined;
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const query = searchParams.get('query') || undefined;

    const complaints = db.getComplaints({ wardId, category, status, query });

    return NextResponse.json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch complaints' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      category,
      wardId,
      addressText,
      latitude,
      longitude,
      description,
      language,
      complainantName,
      complainantPhone,
      consentGiven,
      photoUrl,
      symptomsReported,
    } = body;

    // Validation
    if (!category || !wardId || !addressText || !description) {
      return NextResponse.json(
        { success: false, error: 'Validation Error: category, wardId, addressText, and description are required' },
        { status: 400 }
      );
    }

    if (consentGiven !== true) {
      return NextResponse.json(
        { success: false, error: 'Validation Error: Privacy consent must be accepted to submit a complaint' },
        { status: 400 }
      );
    }

    // Default coords to ward center if coordinates not provided by user
    const ward = db.getWards().find(w => w.id === wardId);
    const finalLat = typeof latitude === 'number' && !isNaN(latitude) ? latitude : (ward?.latitude ?? 12.9716);
    const finalLon = typeof longitude === 'number' && !isNaN(longitude) ? longitude : (ward?.longitude ?? 77.5946);

    const result = db.createComplaint({
      category,
      wardId,
      addressText,
      latitude: finalLat,
      longitude: finalLon,
      description,
      language: language || 'en',
      complainantName,
      complainantPhone,
      consentGiven: true,
      photoUrl,
      symptomsReported,
    });

    return NextResponse.json({
      success: true,
      message: 'Complaint submitted successfully',
      ticketNumber: result.complaint.ticketNumber,
      clusterDetected: result.clusterFound,
      alertTriggered: result.alertTriggered,
      data: result.complaint,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit complaint' },
      { status: 500 }
    );
  }
}

