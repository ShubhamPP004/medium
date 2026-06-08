'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, ChevronDown, ChevronUp, BookX, Sparkles } from 'lucide-react';
import ArticleCard from './ArticleCard';

interface Article {
  url: string;
  title: string;
  byline: string;
  images: string[];
  pubDate?: string;
}

interface ArticleListProps {
  articles: Article[];
  newCount: number;
}

type SortField = 'number' | 'title' | 'date';
type SortDirection = 'asc' | 'desc';

export default function ArticleList({ articles, newCount }: ArticleListProps) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const sortedArticles = useMemo(() => {
    const filtered = articles.filter((article) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        article.title.toLowerCase().includes(q) ||
        article.byline?.toLowerCase().includes(q) ||
        article.url.toLowerCase().includes(q)
      );
    });

    return filtered.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'number') {
        const na = a.title.match(/SFMC Tips #(\d+)/);
        const nb = b.title.match(/SFMC Tips #(\d+)/);
        cmp = (na ? parseInt(na[1]) : 0) - (nb ? parseInt(nb[1]) : 0);
      } else if (sortField === 'title') {
        cmp = a.title.localeCompare(b.title);
      } else if (sortField === 'date') {
        const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
        const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
        cmp = da - db;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [articles, search, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const newArticles = sortedArticles.slice(0, newCount);
  const oldArticles = sortedArticles.slice(newCount);

  const SortButton = ({ field, label }: { field: SortField; label: string }) => {
    const isActive = sortField === field;
    return (
      <button
        onClick={() => toggleSort(field)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-body transition-all duration-200 ${
          isActive
            ? 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20'
            : 'text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-default)] hover:text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
        }`}
      >
        <ArrowUpDown className="w-3 h-3" />
        <span>{label}</span>
        {isActive && (
          <span className="font-mono-nums text-[10px]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
        )}
      </button>
    );
  };

  return (
    <div className="glass rounded-xl overflow-hidden border border-[var(--border-default)]">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[var(--border-default)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-[var(--text-primary)] font-display tracking-tight">Articles</h2>
            <span className="font-mono-nums text-xs bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-muted)] px-2.5 py-1 rounded-lg">
              {sortedArticles.length}
            </span>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--border-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-all"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-dim)]" />
          <input
            type="text"
            placeholder="Search articles, authors, or topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent-blue)]/30 focus:ring-1 focus:ring-[var(--accent-blue)]/20 transition-all font-body"
          />
        </div>

        {/* Filter toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-body transition-all ${
              showFilters
                ? 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20'
                : 'text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-default)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
          {showFilters && (
            <div className="flex items-center gap-2 animate-enter">
              <SortButton field="date" label="Date" />
              <SortButton field="number" label="Number" />
              <SortButton field="title" label="Title" />
            </div>
          )}
        </div>
      </div>

      {/* Article list */}
      {expanded && (
        <div className="divide-y divide-[var(--border-default)]">
          {sortedArticles.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-center justify-center mx-auto mb-4">
                <BookX className="w-6 h-6 text-[var(--text-dim)]" />
              </div>
              <p className="text-[var(--text-muted)] font-body text-sm">No articles match your search</p>
              <p className="text-[var(--text-dim)] text-xs mt-1 font-body">Try a different keyword</p>
            </div>
          ) : (
            <>
              {newArticles.length > 0 && (
                <div className="p-2 sm:p-3">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
                    <span className="text-xs font-semibold text-[var(--accent-emerald)] uppercase tracking-wider font-body">
                      New Articles
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-[var(--accent-emerald)]/20 to-transparent" />
                  </div>
                  <div className="space-y-2">
                    {newArticles.map((article, i) => (
                      <ArticleCard
                        key={article.url}
                        article={article}
                        index={i}
                        isNew={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {oldArticles.length > 0 && (
                <div className="p-2 sm:p-3">
                  {newArticles.length > 0 && (
                    <div className="flex items-center gap-2 mb-3 px-2">
                      <span className="text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider font-body">
                        All Articles
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-[var(--text-dim)]/20 to-transparent" />
                    </div>
                  )}
                  <div className="space-y-2">
                    {oldArticles.map((article, i) => (
                      <ArticleCard
                        key={article.url}
                        article={article}
                        index={i + newArticles.length}
                        isNew={false}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
