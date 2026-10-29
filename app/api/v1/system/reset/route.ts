import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export async function POST() {
  try {
    db.reset();
    return NextResponse.json({
      success: true,
      message: 'Database reset to initial verified demonstration state',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Reset failed' },
      { status: 500 }
    );
  }
}

