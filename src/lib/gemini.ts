import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_SYSTEM_PROMPT } from '../config/aiPrompt';
import { UserLocation } from './validation';
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
 * Asks the Gemini model an election-related question, adhering to system rules.
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

  if (!apiKey) {
      return sanitizeHtml("AI service is currently unavailable. Please check the API key configuration.");
  }

  try {
    // We use gemini-1.5-flash for faster responses
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        systemInstruction: AI_SYSTEM_PROMPT
    });
    
    const locationContext = location 
        ? `User location: ${location.city}, ${location.state}, ${location.country}. Format answers in plain language or structured list.`
        : "User location: Unknown. Format answers in plain language or structured list.";

    const prompt = `
      ${locationContext}
      User question: ${query}
      
      Provide a factual, nonpartisan answer about the election PROCESS only (registration, deadlines, ID requirements).
      DO NOT discuss candidates, parties, or political positions.
      Keep response under 300 words.
    `;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Sanitize before returning (RULE 3 - OUTPUT SANITIZATION)
    const safeResponse = sanitizeHtml(responseText);

    // Cache the result
    responseCache.set(cacheKey, { response: safeResponse, timestamp: Date.now() });
    
    return safeResponse;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return sanitizeHtml("I encountered an error while trying to answer your question. Please try again later.");
  }
}
