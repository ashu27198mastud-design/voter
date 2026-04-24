/**
 * Search Grounding Service
 * Provides official election-process information via Google Custom Search JSON API.
 */

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink?: string;
}

/**
 * Enhanced query with election-process intent for better grounding.
 */
function buildElectionQuery(query: string, location?: { city?: string; state?: string; country?: string }): string {
  const parts = [query];
  
  if (location) {
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    if (location.country) parts.push(location.country);
  }
  
  // Add authority keywords based on common terminology
  parts.push("official election authority voter registration polling place registration deadline");
  
  return parts.join(" ");
}

/**
 * Calls Google Custom Search API to retrieve official election data.
 * Runs strictly server-side.
 */
export async function searchElectionSources(
  query: string, 
  location?: { city?: string; state?: string; country?: string }
): Promise<SearchResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    console.warn("Search grounding skipped: Missing GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_ENGINE_ID");
    return [];
  }

  const enhancedQuery = buildElectionQuery(query, location);
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.append("key", apiKey);
  url.searchParams.append("cx", searchEngineId);
  url.searchParams.append("q", enhancedQuery);
  url.searchParams.append("num", "5"); // Limit to top 5 results for speed and token efficiency

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.items) return [];

    return (data.items as Array<{ title: string; link: string; snippet: string; displayLink?: string }>).map((item) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      displayLink: item.displayLink
    }));
  } catch (error) {
    console.error("Search grounding failed:", error);
    return [];
  }
}
