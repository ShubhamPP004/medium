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
      color: 'var(--accent-blue)',
      glow: 'var(--accent-blue-glow)',
      iconBg: 'bg-[var(--accent-blue)]/10',
      borderColor: 'border-[var(--accent-blue)]/20',
    },
    {
      icon: Image,
      label: 'Images',
      value: stats.imageCount.toLocaleString(),
      suffix: '',
      color: 'var(--accent-emerald)',
      glow: 'var(--accent-emerald-glow)',
      iconBg: 'bg-[var(--accent-emerald)]/10',
      borderColor: 'border-[var(--accent-emerald)]/20',
    },
    {
      icon: Download,
      label: 'DOCX Size',
      value: stats.docxSize || 'N/A',
      suffix: '',
      color: 'var(--accent-amber)',
      glow: 'var(--accent-amber-glow)',
      iconBg: 'bg-[var(--accent-amber)]/10',
      borderColor: 'border-[var(--accent-amber)]/20',
    },
    {
      icon: Clock,
      label: 'Last Update',
      value: timeAgo,
      suffix: '',
      color: 'var(--text-muted)',
      glow: 'transparent',
      iconBg: 'bg-[var(--text-dim)]/20',
      borderColor: 'border-[var(--border-default)]',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="group relative glass rounded-xl p-5 transition-all duration-300 hover:border-[var(--border-hover)] overflow-hidden"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            {/* Hover glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"
              style={{ boxShadow: `inset 0 0 40px ${item.glow}` }}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`${item.iconBg} ${item.borderColor} border p-2 rounded-lg transition-all duration-300 group-hover:scale-110`}>
                  <Icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                {item.suffix && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-[var(--accent-emerald)] bg-[var(--accent-emerald)]/10 px-2.5 py-1 rounded-full border border-[var(--accent-emerald)]/20">
                    <TrendingUp className="w-3 h-3" />
                    {item.suffix}
                  </span>
                )}
              </div>
              <div className="font-mono-nums text-2xl font-bold text-[var(--text-primary)] mb-1 tracking-tight">
                {item.value}
              </div>
              <div className="text-xs font-body text-[var(--text-muted)] tracking-wide uppercase">
                {item.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
