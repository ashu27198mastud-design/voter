import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    civicConfigured: Boolean(process.env.CIVIC_API_KEY),
    mapsConfigured: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY),
    searchConfigured: Boolean(process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID),
    firebaseConfigured: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY)
  });
}
