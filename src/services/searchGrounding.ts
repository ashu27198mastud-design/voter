export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

export interface SearchLocation {
  city: string;
  state: string;
  country: string;
}

/**
 * server-side only search grounding service
 * uses Google Custom Search JSON API
 */
export async function searchElectionSources(
  query: string, 
  location?: SearchLocation
): Promise<SearchResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !engineId) {
    console.warn('Search Grounding: Missing API keys');
    return [];
  }

  // Optimize query with location context if available
  const context = location?.city ? ` ${location.city}` : '';
  const searchTerms = `${query}${context}`;

  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.append('key', apiKey);
  url.searchParams.append('cx', engineId);
  url.searchParams.append('q', searchTerms);
  url.searchParams.append('num', '5'); // Limit to top 5 results

  try {
    const response = await fetch(url.toString(), {
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = typeof response.text === 'function' ? await response.text() : 'API Error';
      console.error('Search Grounding: API error', errorText);
      return [];
    }

    const data = await response.json();
    if (!data.items || !Array.isArray(data.items)) {
      return [];
    }

    return data.items.map((item: { title: string; link: string; snippet: string; displayLink: string }) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      displayLink: item.displayLink,
    }));
  } catch (error) {
    console.error('Search Grounding: Network error', error);
    return [];
  }
}
