import { NextResponse } from 'next/server';
import { loadAgents } from '../../lib/loadAgents';

/**
 * GET /api/agents
 * Returns all agents from the data directory
 * In dev mode (DEV_MODE=true), returns example agents
 * In production, returns individual agent JSON files
 */
export async function GET() {
  try {
    const agents = await loadAgents();
    
    return NextResponse.json({
      success: true,
      count: agents.length,
      devMode: process.env.DEV_MODE === 'true',
      agents,
    });
  } catch (error) {
    console.error('Error loading agents:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to load agents',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
