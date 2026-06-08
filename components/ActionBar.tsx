'use client';

import { useState } from 'react';
import { Download, RefreshCw, CheckCircle, AlertCircle, Loader2, FileDown, ExternalLink, ChevronRight, Sparkles } from 'lucide-react';

interface NewArticle {
  title: string;
  url: string;
  pubDate: string | null;
}

interface CheckResult {
  success: boolean;
  checkedAt: string;
  feedCount: number;
  currentCount: number;
  newCount: number;
  hasNewArticles: boolean;
  newArticles: NewArticle[];
  error?: string;
}

interface ActionBarProps {
  docxExists: boolean;
  docxSize: string;
  onRefresh?: () => void;
}

export default function ActionBar({ docxExists, docxSize, onRefresh }: ActionBarProps) {
  const [downloading, setDownloading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);

    try {
      const res = await fetch('/api/download');
      const data = await res.json().catch(() => null);

      if (!data?.externalUrl) {
        throw new Error('Download URL not available');
      }

      const externalUrl = data.externalUrl;

      if ('showSaveFilePicker' in window) {
        try {
          const fileRes = await fetch(externalUrl);
          if (!fileRes.ok) {
            throw new Error(`Failed to fetch: ${fileRes.status}`);
          }
          const blob = await fileRes.blob();

          const handle = await (window as any).showSaveFilePicker({
            suggestedName: 'Marketing_Cloud_Next_Public.docx',
            startIn: 'downloads',
            types: [{
              description: 'Word Document',
              accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }
            }]
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          setDownloading(false);
          return;
        } catch (fsErr: any) {
          if (fsErr.name === 'AbortError') {
            setDownloading(false);
            return;
          }
        }
      }

      window.open(externalUrl, '_blank');
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleCheckUpdates = async () => {
    setChecking(true);
    setShowResults(true);
    setCheckResult(null);

    try {
      const res = await fetch('/api/check-updates');
      const data = await res.json() as CheckResult;
      setCheckResult(data);

      if (data.success && data.hasNewArticles && onRefresh) {
        onRefresh();
      }
    } catch (err) {
      setCheckResult({
        success: false,
        checkedAt: new Date().toISOString(),
        feedCount: 0,
        currentCount: 0,
        newCount: 0,
        hasNewArticles: false,
        newArticles: [],
        error: err instanceof Error ? err.message : 'Failed to check updates',
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={!docxExists || downloading}
          className="group relative flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold font-body text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.25) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
          }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[var(--accent-blue)]/10 to-[var(--accent-blue)]/5" />
          <div className="relative z-10 flex items-center gap-2.5">
            {downloading ? (
              <Loader2 className="w-5 h-5 text-[var(--accent-blue)] animate-spin" />
            ) : (
              <FileDown className="w-5 h-5 text-[var(--accent-blue)] group-hover:translate-y-[-1px] transition-transform" />
            )}
            <span className="text-[var(--text-primary)]">
              {downloading ? 'Downloading...' : `Download DOCX (${docxSize})`}
            </span>
          </div>
        </button>

        {/* Check Updates Button */}
        <button
          onClick={handleCheckUpdates}
          disabled={checking}
          className="group relative flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold font-body text-sm transition-all duration-300 disabled:opacity-50 active:scale-[0.97] overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.2) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
          }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[var(--accent-emerald)]/10 to-[var(--accent-emerald)]/5" />
          <div className="relative z-10 flex items-center gap-2.5">
            {checking ? (
              <Loader2 className="w-5 h-5 text-[var(--accent-emerald)] animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5 text-[var(--accent-emerald)] group-hover:rotate-180 transition-transform duration-500" />
            )}
            <span className="text-[var(--text-primary)]">
              {checking ? 'Checking...' : 'Check for Updates'}
            </span>
          </div>
        </button>
      </div>

      <p className="text-[11px] text-[var(--text-dim)] text-center font-body leading-relaxed">
        If a file exists with the same name, your browser may append &quot;(1)&quot;.
        Modern browsers (Chrome/Edge) open a save dialog where you can choose to overwrite.
      </p>

      {downloadError && (
        <div className="glass rounded-xl p-4 border-l-2 border-l-[var(--accent-rose)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--accent-rose)] mt-0.5 shrink-0" />
            <div>
              <p className="text-[var(--accent-rose)] font-medium font-body text-sm">Download Error</p>
              <p className="text-[var(--text-muted)] text-xs mt-1 font-body">{downloadError}</p>
            </div>
          </div>
        </div>
      )}

      {showResults && checkResult && (
        <div className="glass rounded-xl p-5 space-y-4 border-l-2 border-l-[var(--accent-emerald)] animate-enter">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {checkResult.success ? (
                checkResult.hasNewArticles ? (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-[var(--accent-emerald)]/10 border border-[var(--accent-emerald)]/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[var(--accent-emerald)]" />
                    </div>
                    <div>
                      <p className="text-[var(--accent-emerald)] font-semibold font-body text-sm">
                        {checkResult.newCount} new article{checkResult.newCount > 1 ? 's' : ''} found!
                      </p>
                      <p className="text-[var(--text-muted)] text-xs font-body">
                        Feed: {checkResult.feedCount} | Stored: {checkResult.currentCount}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-[var(--accent-blue)]" />
                    </div>
                    <div>
                      <p className="text-[var(--accent-blue)] font-semibold font-body text-sm">No new articles</p>
                      <p className="text-[var(--text-muted)] text-xs font-body">
                        Feed: {checkResult.feedCount} | Stored: {checkResult.currentCount}
                      </p>
                    </div>
                  </>
                )
              ) : (
                <>
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent-rose)]/10 border border-[var(--accent-rose)]/20 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-[var(--accent-rose)]" />
                  </div>
                  <div>
                    <p className="text-[var(--accent-rose)] font-semibold font-body text-sm">Check failed</p>
                    <p className="text-[var(--text-muted)] text-xs font-body">{checkResult.error}</p>
                  </div>
                </>
              )}
            </div>
            <p className="text-[10px] text-[var(--text-dim)] font-body">
              {new Date(checkResult.checkedAt).toLocaleTimeString()}
            </p>
          </div>

          {checkResult.newArticles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider font-body">New Articles</p>
              {checkResult.newArticles.map((article, i) => (
                <a
                  key={i}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--accent-emerald)]/30 hover:bg-[var(--bg-card-hover)] transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-[var(--accent-emerald)]/10 flex items-center justify-center shrink-0">
                    <ChevronRight className="w-4 h-4 text-[var(--accent-emerald)] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] font-body truncate">{article.title}</p>
                    {article.pubDate && (
                      <p className="text-[10px] text-[var(--text-muted)] font-body mt-0.5">
                        {new Date(article.pubDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-[var(--text-dim)] shrink-0 group-hover:text-[var(--accent-emerald)] transition-colors" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
