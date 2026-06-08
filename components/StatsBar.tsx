import { FileText, Image, Clock, Download, TrendingUp } from 'lucide-react';
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
    { icon: FileText, label: 'Articles', value: stats.total.toString(), color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { icon: Image, label: 'Images', value: stats.imageCount.toString(), color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { icon: Download, label: 'DOCX Size', value: stats.docxSize || 'N/A', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { icon: Clock, label: 'Last Update', value: timeAgo, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="glass rounded-xl p-5 hover:bg-white/10 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className={`${item.bg} p-2.5 rounded-lg`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              {item.label === 'Articles' && stats.newCount > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  +{stats.newCount}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-white mb-1">{item.value}</div>
            <div className="text-sm text-slate-400">{item.label}</div>
          </div>
        );
      })}
    </div>
  );
}
