'use client';

import { useState } from 'react';
import { Download, RefreshCw, CheckCircle, AlertCircle, Loader2, Globe, FileDown, ExternalLink } from 'lucide-react';

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

      // Use File System Access API when available to let user choose overwrite
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
            return; // user cancelled
          }
          // fall through to fallback on CORS or other errors
        }
      }

      // Fallback: open in new tab (browser handles download with default behavior)
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
    setDownloadError(null);
    
    try {
      const res = await fetch('/api/check-updates');
      const data = await res.json();
      setCheckResult(data);
      
      if (data.hasNewArticles && onRefresh) {
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
        <button
          onClick={handleDownload}
          disabled={!docxExists || downloading}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#2E75B6] text-white font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {downloading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <FileDown className="w-5 h-5" />
          )}
          <span>{downloading ? 'Downloading...' : `Download DOCX (${docxSize})`}</span>
        </button>

        <button
          onClick={handleCheckUpdates}
          disabled={checking}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-semibold hover:bg-emerald-600/30 transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          {checking ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <RefreshCw className="w-5 h-5" />
          )}
          <span>{checking ? 'Checking...' : 'Check for Updates'}</span>
        </button>
      </div>

      <p className="text-xs text-white/40 text-center">
        If a file with the same name exists, your browser may append &quot;(1)&quot;.
        Modern browsers (Chrome/Edge) will open a save dialog where you can choose to overwrite.
      </p>

      {downloadError && (
        <div className="glass rounded-xl p-4 border border-red-500/20 bg-red-500/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-red-400 font-medium">Download Error</p>
              <p className="text-red-400/70 text-sm mt-1">{downloadError}</p>
              <p className="text-red-400/50 text-xs mt-2">
                Make sure the DOCX file is in the public/ folder before deploying.
              </p>
            </div>
          </div>
        </div>
      )}

      {showResults && checkResult && (
        <div className="glass rounded-xl p-6 space-y-4 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {checkResult.success ? (
                checkResult.hasNewArticles ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-emerald-400 font-medium">
                        {checkResult.newCount} new article{checkResult.newCount > 1 ? 's' : ''} found!
                      </p>
                      <p className="text-emerald-400/70 text-sm">
                        RSS feed has {checkResult.feedCount} articles · You have {checkResult.currentCount}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-blue-400 font-medium">All articles up to date</p>
                      <p className="text-blue-400/70 text-sm">
                        RSS feed has {checkResult.feedCount} articles · No new articles detected
                      </p>
                    </div>
                  </>
                )
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-red-400 font-medium">Check failed</p>
                    <p className="text-red-400/70 text-sm">{checkResult.error}</p>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setShowResults(false)}
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              Hide
            </button>
          </div>

          {checkResult.hasNewArticles && checkResult.newArticles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">New articles detected:</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {checkResult.newArticles.map((article, idx) => (
                  <a
                    key={idx}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                  >
                    <Globe className="w-4 h-4 text-slate-400 mt-0.5 shrink-0 group-hover:text-emerald-400 transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 group-hover:text-white transition-colors truncate">
                        {article.title}
                      </p>
                      {article.pubDate && (
                        <p className="text-xs text-slate-500 mt-0.5">{article.pubDate}</p>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                To add these articles to your DOCX, run the local auto-update script or add them manually.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
