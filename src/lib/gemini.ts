import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_SYSTEM_PROMPT } from '../config/aiPrompt';
import { UserLocation } from '../types';
import { sanitizeHtml } from './security';

// Initialize the Gemini API client
// It will look for GEMINI_API_KEY in the environment
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn("Gemini API key is not set. Ensure GEMINI_API_KEY is in your environment.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

// Simple cache for AI responses: Map<queryHash, response>
const responseCache = new Map<string, { response: string, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache

/**
 * Asks the VotePath Assistant (via server-side proxy) an election-related question.
 * 
 * @param query The user's question.
 * @param location The user's validated location.
 * @returns The generated response, sanitized.
 */
export async function askElectionQuestion(
  query: string,
  location?: UserLocation
): Promise<string> {
  // Check cache first
  const cacheKey = JSON.stringify({ query, location });
  const cached = responseCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return cached.response;
  }

  try {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, location })
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const safeResponse = data.response;

    // Cache the result
    responseCache.set(cacheKey, { response: safeResponse, timestamp: Date.now() });
    
    return safeResponse;
  } catch (error) {
    console.error("Error calling Chat API:", error);
    return "I encountered an error while trying to answer your question. Please try again later.";
  }
}
