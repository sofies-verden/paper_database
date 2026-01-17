import { Tag, X, Clock, BookMarked, CheckCircle, Share2, Filter } from 'lucide-react';
import type { ReadingStatus } from '../types';

interface SidebarProps {
  tags: { name: string; count: number }[];
  selectedTags: string[];
  onTagClick: (tag: string) => void;
  statusCounts: Record<ReadingStatus, number>;
  selectedStatus: ReadingStatus | null;
  onStatusClick: (status: ReadingStatus | null) => void;
  isOpen: boolean;
  onClose: () => void;
}

// Status configuration matching PaperCard
const statusConfig: Record<ReadingStatus, { label: string; color: string; selectedColor: string; icon: typeof Clock }> = {
  'to-read': { label: '未読', color: 'text-blue-600', selectedColor: 'bg-blue-100 text-blue-700', icon: Clock },
  'reading': { label: '読書中', color: 'text-yellow-600', selectedColor: 'bg-yellow-100 text-yellow-700', icon: BookMarked },
  'read': { label: '読了', color: 'text-green-600', selectedColor: 'bg-green-100 text-green-700', icon: CheckCircle },
  'posted': { label: '投稿済', color: 'text-purple-600', selectedColor: 'bg-purple-100 text-purple-700', icon: Share2 },
};

const statusOrder: ReadingStatus[] = ['to-read', 'reading', 'read', 'posted'];

export function Sidebar({
  tags,
  selectedTags,
  onTagClick,
  statusCounts,
  selectedStatus,
  onStatusClick,
  isOpen,
  onClose,
}: SidebarProps) {
  const hasFilters = selectedTags.length > 0 || selectedStatus !== null;

  const clearAllFilters = () => {
    selectedTags.forEach(tag => onTagClick(tag));
    if (selectedStatus !== null) {
      onStatusClick(null);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          lg:transform-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-4 h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-800">Filters</h2>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Clear all filters */}
          {hasFilters && (
            <button
              onClick={clearAllFilters}
              className="mb-4 text-sm text-blue-600 hover:underline"
            >
              Clear all filters
            </button>
          )}

          {/* Status Section */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Status
            </h3>
            <div className="space-y-1">
              {statusOrder.map((status) => {
                const config = statusConfig[status];
                const StatusIcon = config.icon;
                const count = statusCounts[status] || 0;
                const isSelected = selectedStatus === status;

                return (
                  <button
                    key={status}
                    onClick={() => onStatusClick(isSelected ? null : status)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-sm
                      transition-colors duration-150 flex items-center gap-2
                      ${isSelected
                        ? config.selectedColor + ' font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    <StatusIcon className={`w-4 h-4 ${isSelected ? '' : config.color}`} />
                    <span>{config.label}</span>
                    <span className="ml-auto text-gray-400">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-gray-500" />
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Tags
              </h3>
            </div>
            <div className="space-y-1">
              {tags.map(({ name, count }) => (
                <button
                  key={name}
                  onClick={() => onTagClick(name)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg text-sm
                    transition-colors duration-150
                    ${selectedTags.includes(name)
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <span>{name}</span>
                  <span className="ml-2 text-gray-400">({count})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
