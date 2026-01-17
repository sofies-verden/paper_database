import { useState } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  ExternalLink,
  Star,
  ListOrdered,
  Zap,
} from 'lucide-react';
import type { Paper } from '../types';
import type { RecommendationResponse } from '../services/recommendation';
import { getRecommendations, getQuickRecommendation } from '../services/recommendation';

interface RecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  papers: Paper[];
  onPaperClick: (paperId: string) => void;
}

type Mode = 'idle' | 'loading' | 'success' | 'error';

export function RecommendationModal({
  isOpen,
  onClose,
  papers,
  onPaperClick,
}: RecommendationModalProps) {
  const [mode, setMode] = useState<Mode>('idle');
  const [response, setResponse] = useState<RecommendationResponse | null>(null);
  const [useAI, setUseAI] = useState(true);

  if (!isOpen) return null;

  const handleRecommend = async () => {
    setMode('loading');

    try {
      let result: RecommendationResponse;

      if (useAI) {
        result = await getRecommendations(papers, 3);
      } else {
        result = getQuickRecommendation(papers, 3);
      }

      setResponse(result);
      setMode(result.success ? 'success' : 'error');
    } catch (error) {
      setResponse({
        success: false,
        recommendations: [],
        summary: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      setMode('error');
    }
  };

  const handlePaperClick = (paperId: string) => {
    onPaperClick(paperId);
    onClose();
  };

  const handleClose = () => {
    setMode('idle');
    setResponse(null);
    onClose();
  };

  const unreadCount = papers.filter(p => p.status === 'to-read').length;

  // Find paper by ID for displaying additional info
  const findPaper = (id: string) => papers.find(p => p.id === id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900">今日の論文推薦</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {/* Idle state */}
          {mode === 'idle' && (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                AIがあなたにぴったりの論文を推薦します
              </h3>
              <p className="text-gray-500 mb-6">
                未読論文: {unreadCount}件
              </p>

              {/* Mode toggle */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={useAI}
                    onChange={() => setUseAI(true)}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    <Sparkles className="w-4 h-4 inline mr-1 text-yellow-500" />
                    Claude AI推薦
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={!useAI}
                    onChange={() => setUseAI(false)}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    <Zap className="w-4 h-4 inline mr-1 text-blue-500" />
                    クイック推薦
                  </span>
                </label>
              </div>

              <button
                onClick={handleRecommend}
                disabled={unreadCount === 0}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {unreadCount === 0 ? '未読論文がありません' : '推薦を取得'}
              </button>

              {useAI && (
                <p className="text-xs text-gray-400 mt-4">
                  Claude APIを使用します。APIキーが必要です。
                </p>
              )}
            </div>
          )}

          {/* Loading state */}
          {mode === 'loading' && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500">
                {useAI ? 'Claude AIが論文を分析中...' : '推薦を計算中...'}
              </p>
            </div>
          )}

          {/* Error state */}
          {mode === 'error' && response && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                推薦の取得に失敗しました
              </h3>
              <p className="text-red-500 mb-6">{response.error}</p>
              <button
                onClick={() => setMode('idle')}
                className="px-4 py-2 text-blue-600 hover:underline"
              >
                戻る
              </button>
            </div>
          )}

          {/* Success state */}
          {mode === 'success' && response && (
            <div>
              {/* Summary */}
              {response.summary && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <p className="text-blue-800">{response.summary}</p>
                </div>
              )}

              {/* Recommendations */}
              <div className="space-y-4">
                {response.recommendations.map((rec) => {
                  const paper = findPaper(rec.paperId);
                  return (
                    <div
                      key={rec.paperId}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                            {rec.suggestedReadingOrder}
                          </span>
                          <div className="flex items-center gap-1">
                            {[...Array(rec.relevanceScore)].map((_, i) => (
                              <Star
                                key={i}
                                className="w-4 h-4 text-yellow-400 fill-current"
                              />
                            ))}
                            {[...Array(5 - rec.relevanceScore)].map((_, i) => (
                              <Star
                                key={i}
                                className="w-4 h-4 text-gray-200"
                              />
                            ))}
                          </div>
                        </div>
                        <ListOrdered className="w-4 h-4 text-gray-400" />
                      </div>

                      {/* Title */}
                      <h4 className="font-medium text-gray-900 mb-2 leading-tight">
                        {rec.title}
                      </h4>

                      {/* Paper info */}
                      {paper && (
                        <p className="text-sm text-gray-500 mb-2">
                          {paper.authors.slice(0, 2).join(', ')}
                          {paper.authors.length > 2 && ' et al.'}
                          {' • '}{paper.year}
                          {paper.citationCount && ` • 被引用: ${paper.citationCount.toLocaleString()}`}
                        </p>
                      )}

                      {/* Reason */}
                      <p className="text-sm text-gray-600 mb-3">{rec.reason}</p>

                      {/* Action */}
                      {paper?.url && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePaperClick(rec.paperId)}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            詳細を見る
                          </button>
                          <span className="text-gray-300">|</span>
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            論文を読む
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex justify-center gap-4 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={handleRecommend}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  再推薦
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
