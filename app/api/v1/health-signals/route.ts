import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export async function GET(request: NextRequest) {
  try {
    const signals = db.getHealthSignals();

    // Privacy safeguard: enforce k-anonymity (minimum report threshold >= 5 for public display)
    const sanitizedSignals = signals.map(sig => {
      if (sig.reportCount < 5) {
        return {
          ...sig,
          reportCount: '< 5 (Suppressed for Privacy)',
          symptomTypes: [{ symptom: 'RESTRICTED', count: 0 }],
          assessmentNotes: 'Data suppressed to prevent individual re-identification in compliance with health privacy policies.',
        };
      }
      return sig;
    });

    return NextResponse.json({
      success: true,
      disclaimer: 'DECISION-SUPPORT NOTICE: This module identifies epidemiological statistical patterns for authorized BBMP/IDSP assessment. It does NOT diagnose individuals or confirm waterborne outbreaks without clinical investigation.',
      data: sanitizedSignals,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch health signals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, reviewStatus, reviewedBy, assessmentNotes } = body;

    if (!id || !reviewStatus) {
      return NextResponse.json(
        { success: false, error: 'id and reviewStatus are required' },
        { status: 400 }
      );
    }

    const updated = db.updateHealthSignal(id, {
      reviewStatus,
      reviewedBy: reviewedBy || 'BBMP Surveillance Officer',
      reviewedAt: new Date().toISOString(),
      assessmentNotes,
    });

    db.addAuditLog({
      userName: reviewedBy || 'Public Health Officer',
      userRole: 'PUBLIC_HEALTH_OFFICER',
      action: 'EPIDEMIOLOGY_ASSESSMENT',
      entityType: 'HEALTH_SIGNAL',
      entityId: id,
      details: { reviewStatus, assessmentNotes },
    });

    return NextResponse.json({
      success: true,
      message: 'Health signal assessment updated',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update health signal' },
      { status: 500 }
    );
  }
}

