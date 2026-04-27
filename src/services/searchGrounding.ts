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

  // Optimize query with location context and official source intent
  let intentContext = '';
  if (location) {
    const { country, city, state } = location;
    if (country === 'IN' || country === 'India' || country === 'Bharat') {
      intentContext = ` Election Commission of India CEO ${state} voter registration EPIC electoral roll official`;
    } else if (country === 'AU' || country === 'Australia') {
      intentContext = ' Australian Electoral Commission AEC enrolment polling place postal voting official';
    } else if (country === 'GB' || country === 'UK' || country === 'United Kingdom') {
      intentContext = ' gov.uk electoral registration polling station photo ID official';
    } else if (country === 'US' || country === 'United States') {
      intentContext = ' vote.gov state election office polling place voter registration absentee official';
    } else if (country === 'CA' || country === 'Canada') {
      intentContext = ' Elections Canada voter registration polling station ID official';
    } else {
      intentContext = ` ${city} ${state} official election authority registration polling`;
    }
  }

  const searchTerms = `${query}${intentContext}`.substring(0, 200);

  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.append('key', apiKey);
  url.searchParams.append('cx', engineId);
  url.searchParams.append('q', searchTerms);
  url.searchParams.append('num', '5');

  try {
    const response = await fetch(url.toString(), {
      cache: 'no-store'
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    if (!data.items || !Array.isArray(data.items)) {
      return [];
    }

    const officialDomains = [
      '.gov', '.gov.in', '.gov.au', '.gov.uk', '.gc.ca', 
      'eci.gov.in', 'aec.gov.au', 'elections.ca', 'vote.gov'
    ];

    return data.items
      .map((item: { title?: string; link?: string; snippet?: string; displayLink?: string }) => ({
        title: item.title?.replace(/<[^>]*>?/gm, '') || '',
        link: item.link || '',
        snippet: item.snippet?.replace(/<[^>]*>?/gm, '') || '',
        displayLink: item.displayLink || '',
      }))
      // Filter out political campaign domains or obviously biased results
      .filter((item: SearchResult) => {
        if (!item.link) return false;
        const linkUrl = item.link.toLowerCase();
        const isCampaign = /campaign|donate|candidate|party|republican|democrat|labor|liberal/i.test(linkUrl);
        return !isCampaign;
      })
      // Prioritize official domains
      .sort((a: SearchResult, b: SearchResult) => {
        const aOfficial = officialDomains.some(d => a.link.includes(d)) ? 1 : 0;
        const bOfficial = officialDomains.some(d => b.link.includes(d)) ? 1 : 0;
        return bOfficial - aOfficial;
      });
  } catch {
    return [];
  }
}
