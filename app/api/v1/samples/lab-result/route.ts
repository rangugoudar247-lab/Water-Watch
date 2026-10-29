import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sampleId,
      labName,
      testedByOfficer,
      phValue,
      turbidityNtu,
      freeChlorineMgL,
      totalColiformCfu100ml,
      eColiCfu100ml,
      tdsMgL,
      nitratesMgL,
      fluoridesMgL,
      certifiedBySignature,
      dataCategory,
    } = body;

    if (!sampleId || !labName || !testedByOfficer || !certifiedBySignature) {
      return NextResponse.json(
        { success: false, error: 'Validation Error: sampleId, labName, testedByOfficer, and certifiedBySignature are required' },
        { status: 400 }
      );
    }

    if (
      typeof phValue !== 'number' ||
      typeof turbidityNtu !== 'number' ||
      typeof freeChlorineMgL !== 'number' ||
      typeof eColiCfu100ml !== 'number'
    ) {
      return NextResponse.json(
        { success: false, error: 'Validation Error: numeric measurements required for pH, turbidity, chlorine, and E. coli' },
        { status: 400 }
      );
    }

    const result = db.addLabResult({
      sampleId,
      labName,
      testedByOfficer,
      phValue,
      turbidityNtu,
      freeChlorineMgL,
      totalColiformCfu100ml: totalColiformCfu100ml || 0,
      eColiCfu100ml,
      tdsMgL: tdsMgL || 250,
      nitratesMgL,
      fluoridesMgL,
      certifiedBySignature,
      dataCategory: dataCategory || 'DEMO',
    });

    return NextResponse.json({
      success: true,
      message: 'Laboratory test result certified successfully',
      data: result,
      meetsIs10500: result.meetsIs10500,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit laboratory result' },
      { status: 500 }
    );
  }
}

