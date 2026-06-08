'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Zap, Globe, Activity, Clock, RefreshCw } from 'lucide-react';
import StatsBar from '@/components/StatsBar';
import ActionBar from '@/components/ActionBar';
import ArticleList from '@/components/ArticleList';

interface Article {
  url: string;
  title: string;
  byline: string;
  images: string[];
  pubDate?: string;
}

interface Stats {
  total: number;
  newCount: number;
  imageCount: number;
  docxSize: string;
  docxExists: boolean;
  lastUpdate: string;
}

export default function Dashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [articlesRes, statsRes] = await Promise.all([
          fetch('/api/articles'),
          fetch('/api/stats'),
        ]);

        if (!articlesRes.ok) throw new Error('Failed to load articles');
        if (!statsRes.ok) throw new Error('Failed to load stats');

        const articlesData = await articlesRes.json() as Article[];
        const statsData = await statsRes.json() as Stats;

        setArticles(articlesData);
        setStats(statsData);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load data';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const refreshData = async () => {
    try {
      const [articlesRes, statsRes] = await Promise.all([
        fetch('/api/articles'),
        fetch('/api/stats'),
      ]);
      if (articlesRes.ok) {
        const articlesData = await articlesRes.json() as Article[];
        setArticles(articlesData);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json() as Stats;
        setStats(statsData);
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-400/20 border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Data</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl bg-[#2E75B6] text-white font-semibold hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#2E75B6]/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-[#2E75B6]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Marketing Cloud Next</h1>
                <p className="text-sm text-slate-400">Article Collection Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Auto-updates daily at 6:00 AM</span>
              </div>
              <a
                href="https://medium.com/@marketingcloudtips"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-slate-300"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Medium</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Status Banner */}
        {stats.newCount > 0 ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-emerald-400 font-medium">
                {stats.newCount} new article{stats.newCount > 1 ? 's' : ''} detected!
              </p>
              <p className="text-emerald-400/70 text-sm">Last updated: {stats.lastUpdate}</p>
            </div>
          </div>
        ) : (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-blue-400 font-medium">All articles up to date</p>
              <p className="text-blue-400/70 text-sm">Last checked: {stats.lastUpdate}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <StatsBar stats={stats} />

        {/* Actions */}
        <ActionBar docxExists={stats.docxExists} docxSize={stats.docxSize} onRefresh={refreshData} />
        {/* Articles */}
        <ArticleList articles={articles} newCount={stats.newCount} />

        {/* Footer */}
        <footer className="text-center text-sm text-slate-500 py-8">
          <p>
            Built for{' '}
            <a
              href="https://medium.com/@marketingcloudtips"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              @marketingcloudtips
            </a>
            {' '}— Auto-updates via RSS feed
          </p>
          <p className="mt-2 text-xs text-slate-600">
            Use the Check for Updates button above to detect new articles via RSS feed
          </p>
        </footer>
      </main>
    </div>
  );
}
