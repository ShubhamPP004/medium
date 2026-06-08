export interface Article {
  url: string;
  title: string;
  byline: string;
  markdown: string;
  images: string[];
  guid?: string;
  pubDate?: string;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

export interface DashboardData {
  articles: Article[];
  total: number;
  newCount: number;
  lastUpdate: string | null;
  docxSize: string | null;
  docxExists: boolean;
  imageCount: number;
  error?: string;
}

export interface RegenerateResponse {
  success: boolean;
  output: string;
  error: string | null;
}
