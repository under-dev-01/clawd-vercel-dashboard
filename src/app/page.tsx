'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';
import { LoadingSpinner, LoadingOverlay } from '@/components/Loading';
import { useErrorToast } from '@/components/ErrorToast';
import type { 
  SystemStats, 
  AIStats, 
  FileItem, 
  SearchResult, 
  PreviewData 
} from '@/types';

type View = 'overview' | 'files' | 'ai';

export default function Dashboard() {
  // Auth state
  const [pwd, setPwd] = useState('');
  const [auth, setAuth] = useState(false);

  // UI state
  const [view, setView] = useState<View>('overview');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Data state
  const [system, setSystem] = useState<SystemStats | null>(null);
  const [ai, setAi] = useState<AIStats | null>(null);
  const [path, setPath] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  
  // Search state
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Preview state
  const [preview, setPreview] = useState<PreviewData | null>(null);

  // Error handling
  const { showError, ErrorComponent } = useErrorToast();
  const { fetchApi, error: apiError } = useApi({ password: pwd });

  // Check for saved password on mount
  useEffect(() => {
    const savedPwd = localStorage.getItem('cpwd');
    if (savedPwd) {
      setPwd(savedPwd);
      setAuth(true);
    }
    setInitialLoading(false);
  }, []);

  // Show API errors
  useEffect(() => {
    if (apiError) {
      showError(apiError.message);
    }
  }, [apiError, showError]);

  // Load data when authenticated
  useEffect(() => {
    if (auth) {
      loadAll();
    }
  }, [auth]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setPreview(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Search debounce
  useEffect(() => {
    if (!search) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const data = await fetchApi<{ results: SearchResult[] }>(`/api/files/search?q=${encodeURIComponent(search)}`);
      if (data) setSearchResults(data.results || []);
    }, 200);
    return () => clearTimeout(timer);
  }, [search, fetchApi]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [sysData, aiData] = await Promise.all([
      fetchApi<SystemStats & { success: boolean }>('/api/system'),
      fetchApi<AIStats & { success: boolean }>('/api/ai/stats?hours=24')
    ]);
    
    if (sysData) setSystem(sysData);
    if (aiData) setAi(aiData);
    
    if (view === 'files') {
      await loadFiles(path);
    }
    setLoading(false);
  }, [fetchApi, view, path]);

  const loadFiles = useCallback(async (p: string) => {
    const data = await fetchApi<{ items: FileItem[]; path: string }>(
      `/api/files?path=${encodeURIComponent(p)}`
    );
    if (data) {
      setPath(data.path);
      setFiles((data.items || []).sort((a: FileItem, b: FileItem) => 
        a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1
      ));
    }
  }, [fetchApi]);

  const openPreview = useCallback(async (p: string) => {
    const data = await fetchApi<PreviewData>(`/api/files/preview?path=${encodeURIComponent(p)}`);
    if (data) setPreview({ ...data, path: p });
  }, [fetchApi]);

  const download = useCallback((p: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
    if (!API_URL) return;
    window.open(`${API_URL}/api/files/download?path=${encodeURIComponent(p)}&pwd=${encodeURIComponent(pwd)}`);
  }, [pwd]);

  const login = useCallback(() => {
    localStorage.setItem('cpwd', pwd);
    setAuth(true);
  }, [pwd]);

  const logout = useCallback(() => {
    localStorage.removeItem('cpwd');
    setAuth(false);
    setPwd('');
  }, []);

  // Format helpers
  const fmt = useCallback((n: number) => {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toString();
  }, []);

  const fmtBytes = useCallback((b: number | null) => {
    if (!b) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(1024));
    return (b / Math.pow(1024, i)).toFixed(1) + units[i];
  }, []);

  const fmtCost = useCallback((c: number) => c > 0 ? `$${c.toFixed(2)}` : '$0.00', []);

  // Initial loading
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Login screen
  if (!auth) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="w-full max-w-xs">
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">⚡</div>
            <h1 className="text-xl font-semibold text-neutral-800">clawd dashboard</h1>
          </div>
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            placeholder="password"
            className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-900 mb-3 focus:outline-none focus:ring-2 focus:ring-neutral-300"
            autoFocus
          />
          <button 
            onClick={login} 
            className="w-full py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition"
          >
            enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {loading && <LoadingOverlay />}
      {ErrorComponent}

      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold text-neutral-800">⚡ clawd</span>
            <nav className="flex gap-1">
              {(['overview', 'ai', 'files'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => { 
                    setView(v); 
                    if (v === 'files') loadFiles(''); 
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition capitalize ${
                    view === v ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {v}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSearchOpen(true)} 
              className="px-3 py-1.5 text-sm text-neutral-500 bg-neutral-100 rounded-lg hover:bg-neutral-200 flex items-center gap-2"
            >
              search <kbd className="text-xs bg-neutral-200 px-1 rounded">/</kbd>
            </button>
            <button 
              onClick={loadAll} 
              className="p-2 text-neutral-500 hover:text-neutral-700"
              aria-label="Refresh"
            >
              {loading ? <LoadingSpinner size="sm" /> : '↻'}
            </button>
            <button 
              onClick={logout}
              className="p-2 text-neutral-400 hover:text-neutral-600"
              aria-label="Logout"
            >
              →
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Overview */}
        {view === 'overview' && (
          <div className="space-y-6">
            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                label="Disk" 
                value={system?.disk.pct || '—'} 
                subtext={`${system?.disk.used || '—'} / ${system?.disk.total || '—'}`}
              />
              <StatCard 
                label="Memory" 
                value={system?.mem.used || '—'} 
                subtext={`of ${system?.mem.total || '—'}`}
              />
              <StatCard 
                label="Tokens (24h)" 
                value={ai ? fmt(ai.tokens.total) : '—'} 
                subtext={`${ai?.messages || 0} messages`}
              />
              <StatCard 
                label="Cost (24h)" 
                value={ai ? fmtCost(ai.cost.total) : '—'} 
                subtext={`${ai?.sessions || 0} sessions`}
              />
            </div>

            {/* Provider breakdown */}
            {ai && Object.keys(ai.byProvider).length > 0 && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide mb-4">
                  By Provider
                </h2>
                <div className="space-y-3">
                  {Object.entries(ai.byProvider)
                    .filter(([_, d]) => d.tokens > 0)
                    .sort((a, b) => b[1].tokens - a[1].tokens)
                    .map(([provider, data]) => (
                      <div key={provider} className="flex items-center gap-4">
                        <div className="w-32 text-sm font-medium text-neutral-700 capitalize">
                          {provider}
                        </div>
                        <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <ProgressBar 
                            value={data.tokens} 
                            max={ai.tokens.total} 
                            color={getProviderColor(provider)}
                          />
                        </div>
                        <div className="w-20 text-right text-sm text-neutral-600">
                          {fmt(data.tokens)}
                        </div>
                        <div className="w-16 text-right text-sm text-neutral-500">
                          {fmtCost(data.cost)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* System info */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6">
              <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide mb-4">
                System
              </h2>
              <div className="text-sm text-neutral-600">{system?.uptime || 'Loading...'}</div>
            </div>
          </div>
        )}

        {/* AI Stats */}
        {view === 'ai' && ai && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Input Tokens" value={fmt(ai.tokens.input)} />
              <StatCard label="Output Tokens" value={fmt(ai.tokens.output)} />
              <StatCard label="Total Cost" value={fmtCost(ai.cost.total)} />
              <StatCard label="Sessions" value={ai.sessions.toString()} />
            </div>

            {/* Model breakdown */}
            {Object.keys(ai.byModel).length > 0 && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide mb-4">
                  By Model
                </h2>
                <div className="space-y-2">
                  {Object.entries(ai.byModel)
                    .filter(([_, d]) => d.tokens > 0)
                    .sort((a, b) => b[1].tokens - a[1].tokens)
                    .map(([model, data]) => (
                      <div 
                        key={model} 
                        className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0"
                      >
                        <div className="text-sm font-mono text-neutral-700">{model}</div>
                        <div className="flex items-center gap-6">
                          <span className="text-sm text-neutral-600">{fmt(data.tokens)} tokens</span>
                          <span className="text-sm text-neutral-500">{data.messages} msgs</span>
                          <span className="text-sm text-neutral-500">{fmtCost(data.cost)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            {ai.hourlyArray.length > 0 && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide mb-4">
                  Timeline (Last 24h)
                </h2>
                <div className="flex items-end gap-1 h-32">
                  {ai.hourlyArray.slice(-24).map((h, i) => {
                    const max = Math.max(...ai.hourlyArray.map(x => x.tokens));
                    const pct = max > 0 ? (h.tokens / max) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center group relative">
                        <div 
                          className="w-full bg-blue-400 rounded-t hover:bg-blue-500 transition"
                          style={{ height: `${Math.max(pct, 2)}%` }}
                        />
                        <div className="absolute bottom-full mb-1 hidden group-hover:block bg-neutral-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                          {h.hour}: {fmt(h.tokens)} tokens
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-neutral-400">
                  <span>24h ago</span>
                  <span>now</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Files */}
        {view === 'files' && (
          <div className="space-y-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm">
              <button 
                onClick={() => loadFiles('')} 
                className="text-neutral-500 hover:text-neutral-800 font-medium"
              >
                ~
              </button>
              {path.split('/').filter(Boolean).map((c, i, arr) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="text-neutral-300">/</span>
                  <button 
                    onClick={() => loadFiles(arr.slice(0, i + 1).join('/'))} 
                    className="text-neutral-500 hover:text-neutral-800 font-medium"
                  >
                    {c}
                  </button>
                </span>
              ))}
            </div>

            {/* File list */}
            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
              {files.length === 0 ? (
                <div className="px-4 py-12 text-center text-neutral-400">empty</div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {files.map((f) => {
                    const fp = path ? `${path}/${f.name}` : f.name;
                    return (
                      <div
                        key={f.name}
                        className="flex items-center px-4 py-3 hover:bg-neutral-50 cursor-pointer"
                        onClick={() => f.type === 'dir' ? loadFiles(fp) : openPreview(fp)}
                      >
                        <span className="w-8 text-neutral-400">
                          {f.type === 'dir' ? '📁' : '·'}
                        </span>
                        <span className={`flex-1 text-sm ${
                          f.type === 'dir' ? 'text-blue-600 font-medium' : 'text-neutral-700'
                        }`}>
                          {f.name}
                        </span>
                        <span className="text-xs text-neutral-400 w-16 text-right">
                          {fmtBytes(f.size)}
                        </span>
                        {f.type === 'file' && (
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              download(fp); 
                            }} 
                            className="ml-3 text-neutral-400 hover:text-neutral-600"
                            aria-label="Download"
                          >
                            ↓
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Search Modal */}
      {searchOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-50 flex items-start justify-center pt-20" 
          onClick={() => setSearchOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files..."
              className="w-full px-4 py-4 text-lg border-b border-neutral-100 focus:outline-none"
              autoFocus
            />
            <div className="max-h-80 overflow-y-auto">
              {searchResults.map((r, i) => (
                <div
                  key={i}
                  className="px-4 py-3 hover:bg-neutral-50 cursor-pointer"
                  onClick={() => { 
                    if (r.type === 'dir') {
                      loadFiles(r.path);
                    } else {
                      openPreview(r.path);
                    }
                    setSearchOpen(false);
                    setSearch('');
                    setView('files');
                  }}
                >
                  <div className="text-sm font-medium text-neutral-800">{r.name}</div>
                  <div className="text-xs text-neutral-400">{r.path}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div 
          className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4" 
          onClick={() => setPreview(null)}
        >
          <div 
            className="bg-white w-full max-w-4xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col" 
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
              <span className="font-medium text-neutral-800 truncate">{preview.path}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => download(preview.path)} 
                  className="text-sm px-3 py-1 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200"
                >
                  download
                </button>
                <button 
                  onClick={() => setPreview(null)} 
                  className="text-neutral-400 hover:text-neutral-600"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-neutral-50">
              {preview.type === 'image' && preview.data && (
                <img src={preview.data} alt="" className="max-w-full mx-auto" />
              )}
              {preview.type === 'text' && (
                <pre className="text-sm font-mono text-neutral-700 whitespace-pre-wrap">
                  {preview.content}
                </pre>
              )}
              {preview.type === 'binary' && (
                <div className="text-center py-12 text-neutral-400">Binary file</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Component helpers
function StatCard({ 
  label, 
  value, 
  subtext 
}: { 
  label: string; 
  value: string; 
  subtext?: string;
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4">
      <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-semibold text-neutral-900">{value}</div>
      {subtext && <div className="text-sm text-neutral-500">{subtext}</div>}
    </div>
  );
}

function ProgressBar({ 
  value, 
  max, 
  color 
}: { 
  value: number; 
  max: number; 
  color: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div 
      className={`h-full rounded-full ${color}`}
      style={{ width: `${pct}%` }}
    />
  );
}

function getProviderColor(provider: string): string {
  const colors: Record<string, string> = {
    'anthropic': 'bg-orange-400',
    'kimi-coding': 'bg-blue-400',
    'openai': 'bg-green-400',
    'google': 'bg-red-400'
  };
  return colors[provider] || 'bg-neutral-400';
}
