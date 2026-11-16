import React from 'react';
import {
  Menu,
  Bell,
  Command,
  LayoutGrid,
  List,
  Search,
  Plus,
  Briefcase,
  Compass,
  Target,
  Zap,
  Inbox,
  Users,
  Share2,
  Scale,
  Sparkles,
  BarChart3,
  ShieldCheck,
  HelpCircle,
  FileText,
  Settings,
} from 'lucide-react';
import type { Module } from '../../App';
import { useI18n } from '../../lib/i18n';

export interface TwentyTopBarProps {
  currentModule: Module;
  onOpenMobileSidebar: () => void;
  // Pipeline-specific controls
  view?: 'board' | 'table';
  onViewChange?: (view: 'board' | 'table') => void;
  query?: string;
  onQueryChange?: (q: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
  // Action triggers
  onOpenAddModal: () => void;
  onOpenNotifications: () => void;
  onOpenShortcuts: () => void;
  unreadAlertsCount: number;
  loading: boolean;
}

const moduleMeta: Record<
  Module,
  { labelKey: string; fallbackLabel: string; icon: React.ElementType }
> = {
  pipeline: { labelKey: 'nav.pipeline', fallbackLabel: 'Pipeline', icon: Briefcase },
  cockpit: { labelKey: 'nav.cockpit', fallbackLabel: 'Cockpit', icon: Compass },
  jobhunter: { labelKey: 'nav.jobhunter', fallbackLabel: 'Job Hunter', icon: Target },
  applyflow: { labelKey: 'nav.applyflow', fallbackLabel: 'ApplyFlow', icon: Zap },
  inbox: { labelKey: 'nav.inbox', fallbackLabel: 'Recruitment Inbox', icon: Inbox },
  networking: { labelKey: 'nav.networking', fallbackLabel: 'Networking', icon: Users },
  linkedin: { labelKey: 'nav.linkedin', fallbackLabel: 'LinkedIn Assistant', icon: Share2 },
  offers: { labelKey: 'nav.offers', fallbackLabel: 'Offer & THP', icon: Scale },
  'ai-studio': { labelKey: 'nav.aistudio', fallbackLabel: 'AI Studio', icon: Sparkles },
  analytics: { labelKey: 'nav.analytics', fallbackLabel: 'Funnel Analytics', icon: BarChart3 },
  users: { labelKey: 'nav.users', fallbackLabel: 'Users & Roles', icon: ShieldCheck },
  help: { labelKey: 'nav.help', fallbackLabel: 'Help & Docs', icon: HelpCircle },
  system: { labelKey: 'nav.system', fallbackLabel: 'System Pages', icon: FileText },
  settings: { labelKey: 'nav.settings', fallbackLabel: 'Settings', icon: Settings },
};

export const TwentyTopBar: React.FC<TwentyTopBarProps> = ({
  currentModule,
  onOpenMobileSidebar,
  view = 'board',
  onViewChange,
  query = '',
  onQueryChange,
  searchInputRef,
  onOpenAddModal,
  onOpenNotifications,
  onOpenShortcuts,
  unreadAlertsCount,
  loading,
}) => {
  const { t, locale, setLocale } = useI18n();
  const meta = moduleMeta[currentModule] || moduleMeta.pipeline;
  const CurrentIcon = meta.icon;
  const moduleTitle = t(meta.labelKey) !== meta.labelKey ? t(meta.labelKey) : meta.fallbackLabel;

  return (
    <header className="twenty-topbar sticky top-0 z-30 h-[52px] bg-white/95 dark:bg-[#121214]/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 px-4 flex items-center justify-between gap-4 select-none">
      {/* Left side: Mobile menu toggle + View title + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-1.5 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center flex-shrink-0">
            <CurrentIcon size={14} />
          </div>
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
            {moduleTitle}
          </span>
        </div>

        {/* In Pipeline: View Mode Switcher (Board vs Table) in Twenty CRM style */}
        {currentModule === 'pipeline' && onViewChange && (
          <div className="hidden sm:flex items-center ml-2 border border-zinc-200/90 dark:border-zinc-700/80 rounded-md p-0.5 bg-zinc-100/70 dark:bg-zinc-800/60">
            <button
              onClick={() => onViewChange('board')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                view === 'board'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              title="Board View"
            >
              <LayoutGrid size={13} />
              <span>Board</span>
            </button>
            <button
              onClick={() => onViewChange('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                view === 'table'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              title="Table View"
            >
              <List size={13} />
              <span>Table</span>
            </button>
          </div>
        )}

        {/* Pipeline Search input */}
        {currentModule === 'pipeline' && onQueryChange && (
          <div className="hidden md:flex items-center relative ml-1">
            <Search size={13} className="absolute left-2.5 text-zinc-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari perusahaan, posisi… (/)"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="w-48 lg:w-60 pl-8 pr-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/70 rounded-md text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all font-sans"
            />
          </div>
        )}
      </div>

      {/* Right side: Sync state, Notifications, Shortcuts, Language, and + New button */}
      <div className="flex items-center gap-2">
        {/* PocketBase sync state */}
        <div
          className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100/60 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/50"
          title={loading ? 'Menyinkronkan data…' : 'PocketBase tersambung dan siap'}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
            }`}
          />
          <span>{loading ? 'Syncing…' : 'Connected'}</span>
        </div>

        {/* Bilingual Switcher (ID / EN) */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-md border border-zinc-200/80 dark:border-zinc-700/70 text-[10px] font-semibold">
          <button
            type="button"
            onClick={() => setLocale('id')}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              locale === 'id'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            ID
          </button>
          <button
            type="button"
            onClick={() => setLocale('en')}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              locale === 'en'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            EN
          </button>
        </div>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-1.5 rounded-md text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Notifikasi"
          aria-label="Open notifications"
        >
          <Bell size={16} />
          {unreadAlertsCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-zinc-900">
              {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
            </span>
          )}
        </button>

        {/* Keyboard Shortcuts Trigger */}
        <button
          onClick={onOpenShortcuts}
          className="hidden sm:flex p-1.5 rounded-md text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Pintasan Keyboard (?)"
          aria-label="Keyboard Shortcuts"
        >
          <Command size={15} />
        </button>

        {/* Twenty CRM Signature Primary Action: + New Opportunity */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 rounded-md text-xs font-semibold shadow-2xs transition-all active:scale-[0.98]"
          title="Tambah Peluang Karier Baru (N)"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Peluang Baru</span>
          <span className="sm:hidden">Baru</span>
        </button>
      </div>
    </header>
  );
};
