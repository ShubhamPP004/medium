import { ExternalLink, Image, BookOpen, Hash, Calendar, ArrowUpRight } from 'lucide-react';
import { useMemo } from 'react';

interface ArticleCardProps {
  article: {
    url: string;
    title: string;
    byline: string;
    images: string[];
    pubDate?: string;
  };
  index: number;
  isNew?: boolean;
}

export default function ArticleCard({ article, index, isNew }: ArticleCardProps) {
  const tipsNum = useMemo(() => {
    const match = article.title.match(/SFMC Tips #(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }, [article.title]);

  const displayDate = useMemo(() => {
    if (!article.pubDate) return null;
    try {
      const date = new Date(article.pubDate);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  }, [article.pubDate]);

  return (
    <div className="card card-hover rounded-lg p-4 sm:p-5 group">
      {/* New badge */}
      {isNew && (
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-[var(--accent-emerald-muted)] border border-[var(--accent-emerald-border)] text-[var(--accent-emerald)] text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-bl-lg font-body uppercase">
            New
          </div>
        </div>
      )}

      <div className="flex items-start gap-3.5">
        {/* Number badge */}
        <div className="flex-shrink-0 w-9 h-9 rounded-md bg-[var(--accent-blue-muted)] border border-[var(--accent-blue-border)] flex items-center justify-center transition-all duration-200 group-hover:bg-[var(--accent-blue)]/15 group-hover:border-[var(--accent-blue)]/30">
          <span className="font-mono-nums text-sm font-bold text-[var(--accent-blue)]">{index + 1}</span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-[var(--text-primary)] font-semibold text-sm sm:text-[15px] leading-snug mb-2.5 font-body group-hover:text-[var(--accent-blue)] transition-colors duration-200 line-clamp-2">
            {article.title}
          </h3>

          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[11px] font-body">
            {tipsNum !== null && (
              <span className="flex items-center gap-1.5 text-[var(--accent-blue)]">
                <Hash className="w-3 h-3" />
                <span className="font-mono-nums font-medium">Tips #{tipsNum}</span>
              </span>
            )}
            {article.byline && (
              <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <BookOpen className="w-3 h-3" />
                <span className="truncate max-w-[100px] sm:max-w-[180px]">{article.byline}</span>
              </span>
            )}
            <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <Image className="w-3 h-3" />
              <span className="font-mono-nums">{article.images.length}</span>
            </span>
            {displayDate && (
              <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <Calendar className="w-3 h-3" />
                <span>{displayDate}</span>
              </span>
            )}
          </div>
        </div>

        {/* External link */}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 p-2 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:border-[var(--accent-blue-border)] hover:bg-[var(--bg-card-hover)] transition-all text-[var(--text-muted)] hover:text-[var(--accent-blue)] group/link"
          onClick={(e) => e.stopPropagation()}
        >
          <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-200" />
        </a>
      </div>
    </div>
  );
}
