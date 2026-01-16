import { useState } from 'react';
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
  Quote,
  BookOpen,
  Clock,
  BookMarked,
  CheckCircle,
  Share2,
} from 'lucide-react';
import type { Paper, ReadingStatus } from '../types';

interface PaperCardProps {
  paper: Paper;
  onTagClick: (tag: string) => void;
}

// Status badge configuration
const statusConfig: Record<ReadingStatus, { label: string; color: string; icon: typeof Clock }> = {
  'to-read': { label: '未読', color: 'bg-blue-100 text-blue-700', icon: Clock },
  'reading': { label: '読書中', color: 'bg-yellow-100 text-yellow-700', icon: BookMarked },
  'read': { label: '読了', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  'posted': { label: '投稿済', color: 'bg-purple-100 text-purple-700', icon: Share2 },
};

// Format large numbers (e.g., 12000 -> 12K)
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

export function PaperCard({ paper, onTagClick }: PaperCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Use abstract with fallback to summary for backward compatibility
  const content = paper.abstract ?? paper.summary ?? '';
  const summaryPreview = content.slice(0, 100);
  const hasMoreContent = content.length > 100;

  const handleCardClick = () => {
    if (hasMoreContent) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    onTagClick(tag);
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const status = statusConfig[paper.status];
  const StatusIcon = status.icon;

  return (
    <article
      onClick={handleCardClick}
      className={`bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow ${
        hasMoreContent ? 'cursor-pointer' : ''
      }`}
    >
      {/* Header: Status badge and Citation count */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${status.color}`}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
        </div>

        {/* Citation Count Badge */}
        {paper.citationCount !== undefined && paper.citationCount > 0 && (
          <div className="flex items-center gap-1 text-sm text-gray-500" title={`${paper.citationCount} citations`}>
            <Quote className="w-4 h-4" />
            <span className="font-medium">{formatNumber(paper.citationCount)}</span>
            {paper.influentialCitations !== undefined && paper.influentialCitations > 0 && (
              <span className="text-xs text-gray-400" title={`${paper.influentialCitations} influential citations`}>
                ({formatNumber(paper.influentialCitations)})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
        {paper.title}
      </h3>

      {/* Meta info: Year, Authors */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{paper.year}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>{paper.authors.slice(0, 2).join(', ')}{paper.authors.length > 2 ? ' et al.' : ''}</span>
        </div>
      </div>

      {/* Tags */}
      {paper.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {paper.tags.map((tag) => (
            <button
              key={tag}
              onClick={(e) => handleTagClick(e, tag)}
              className="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Abstract/Summary */}
      {content && (
        <p className="text-gray-600 text-sm leading-relaxed mb-3">
          {isExpanded ? content : summaryPreview}
          {!isExpanded && hasMoreContent && '...'}
        </p>
      )}

      {/* Journal/Conference Info */}
      {paper.journal && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-3 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{paper.journal.name}</span>
          </div>
          {paper.journal.hIndex !== undefined && (
            <span title="h-index">h: {paper.journal.hIndex}</span>
          )}
          {paper.journal.twoYearCitedness !== undefined && (
            <span title="2-year mean citedness (Impact Factor alternative)">
              2yr: {paper.journal.twoYearCitedness.toFixed(1)}
            </span>
          )}
        </div>
      )}

      {/* Footer: Expand button and Link */}
      <div className="flex items-center justify-between">
        {hasMoreContent && (
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                閉じる
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                もっと見る
              </>
            )}
          </button>
        )}

        {paper.url && (
          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLinkClick}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors ml-auto"
          >
            <ExternalLink className="w-4 h-4" />
            論文を読む
          </a>
        )}
      </div>
    </article>
  );
}
