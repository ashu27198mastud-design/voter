import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');
  const type = searchParams.get('type') || 'voterinfo'; // 'voterinfo' or 'representatives'

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  const apiKey = process.env.CIVIC_API_KEY || process.env.NEXT_PUBLIC_CIVIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Civic API key missing' }, { status: 503 });
  }

  const endpoint = type === 'representatives' 
    ? 'https://www.googleapis.com/civicinfo/v2/representatives'
    : 'https://www.googleapis.com/civicinfo/v2/voterinfo';

  const url = `${endpoint}?address=${encodeURIComponent(address)}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
        return NextResponse.json({ error: 'Civic API error' }, { status: response.status });
    }
    const data = await response.json();
    
    const { logger } = await import('@/lib/logger');
    logger.info('Civic API Fetch Successful', { address, type });

    return NextResponse.json(data);
  } catch (error: any) {
    const { logger } = await import('@/lib/logger');
    logger.error('Civic API Proxy Error', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
