import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export async function GET() {
  try {
    const rules = db.getRules();
    return NextResponse.json({
      success: true,
      count: rules.length,
      data: rules,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isEnabled, thresholdConfig } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Rule id is required' }, { status: 400 });
    }

    const updated = db.updateRule(id, { isEnabled, thresholdConfig });

    db.addAuditLog({
      userName: 'Administrator',
      userRole: 'ADMIN',
      action: 'UPDATE_DETECTION_RULE',
      entityType: 'DETECTION_RULE',
      entityId: updated.ruleCode,
      details: { isEnabled, thresholdConfig },
    });

    return NextResponse.json({
      success: true,
      message: 'Detection rule updated successfully',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update rule' },
      { status: 500 }
    );
  }
}

