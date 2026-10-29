import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export async function GET() {
  try {
    const sources = db.getDataSources();
    const now = Date.now();

    // Check for stale data warnings
    const enrichedSources = sources.map(source => {
      const lastSyncMs = new Date(source.lastSyncAt).getTime();
      const diffHours = (now - lastSyncMs) / (1000 * 60 * 60);
      const isStale = diffHours > source.staleThresholdHours;

      return {
        ...source,
        isStale,
        diffHours: parseFloat(diffHours.toFixed(1)),
        warning: isStale ? `Telemetry is stale. Exceeded ${source.staleThresholdHours}h threshold.` : null,
      };
    });

    return NextResponse.json({
      success: true,
      count: enrichedSources.length,
      data: enrichedSources,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch data sources' },
      { status: 500 }
    );
  }
}

