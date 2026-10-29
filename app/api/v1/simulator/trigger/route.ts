import { NextRequest, NextResponse } from 'next/server';
import { runSimulationScenario, SimulationScenario } from '@/lib/engine/simulator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const scenario: SimulationScenario = body.scenario || 'PRESSURE_DROP_BACK_SIPHONAGE';

    const result = runSimulationScenario(scenario);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Simulation execution failed' },
      { status: 500 }
    );
  }
}

