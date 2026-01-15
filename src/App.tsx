import { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { Menu, FileText } from 'lucide-react';
import { SearchBar } from './components/SearchBar';
import { Sidebar } from './components/Sidebar';
import { PaperCard } from './components/PaperCard';
import type { Paper } from './types';

function App() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data.json')
      .then((res) => res.json())
      .then((data: Paper[]) => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
        );
        setPapers(sorted);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load papers:', err);
        setLoading(false);
      });
  }, []);

  const fuse = useMemo(() => {
    return new Fuse(papers, {
      keys: ['title', 'summary', 'tags', 'authors'],
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

  const filteredPapers = useMemo(() => {
    let result = papers;

    if (searchQuery.trim()) {
      result = fuse.search(searchQuery).map((r) => r.item);
    }

    if (selectedTags.length > 0) {
      result = result.filter((paper) =>
        selectedTags.some((tag) => paper.tags.includes(tag))
      );
    }

    return result;
  }, [papers, searchQuery, selectedTags, fuse]);

  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

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
            <h1 className="text-xl font-bold text-gray-900">AI Paper Database</h1>
          </div>

          <div className="flex-1 max-w-xl ml-auto">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          tags={tags}
          selectedTags={selectedTags}
          onTagClick={handleTagClick}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-4xl">
            <p className="text-sm text-gray-500 mb-4">
              {filteredPapers.length} papers found
              {selectedTags.length > 0 && (
                <span className="ml-2">
                  (filtered by: {selectedTags.join(', ')})
                </span>
              )}
            </p>

            <div className="space-y-4">
              {filteredPapers.map((paper) => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  onTagClick={handleTagClick}
                />
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
    </div>
  );
}

export default App;
