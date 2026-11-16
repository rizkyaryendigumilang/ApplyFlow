import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Bell,
  ChevronDown,
  CirclePlus,
  Command,
  Eye,
  FileText,
  LayoutGrid,
  List,
  Search,
  Send,
  Sparkles,
  Target,
  Zap,
  Printer,
  Smartphone,
  Settings,
  Plus,
} from 'lucide-react';
import type { Application, Status } from './lib/pb-types';
import { useApplications } from './hooks/useApplications';
import { useCVArtifacts } from './hooks/useCVArtifacts';
import { useInterviews } from './hooks/useInterviews';
import { useApplicationEvents } from './hooks/useApplicationEvents';
import { useCandidateProfile } from './hooks/useCandidateProfile';
import { useJobLeads } from './hooks/useJobLeads';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useI18n } from './lib/i18n';
import { daysSince, responseRate } from './lib/utils';

// Twenty CRM layout shell components
import { TwentySidebar } from './components/layout/TwentySidebar';
import { TwentyTopBar } from './components/layout/TwentyTopBar';

// Core feature views
import { JobSeekerCockpitView } from './features/cockpit/JobSeekerCockpitView';
import { StarCoachModal } from './features/interview-prep/StarCoachModal';
import { ApplyFlowView } from './features/applyflow/ApplyFlowView';
import { JobHunterView } from './features/job-hunter/JobHunterView';
import { AutoJobScoutView } from './features/job-scout/AutoJobScoutView';
import { RecruitmentInboxView } from './features/recruitment-inbox/RecruitmentInboxView';
import { NetworkingView } from './features/networking/NetworkingView';
import { LinkedInAssistantView } from './features/linkedin-assistant/LinkedInAssistantView';
import { SettingsView } from './features/settings/SettingsView';
import { OfferComparatorView } from './features/offer-calculator/OfferComparatorView';
import { AiAgentStudioView } from './features/ai-agent-studio/AiAgentStudioView';

// Enterprise SaaS modules
import { NotificationCenter } from './features/notifications/NotificationCenter';
import { UserManagementView } from './features/user-management/UserManagementView';
import { AnalyticsView } from './features/analytics/AnalyticsView';
import { HelpSupportView } from './features/help/HelpSupportView';
import { SystemPagesView } from './features/system-pages/SystemPagesView';
import { GlobalSearchModal } from './features/search/GlobalSearchModal';
import { OnboardingWizardModal } from './features/onboarding/OnboardingWizardModal';
import { KeyboardShortcutsModal } from './components/layout/KeyboardShortcutsModal';

// Deconstructed Kanban & Table components (codebase-design)
import { ApplicationCard } from './features/kanban/ApplicationCard';
import { JobTable } from './features/spreadsheet-view/JobTable';
import { FollowUp } from './features/kanban/FollowUpRadar';
import { ApplicationDrawer } from './features/application-detail/ApplicationDrawer';
import { AddOpportunityModal } from './components/layout/AddOpportunityModal';
import { FollowUpModal } from './features/application-detail/FollowUpModal';
import { AtsResumeFormatterModal } from './features/resume-formatter/AtsResumeFormatterModal';
import { EmptyState } from './components/ui/EmptyState';
import { saveAutoBackupSnapshot } from './lib/data-transfer';

const statuses: Status[] = [
  'Wishlist',
  'Applied',
  'Viewed',
  'Screening',
  'Interview',
  'Offer',
  'Rejected',
  'Ghosted',
];

const dateLabel = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
})
  .format(new Date())
  .toUpperCase();

export type Module =
  | 'cockpit'
  | 'pipeline'
  | 'jobhunter'
  | 'jobscout'
  | 'applyflow'
  | 'inbox'
  | 'networking'
  | 'linkedin'
  | 'offers'
  | 'ai-studio'
  | 'analytics'
  | 'users'
  | 'help'
  | 'system'
  | 'settings';

function App() {
  const { applications, loading, error, updateStatus, update, add } = useApplications();
  const { cvs, error: cvError } = useCVArtifacts();
  const { interviews, error: interviewError, addInterview } = useInterviews();
  const { addEvent } = useApplicationEvents();
  const { profile } = useCandidateProfile();

  // Top-level Auto-Sync Snapshot Engine: ensures fresh backup state in background
  useEffect(() => {
    if (!loading && applications.length > 0) {
      saveAutoBackupSnapshot({
        applications,
        cvs,
        interviews,
      });
    }
  }, [applications, cvs, interviews, loading]);

  const [view, setView] = useState<'board' | 'table'>('board');
  const [query, setQuery] = useState('');
  const [drawer, setDrawer] = useState<Application | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [followUpApp, setFollowUpApp] = useState<Application | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isAtsResumeOpen, setIsAtsResumeOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    try {
      return !localStorage.getItem('junction_onboarding_completed');
    } catch {
      return false;
    }
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('twenty_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('twenty_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const { canInstall, promptInstall } = usePWAInstall();

  // Global keyboard shortcuts (Ctrl+K, N, Esc, /, ?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputActive =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // Cmd+K / Ctrl+K: Global Search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
        return;
      }

      // Escape: Close any open modal or drawer
      if (e.key === 'Escape') {
        setIsGlobalSearchOpen(false);
        setIsShortcutsOpen(false);
        setShowAdd(false);
        setDrawer(null);
        setIsMoreMenuOpen(false);
        setStarCoachParams(null);
        setIsOnboardingOpen(false);
        return;
      }

      // If user is currently typing in an input field, do not trigger single-key shortcuts
      if (isInputActive) return;

      // N: Add new opportunity
      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setShowAdd(true);
        return;
      }

      // /: Focus search input in pipeline or open global search
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        } else {
          setIsGlobalSearchOpen(true);
        }
        return;
      }

      // ?: Toggle keyboard shortcuts guide
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { leads: jobLeads } = useJobLeads();
  const { locale, setLocale, t } = useI18n();
  const [starCoachParams, setStarCoachParams] = useState<{ company: string; position: string } | null>(null);

  const [module, setModule] = useState<Module>(() => {
    try {
      const saved = localStorage.getItem('junction_crm_preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        const validModules: Module[] = [
          'cockpit',
          'pipeline',
          'jobhunter',
          'jobscout',
          'applyflow',
          'inbox',
          'networking',
          'linkedin',
          'offers',
          'ai-studio',
          'analytics',
          'users',
          'help',
          'system',
          'settings',
        ];
        if (validModules.includes(parsed.defaultLandingModule)) {
          return parsed.defaultLandingModule;
        }
      }
    } catch {
      // fallback
    }
    return 'cockpit';
  });

  const [promotedLead, setPromotedLead] = useState<{
    title: string;
    company: string;
    rawJd: string;
    url?: string;
    source?: string;
  } | null>(null);

  const filtered = useMemo(
    () =>
      applications.filter((a) =>
        `${a.company} ${a.position} ${a.location}`.toLowerCase().includes(query.toLowerCase())
      ),
    [applications, query]
  );

  const metrics = [
    [
      'Active pipeline',
      applications.filter((a) => !['Rejected', 'Ghosted'].includes(a.status)).length,
      'current roles',
    ],
    [
      'Response rate',
      `${responseRate(
        applications.filter((a) =>
          ['Viewed', 'Screening', 'Interview', 'Offer'].includes(a.status)
        ).length,
        applications.length
      )}%`,
      'viewed, screening, interview, offer',
    ],
    [
      'Viewed & Seen',
      applications.filter((a) => a.status === 'Viewed').length,
      'seen by employer (JobStreet)',
    ],
    [
      'Interviews & Offers',
      applications.filter((a) => ['Interview', 'Offer'].includes(a.status)).length,
      'active interview & offer stages',
    ],
  ];

  const applicationFollowups = applications
    .filter((a) => a.nextFollowUp)
    .sort((a, b) => new Date(a.nextFollowUp!).getTime() - new Date(b.nextFollowUp!).getTime())
    .slice(0, 2)
    .map((a) => ({
      date: a.nextFollowUp!,
      title: `${a.company} · ${a.position}`,
      detail: a.contactName ? `Follow up with ${a.contactName}` : 'Follow-up is due',
    }));

  const interviewFollowups = interviews
    .filter((i) => i.scheduledAt && i.status === 'Scheduled')
    .slice(0, 2)
    .map((i) => {
      const application = applications.find((a) => a.id === i.application);
      return {
        date: i.scheduledAt!,
        title: `${application?.company || 'Interview'} · ${i.round}`,
        detail: 'Scheduled interview round',
      };
    });

  const followups = [...applicationFollowups, ...interviewFollowups]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 2);

  const hasDataError = Boolean(error || cvError || interviewError);

  // Unread notification badge count
  const unreadAlertsCount = useMemo(() => {
    const ghostingCount = applications.filter(
      (a) => ['Applied', 'Viewed'].includes(a.status) && daysSince(a.sentAt) >= 14
    ).length;
    const dueCount = applications.filter(
      (a) => a.nextFollowUp && new Date(a.nextFollowUp).getTime() <= Date.now()
    ).length;
    return ghostingCount + dueCount;
  }, [applications]);

  const navigateTo = (mod: Module) => {
    setModule(mod);
    setIsMobileSidebarOpen(false);
    setIsMoreMenuOpen(false);
  };

  return (
    <div className="twenty-app-shell flex h-screen w-screen overflow-hidden bg-[#fafafa] dark:bg-[#0c0c0e] text-zinc-900 dark:text-zinc-100 font-sans antialiased">
      {/* 1. Twenty CRM Collapsible Left Navigation Sidebar */}
      <TwentySidebar
        currentModule={module}
        onNavigate={navigateTo}
        counts={{
          pipeline: applications.filter((a) => !['Rejected', 'Ghosted'].includes(a.status)).length,
          jobHunter: jobLeads.filter((l) => l.matchScore >= 80).length,
          inbox: applications.filter((a) => a.status === 'Viewed').length,
          offers: applications.filter((a) => a.status === 'Offer').length,
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenSearch={() => setIsGlobalSearchOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenAddModal={() => setShowAdd(true)}
        canInstallPWA={canInstall}
        onInstallPWA={promptInstall}
      />

      {/* 2. Twenty CRM Main Canvas Area (TopBar + Content View) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#fcfcfd] dark:bg-[#09090b]">
        <TwentyTopBar
          currentModule={module}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          view={view}
          onViewChange={setView}
          query={query}
          onQueryChange={setQuery}
          searchInputRef={searchInputRef}
          onOpenAddModal={() => setShowAdd(true)}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          unreadAlertsCount={unreadAlertsCount}
          loading={loading}
        />

        <main className="twenty-main flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5">
          {/* Module View Routers */}
          {module === 'cockpit' ? (
            <JobSeekerCockpitView
              applications={applications}
              interviews={interviews}
              jobLeads={jobLeads}
              onNavigateTo={(m) => navigateTo(m as Module)}
              onSelectApplication={(app) => {
                setDrawer(app);
                navigateTo('pipeline');
              }}
              onOpenAddModal={() => setShowAdd(true)}
              onOpenStarCoach={(comp, pos) => setStarCoachParams({ company: comp, position: pos })}
              onAddInterview={addInterview}
              onPromoteLead={(lead) => {
                setPromotedLead({
                  title: lead.title,
                  company: lead.company,
                  rawJd: lead.rawJd,
                  url: lead.url,
                  source: lead.source,
                });
                navigateTo('applyflow');
              }}
            />
          ) : module === 'linkedin' ? (
            <LinkedInAssistantView applications={applications} />
          ) : module === 'ai-studio' ? (
            <AiAgentStudioView
              onPromoteApplication={add}
              onNavigateToPipeline={() => navigateTo('pipeline')}
            />
          ) : module === 'analytics' ? (
            <AnalyticsView applications={applications} cvs={cvs} />
          ) : module === 'users' ? (
            <UserManagementView />
          ) : module === 'help' ? (
            <HelpSupportView />
          ) : module === 'system' ? (
            <SystemPagesView onNavigateHome={() => navigateTo('pipeline')} />
          ) : module === 'offers' ? (
            <OfferComparatorView applications={applications} />
          ) : module === 'settings' ? (
            <SettingsView
              applications={applications}
              cvs={cvs}
              interviews={interviews}
              onImportApplications={async (imported) => {
                for (const item of imported) {
                  await add({
                    company: item.company || 'Unknown Company',
                    position: item.position || 'Engineer',
                    location: item.location || 'Jakarta',
                    type: item.type || 'In-house',
                    mode: item.mode || 'Hybrid',
                    salaryMin: item.salaryMin || 0,
                    salaryMax: item.salaryMax || 0,
                    salaryPeriod: item.salaryPeriod || 'monthly',
                    status: item.status || 'Wishlist',
                    sentAt: item.sentAt || new Date().toISOString().slice(0, 10),
                    cvVersion: item.cvVersion || 'CV-General-v1',
                    link: item.link,
                    contactName: item.contactName,
                    contact: item.contact,
                    jobSource: item.jobSource || 'Other',
                    applicationMethod: item.applicationMethod || 'Manual',
                    notes: item.notes,
                  });
                }
              }}
              onResetToSeed={() => {
                localStorage.removeItem('career_crm_mock_applications');
                location.reload();
              }}
              onNavigateTab={(tab) => navigateTo(tab as Module)}
            />
          ) : module === 'jobhunter' ? (
            <JobHunterView
              onPromoteToApplyFlow={(lead) => {
                setPromotedLead(lead);
                navigateTo('applyflow');
              }}
            />
          ) : module === 'jobscout' ? (
            <AutoJobScoutView
              onAddApplication={add}
              onNavigateToTracker={() => navigateTo('pipeline')}
            />
          ) : module === 'inbox' ? (
            <RecruitmentInboxView
              applications={applications}
              addApplication={add}
              onSelectApplication={(app) => {
                setDrawer(app);
                navigateTo('pipeline');
              }}
            />
          ) : module === 'networking' ? (
            <NetworkingView />
          ) : module === 'applyflow' ? (
            <ApplyFlowView cvs={cvs} add={add} initialData={promotedLead} />
          ) : (
            <div className="space-y-6">
              {hasDataError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
                  <span>Gagal memuat beberapa data dari PocketBase.</span>
                  <button onClick={() => location.reload()} className="font-semibold underline">
                    Muat Ulang
                  </button>
                </div>
              )}

              {/* 1. Twenty CRM KPI Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {metrics.map(([label, value, detail], i) => (
                  <div
                    key={label}
                    className="bg-white dark:bg-[#18181b] border border-zinc-200/90 dark:border-zinc-800/90 rounded-lg p-3.5 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
                      <span className="font-medium">{label}</span>
                      {i === 0 ? (
                        <Target size={14} className="text-zinc-400" />
                      ) : i === 1 ? (
                        <Activity size={14} className="text-zinc-400" />
                      ) : i === 2 ? (
                        <Eye size={14} className="text-zinc-400" />
                      ) : (
                        <Sparkles size={14} className="text-zinc-400" />
                      )}
                    </div>
                    <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
                      {value}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1 truncate">{detail}</div>
                  </div>
                ))}
              </div>

              {/* 2. Main Workspace (Kanban Board or Table View) in Twenty CRM style */}
              <div className="bg-white dark:bg-[#18181b] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl p-4 shadow-2xs">
                {/* Header bar within workspace */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                      Pipa Peluang Karier
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium border border-zinc-200/60 dark:border-zinc-700/60">
                      {filtered.length} posisi
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAdd(true)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 rounded-md text-xs font-semibold shadow-2xs transition-all active:scale-[0.98]"
                    >
                      <Plus size={13} />
                      <span>Tambah Posisi</span>
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex gap-3.5 overflow-x-auto pb-4 scrollbar-thin">
                    {statuses.slice(0, 5).map((status) => (
                      <div
                        key={status}
                        className="w-[280px] min-w-[280px] flex-shrink-0 bg-zinc-50/70 dark:bg-zinc-900/30 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 p-3"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`dot ${status.toLowerCase()}`} />
                          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                            {status}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="h-24 bg-white dark:bg-zinc-800 rounded-lg animate-pulse" />
                          <div className="h-24 bg-white dark:bg-zinc-800 rounded-lg animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filtered.length === 0 && query ? (
                  <EmptyState
                    icon={Search}
                    title={`Tidak Ditemukan Hasil untuk "${query}"`}
                    description="Tidak ada peluang karier yang cocok dengan kata kunci pencarian. Coba ubah ejaan atau bersihkan filter."
                    actionLabel="Reset Filter Pencarian"
                    onAction={() => setQuery('')}
                  />
                ) : applications.length === 0 ? (
                  <EmptyState
                    icon={Target}
                    title="Papan Pipeline Lamaran Masih Kosong"
                    description="Mulai langkah pencarian karir terstruktur Anda. Catat peluang kerja pertama untuk memantau status seleksi, follow-up, dan penawaran gaji."
                    actionLabel="+ Tambah Peluang Pertama (N)"
                    onAction={() => setShowAdd(true)}
                  />
                ) : view === 'board' ? (
                  <div className="flex gap-3.5 overflow-x-auto pb-4 scrollbar-thin">
                    {statuses.slice(0, 6).map((status) => {
                      const colApps = filtered.filter((a) => a.status === status);
                      return (
                        <div
                          key={status}
                          className="w-[280px] min-w-[280px] flex-shrink-0 flex flex-col bg-zinc-50/70 dark:bg-zinc-900/30 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 p-2.5 min-h-[480px]"
                        >
                          <div className="flex items-center justify-between px-1 pb-2.5 mb-2 border-b border-zinc-200/60 dark:border-zinc-800/60 select-none">
                            <div className="flex items-center gap-2">
                              <span className={`dot ${status.toLowerCase()}`} />
                              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                {status}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium border border-zinc-200/50 dark:border-zinc-700/50">
                                {colApps.length}
                              </span>
                            </div>

                            <button
                              onClick={() => setShowAdd(true)}
                              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
                              title={`Tambah lamaran di tahap ${status}`}
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          <div className="flex-1 flex flex-col gap-2.5">
                            {colApps.map((a) => (
                              <ApplicationCard
                                key={a.id}
                                application={a}
                                onClick={() => setDrawer(a)}
                              />
                            ))}

                            {colApps.length === 0 && (
                              <div className="h-24 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col items-center justify-center p-3 text-center text-[11px] text-zinc-400">
                                <span>Belum ada lamaran</span>
                                <button
                                  onClick={() => setShowAdd(true)}
                                  className="mt-1 text-[10px] font-medium text-zinc-600 dark:text-zinc-300 hover:underline flex items-center gap-1"
                                >
                                  <Plus size={10} /> Tambah
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <JobTable
                    applications={filtered}
                    onSelectApplication={setDrawer}
                    onResetFilters={() => setQuery('')}
                    onImportApplications={async (imported) => {
                      for (const item of imported) {
                        await add({
                          company: item.company || 'Unknown Company',
                          position: item.position || 'Engineer',
                          link: item.link,
                          contactName: item.contactName,
                          contact: item.contact,
                          location: item.location || 'USA',
                          type: item.type || 'In-house',
                          mode: item.mode || 'Remote',
                          pay: item.pay,
                          sent: item.sent,
                          salaryMin: item.salaryMin || 0,
                          salaryMax: item.salaryMax || 0,
                          salaryPeriod: item.salaryPeriod || 'monthly',
                          status: item.status || 'Wishlist',
                          sentAt: item.sentAt || new Date().toISOString().slice(0, 10),
                          cvVersion: item.cvVersion || 'CV-Tech-v1',
                          jobSource: item.link ? 'Company Website' : 'Direct / Referral',
                          applicationMethod: 'Manual',
                        });
                      }
                    }}
                  />
                )}
              </div>

              {/* 3. Twenty CRM Bento Insights & Follow-up Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Bento Card 1: Follow-Up Radar */}
                <div className="bg-white dark:bg-[#18181b] border border-zinc-200/90 dark:border-zinc-800/90 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                      <span className="font-semibold text-[10px] uppercase tracking-wider text-zinc-500">
                        Follow-up Radar
                      </span>
                      <Activity size={13} className="text-emerald-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                      Agenda & Anti-Ghosting
                    </h3>
                  </div>

                  <div className="space-y-2 mt-2">
                    {followups.length ? (
                      followups.map((item, index) => {
                        const matchingApp = applications.find(
                          (a) =>
                            `${a.company} · ${a.position}` === item.title ||
                            item.title.startsWith(a.company)
                        );
                        return (
                          <div
                            key={`${item.title}-${index}`}
                            onClick={() => matchingApp && setFollowUpApp(matchingApp)}
                            className="p-2 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 cursor-pointer hover:border-zinc-300 transition-colors text-xs"
                          >
                            <div className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                              {item.title}
                            </div>
                            <div className="text-[10px] text-zinc-400 truncate">{item.detail}</div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-xs text-zinc-400 py-3 text-center">
                        Tidak ada follow-up mendesak hari ini.
                      </div>
                    )}
                  </div>
                </div>

                {/* Bento Card 2: CV Lab Experiments */}
                <div className="bg-white dark:bg-[#18181b] border border-zinc-200/90 dark:border-zinc-800/90 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                      <span className="font-semibold text-[10px] uppercase tracking-wider text-zinc-500">
                        CV Experiment Lab
                      </span>
                      <FileText size={13} className="text-blue-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                      Performa Varian CV
                    </h3>
                  </div>

                  <div className="space-y-2 mt-2">
                    {cvs.slice(0, 2).map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-2 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                            {c.label}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {c.applications} lamaran terkirim
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 ml-2">
                          {responseRate(c.responses, c.applications)}%
                        </span>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setIsAtsResumeOpen(true)}
                      className="w-full mt-2 py-1.5 text-center text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Printer size={12} />
                      <span>Cetak Format ATS</span>
                    </button>
                  </div>
                </div>

                {/* Bento Card 3: Monotonic Guard Health */}
                <div className="bg-white dark:bg-[#18181b] border border-zinc-200/90 dark:border-zinc-800/90 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                      <span className="font-semibold text-[10px] uppercase tracking-wider text-zinc-500">
                        Integritas Funnel
                      </span>
                      <Zap size={13} className="text-amber-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                      Status Terjaga Aman
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Hierarki seleksi terlindungi secara otomatis (ADR-0002).
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="p-2 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
                      <span className="text-[10px] text-zinc-400 block">Posisi Aktif</span>
                      <span className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">
                        {applications.filter((a) => !['Rejected', 'Ghosted'].includes(a.status)).length}
                      </span>
                    </div>
                    <div className="p-2 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
                      <span className="text-[10px] text-zinc-400 block">Interview Rate</span>
                      <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {applications.length > 0
                          ? Math.round(
                              (applications.filter((a) => ['Interview', 'Offer'].includes(a.status)).length /
                                applications.length) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bento Card 4: Autonomous Telegram Briefing */}
                <div className="bg-white dark:bg-[#18181b] border border-zinc-200/90 dark:border-zinc-800/90 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                      <span className="font-semibold text-[10px] uppercase tracking-wider text-zinc-500">
                        Telegram Bot
                      </span>
                      <Send size={13} className="text-sky-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                      Morning Briefing 08:30
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Ringkasan lamaran harian dan agenda wawancara terkirim otomatis.
                    </p>
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => navigateTo('settings')}
                      className="w-full py-1.5 text-center text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Settings size={12} />
                      <span>Pengaturan Bot</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Extracted Application Detail Drawer with Monotonic Safety Guard */}
      {drawer && (
        <ApplicationDrawer
          application={drawer}
          onClose={() => setDrawer(null)}
          onUpdateStatus={updateStatus}
          onOpenFollowUp={(app) => setFollowUpApp(app)}
        />
      )}

      {/* Extracted Add Opportunity Modal */}
      {showAdd && (
        <AddOpportunityModal onClose={() => setShowAdd(false)} onAdd={add} />
      )}

      {/* Follow Up Modal */}
      {followUpApp && (
        <FollowUpModal
          application={followUpApp}
          onClose={() => setFollowUpApp(null)}
          onLogFollowUp={async (appId, nextFollowUpDate, note) => {
            await update(appId, { nextFollowUp: nextFollowUpDate });
            await addEvent({
              application: appId,
              eventType: 'recruiter_contacted',
              sourcePlatform: 'manual',
              rawSubject: 'Follow-Up Anti-Ghosting Terkirim',
              evidenceSnippet: note,
            });
          }}
        />
      )}

      {/* Notification Center Modal */}
      <NotificationCenter
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        applications={applications}
        interviews={interviews}
        onSelectApplication={(app: Application) => {
          setDrawer(app);
          navigateTo('pipeline');
        }}
      />

      {/* 1-Click Printable ATS Resume Formatter Modal */}
      <AtsResumeFormatterModal
        isOpen={isAtsResumeOpen}
        onClose={() => setIsAtsResumeOpen(false)}
        profile={profile}
      />

      {/* Interactive STAR Prep Coach Modal */}
      {starCoachParams && (
        <StarCoachModal
          isOpen={true}
          companyName={starCoachParams.company}
          roleTitle={starCoachParams.position}
          onClose={() => setStarCoachParams(null)}
        />
      )}

      {/* Global Search & Discovery Modal (Ctrl+K / Cmd+K) */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        applications={applications}
        interviews={interviews}
        jobLeads={jobLeads}
        onSelectApplication={(app: Application) => {
          setDrawer(app);
          navigateTo('pipeline');
        }}
      />

      {/* Onboarding Setup Wizard & Product Tour Modal */}
      <OnboardingWizardModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={(data) => {
          setIsOnboardingOpen(false);
          navigateTo('cockpit');
        }}
      />

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

export default App;
