'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Zap, Globe, Activity, Clock, ArrowUpRight, Sparkles } from 'lucide-react';
import StatsBar from '@/components/StatsBar';
import ActionBar from '@/components/ActionBar';
import ArticleList from '@/components/ArticleList';
import ThemeToggle from '@/components/ThemeToggle';

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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-deep)]">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-[2.5px] border-[var(--border-default)] border-t-[var(--accent-blue)] animate-spin" />
          </div>
          <p className="text-[var(--text-muted)] text-sm font-body">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-deep)] px-4">
        <div className="text-center max-w-md animate-enter">
          <div className="w-14 h-14 rounded-xl bg-[var(--accent-rose-muted)] border border-[var(--accent-rose-border)] flex items-center justify-center mx-auto mb-4">
            <Activity className="w-6 h-6 text-[var(--accent-rose-text)]" />
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2 font-display tracking-tight">Error Loading Data</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-5 font-body">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 rounded-lg bg-[var(--accent-blue-muted)] border border-[var(--accent-blue-border)] text-[var(--accent-blue)] font-semibold text-sm hover:bg-[var(--accent-blue)]/10 transition-colors font-body"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      {/* Header */}
      <header className="border-b border-[var(--border-default)] sticky top-0 z-50 bg-[var(--bg-deep)]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-blue-muted)] border border-[var(--accent-blue-border)] flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-[var(--accent-blue)]" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-[var(--text-primary)] font-display tracking-tight leading-tight">
                  Marketing Cloud <span className="text-[var(--accent-blue)]">Next</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-body">
                <Sparkles className="w-3 h-3 text-[var(--accent-amber-text)]" />
                <span>Auto-updates daily at 6:00 AM IST</span>
              </div>
              <a
                href="https://medium.com/@marketingcloudtips"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)] transition-all text-xs text-[var(--text-muted)] font-body"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Medium</span>
                <ArrowUpRight className="w-3 h-3 text-[var(--text-dim)]" />
              </a>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Status Banner */}
        <div className="animate-enter animate-enter-delay-1">
          {stats.newCount > 0 ? (
            <div className="card rounded-xl p-4 flex items-center gap-4 border-l-2 border-l-[var(--accent-emerald-text)]">
              <div className="w-9 h-9 rounded-lg bg-[var(--accent-emerald-muted)] border border-[var(--accent-emerald-border)] flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-[var(--accent-emerald-text)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--accent-emerald)] font-semibold font-body text-sm">
                  {stats.newCount} new article{stats.newCount > 1 ? 's' : ''} detected
                </p>
                <p className="text-[var(--text-muted)] text-xs mt-0.5 font-body">
                  Last updated: {stats.lastUpdate}
                </p>
              </div>
            </div>
          ) : (
            <div className="card rounded-xl p-4 flex items-center gap-4 border-l-2 border-l-[var(--accent-blue)]">
              <div className="w-9 h-9 rounded-lg bg-[var(--accent-blue-muted)] border border-[var(--accent-blue-border)] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-[var(--accent-blue)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--accent-blue)] font-semibold font-body text-sm">All articles up to date</p>
                <p className="text-[var(--text-muted)] text-xs mt-0.5 font-body">
                  Last checked: {stats.lastUpdate}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="animate-enter animate-enter-delay-2">
          <StatsBar stats={stats} />
        </div>

        {/* Actions */}
        <div className="animate-enter animate-enter-delay-3">
          <ActionBar docxExists={stats.docxExists} docxSize={stats.docxSize} onRefresh={refreshData} />
        </div>

        {/* Articles */}
        <div className="animate-enter animate-enter-delay-4">
          <ArticleList articles={articles} newCount={stats.newCount} />
        </div>

        {/* Footer */}
        <footer className="text-center py-6 border-t border-[var(--border-default)] animate-enter animate-enter-delay-5">
          <p className="text-[11px] text-[var(--text-dim)] font-body">
            Built for{' '}
            <a
              href="https://medium.com/@marketingcloudtips"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-blue)] hover:text-[var(--accent-blue-hover)] transition-colors"
            >
              @marketingcloudtips
            </a>
            {' '}— Auto-updates via RSS feed
          </p>
        </footer>
      </main>
    </div>
  );
}
