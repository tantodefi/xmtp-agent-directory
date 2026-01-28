import { NextRequest, NextResponse } from 'next/server';
import { loadAgents } from '../../lib/loadAgents';

// Simple in-memory rate limiting
// Note: This resets on cold starts, but provides basic protection
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in ms

function getRateLimitInfo(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    // New window
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetIn: RATE_LIMIT_WINDOW };
  }
  
  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count, resetIn: record.resetTime - now };
}

// Clean up old entries periodically (every 100 requests)
let requestCount = 0;
function cleanupRateLimitMap() {
  requestCount++;
  if (requestCount % 100 === 0) {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(ip);
      }
    }
  }
}

/**
 * GET /api/agents
 * Public API endpoint that returns all agents from the directory
 * 
 * Rate limited: 60 requests per minute per IP
 * 
 * Response format:
 * {
 *   success: boolean,
 *   count: number,
 *   agents: Agent[]
 * }
 */
export async function GET(request: NextRequest) {
  // Get client IP for rate limiting
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  
  // Check rate limit
  cleanupRateLimitMap();
  const rateLimit = getRateLimitInfo(ip);
  
  // CORS and cache headers for public API
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    'X-RateLimit-Limit': RATE_LIMIT.toString(),
    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(rateLimit.resetIn / 1000).toString(),
  };
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests. Try again in ${Math.ceil(rateLimit.resetIn / 1000)} seconds.`
      },
      { status: 429, headers }
    );
  }

  try {
    const agents = await loadAgents();
    
    return NextResponse.json({
      success: true,
      count: agents.length,
      agents,
    }, { headers });
  } catch (error) {
    console.error('Error loading agents:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to load agents',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
