'use client';

import { useState, useEffect } from 'react';
import { Terminal, ChevronDown, ChevronUp, RefreshCw, Loader2 } from 'lucide-react';
import { type LogEntry } from '@/lib/types';

export default function LogsViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/logs');
      const data = await response.json() as { logs: LogEntry[] };
      setLogs(data.logs);
    } catch (error: unknown) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'success': return 'text-emerald-400';
      default: return 'text-slate-300';
    }
  };

  const getLogBg = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'bg-red-500/5';
      case 'success': return 'bg-emerald-500/5';
      default: return 'bg-transparent';
    }
  };

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-400" />
            <h2 className="text-xl font-bold text-white">Update Logs</h2>
          </div>
          {logs.length > 0 && (
            <span className="text-sm text-slate-400">
              {logs.length} entries
            </span>
          )}
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="max-h-[400px] overflow-y-auto">
          <div className="p-4 space-y-1">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No logs available
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 py-2 px-3 rounded-lg ${getLogBg(log.type)} text-sm font-mono`}
                >
                  <span className="text-slate-500 text-xs whitespace-nowrap flex-shrink-0">
                    {log.timestamp}
                  </span>
                  <span className={`${getLogColor(log.type)} break-all`}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
