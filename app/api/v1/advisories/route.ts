import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export async function GET() {
  try {
    const advisories = db.getPublicAdvisories();
    return NextResponse.json({
      success: true,
      data: advisories,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch advisories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titleEn, titleKn, contentEn, contentKn, advisoryType, affectedWards, issuedByOfficer, dataCategory } = body;

    if (!titleEn || !titleKn || !contentEn || !contentKn || !advisoryType) {
      return NextResponse.json(
        { success: false, error: 'Bilingual titles, contents, and advisoryType are required' },
        { status: 400 }
      );
    }

    const created = db.createPublicAdvisory({
      titleEn,
      titleKn,
      contentEn,
      contentKn,
      advisoryType,
      affectedWards: affectedWards || ['All Bengaluru Wards'],
      issuedByOfficer: issuedByOfficer || 'BWSSB & BBMP Joint Control',
      isActive: true,
      dataCategory: dataCategory || 'DEMO',
    });

    db.addAuditLog({
      userName: issuedByOfficer || 'Zonal Supervisor',
      userRole: 'ZONAL_SUPERVISOR',
      action: 'PUBLISH_ADVISORY',
      entityType: 'PUBLIC_ADVISORY',
      entityId: created.advisoryCode,
      details: { titleEn, advisoryType },
    });

    return NextResponse.json({
      success: true,
      message: 'Public advisory published',
      data: created,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create advisory' },
      { status: 500 }
    );
  }
}

