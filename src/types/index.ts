/**
 * Dashboard TypeScript type definitions
 */

export interface SystemStats {
  disk: {
    total: string;
    used: string;
    avail: string;
    pct: string;
  };
  mem: {
    total: string;
    used: string;
    free: string;
    avail: string;
  };
  uptime: string;
}

export interface AIStats {
  period: string;
  sessions: number;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: {
    input: number;
    output: number;
    total: number;
  };
  messages: number;
  byProvider: Record<string, ProviderStats>;
  byModel: Record<string, ModelStats>;
  hourlyArray: HourlyData[];
}

export interface ProviderStats {
  tokens: number;
  messages: number;
  cost: number;
}

export interface ModelStats {
  tokens: number;
  messages: number;
  cost: number;
}

export interface HourlyData {
  hour: string;
  tokens: number;
  byProvider: Record<string, number>;
}

export interface FileItem {
  name: string;
  type: 'dir' | 'file';
  size: number | null;
  mtime: string;
  ext: string | null;
}

export interface SearchResult {
  name: string;
  path: string;
  type: 'dir' | 'file';
}

export interface PreviewData {
  path: string;
  type: 'image' | 'text' | 'binary';
  data?: string;
  mime?: string;
  content?: string;
  message?: string;
  ext?: string;
}

export interface ApiError {
  message: string;
  code: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  error?: ApiError;
  data?: T;
}
