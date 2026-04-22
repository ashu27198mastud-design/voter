import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.2.0',
    services: {
      ai: 'operational',
      civic: 'operational'
    }
  });
}
