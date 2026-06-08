import { FileText, Image, Download, Clock, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

interface Stats {
  total: number;
  newCount: number;
  imageCount: number;
  docxSize: string;
  docxExists: boolean;
  lastUpdate: string;
}

interface StatsBarProps {
  stats: Stats;
}

export default function StatsBar({ stats }: StatsBarProps) {
  const timeAgo = useMemo(() => {
    if (!stats.lastUpdate || stats.lastUpdate === 'Never') return 'Never';
    try {
      const date = new Date(stats.lastUpdate);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays > 0) return `${diffDays}d ago`;
      if (diffHours > 0) return `${diffHours}h ago`;
      return 'Just now';
    } catch {
      return stats.lastUpdate;
    }
  }, [stats.lastUpdate]);

  const items = [
    {
      icon: FileText,
      label: 'Articles',
      value: stats.total.toString(),
      suffix: stats.newCount > 0 ? `+${stats.newCount}` : '',
      accent: 'var(--accent-blue)',
      accentText: 'var(--accent-blue)',
      accentMuted: 'var(--accent-blue-muted)',
      accentBorder: 'var(--accent-blue-border)',
    },
    {
      icon: Image,
      label: 'Images',
      value: stats.imageCount.toLocaleString(),
      suffix: '',
      accent: 'var(--accent-emerald)',
      accentText: 'var(--accent-emerald-text)',
      accentMuted: 'var(--accent-emerald-muted)',
      accentBorder: 'var(--accent-emerald-border)',
    },
    {
      icon: Download,
      label: 'DOCX Size',
      value: stats.docxSize || 'N/A',
      suffix: '',
      accent: 'var(--accent-amber)',
      accentText: 'var(--accent-amber-text)',
      accentMuted: 'var(--accent-amber-muted)',
      accentBorder: 'var(--accent-amber-border)',
    },
    {
      icon: Clock,
      label: 'Last Update',
      value: timeAgo,
      suffix: '',
      accent: 'var(--text-muted)',
      accentText: 'var(--text-muted)',
      accentMuted: 'var(--bg-elevated)',
      accentBorder: 'var(--border-default)',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="card card-hover rounded-xl p-5 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="p-2 rounded-lg border transition-colors duration-200"
                style={{
                  background: item.accentMuted,
                  borderColor: item.accentBorder,
                  color: item.accentText,
                }}
              >
                <Icon className="w-5 h-5" />
              </div>
              {item.suffix && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--accent-emerald)] bg-[var(--accent-emerald-muted)] px-2 py-1 rounded-full border border-[var(--accent-emerald-border)] font-body">
                  <TrendingUp className="w-3 h-3" />
                  {item.suffix}
                </span>
              )}
            </div>
            <div className="font-mono-nums text-2xl font-bold text-[var(--text-primary)] mb-1 tracking-tight">
              {item.value}
            </div>
            <div className="text-[11px] font-body text-[var(--text-muted)] tracking-wider uppercase">
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
