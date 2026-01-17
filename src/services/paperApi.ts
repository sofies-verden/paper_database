/**
 * Paper Metadata API Service
 * Integrates Semantic Scholar, OpenAlex, and Crossref APIs
 */

import type { Paper, Journal } from '../types';

// API Response types
export interface SemanticScholarResponse {
  paperId?: string;
  title?: string;
  year?: number;
  citationCount?: number;
  influentialCitationCount?: number;
  venue?: string;
  authors?: Array<{ name: string }>;
}

export interface OpenAlexResponse {
  id?: string;
  title?: string;
  cited_by_count?: number;
  counts_by_year?: Array<{ year: number; cited_by_count: number }>;
  primary_location?: {
    source?: {
      display_name?: string;
      issn_l?: string;
      host_organization_name?: string;
      summary_stats?: {
        h_index?: number;
        '2yr_mean_citedness'?: number;
      };
    };
  };
  authorships?: Array<{
    author?: {
      display_name?: string;
      summary_stats?: {
        h_index?: number;
      };
    };
  }>;
}

export interface EnrichmentResult {
  success: boolean;
  source?: 'semantic_scholar' | 'openalex' | 'crossref';
  data?: Partial<Paper>;
  error?: string;
}

// Configuration
const CONFIG = {
  semanticScholar: {
    baseUrl: 'https://api.semanticscholar.org/graph/v1/paper',
    rateLimit: 100, // per 5 minutes
    rateLimitWindow: 5 * 60 * 1000,
  },
  openAlex: {
    baseUrl: 'https://api.openalex.org/works',
    rateLimit: 100000, // per day
  },
  retryAttempts: 3,
  retryDelay: 1000,
  batchSize: 10,
  batchDelay: 1000, // delay between batches
};

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for API calls
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  attempts: number = CONFIG.retryAttempts,
  delay: number = CONFIG.retryDelay
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on 404 (not found)
      if (error instanceof Error && error.message.includes('404')) {
        throw error;
      }

      // Rate limit - wait longer
      if (error instanceof Error && error.message.includes('429')) {
        await sleep(delay * (i + 1) * 5);
        continue;
      }

      if (i < attempts - 1) {
        await sleep(delay * (i + 1));
      }
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Get data from Semantic Scholar API
 */
export async function getSemanticScholarData(
  identifier: string,
  type: 'doi' | 'arxiv' | 'title' = 'doi'
): Promise<SemanticScholarResponse | null> {
  let url: string;

  switch (type) {
    case 'doi':
      url = `${CONFIG.semanticScholar.baseUrl}/DOI:${encodeURIComponent(identifier)}`;
      break;
    case 'arxiv':
      url = `${CONFIG.semanticScholar.baseUrl}/arXiv:${encodeURIComponent(identifier)}`;
      break;
    case 'title':
      url = `${CONFIG.semanticScholar.baseUrl}/search?query=${encodeURIComponent(identifier)}&limit=1`;
      break;
  }

  url += type !== 'title'
    ? '?fields=paperId,title,year,citationCount,influentialCitationCount,venue,authors'
    : '&fields=paperId,title,year,citationCount,influentialCitationCount,venue,authors';

  try {
    const response = await withRetry(async () => {
      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        throw new Error(`Semantic Scholar API error: ${res.status}`);
      }
      return res;
    });

    const data = await response.json();

    // Handle search results
    if (type === 'title' && data.data && data.data.length > 0) {
      return data.data[0];
    }

    return data;
  } catch (error) {
    // Silently fail - will try other APIs
    return null;
  }
}

/**
 * Get data from OpenAlex API
 */
export async function getOpenAlexData(
  identifier: string,
  type: 'doi' | 'title' = 'doi',
  email?: string
): Promise<OpenAlexResponse | null> {
  let url: string;

  if (type === 'doi') {
    url = `${CONFIG.openAlex.baseUrl}/doi:${encodeURIComponent(identifier)}`;
  } else {
    url = `${CONFIG.openAlex.baseUrl}?filter=title.search:${encodeURIComponent(identifier)}&per_page=1`;
  }

  // Add email for polite pool (higher rate limits)
  if (email) {
    url += url.includes('?') ? '&' : '?';
    url += `mailto=${encodeURIComponent(email)}`;
  }

  try {
    const response = await withRetry(async () => {
      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        throw new Error(`OpenAlex API error: ${res.status}`);
      }
      return res;
    });

    const data = await response.json();

    // Handle search results
    if (type === 'title' && data.results && data.results.length > 0) {
      return data.results[0];
    }

    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Convert API responses to Paper metadata
 */
function mergeApiResponses(
  semanticScholar: SemanticScholarResponse | null,
  openAlex: OpenAlexResponse | null
): Partial<Paper> {
  const result: Partial<Paper> = {};

  // Citation counts - prefer Semantic Scholar
  if (semanticScholar?.citationCount !== undefined) {
    result.citationCount = semanticScholar.citationCount;
  } else if (openAlex?.cited_by_count !== undefined) {
    result.citationCount = openAlex.cited_by_count;
  }

  // Influential citations - only from Semantic Scholar
  if (semanticScholar?.influentialCitationCount !== undefined) {
    result.influentialCitations = semanticScholar.influentialCitationCount;
  }

  // Year - prefer existing, then Semantic Scholar, then OpenAlex
  if (semanticScholar?.year) {
    result.year = semanticScholar.year;
  }

  // Journal info - prefer OpenAlex (more detailed)
  if (openAlex?.primary_location?.source) {
    const source = openAlex.primary_location.source;
    const journal: Journal = {
      name: source.display_name || 'Unknown',
    };

    if (source.issn_l) {
      journal.issn = source.issn_l;
    }

    if (source.summary_stats?.h_index) {
      journal.hIndex = source.summary_stats.h_index;
    }

    if (source.summary_stats?.['2yr_mean_citedness']) {
      journal.twoYearCitedness = source.summary_stats['2yr_mean_citedness'];
    }

    result.journal = journal;
  } else if (semanticScholar?.venue) {
    result.journal = { name: semanticScholar.venue };
  }

  // Authors - fill in if missing
  if (semanticScholar?.authors && semanticScholar.authors.length > 0) {
    const authors = semanticScholar.authors
      .map(a => a.name)
      .filter(Boolean);
    if (authors.length > 0) {
      result.authors = authors;
    }
  } else if (openAlex?.authorships && openAlex.authorships.length > 0) {
    const authors = openAlex.authorships
      .map(a => a.author?.display_name)
      .filter((name): name is string => Boolean(name));
    if (authors.length > 0) {
      result.authors = authors;
    }
  }

  return result;
}

/**
 * Enrich a single paper with metadata from APIs
 */
export async function enrichPaper(
  paper: Partial<Paper>,
  options: { email?: string } = {}
): Promise<EnrichmentResult> {
  try {
    let semanticScholarData: SemanticScholarResponse | null = null;
    let openAlexData: OpenAlexResponse | null = null;

    // Try DOI first
    if (paper.doi) {
      [semanticScholarData, openAlexData] = await Promise.all([
        getSemanticScholarData(paper.doi, 'doi'),
        getOpenAlexData(paper.doi, 'doi', options.email),
      ]);
    }

    // Try arXiv ID if DOI didn't work
    if (!semanticScholarData && paper.url) {
      const arxivMatch = paper.url.match(/arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5})/i);
      if (arxivMatch) {
        semanticScholarData = await getSemanticScholarData(arxivMatch[1], 'arxiv');
      }
    }

    // Try title search as last resort
    if (!semanticScholarData && !openAlexData && paper.title) {
      [semanticScholarData, openAlexData] = await Promise.all([
        getSemanticScholarData(paper.title, 'title'),
        getOpenAlexData(paper.title, 'title', options.email),
      ]);
    }

    // If no data found, return failure
    if (!semanticScholarData && !openAlexData) {
      return {
        success: false,
        error: 'No data found from any API',
      };
    }

    // Merge API responses
    const enrichedData = mergeApiResponses(semanticScholarData, openAlexData);

    return {
      success: true,
      source: semanticScholarData ? 'semantic_scholar' : 'openalex',
      data: enrichedData,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Progress callback type
 */
export type ProgressCallback = (current: number, total: number, paper?: Paper) => void;

/**
 * Enrich multiple papers with batching and rate limiting
 */
export async function enrichPapers(
  papers: Paper[],
  options: {
    email?: string;
    onProgress?: ProgressCallback;
    batchSize?: number;
  } = {}
): Promise<Map<string, EnrichmentResult>> {
  const results = new Map<string, EnrichmentResult>();
  const batchSize = options.batchSize || CONFIG.batchSize;

  // Process in batches
  for (let i = 0; i < papers.length; i += batchSize) {
    const batch = papers.slice(i, i + batchSize);

    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(async (paper) => {
        const result = await enrichPaper(paper, { email: options.email });
        return { paper, result };
      })
    );

    // Store results and report progress
    for (const { paper, result } of batchResults) {
      results.set(paper.id, result);
    }

    // Report progress after batch completes
    if (options.onProgress) {
      options.onProgress(
        Math.min(i + batchSize, papers.length),
        papers.length
      );
    }

    // Delay between batches (rate limiting)
    if (i + batchSize < papers.length) {
      await sleep(CONFIG.batchDelay);
    }
  }

  return results;
}

/**
 * Apply enrichment results to papers
 */
export function applyEnrichment(
  papers: Paper[],
  results: Map<string, EnrichmentResult>
): Paper[] {
  return papers.map(paper => {
    const result = results.get(paper.id);
    if (!result?.success || !result.data) {
      return paper;
    }

    // Merge enriched data, preserving existing values
    return {
      ...paper,
      citationCount: paper.citationCount ?? result.data.citationCount,
      influentialCitations: paper.influentialCitations ?? result.data.influentialCitations,
      journal: paper.journal ?? result.data.journal,
      year: paper.year || result.data.year || new Date().getFullYear(),
      authors: (paper.authors?.length === 1 && paper.authors[0] === 'Unknown')
        ? (result.data.authors || paper.authors)
        : paper.authors,
    };
  });
}

/**
 * Summary statistics for enrichment
 */
export interface EnrichmentSummary {
  total: number;
  enriched: number;
  failed: number;
  averageCitations: number;
  sources: {
    semantic_scholar: number;
    openalex: number;
    crossref: number;
  };
}

/**
 * Get enrichment summary statistics
 */
export function getEnrichmentSummary(
  results: Map<string, EnrichmentResult>,
  papers: Paper[]
): EnrichmentSummary {
  const summary: EnrichmentSummary = {
    total: papers.length,
    enriched: 0,
    failed: 0,
    averageCitations: 0,
    sources: {
      semantic_scholar: 0,
      openalex: 0,
      crossref: 0,
    },
  };

  let totalCitations = 0;
  let citationCount = 0;

  for (const [id, result] of results) {
    if (result.success) {
      summary.enriched++;
      if (result.source) {
        summary.sources[result.source]++;
      }

      // Count citations
      const paper = papers.find(p => p.id === id);
      const citations = paper?.citationCount ?? result.data?.citationCount;
      if (citations !== undefined) {
        totalCitations += citations;
        citationCount++;
      }
    } else {
      summary.failed++;
    }
  }

  summary.averageCitations = citationCount > 0
    ? Math.round(totalCitations / citationCount)
    : 0;

  return summary;
}
