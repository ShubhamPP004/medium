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
    <div className="group relative glass rounded-xl p-4 sm:p-5 transition-all duration-300 hover:bg-[var(--bg-card-hover)] hover:border-[var(--border-hover)] hover:translate-y-[-2px] overflow-hidden">
      {/* New badge */}
      {isNew && (
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-[var(--accent-emerald)]/15 border border-[var(--accent-emerald)]/30 text-[var(--accent-emerald)] text-[10px] font-bold tracking-wider px-3 py-1.5 rounded-bl-lg font-body uppercase">
            New
          </div>
        </div>
      )}

      {/* Subtle gradient line on hover */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-blue)]/0 to-transparent group-hover:via-[var(--accent-blue)]/40 transition-all duration-500" />

      <div className="flex items-start gap-4">
        {/* Number badge */}
        <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-[var(--accent-blue)]/8 border border-[var(--accent-blue)]/15 flex items-center justify-center group-hover:bg-[var(--accent-blue)]/15 group-hover:border-[var(--accent-blue)]/25 transition-all duration-300">
          <span className="font-mono-nums text-sm font-bold text-[var(--accent-blue)]">{index + 1}</span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-[var(--text-primary)] font-semibold text-sm sm:text-base leading-snug mb-2.5 font-body group-hover:text-[var(--accent-blue)] transition-colors duration-300 line-clamp-2">
            {article.title}
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-body">
            {tipsNum !== null && (
              <span className="flex items-center gap-1.5 text-[var(--accent-blue)]/80">
                <Hash className="w-3.5 h-3.5" />
                <span className="font-mono-nums font-medium">Tips #{tipsNum}</span>
              </span>
            )}
            {article.byline && (
              <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="truncate max-w-[120px] sm:max-w-[200px]">{article.byline}</span>
              </span>
            )}
            <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <Image className="w-3.5 h-3.5" />
              <span className="font-mono-nums">{article.images.length}</span>
            </span>
            {displayDate && (
              <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <Calendar className="w-3.5 h-3.5" />
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
          className="flex-shrink-0 p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--accent-blue)]/30 hover:bg-[var(--bg-elevated)] transition-all text-[var(--text-muted)] hover:text-[var(--accent-blue)] group/link"
          onClick={(e) => e.stopPropagation()}
        >
          <ArrowUpRight className="w-4 h-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-200" />
        </a>
      </div>
    </div>
  );
}
