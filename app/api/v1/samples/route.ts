import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export async function GET() {
  try {
    const samples = db.getSamples();
    const labResults = db.getLabResults();
    return NextResponse.json({
      success: true,
      samples,
      labResults,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch sample records' },
      { status: 500 }
    );
  }
}

