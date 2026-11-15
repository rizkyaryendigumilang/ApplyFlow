import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Clock,
  Filter,
  ArrowUpDown,
  Bookmark,
  Building,
  Briefcase,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import type { Application, Interview, JobLead } from '../../lib/pb-types';
import { idr } from '../../lib/utils';
import { filterAndSortApplications, type SortOption } from './search-helpers';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: Application[];
  interviews: Interview[];
  jobLeads: JobLead[];
  onSelectApplication: (app: Application) => void;
  onSelectLead?: (lead: JobLead) => void;
}

export function GlobalSearchModal({
  isOpen,
  onClose,
  applications,
  interviews,
  jobLeads,
  onSelectApplication,
  onSelectLead,
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [savedView, setSavedView] = useState<string | null>(null);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('junction_recent_searches');
      return saved ? JSON.parse(saved) : ['Frontend', 'Tokopedia', 'Remote', 'Interview'];
    } catch {
      return ['Frontend', 'Tokopedia', 'Remote', 'Interview'];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard shortcut listener (Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Save query to recents
  const saveRecent = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const filtered = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, 6);
    setRecentSearches(filtered);
    try {
      localStorage.setItem('junction_recent_searches', JSON.stringify(filtered));
    } catch {
      // ignore
    }
  };

  const clearRecents = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('junction_recent_searches');
    } catch {
      // ignore
    }
  };

  // Saved views filter logic
  const handleApplySavedView = (viewKey: string) => {
    if (savedView === viewKey) {
      setSavedView(null);
      setSelectedStatus('all');
      setSelectedMode('all');
      return;
    }

    setSavedView(viewKey);
    if (viewKey === 'needs-followup') {
      setSelectedStatus('all');
      setSortBy('urgent');
    } else if (viewKey === 'interviews') {
      setSelectedStatus('Interview');
      setSortBy('urgent');
    } else if (viewKey === 'remote-only') {
      setSelectedMode('Remote');
    } else if (viewKey === 'top-salary') {
      setSelectedStatus('all');
      setSortBy('salary-desc');
    }
  };

  // Filter and sort applications via pure helper
  const filteredApps = useMemo(() => {
    return filterAndSortApplications(applications, {
      query,
      selectedStatus,
      selectedMode,
      sortBy,
      savedView,
    });
  }, [applications, query, selectedStatus, selectedMode, sortBy, savedView]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'grid',
        placeItems: 'start center',
        padding: 'clamp(16px, 6vh, 60px) 12px 20px',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(10px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          'w-full max-w-2xl rounded-2xl border border-zinc-200/90 bg-white/95 p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950/95',
          'flex flex-col gap-4 text-zinc-900 dark:text-zinc-100 max-h-[85vh] overflow-hidden'
        )}
      >
        {/* Search Bar Input */}
        <div className="relative flex items-center border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <Search size={18} className="absolute left-1 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                saveRecent(query.trim());
              }
            }}
            placeholder="Cari perusahaan, posisi, lokasi, atau kata kunci (Ctrl+K)..."
            className="w-full bg-transparent pl-8 pr-16 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 font-medium"
          />
          <div className="absolute right-0 flex items-center gap-1.5">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded"
              >
                <X size={14} />
              </button>
            )}
            <kbd className="hidden sm:inline-block rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              ESC
            </kbd>
          </div>
        </div>

        {/* Saved Views Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
            <Bookmark size={12} /> Tampilan:
          </span>
          {[
            { id: 'needs-followup', label: 'Butuh Tindakan' },
            { id: 'interviews', label: 'Interview Aktif' },
            { id: 'remote-only', label: 'Remote Saja' },
            { id: 'top-salary', label: 'Gaji Tertinggi' },
          ].map((view) => (
            <button
              key={view.id}
              type="button"
              onClick={() => handleApplySavedView(view.id)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium shrink-0 transition-colors duration-150 active:scale-[0.98] transition-transform',
                savedView === view.id
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
              )}
            >
              {view.label}
            </button>
          ))}
        </div>

        {/* Filter and Sorting Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-y border-zinc-100 py-2.5 dark:border-zinc-800/80">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-zinc-400 flex items-center gap-1 font-medium text-[11px]">
              <Filter size={12} /> Status:
            </span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setSavedView(null);
              }}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-800 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <option value="all">Semua Status</option>
              <option value="Wishlist">Wishlist</option>
              <option value="Applied">Applied</option>
              <option value="Viewed">Viewed</option>
              <option value="Screening">Screening</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
            </select>

            <select
              value={selectedMode}
              onChange={(e) => {
                setSelectedMode(e.target.value);
                setSavedView(null);
              }}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-800 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <option value="all">Semua Mode</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400 flex items-center gap-1 font-medium text-[11px]">
              <ArrowUpDown size={12} /> Urut:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-800 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <option value="newest">Paling Baru</option>
              <option value="salary-desc">Gaji Tertinggi</option>
              <option value="company-asc">Perusahaan (A-Z)</option>
              <option value="urgent">Urgensi Tindakan</option>
            </select>
          </div>
        </div>

        {/* Recent Searches Pills (if query is empty) */}
        {!query && recentSearches.length > 0 && (
          <div className="flex items-center justify-between py-1 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Clock size={11} /> Riwayat Pencarian:
              </span>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="rounded-md bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 text-[11px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={clearRecents}
              className="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-1"
              title="Bersihkan riwayat"
            >
              <Trash2 size={11} /> Bersihkan
            </button>
          </div>
        )}

        {/* Results List */}
        <div className="flex flex-col gap-1.5 overflow-y-auto pr-1 flex-1 min-h-[220px]">
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Hasil Peluang Karier ({filteredApps.length})</span>
            {query && <span className="font-normal lowercase">untuk &ldquo;{query}&rdquo;</span>}
          </div>

          {filteredApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400">
              <Search size={28} className="mb-2 stroke-1 text-zinc-300 dark:text-zinc-700" />
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Tidak ada data peluang karier yang cocok
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Coba gunakan kata kunci lain atau reset filter status Anda.
              </p>
            </div>
          ) : (
            filteredApps.map((app) => (
              <div
                key={app.id}
                onClick={() => {
                  saveRecent(query || app.company);
                  onSelectApplication(app);
                  onClose();
                }}
                className={cn(
                  'group flex items-center justify-between rounded-xl border border-zinc-100 bg-white p-3 hover:border-zinc-300 hover:bg-zinc-50/80 cursor-pointer transition-colors duration-150 active:scale-[0.99] transition-transform dark:border-zinc-900 dark:bg-zinc-900/50 dark:hover:border-zinc-700 dark:hover:bg-zinc-900'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 font-bold text-xs dark:bg-zinc-800 dark:text-zinc-200 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                    {app.company.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:underline">
                        {app.position}
                      </h4>
                      <span
                        className={cn(
                          'rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                          app.status === 'Interview'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : app.status === 'Offer'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : app.status === 'Viewed'
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                            : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        )}
                      >
                        {app.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {app.company} · {app.location} ({app.mode})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  {app.salaryMax ? (
                    <div className="hidden sm:block">
                      <div className="text-xs font-semibold font-mono text-zinc-800 dark:text-zinc-200">
                        {idr(app.salaryMax)}
                      </div>
                      <div className="text-[10px] text-zinc-400">{app.salaryPeriod}</div>
                    </div>
                  ) : null}
                  <ArrowRight
                    size={15}
                    className="text-zinc-400 group-hover:text-zinc-800 group-hover:translate-x-0.5 transition-[color,transform] duration-150 dark:group-hover:text-zinc-200"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5 text-[11px] text-zinc-400 dark:border-zinc-800">
          <span>Gunakan panah untuk navigasi · Enter untuk membuka detail</span>
          <span>Tekan ESC untuk menutup</span>
        </div>
      </div>
    </div>
  );
}
