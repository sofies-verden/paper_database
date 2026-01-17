import { useState, useEffect, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';
import { Menu, FileText, ArrowUpDown, ChevronDown, Sparkles } from 'lucide-react';
import { SearchBar } from './components/SearchBar';
import { Sidebar } from './components/Sidebar';
import { PaperCard } from './components/PaperCard';
import { RecommendationModal } from './components/RecommendationModal';
import type { Paper, ReadingStatus } from './types';

// Sort options configuration
type SortOption = 'year-desc' | 'year-asc' | 'citations-desc' | 'citations-asc' | 'added-desc' | 'added-asc';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'year-desc', label: '出版年（新しい順）' },
  { value: 'year-asc', label: '出版年（古い順）' },
  { value: 'citations-desc', label: '被引用数（多い順）' },
  { value: 'citations-asc', label: '被引用数（少ない順）' },
  { value: 'added-desc', label: '追加日（新しい順）' },
  { value: 'added-asc', label: '追加日（古い順）' },
];

function App() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<ReadingStatus | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('year-desc');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [recommendModalOpen, setRecommendModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Refs for scrolling to papers
  const paperRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'data.json')
      .then((res) => res.json())
      .then((data: Paper[]) => {
        setPapers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load papers:', err);
        setLoading(false);
      });
  }, []);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setSortDropdownOpen(false);
    if (sortDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [sortDropdownOpen]);

  const fuse = useMemo(() => {
    return new Fuse(papers, {
      keys: ['title', 'abstract', 'summary', 'tags', 'authors'],
      threshold: 0.4,
      ignoreLocation: true,
    });
  }, [papers]);

  const tags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    papers.forEach((paper) => {
      paper.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [papers]);

  // Status counts for sidebar
  const statusCounts = useMemo(() => {
    const counts: Record<ReadingStatus, number> = {
      'to-read': 0,
      'reading': 0,
      'read': 0,
      'posted': 0,
    };
    papers.forEach((paper) => {
      counts[paper.status]++;
    });
    return counts;
  }, [papers]);

  // Sorting function
  const sortPapers = (papersToSort: Paper[]): Paper[] => {
    return [...papersToSort].sort((a, b) => {
      switch (sortBy) {
        case 'year-desc':
          return b.year - a.year || b.addedDate.localeCompare(a.addedDate);
        case 'year-asc':
          return a.year - b.year || a.addedDate.localeCompare(b.addedDate);
        case 'citations-desc':
          return (b.citationCount ?? 0) - (a.citationCount ?? 0);
        case 'citations-asc':
          return (a.citationCount ?? 0) - (b.citationCount ?? 0);
        case 'added-desc':
          return b.addedDate.localeCompare(a.addedDate);
        case 'added-asc':
          return a.addedDate.localeCompare(b.addedDate);
        default:
          return 0;
      }
    });
  };

  const filteredPapers = useMemo(() => {
    let result = papers;

    // Search filter
    if (searchQuery.trim()) {
      result = fuse.search(searchQuery).map((r) => r.item);
    }

    // Tag filter
    if (selectedTags.length > 0) {
      result = result.filter((paper) =>
        selectedTags.some((tag) => paper.tags.includes(tag))
      );
    }

    // Status filter
    if (selectedStatus !== null) {
      result = result.filter((paper) => paper.status === selectedStatus);
    }

    // Apply sorting
    return sortPapers(result);
  }, [papers, searchQuery, selectedTags, selectedStatus, sortBy, fuse]);

  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleStatusClick = (status: ReadingStatus | null) => {
    setSelectedStatus(status);
  };

  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
    setSortDropdownOpen(false);
  };

  const handlePaperClick = (paperId: string) => {
    // Clear filters to show all papers
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedStatus(null);

    // Scroll to the paper after a short delay (to let filters clear)
    setTimeout(() => {
      const paperElement = paperRefs.current.get(paperId);
      if (paperElement) {
        paperElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a brief highlight effect
        paperElement.classList.add('ring-2', 'ring-blue-400');
        setTimeout(() => {
          paperElement.classList.remove('ring-2', 'ring-blue-400');
        }, 2000);
      }
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const currentSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || '';
  const unreadCount = statusCounts['to-read'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">AI Paper Database</h1>
            <h1 className="text-xl font-bold text-gray-900 sm:hidden">Papers</h1>
          </div>

          <div className="flex-1 max-w-xl ml-auto">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          {/* Recommend button */}
          <button
            onClick={() => setRecommendModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-medium rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all shadow-sm"
            title="今日の論文を推薦"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">推薦</span>
            {unreadCount > 0 && (
              <span className="bg-white bg-opacity-30 px-1.5 py-0.5 rounded text-xs">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          tags={tags}
          selectedTags={selectedTags}
          onTagClick={handleTagClick}
          statusCounts={statusCounts}
          selectedStatus={selectedStatus}
          onStatusClick={handleStatusClick}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-4xl">
            {/* Results header with sort */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <p className="text-sm text-gray-500">
                {filteredPapers.length} papers found
                {(selectedTags.length > 0 || selectedStatus) && (
                  <span className="ml-2">
                    (filtered{selectedTags.length > 0 && `: ${selectedTags.join(', ')}`}
                    {selectedStatus && ` / ${selectedStatus}`})
                  </span>
                )}
              </p>

              {/* Sort dropdown */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setSortDropdownOpen(!sortDropdownOpen); }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="hidden sm:inline">{currentSortLabel}</span>
                  <span className="sm:hidden">Sort</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {sortDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={(e) => { e.stopPropagation(); handleSortChange(option.value); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                          sortBy === option.value ? 'text-blue-600 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Paper cards */}
            <div className="space-y-4">
              {filteredPapers.map((paper) => (
                <div
                  key={paper.id}
                  ref={(el) => {
                    if (el) paperRefs.current.set(paper.id, el);
                  }}
                  className="transition-all duration-300"
                >
                  <PaperCard
                    paper={paper}
                    onTagClick={handleTagClick}
                  />
                </div>
              ))}

              {filteredPapers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No papers found. Try adjusting your search or filters.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Recommendation Modal */}
      <RecommendationModal
        isOpen={recommendModalOpen}
        onClose={() => setRecommendModalOpen(false)}
        papers={papers}
        onPaperClick={handlePaperClick}
      />
    </div>
  );
}

export default App;
