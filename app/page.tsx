'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Zap, Globe, Activity, Clock, ArrowUpRight, Sparkles } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-deep)]">
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-[3px] border-[var(--accent-blue-glow)] border-t-[var(--accent-blue)] animate-spin" />
            <div className="absolute inset-2 rounded-full border-[2px] border-[var(--accent-emerald-glow)] border-b-[var(--accent-emerald)] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="text-[var(--text-muted)] font-body">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-deep)] px-4">
        <div className="text-center max-w-md animate-enter">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent-rose-glow)] border border-[var(--accent-rose)]/20 flex items-center justify-center mx-auto mb-5">
            <Activity className="w-7 h-7 text-[var(--accent-rose)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2 font-display">Error Loading Data</h2>
          <p className="text-[var(--text-secondary)] mb-5">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 text-[var(--accent-blue)] font-semibold hover:bg-[var(--accent-blue)]/20 transition-all font-body"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-deep)] bg-radial-glow bg-noise relative">
      {/* Ambient background elements */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-[var(--accent-blue)]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-80 h-80 bg-[var(--accent-emerald)]/4 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-[var(--border-default)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4 animate-enter">
              <div className="relative w-11 h-11 rounded-xl bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 flex items-center justify-center overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-blue)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <BookOpen className="w-5 h-5 text-[var(--accent-blue)] relative z-10" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-display tracking-tight">
                  Marketing Cloud <span className="text-gradient">Next</span>
                </h1>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] font-body mt-0.5">Article Collection Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-full px-3 py-1.5">
                <Sparkles className="w-3 h-3 text-[var(--accent-amber)]" />
                <span>Auto-updates daily at 6:00 AM IST</span>
              </div>
              <a
                href="https://medium.com/@marketingcloudtips"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card)] transition-all text-sm text-[var(--text-secondary)] font-body group"
              >
                <Globe className="w-4 h-4 group-hover:text-[var(--accent-blue)] transition-colors" />
                <span className="hidden sm:inline">Medium</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-dim)] group-hover:text-[var(--accent-blue)] transition-colors" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Status Banner */}
        <div className="animate-enter animate-enter-delay-1">
          {stats.newCount > 0 ? (
            <div className="glass rounded-xl p-4 sm:p-5 flex items-center gap-4 border-l-2 border-l-[var(--accent-emerald)]">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-emerald)]/10 border border-[var(--accent-emerald)]/20 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-[var(--accent-emerald)]" />
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
            <div className="glass rounded-xl p-4 sm:p-5 flex items-center gap-4 border-l-2 border-l-[var(--accent-blue)]">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-[var(--accent-blue)]" />
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
        <footer className="text-center py-8 border-t border-[var(--border-default)] animate-enter animate-enter-delay-5">
          <p className="text-xs text-[var(--text-dim)] font-body">
            Built for{' '}
            <a
              href="https://medium.com/@marketingcloudtips"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-blue)] hover:text-[var(--accent-blue)]/80 transition-colors"
            >
              @marketingcloudtips
            </a>
            {' '}— Auto-updates via RSS feed
          </p>
          <p className="text-[10px] text-[var(--text-dim)]/60 mt-1.5 font-body">
            Use the Check for Updates button above to detect new articles via RSS feed
          </p>
        </footer>
      </main>
    </div>
  );
}
