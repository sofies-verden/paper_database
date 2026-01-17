/**
 * Paper Recommendation Service using Claude API
 *
 * NOTE: This service calls Claude API from the client side.
 * For production use, consider implementing a backend proxy to protect API keys.
 */

import type { Paper } from '../types';

// Recommendation result interface
export interface RecommendationResult {
  paperId: string;
  title: string;
  reason: string;
  relevanceScore: number; // 1-5 scale
  suggestedReadingOrder: number;
}

export interface RecommendationResponse {
  success: boolean;
  recommendations: RecommendationResult[];
  summary: string;
  error?: string;
}

// User research profile
const USER_PROFILE = {
  name: 'Tomoki',
  researchFields: ['教育工学', '計量経済学', 'Educational Technology', 'Econometrics'],
  interests: [
    'LLM applications in education',
    'Causal inference methods',
    'AI-assisted learning',
    'Natural language processing',
    'Machine learning for social science',
  ],
};

/**
 * Build the recommendation prompt
 */
function buildPrompt(papers: Paper[], count: number): string {
  // Format papers for the prompt
  const paperList = papers.map((p, index) => {
    const citations = p.citationCount ? `被引用数: ${p.citationCount}` : '';
    const influential = p.influentialCitations ? `, 影響力のある引用: ${p.influentialCitations}` : '';
    const journal = p.journal?.name ? `掲載先: ${p.journal.name}` : '';
    const hIndex = p.journal?.hIndex ? `, h-index: ${p.journal.hIndex}` : '';
    const tags = p.tags.length > 0 ? `タグ: ${p.tags.join(', ')}` : '';

    return `
${index + 1}. ID: ${p.id}
   タイトル: ${p.title}
   著者: ${p.authors.join(', ')}
   出版年: ${p.year}
   ${citations}${influential}
   ${journal}${hIndex}
   ${tags}
   概要: ${(p.abstract || p.summary || '').slice(0, 200)}${(p.abstract || p.summary || '').length > 200 ? '...' : ''}
`.trim();
  }).join('\n\n');

  return `あなたは研究論文の推薦エキスパートです。以下のユーザープロファイルと未読論文リストに基づいて、今日読むべき論文を${count}件推薦してください。

## ユーザープロファイル
- 名前: ${USER_PROFILE.name}
- 研究分野: ${USER_PROFILE.researchFields.join(', ')}
- 興味のあるトピック: ${USER_PROFILE.interests.join(', ')}

## 推薦の基準
1. ユーザーの研究分野との関連性
2. 被引用数と影響力（高い方が重要な論文である可能性が高い）
3. 掲載先のh-indexや2年間被引用率（質の高いジャーナル/会議）
4. 最近のトレンドとの関連性
5. 他の論文を理解するための基礎となる論文かどうか

## 未読論文リスト
${paperList}

## 出力形式
以下のJSON形式で回答してください。他の説明は不要です。

\`\`\`json
{
  "recommendations": [
    {
      "paperId": "論文のID",
      "title": "論文タイトル",
      "reason": "この論文を推薦する理由（日本語で2-3文）",
      "relevanceScore": 5,
      "suggestedReadingOrder": 1
    }
  ],
  "summary": "今日の推薦の全体的な説明（日本語で2-3文）"
}
\`\`\`

推薦は${count}件まで、relevanceScoreは1-5のスケール（5が最も関連性が高い）、suggestedReadingOrderは読む順番（1が最初）を示します。`;
}

/**
 * Parse Claude's response to extract recommendations
 */
function parseResponse(content: string): RecommendationResponse {
  try {
    // Extract JSON from markdown code block if present
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;

    const parsed = JSON.parse(jsonStr);

    return {
      success: true,
      recommendations: parsed.recommendations || [],
      summary: parsed.summary || '',
    };
  } catch (error) {
    // Try to parse as plain JSON
    try {
      const parsed = JSON.parse(content);
      return {
        success: true,
        recommendations: parsed.recommendations || [],
        summary: parsed.summary || '',
      };
    } catch {
      return {
        success: false,
        recommendations: [],
        summary: '',
        error: 'Failed to parse recommendation response',
      };
    }
  }
}

/**
 * Get paper recommendations using Claude API
 */
export async function getRecommendations(
  papers: Paper[],
  count: number = 3
): Promise<RecommendationResponse> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      recommendations: [],
      summary: '',
      error: 'Anthropic API key not configured. Please set VITE_ANTHROPIC_API_KEY in .env file.',
    };
  }

  // Filter to only unread papers
  const unreadPapers = papers.filter(p => p.status === 'to-read');

  if (unreadPapers.length === 0) {
    return {
      success: false,
      recommendations: [],
      summary: '',
      error: '未読の論文がありません。新しい論文を追加してください。',
    };
  }

  const prompt = buildPrompt(unreadPapers, Math.min(count, unreadPapers.length));

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    return parseResponse(content);
  } catch (error) {
    return {
      success: false,
      recommendations: [],
      summary: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get a quick recommendation without API call (fallback/demo mode)
 * Uses simple heuristics based on citation count and tags
 */
export function getQuickRecommendation(papers: Paper[], count: number = 3): RecommendationResponse {
  const unreadPapers = papers.filter(p => p.status === 'to-read');

  if (unreadPapers.length === 0) {
    return {
      success: false,
      recommendations: [],
      summary: '',
      error: '未読の論文がありません。',
    };
  }

  // Score papers based on citations and relevance to user interests
  const scoredPapers = unreadPapers.map(paper => {
    let score = 0;

    // Citation score (normalized)
    if (paper.citationCount) {
      score += Math.min(paper.citationCount / 10000, 2); // Max 2 points
    }

    // Influential citations bonus
    if (paper.influentialCitations) {
      score += Math.min(paper.influentialCitations / 1000, 1); // Max 1 point
    }

    // Journal quality
    if (paper.journal?.hIndex) {
      score += Math.min(paper.journal.hIndex / 100, 1); // Max 1 point
    }

    // Tag relevance to user interests
    const relevantTags = ['LLM', 'NLP', 'Education', 'Reasoning', 'Prompting'];
    const matchingTags = paper.tags.filter(t =>
      relevantTags.some(rt => t.toLowerCase().includes(rt.toLowerCase()))
    );
    score += matchingTags.length * 0.5;

    // Recency bonus
    const currentYear = new Date().getFullYear();
    if (paper.year >= currentYear - 2) {
      score += 0.5;
    }

    return { paper, score };
  });

  // Sort by score and take top N
  const topPapers = scoredPapers
    .sort((a, b) => b.score - a.score)
    .slice(0, count);

  const recommendations: RecommendationResult[] = topPapers.map((item, index) => ({
    paperId: item.paper.id,
    title: item.paper.title,
    reason: generateQuickReason(item.paper),
    relevanceScore: Math.min(5, Math.round(item.score + 2)),
    suggestedReadingOrder: index + 1,
  }));

  return {
    success: true,
    recommendations,
    summary: `被引用数と研究分野の関連性に基づいて${recommendations.length}件の論文を推薦しました。`,
  };
}

/**
 * Generate a quick reason for recommendation (used in demo mode)
 */
function generateQuickReason(paper: Paper): string {
  const reasons: string[] = [];

  if (paper.citationCount && paper.citationCount > 1000) {
    reasons.push(`被引用数${paper.citationCount.toLocaleString()}の影響力のある論文です`);
  }

  if (paper.journal?.name) {
    reasons.push(`${paper.journal.name}に掲載された質の高い研究です`);
  }

  if (paper.tags.some(t => ['LLM', 'NLP', 'Reasoning'].includes(t))) {
    reasons.push('AI・自然言語処理の重要なトピックを扱っています');
  }

  if (reasons.length === 0) {
    reasons.push('研究分野に関連する興味深い論文です');
  }

  return reasons.join('。') + '。';
}
