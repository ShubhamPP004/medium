'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
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
      const query = search.toLowerCase();
      return (
        article.title.toLowerCase().includes(query) ||
        article.byline.toLowerCase().includes(query) ||
        article.url.toLowerCase().includes(query)
      );
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'number': {
          const aMatch = a.title.match(/SFMC Tips #(\d+)/);
          const bMatch = b.title.match(/SFMC Tips #(\d+)/);
          const aNum = aMatch ? parseInt(aMatch[1], 10) : Infinity;
          const bNum = bMatch ? parseInt(bMatch[1], 10) : Infinity;
          comparison = aNum - bNum;
          if (aNum === Infinity && bNum !== Infinity) comparison = 1;
          if (bNum === Infinity && aNum !== Infinity) comparison = -1;
          break;
        }
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date': {
          const aDate = a.pubDate ? new Date(a.pubDate).getTime() : 0;
          const bDate = b.pubDate ? new Date(b.pubDate).getTime() : 0;
          // Fallback to tips number for articles without pubDate (oldest articles)
          const aNumMatch = a.title.match(/SFMC Tips #(\d+)/);
          const bNumMatch = b.title.match(/SFMC Tips #(\d+)/);
          const aNum = aNumMatch ? parseInt(aNumMatch[1], 10) : 0;
          const bNum = bNumMatch ? parseInt(bNumMatch[1], 10) : 0;
          comparison = (aDate || aNum) - (bDate || bNum);
          break;
        }
      }
      return sortDirection === 'asc' ? comparison : -comparison;
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

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            >
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            <h2 className="text-xl font-bold text-white">
              Articles
              <span className="ml-2 text-sm font-normal text-slate-400">({sortedArticles.length} shown)</span>
            </h2>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-slate-300"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-3 mb-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400/50 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              {(['number', 'title', 'date'] as SortField[]).map((field) => (
                <button
                  key={field}
                  onClick={() => toggleSort(field)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm capitalize transition-colors ${
                    sortField === field
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  {field}
                  {sortField === field && (
                    <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {expanded && (
        <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
          {sortedArticles.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No articles match your search</div>
          ) : (
            <>
              {newCount > 0 && newArticles.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-400">New Articles</span>
                    <span className="text-xs text-slate-400">({newArticles.length})</span>
                  </div>
                  <div className="space-y-3">
                    {newArticles.map((article, index) => (
                      <ArticleCard key={article.url} article={article} index={index} isNew={true} />
                    ))}
                  </div>
                </div>
              )}
              {oldArticles.length > 0 && (
                <div>
                  {newCount > 0 && (
                    <div className="flex items-center gap-2 mb-3 px-2">
                      <div className="w-2 h-2 rounded-full bg-slate-500" />
                      <span className="text-sm font-semibold text-slate-400">Previously Added</span>
                      <span className="text-xs text-slate-400">({oldArticles.length})</span>
                    </div>
                  )}
                  <div className="space-y-3">
                    {oldArticles.map((article, index) => (
                      <ArticleCard key={article.url} article={article} index={index + newCount} />
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
