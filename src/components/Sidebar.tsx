import { Tag, X } from 'lucide-react';

interface SidebarProps {
  tags: { name: string; count: number }[];
  selectedTags: string[];
  onTagClick: (tag: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ tags, selectedTags, onTagClick, isOpen, onClose }: SidebarProps) {
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-800">Tags</h2>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {selectedTags.length > 0 && (
            <button
              onClick={() => selectedTags.forEach(tag => onTagClick(tag))}
              className="mb-4 text-sm text-blue-600 hover:underline"
            >
              Clear all filters
            </button>
          )}

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
      </aside>
    </>
  );
}
