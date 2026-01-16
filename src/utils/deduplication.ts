/**
 * Deduplication utilities for paper management
 * Uses DOI exact match and title similarity for duplicate detection
 */

import type { Paper } from '../types';
import type { ExtractedPaper } from './parseResearch';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchType?: 'doi' | 'arxiv' | 'title';
  matchedPaper?: Paper;
  similarity?: number;
}

export interface DeduplicationReport {
  newPapers: ExtractedPaper[];
  duplicates: Array<{
    paper: ExtractedPaper;
    result: DuplicateCheckResult;
  }>;
}

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[a.length][b.length];
}

/**
 * Calculate similarity score between two strings (0-1)
 * Uses Levenshtein distance normalized by max string length
 */
export function calculateTitleSimilarity(title1: string, title2: string): number {
  // Normalize titles for comparison
  const normalize = (s: string) =>
    s.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();

  const t1 = normalize(title1);
  const t2 = normalize(title2);

  if (t1 === t2) return 1;
  if (t1.length === 0 || t2.length === 0) return 0;

  const distance = levenshteinDistance(t1, t2);
  const maxLength = Math.max(t1.length, t2.length);

  return 1 - distance / maxLength;
}

/**
 * Normalize DOI for comparison
 */
function normalizeDOI(doi: string): string {
  return doi.toLowerCase().replace(/^https?:\/\/doi\.org\//i, '').trim();
}

/**
 * Normalize arXiv ID for comparison
 */
function normalizeArxivId(arxivId: string): string {
  return arxivId.toLowerCase().replace(/v\d+$/, '').trim();
}

/**
 * Check if a paper is a duplicate of any existing paper
 */
export function checkDuplicate(
  newPaper: ExtractedPaper,
  existingPapers: Paper[],
  titleThreshold: number = 0.9
): DuplicateCheckResult {
  // 1. Check DOI exact match
  if (newPaper.doi) {
    const normalizedNewDOI = normalizeDOI(newPaper.doi);
    for (const existing of existingPapers) {
      if (existing.doi && normalizeDOI(existing.doi) === normalizedNewDOI) {
        return {
          isDuplicate: true,
          matchType: 'doi',
          matchedPaper: existing,
          similarity: 1,
        };
      }
    }
  }

  // 2. Check arXiv ID exact match
  if (newPaper.arxivId) {
    const normalizedNewArxiv = normalizeArxivId(newPaper.arxivId);
    for (const existing of existingPapers) {
      // Check if URL contains arXiv ID
      const existingArxivMatch = existing.url?.match(/arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5})/i);
      if (existingArxivMatch) {
        const existingArxivId = normalizeArxivId(existingArxivMatch[1]);
        if (existingArxivId === normalizedNewArxiv) {
          return {
            isDuplicate: true,
            matchType: 'arxiv',
            matchedPaper: existing,
            similarity: 1,
          };
        }
      }
    }
  }

  // 3. Check title similarity
  for (const existing of existingPapers) {
    const similarity = calculateTitleSimilarity(newPaper.title, existing.title);
    if (similarity >= titleThreshold) {
      return {
        isDuplicate: true,
        matchType: 'title',
        matchedPaper: existing,
        similarity,
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Check multiple papers for duplicates and return a report
 */
export function checkDuplicates(
  newPapers: ExtractedPaper[],
  existingPapers: Paper[],
  titleThreshold: number = 0.9
): DeduplicationReport {
  const report: DeduplicationReport = {
    newPapers: [],
    duplicates: [],
  };

  // Also check for duplicates within the new papers
  const processedTitles = new Set<string>();
  const processedDOIs = new Set<string>();
  const processedArxivIds = new Set<string>();

  for (const paper of newPapers) {
    // Check within new papers first
    const normalizedTitle = paper.title.toLowerCase().trim();
    const normalizedDOI = paper.doi ? normalizeDOI(paper.doi) : null;
    const normalizedArxivId = paper.arxivId ? normalizeArxivId(paper.arxivId) : null;

    // Skip if already processed (internal duplicate)
    if (
      processedTitles.has(normalizedTitle) ||
      (normalizedDOI && processedDOIs.has(normalizedDOI)) ||
      (normalizedArxivId && processedArxivIds.has(normalizedArxivId))
    ) {
      continue;
    }

    // Check against existing papers
    const result = checkDuplicate(paper, existingPapers, titleThreshold);

    if (result.isDuplicate) {
      report.duplicates.push({ paper, result });
    } else {
      report.newPapers.push(paper);
      processedTitles.add(normalizedTitle);
      if (normalizedDOI) processedDOIs.add(normalizedDOI);
      if (normalizedArxivId) processedArxivIds.add(normalizedArxivId);
    }
  }

  return report;
}

/**
 * Format duplicate report for CLI output
 */
export function formatDuplicateReport(report: DeduplicationReport): string {
  const lines: string[] = [];

  if (report.newPapers.length > 0) {
    lines.push(`\n✅ ${report.newPapers.length}件の新規論文:`);
    for (const paper of report.newPapers) {
      lines.push(`   • ${paper.title.slice(0, 60)}${paper.title.length > 60 ? '...' : ''}`);
    }
  }

  if (report.duplicates.length > 0) {
    lines.push(`\n⚠️  ${report.duplicates.length}件の重複を検出:`);
    for (const { paper, result } of report.duplicates) {
      const matchInfo = result.matchType === 'title'
        ? `類似度: ${(result.similarity! * 100).toFixed(1)}%`
        : `${result.matchType?.toUpperCase()}一致`;
      lines.push(`   • ${paper.title.slice(0, 50)}... (${matchInfo})`);
      lines.push(`     → 既存: ${result.matchedPaper?.title.slice(0, 50)}...`);
    }
  }

  return lines.join('\n');
}
