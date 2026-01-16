/**
 * Deep Research Markdown Parser
 * Extracts paper information from markdown/text files
 */

import type { Paper, ReadingStatus } from '../types';

// Extracted paper info before full Paper conversion
export interface ExtractedPaper {
  title: string;
  authors: string[];
  year?: number;
  doi?: string;
  arxivId?: string;
  url?: string;
  abstract?: string;
}

// DOI patterns
const DOI_PATTERNS = [
  /(?:doi\.org\/|DOI:\s*|doi:\s*)(10\.\d{4,}\/[^\s\])"'<>]+)/gi,
  /\b(10\.\d{4,}\/[^\s\])"'<>]+)\b/g,
];

// arXiv patterns
const ARXIV_PATTERNS = [
  /arxiv\.org\/abs\/(\d{4}\.\d{4,5}(?:v\d+)?)/gi,
  /arxiv\.org\/pdf\/(\d{4}\.\d{4,5}(?:v\d+)?)/gi,
  /arXiv:\s*(\d{4}\.\d{4,5}(?:v\d+)?)/gi,
  /\[(\d{4}\.\d{4,5})\]/g,
];

// Title patterns (common markdown/citation formats)
const TITLE_PATTERNS = [
  // Markdown headers with paper titles
  /^#{1,3}\s+(?:\d+\.\s+)?[""]?(.+?)[""]?\s*$/gm,
  // Bold titles
  /\*\*(.+?)\*\*/g,
  // Quoted titles
  /"([^"]{20,200})"/g,
  /「([^」]{10,200})」/g,
  // Citation format: Author et al. (Year). Title.
  /(?:et al\.|[A-Z][a-z]+)\s*\(\d{4}\)\.\s*[""]?([^.""]{20,200})[""]?\./g,
];

// Author patterns
const AUTHOR_PATTERNS = [
  // "by Author1, Author2, and Author3"
  /(?:by|著者[：:])[\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)*(?:\s+(?:and|&)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)?)/gi,
  // "Author1, Author2, ... (Year)"
  /^([A-Z][a-z]+(?:,?\s+[A-Z]\.?)+(?:,\s*[A-Z][a-z]+(?:,?\s+[A-Z]\.?)+)*(?:\s*(?:,|&|and)\s*(?:et al\.?|[A-Z][a-z]+(?:,?\s+[A-Z]\.?)+))?)\s*\(\d{4}\)/gm,
  // Japanese author format
  /著者[：:\s]*(.+?)(?:\n|$)/g,
];

// Year patterns
const YEAR_PATTERNS = [
  /\((\d{4})\)/g,
  /(\d{4})年/g,
  /published\s+(?:in\s+)?(\d{4})/gi,
];

/**
 * Extract DOIs from text
 */
export function extractDOIs(text: string): string[] {
  const dois = new Set<string>();

  for (const pattern of DOI_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      // Clean up DOI (remove trailing punctuation)
      const doi = match[1].replace(/[.,;:)\]]+$/, '');
      dois.add(doi);
    }
  }

  return Array.from(dois);
}

/**
 * Extract arXiv IDs from text
 */
export function extractArxivIds(text: string): string[] {
  const arxivIds = new Set<string>();

  for (const pattern of ARXIV_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      // Remove version suffix for deduplication
      const id = match[1].replace(/v\d+$/, '');
      arxivIds.add(id);
    }
  }

  return Array.from(arxivIds);
}

/**
 * Clean markdown formatting from title
 */
function cleanTitle(title: string): string {
  return title
    .replace(/^\*\*|\*\*$/g, '')  // Remove bold markers
    .replace(/^\*|\*$/g, '')      // Remove italic markers
    .replace(/^#+\s*/, '')        // Remove header markers
    .replace(/^\d+\.\s*/, '')     // Remove numbering
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Convert links to text
    .trim();
}

/**
 * Check if title looks like a real paper title (not metadata)
 */
function isValidPaperTitle(title: string): boolean {
  const invalidPatterns = [
    /^(references?|bibliography|citations?|abstract|introduction|conclusion|appendix|acknowledgements?)$/i,
    /^(figure|table|section|chapter)\s*\d*/i,
    /^(deep research|key findings|summary|overview)/i,
    /^https?:\/\//i,
    /^(doi|arxiv|url):/i,
  ];

  return !invalidPatterns.some(pattern => pattern.test(title));
}

/**
 * Extract potential paper titles from text
 */
export function extractTitles(text: string): string[] {
  const titles = new Set<string>();

  for (const pattern of TITLE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      let title = cleanTitle(match[1].trim());
      // Filter out non-title strings
      if (title.length >= 10 && title.length <= 300 &&
          !title.match(/^(http|www|doi)/i) &&
          isValidPaperTitle(title)) {
        titles.add(title);
      }
    }
  }

  return Array.from(titles);
}

/**
 * Extract authors from text near a title
 */
export function extractAuthors(text: string): string[] {
  const authors: string[] = [];

  for (const pattern of AUTHOR_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      const authorStr = match[1];
      // Split by common delimiters
      const parsed = authorStr
        .split(/,\s*(?:and\s+)?|(?:\s+and\s+)|(?:\s*&\s*)/)
        .map(a => a.trim())
        .filter(a => a.length > 0 && !a.match(/^et al\.?$/i));
      authors.push(...parsed);
    }
  }

  // Deduplicate
  return [...new Set(authors)];
}

/**
 * Extract year from text
 */
export function extractYear(text: string): number | undefined {
  for (const pattern of YEAR_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    const match = regex.exec(text);
    if (match) {
      const year = parseInt(match[1], 10);
      if (year >= 1900 && year <= new Date().getFullYear() + 1) {
        return year;
      }
    }
  }
  return undefined;
}

/**
 * Parse a section of text that likely contains one paper
 */
function parsePaperSection(section: string): ExtractedPaper | null {
  const dois = extractDOIs(section);
  const arxivIds = extractArxivIds(section);
  const titles = extractTitles(section);
  const authors = extractAuthors(section);
  const year = extractYear(section);

  // Need at least a title or identifier
  if (titles.length === 0 && dois.length === 0 && arxivIds.length === 0) {
    return null;
  }

  // Get the best title
  let title: string | undefined = titles[0];
  if (title) {
    title = cleanTitle(title);
    // Skip if still not a valid title after cleaning
    if (!isValidPaperTitle(title) || title.length < 10) {
      title = undefined;
    }
  }

  // Fall back to identifier-based title
  if (!title) {
    if (dois.length > 0) {
      title = `Paper DOI:${dois[0]}`;
    } else if (arxivIds.length > 0) {
      title = `Paper arXiv:${arxivIds[0]}`;
    } else {
      return null; // No usable title
    }
  }

  // TypeScript: title is guaranteed to be string here
  const finalTitle: string = title;

  // Build URL from identifiers
  let url: string | undefined;
  if (arxivIds.length > 0) {
    url = `https://arxiv.org/abs/${arxivIds[0]}`;
  } else if (dois.length > 0) {
    url = `https://doi.org/${dois[0]}`;
  }

  return {
    title: finalTitle,
    authors: authors.length > 0 ? authors : ['Unknown'],
    year,
    doi: dois[0],
    arxivId: arxivIds[0],
    url,
  };
}

/**
 * Split markdown into paper sections
 */
function splitIntoPaperSections(markdown: string): string[] {
  // Split by common section markers
  const sections = markdown.split(/(?=^#{1,3}\s+\d*\.?\s*[^#\n])|(?=^\d+\.\s+\*\*)|(?=^---+$)/m);

  return sections
    .map(s => s.trim())
    .filter(s => s.length > 50); // Filter out too-short sections
}

/**
 * Main function: Parse deep research markdown and extract papers
 */
export function parseResearchMarkdown(markdown: string): ExtractedPaper[] {
  const papers: ExtractedPaper[] = [];
  const seenIdentifiers = new Set<string>();

  // First, try to find all unique DOIs and arXiv IDs
  const allDOIs = extractDOIs(markdown);
  const allArxivIds = extractArxivIds(markdown);

  // Split into sections and parse each
  const sections = splitIntoPaperSections(markdown);

  for (const section of sections) {
    const paper = parsePaperSection(section);
    if (paper) {
      // Check for duplicates within this parse
      const identifier = paper.doi || paper.arxivId || paper.title;
      if (!seenIdentifiers.has(identifier)) {
        seenIdentifiers.add(identifier);
        papers.push(paper);
      }
    }
  }

  // If section parsing didn't find much, try extracting from identifiers directly
  if (papers.length === 0) {
    for (const doi of allDOIs) {
      if (!seenIdentifiers.has(doi)) {
        seenIdentifiers.add(doi);
        papers.push({
          title: `Paper DOI:${doi}`,
          authors: ['Unknown'],
          doi,
          url: `https://doi.org/${doi}`,
        });
      }
    }

    for (const arxivId of allArxivIds) {
      if (!seenIdentifiers.has(arxivId)) {
        seenIdentifiers.add(arxivId);
        papers.push({
          title: `Paper arXiv:${arxivId}`,
          authors: ['Unknown'],
          arxivId,
          url: `https://arxiv.org/abs/${arxivId}`,
        });
      }
    }
  }

  return papers;
}

/**
 * Convert ExtractedPaper to full Paper type
 */
export function toPaper(
  extracted: ExtractedPaper,
  options: {
    status?: ReadingStatus;
    tags?: string[];
  } = {}
): Paper {
  const now = new Date().toISOString().split('T')[0];

  return {
    id: extracted.doi || extracted.arxivId || crypto.randomUUID(),
    title: extracted.title,
    authors: extracted.authors,
    year: extracted.year || new Date().getFullYear(),
    doi: extracted.doi,
    url: extracted.url,
    abstract: extracted.abstract,
    tags: options.tags || [],
    status: options.status || 'to-read',
    addedDate: now,
  };
}
