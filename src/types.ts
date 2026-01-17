// 読書ステータス
export type ReadingStatus = 'to-read' | 'reading' | 'read' | 'posted';

// ジャーナル/会議情報
export interface Journal {
  name: string;
  issn?: string;
  hIndex?: number;
  twoYearCitedness?: number;  // IF代替指標
}

// 論文データ型
export interface Paper {
  // 基本情報
  id: string;
  title: string;
  authors: string[];
  year: number;
  doi?: string;
  url?: string;
  abstract?: string;

  // タグ・カテゴリ
  tags: string[];

  // 読書管理
  status: ReadingStatus;
  addedDate: string;      // ISO 8601 (YYYY-MM-DD)
  readDate?: string;      // ISO 8601

  // 引用メタデータ
  citationCount?: number;
  influentialCitations?: number;
  journal?: Journal;

  // ツイート管理
  tweetDraft?: string;
  tweetedAt?: string;

  // 後方互換性のため残す (deprecated)
  /** @deprecated Use abstract instead */
  summary?: string;
  /** @deprecated Use year instead */
  publishedDate?: string;
}

// 後方互換性ヘルパー: 旧データを新形式に変換
export function migratePaper(oldPaper: Partial<Paper>): Paper {
  const year = oldPaper.year ??
    (oldPaper.publishedDate ? new Date(oldPaper.publishedDate).getFullYear() : new Date().getFullYear());

  return {
    id: oldPaper.id ?? crypto.randomUUID(),
    title: oldPaper.title ?? 'Untitled',
    authors: oldPaper.authors ?? [],
    year,
    doi: oldPaper.doi,
    url: oldPaper.url,
    abstract: oldPaper.abstract ?? oldPaper.summary,
    tags: oldPaper.tags ?? [],
    status: oldPaper.status ?? 'read',
    addedDate: oldPaper.addedDate ?? new Date().toISOString().split('T')[0],
    readDate: oldPaper.readDate,
    citationCount: oldPaper.citationCount,
    influentialCitations: oldPaper.influentialCitations,
    journal: oldPaper.journal,
    tweetDraft: oldPaper.tweetDraft,
    tweetedAt: oldPaper.tweetedAt,
    // deprecated fields
    summary: oldPaper.summary ?? oldPaper.abstract,
    publishedDate: oldPaper.publishedDate,
  };
}
