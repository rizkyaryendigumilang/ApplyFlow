import React from 'react';
import {
  Briefcase,
  Compass,
  Target,
  Radar,
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
  Search,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Smartphone,
  X,
  Plus,
} from 'lucide-react';
import type { Module } from '../../App';
import { useI18n } from '../../lib/i18n';

export interface TwentySidebarProps {
  currentModule: Module;
  onNavigate: (module: Module) => void;
  counts: {
    pipeline: number;
    jobHunter: number;
    inbox: number;
    offers: number;
  };
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenSearch: () => void;
  onOpenOnboarding: () => void;
  onOpenAddModal: () => void;
  canInstallPWA: boolean;
  onInstallPWA: () => void;
  userEmail?: string;
}

interface NavItem {
  id: Module;
  labelKey: string;
  fallbackLabel: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeVariant?: 'default' | 'accent' | 'warning';
}

interface NavGroup {
  id: string;
  titleKey: string;
  fallbackTitle: string;
  items: NavItem[];
}

export const TwentySidebar: React.FC<TwentySidebarProps> = ({
  currentModule,
  onNavigate,
  counts,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenSearch,
  onOpenOnboarding,
  onOpenAddModal,
  canInstallPWA,
  onInstallPWA,
  userEmail = 'admin@applyflow.local',
}) => {
  const { t } = useI18n();

  const groups: NavGroup[] = [
    {
      id: 'workspace',
      titleKey: 'sidebar.workspace',
      fallbackTitle: 'Workspace',
      items: [
        {
          id: 'cockpit',
          labelKey: 'nav.cockpit',
          fallbackLabel: 'Cockpit',
          icon: Compass,
        },
        {
          id: 'jobscout',
          labelKey: 'nav.jobscout',
          fallbackLabel: 'Auto Job Scout',
          icon: Radar,
          badgeVariant: 'accent',
        },
        {
          id: 'jobhunter',
          labelKey: 'nav.jobhunter',
          fallbackLabel: 'Job Hunter',
          icon: Target,
          badge: counts.jobHunter > 0 ? counts.jobHunter : undefined,
          badgeVariant: 'accent',
        },
        {
          id: 'applyflow',
          labelKey: 'nav.applyflow',
          fallbackLabel: 'ApplyFlow',
          icon: Zap,
        },
        {
          id: 'pipeline',
          labelKey: 'nav.pipeline',
          fallbackLabel: 'Pipeline',
          icon: Briefcase,
          badge: counts.pipeline,
        },
        {
          id: 'inbox',
          labelKey: 'nav.inbox',
          fallbackLabel: 'Recruitment Inbox',
          icon: Inbox,
          badge: counts.inbox > 0 ? counts.inbox : undefined,
          badgeVariant: 'warning',
        },
      ],
    },
    {
      id: 'tools',
      titleKey: 'sidebar.tools',
      fallbackTitle: 'Tools & Growth',
      items: [
        {
          id: 'networking',
          labelKey: 'nav.networking',
          fallbackLabel: 'Networking',
          icon: Users,
        },
        {
          id: 'linkedin',
          labelKey: 'nav.linkedin',
          fallbackLabel: 'LinkedIn Assistant',
          icon: Share2,
        },
        {
          id: 'offers',
          labelKey: 'nav.offers',
          fallbackLabel: 'Offer & THP',
          icon: Scale,
          badge: counts.offers > 0 ? counts.offers : undefined,
        },
        {
          id: 'ai-studio',
          labelKey: 'nav.aistudio',
          fallbackLabel: 'Otomasi Karier',
          icon: Sparkles,
        },
        {
          id: 'analytics',
          labelKey: 'nav.analytics',
          fallbackLabel: 'Funnel Analytics',
          icon: BarChart3,
        },
      ],
    },
    {
      id: 'admin',
      titleKey: 'sidebar.admin',
      fallbackTitle: 'Settings & Admin',
      items: [
        {
          id: 'users',
          labelKey: 'nav.users',
          fallbackLabel: 'Users & Roles',
          icon: ShieldCheck,
        },
        {
          id: 'help',
          labelKey: 'nav.help',
          fallbackLabel: 'Help & Docs',
          icon: HelpCircle,
        },
        {
          id: 'system',
          labelKey: 'nav.system',
          fallbackLabel: 'System Pages',
          icon: FileText,
        },
        {
          id: 'settings',
          labelKey: 'nav.settings',
          fallbackLabel: 'Settings',
          icon: Settings,
        },
      ],
    },
  ];

  const sidebarContent = (
    <aside
      className={`twenty-sidebar flex flex-col h-full bg-[#fafafa]/80 dark:bg-[#121214]/80 backdrop-blur-xl border-r border-zinc-200/60 dark:border-zinc-800/60 transition-all duration-200 select-none ${
        isCollapsed ? 'w-[68px]' : 'w-[240px]'
      }`}
    >
      {/* 1. Workspace Header (Cansaas Space & Twenty CRM style) */}
      <div className="flex items-center justify-between px-3.5 h-[56px] border-b border-zinc-200/70 dark:border-zinc-800/70">
        <div
          className={`flex items-center gap-2.5 cursor-pointer overflow-hidden ${
            isCollapsed ? 'justify-center w-full' : ''
          }`}
          onClick={() => onNavigate('pipeline')}
          title="ApplyFlow Career CRM"
        >
          <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0 tracking-tight">
            AF
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate tracking-tight flex items-center gap-1.5">
                ApplyFlow Space
                <ChevronDown size={12} className="text-zinc-400" />
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                Career CRM & Funnel
              </span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          className="md:hidden text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 p-1 rounded-md"
          onClick={onCloseMobile}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* 2. Global Search & Create New Work (Cansaas Space Reference) */}
      <div className="px-2.5 pt-2.5 pb-1 space-y-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenSearch}
            className={`flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 bg-white dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 rounded-md transition-all active:scale-[0.985] shadow-2xs ${
              isCollapsed ? 'w-full justify-center px-0' : 'flex-1'
            }`}
            title={`${t('sidebar.searchShortcut')} (⌘K)`}
          >
            <Search size={14} className="text-zinc-400" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left text-[11px]">{t('sidebar.searchShortcut')}…</span>
                <kbd className="text-[9px] font-mono bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300 px-1 py-0.5 rounded border border-zinc-200 dark:border-zinc-600">
                  ⌘K
                </kbd>
              </>
            )}
          </button>

          {!isCollapsed && (
            <button
              onClick={onOpenAddModal}
              className="w-7 h-7 flex items-center justify-center rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 shadow-2xs active:scale-[0.95] transition-all flex-shrink-0"
              title={`${t('sidebar.createNewWork')} (N)`}
              aria-label={t('sidebar.createNewWork')}
            >
              <Plus size={14} />
            </button>
          )}
        </div>

        {/* Prominent Create New Work Button (Cansaas Style) */}
        {!isCollapsed && (
          <button
            onClick={onOpenAddModal}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 shadow-2xs hover:shadow-xs active:scale-[0.985] transition-all"
            title={`${t('sidebar.createNewWork')} (N)`}
          >
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                +
              </span>
              <span>{t('sidebar.createNewWork')}</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
              N
            </span>
          </button>
        )}
      </div>

      {/* 3. Navigation Groups (Twenty CRM style) */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 text-xs font-medium scrollbar-thin">
        {groups.map((group) => (
          <div key={group.id} className="space-y-0.5">
            {!isCollapsed && (
              <div className="px-2 pt-1 pb-1 text-[10px] uppercase font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider">
                {t(group.titleKey) !== group.titleKey ? t(group.titleKey) : group.fallbackTitle}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentModule === item.id;
              const label = t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.fallbackLabel;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-all duration-150 active:scale-[0.98] ${
                    isCollapsed ? 'justify-center px-0' : ''
                  } ${
                    isActive
                      ? 'bg-zinc-200/70 text-zinc-950 font-semibold dark:bg-zinc-800 dark:text-zinc-50 shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/40 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/40'
                  }`}
                  title={label}
                >
                  <Icon
                    size={16}
                    className={`flex-shrink-0 ${
                      isActive
                        ? 'text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-400 dark:text-zinc-400 group-hover:text-zinc-600'
                    }`}
                  />
                  {!isCollapsed && (
                    <>
                      <span className="truncate flex-1 text-left">{label}</span>
                      {item.badge !== undefined && item.badge !== 0 && (
                        <span
                          className={`text-[10px] font-mono tabular-nums font-medium px-1.5 py-0.2 rounded-full border ${
                            item.badgeVariant === 'accent'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : item.badgeVariant === 'warning'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                              : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* 4. Footer Utilities & Profile Row (Twenty CRM style) */}
      <div className="p-2 border-t border-zinc-200/70 dark:border-zinc-800/70 space-y-1">
        {/* Onboarding Tour Link */}
        <button
          onClick={() => {
            onOpenOnboarding();
            onCloseMobile();
          }}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/40 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/40 transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="Onboarding Tour"
        >
          <Sparkles size={14} className="text-amber-500 flex-shrink-0" />
          {!isCollapsed && <span className="truncate text-left text-[11px]">Panduan Tour</span>}
        </button>

        {/* PWA Install Button */}
        {canInstallPWA && (
          <button
            onClick={onInstallPWA}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/40 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/40 transition-colors ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Install Web App"
          >
            <Smartphone size={14} className="text-emerald-600 flex-shrink-0" />
            {!isCollapsed && <span className="truncate text-left text-[11px]">Install App</span>}
          </button>
        )}

        {/* User Profile Card & Collapse Toggle */}
        <div
          className={`flex items-center gap-2 pt-1.5 mt-1 border-t border-zinc-200/50 dark:border-zinc-800/50 ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <div
            className={`flex items-center gap-2 min-w-0 cursor-pointer p-1 rounded-md hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40 flex-1 ${
              isCollapsed ? 'justify-center' : ''
            }`}
            onClick={() => onNavigate('settings')}
            title="Pengaturan Akun"
          >
            <div className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-100 dark:bg-zinc-200 dark:text-zinc-900 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
              RA
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 truncate leading-tight">
                  Admin
                </span>
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 truncate leading-tight">
                  {userEmail}
                </span>
              </div>
            )}
          </div>

          {/* Desktop Sidebar Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1.5 rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors"
            title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
            aria-label="Toggle sidebar collapse"
          >
            {isCollapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block flex-shrink-0">{sidebarContent}</div>

      {/* Mobile Drawer Backdrop & Slide-over */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-[260px] max-w-[80vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
