import { ExternalLink, Image, BookOpen, Hash, Calendar } from 'lucide-react';
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
      return new Date(article.pubDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  }, [article.pubDate]);

  return (
    <div className="group glass rounded-xl p-5 hover:bg-white/10 transition-all duration-300 hover:scale-[1.01] relative overflow-hidden">
      {isNew && (
        <div className="absolute top-0 right-0">
          <div className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-bl-lg">NEW</div>
        </div>
      )}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#2E75B6]/20 flex items-center justify-center text-[#2E75B6] font-bold text-lg">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-base leading-snug mb-2 group-hover:text-blue-300 transition-colors">
            {article.title}
          </h3>
          <div className="flex items-center gap-3 text-sm text-slate-400 flex-wrap">
            {tipsNum !== null && (
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-blue-400 font-medium">Tips #{tipsNum}</span>
              </span>
            )}
            {article.byline && (
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                {article.byline}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5" />
              {article.images.length} images
            </span>
            {displayDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {displayDate}
              </span>
            )}
          </div>
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
