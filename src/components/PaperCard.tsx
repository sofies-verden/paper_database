import { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, Calendar, Users } from 'lucide-react';
import type { Paper } from '../types';

interface PaperCardProps {
  paper: Paper;
  onTagClick: (tag: string) => void;
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

  return (
    <article
      onClick={handleCardClick}
      className={`bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow ${
        hasMoreContent ? 'cursor-pointer' : ''
      }`}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
        {paper.title}
      </h3>

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

      <p className="text-gray-600 text-sm leading-relaxed mb-3">
        {isExpanded ? content : summaryPreview}
        {!isExpanded && hasMoreContent && '...'}
      </p>

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
      </div>
    </article>
  );
}
