import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Bell,
  ChevronDown,
  CirclePlus,
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

// Core feature views
import { JobSeekerCockpitView } from './features/cockpit/JobSeekerCockpitView';
import { StarCoachModal } from './features/interview-prep/StarCoachModal';
import { ApplyFlowView } from './features/applyflow/ApplyFlowView';
import { JobHunterView } from './features/job-hunter/JobHunterView';
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

// Deconstructed Kanban & Table components (codebase-design)
import { ApplicationCard } from './features/kanban/ApplicationCard';
import { JobTable } from './features/spreadsheet-view/JobTable';
import { FollowUp } from './features/kanban/FollowUpRadar';
import { ApplicationDrawer } from './features/application-detail/ApplicationDrawer';
import { AddOpportunityModal } from './components/layout/AddOpportunityModal';
import { FollowUpModal } from './features/application-detail/FollowUpModal';
import { AtsResumeFormatterModal } from './features/resume-formatter/AtsResumeFormatterModal';
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
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    try {
      return !localStorage.getItem('junction_onboarding_completed');
    } catch {
      return false;
    }
  });

  const { canInstall, promptInstall } = usePWAInstall();

  // Global keyboard shortcut: Cmd+K / Ctrl+K for Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
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
    setIsMoreMenuOpen(false);
  };

  return (
    <div className="app-shell">
      <header>
        <div
          className="brand"
          onClick={() => navigateTo('pipeline')}
          style={{ cursor: 'pointer' }}
        >
          <div className="brand-mark">J</div>
          <div>
            <strong>Junction</strong>
            <span>Career CRM</span>
          </div>
        </div>

        <nav>
          <button
            className={module === 'cockpit' ? 'active font-semibold' : ''}
            onClick={() => navigateTo('cockpit')}
          >
            {t('nav.cockpit')}
          </button>
          <button
            className={module === 'pipeline' ? 'active' : ''}
            onClick={() => navigateTo('pipeline')}
          >
            {t('nav.pipeline')}
          </button>
          <button
            className={module === 'jobhunter' ? 'active' : ''}
            onClick={() => navigateTo('jobhunter')}
          >
            {t('nav.jobhunter')}
          </button>
          <button
            className={module === 'applyflow' ? 'active applyflow-nav' : 'applyflow-nav'}
            onClick={() => navigateTo('applyflow')}
          >
            {t('nav.applyflow')}
          </button>
          <button
            className={module === 'inbox' ? 'active' : ''}
            onClick={() => navigateTo('inbox')}
          >
            {t('nav.inbox')}
          </button>
          <button
            className={module === 'networking' ? 'active' : ''}
            onClick={() => navigateTo('networking')}
          >
            {t('nav.networking')}
          </button>
          <button
            className={module === 'linkedin' ? 'active' : ''}
            onClick={() => navigateTo('linkedin')}
          >
            {t('nav.linkedin')}
          </button>
          <button
            className={module === 'offers' ? 'active' : ''}
            onClick={() => navigateTo('offers')}
          >
            {t('nav.offers')}
          </button>
          <button
            className={module === 'ai-studio' ? 'active' : ''}
            onClick={() => navigateTo('ai-studio')}
          >
            {t('nav.aistudio')}
          </button>
          <button
            className={module === 'analytics' ? 'active' : ''}
            onClick={() => navigateTo('analytics')}
          >
            {t('nav.analytics')}
          </button>

          {/* More SaaS enterprise sections dropdown */}
          <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={['users', 'help', 'system'].includes(module) ? 'active' : ''}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {t('nav.enterprise')} <ChevronDown size={13} />
            </button>

            {isMoreMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '64px',
                  left: 0,
                  background: '#fbfbf8',
                  border: '1px solid #dedfd8',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                  zIndex: 20,
                  minWidth: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '6px 0',
                }}
              >
                <button
                  onClick={() => navigateTo('users')}
                  style={{
                    padding: '9px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    color: module === 'users' ? '#7d9850' : '#202320',
                    fontWeight: module === 'users' ? 600 : 400,
                  }}
                >
                  {t('nav.users')}
                </button>
                <button
                  onClick={() => navigateTo('help')}
                  style={{
                    padding: '9px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    color: module === 'help' ? '#7d9850' : '#202320',
                    fontWeight: module === 'help' ? 600 : 400,
                  }}
                >
                  {t('nav.help')}
                </button>
                <button
                  onClick={() => navigateTo('system')}
                  style={{
                    padding: '9px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    color: module === 'system' ? '#7d9850' : '#202320',
                    fontWeight: module === 'system' ? 600 : 400,
                  }}
                >
                  {t('nav.system')}
                </button>
                <div style={{ height: '1px', background: '#e5e7eb', margin: '4px 0' }} />
                <button
                  onClick={() => {
                    setIsOnboardingOpen(true);
                    setIsMoreMenuOpen(false);
                  }}
                  style={{
                    padding: '9px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    color: '#202320',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Sparkles size={13} className="text-amber-600" /> {t('nav.onboardingTour')}
                </button>
                {canInstall && (
                  <button
                    onClick={() => {
                      promptInstall();
                      setIsMoreMenuOpen(false);
                    }}
                    style={{
                      padding: '9px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      color: '#202320',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Smartphone size={13} className="text-emerald-600" /> Pasang Aplikasi (PWA)
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            className={module === 'settings' ? 'active' : ''}
            onClick={() => navigateTo('settings')}
          >
            {t('nav.settings')}
          </button>
        </nav>

        <div className="header-actions">
          {/* Global Search & Discovery Trigger (Cmd+K) */}
          <button
            type="button"
            onClick={() => setIsGlobalSearchOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '8px',
              background: '#f0f2ea',
              border: '1px solid #dcdfd5',
              color: '#555d4e',
              fontSize: '12px',
              cursor: 'pointer',
            }}
            title="Pencarian Global (Ctrl+K / Cmd+K)"
            aria-label="Pencarian Global"
          >
            <Search size={14} />
            <span style={{ fontSize: '11px', fontWeight: 500 }}>{t('nav.search')}</span>
            <kbd
              style={{
                fontFamily: 'monospace',
                fontSize: '10px',
                background: '#fff',
                border: '1px solid #d5d8cd',
                borderRadius: '4px',
                padding: '1px 4px',
                color: '#777e70',
              }}
            >
              ⌘K
            </kbd>
          </button>

          {/* Notification Center Trigger */}
          <button
            onClick={() => setIsNotificationOpen(true)}
            style={{
              position: 'relative',
              display: 'grid',
              placeItems: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#f0f2ea',
              color: '#4e5548',
            }}
            aria-label="Open notifications"
          >
            <Bell size={16} />
            {unreadAlertsCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#e27357',
                  color: '#fff',
                  font: "bold 9px 'DM Mono'",
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {unreadAlertsCount}
              </span>
            )}
          </button>

          <span className="sync">
            <i /> {loading ? 'Syncing…' : 'PocketBase ready'}
          </span>

          {/* Bilingual Switcher */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#eef1e5',
              padding: '2px',
              borderRadius: '8px',
              border: '1px solid #dedfd8',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <button
              type="button"
              onClick={() => setLocale('id')}
              style={{
                padding: '2px 8px',
                borderRadius: '6px',
                border: 'none',
                background: locale === 'id' ? '#7d9850' : 'transparent',
                color: locale === 'id' ? '#fff' : '#494f45',
                cursor: 'pointer',
                fontWeight: locale === 'id' ? 700 : 500,
              }}
            >
              ID
            </button>
            <button
              type="button"
              onClick={() => setLocale('en')}
              style={{
                padding: '2px 8px',
                borderRadius: '6px',
                border: 'none',
                background: locale === 'en' ? '#7d9850' : 'transparent',
                color: locale === 'en' ? '#fff' : '#494f45',
                cursor: 'pointer',
                fontWeight: locale === 'en' ? 700 : 500,
              }}
            >
              EN
            </button>
          </div>

          <button
            className="avatar"
            aria-label="Open account settings"
            onClick={() => navigateTo('settings')}
          >
            RA
          </button>
        </div>
      </header>

      {/* Module View Routers */}
      {module === 'cockpit' ? (
        <main>
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
        </main>
      ) : module === 'linkedin' ? (
        <main>
          <LinkedInAssistantView applications={applications} />
        </main>
      ) : module === 'ai-studio' ? (
        <main>
          <AiAgentStudioView
            onPromoteApplication={add}
            onNavigateToPipeline={() => navigateTo('pipeline')}
          />
        </main>
      ) : module === 'analytics' ? (
        <main>
          <AnalyticsView applications={applications} cvs={cvs} />
        </main>
      ) : module === 'users' ? (
        <main>
          <UserManagementView />
        </main>
      ) : module === 'help' ? (
        <main>
          <HelpSupportView />
        </main>
      ) : module === 'system' ? (
        <main>
          <SystemPagesView onNavigateHome={() => navigateTo('pipeline')} />
        </main>
      ) : module === 'offers' ? (
        <main>
          <OfferComparatorView applications={applications} />
        </main>
      ) : module === 'settings' ? (
        <main>
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
        </main>
      ) : module === 'jobhunter' ? (
        <main>
          <JobHunterView
            onPromoteToApplyFlow={(lead) => {
              setPromotedLead(lead);
              navigateTo('applyflow');
            }}
          />
        </main>
      ) : module === 'inbox' ? (
        <main>
          <RecruitmentInboxView
            applications={applications}
            addApplication={add}
            onSelectApplication={(app) => {
              setDrawer(app);
              navigateTo('pipeline');
            }}
          />
        </main>
      ) : module === 'networking' ? (
        <main>
          <NetworkingView />
        </main>
      ) : module === 'applyflow' ? (
        <main>
          <ApplyFlowView cvs={cvs} add={add} initialData={promotedLead} />
        </main>
      ) : (
        <main>
          <section className="hero">
            <div>
              <p className="eyebrow">{dateLabel}</p>
              <h1>
                Keep the right
                <br />
                <em>doors open.</em>
              </h1>
              <p className="lede">
                A focused view of every opportunity, conversation, and next move in your career.
              </p>
            </div>
            <button className="primary" onClick={() => setShowAdd(true)}>
              <CirclePlus size={18} /> Add opportunity
            </button>
          </section>

          {hasDataError && (
            <div className="data-error">
              Could not load all your data.{' '}
              <button onClick={() => location.reload()}>Retry</button>
            </div>
          )}

          <section className="metrics">
            {metrics.map(([label, value, detail], i) => (
              <div className="metric" key={label}>
                <div className="metric-top">
                  <span>{label}</span>
                  {i === 0 ? (
                    <Target size={16} />
                  ) : i === 1 ? (
                    <Activity size={16} />
                  ) : i === 2 ? (
                    <Eye size={16} />
                  ) : (
                    <Sparkles size={16} />
                  )}
                </div>
                <b>{value}</b>
                <small>{detail}</small>
              </div>
            ))}
          </section>

          <section className="workspace">
            <div className="toolbar">
              <div className="section-title">
                <h2>Opportunity pipeline</h2>
                <span>{filtered.length} roles</span>
              </div>
              <div className="tools">
                <div className="search">
                  <Search size={16} />
                  <input
                    placeholder="Search company, role, location"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className="segmented">
                  <button
                    className={view === 'board' ? 'selected' : ''}
                    onClick={() => setView('board')}
                    aria-label="Board view"
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    className={view === 'table' ? 'selected' : ''}
                    onClick={() => setView('table')}
                    aria-label="Table view"
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="board">
                {statuses.slice(0, 5).map((status) => (
                  <div className="column" key={status}>
                    <div className="column-head">
                      <span className={`dot ${status.toLowerCase()}`} />
                      <h3>{status}</h3>
                    </div>
                    <div className="cards">
                      <div className="skeleton-card">
                        <div className="skeleton skeleton-text" style={{ width: '45%' }} />
                        <div className="skeleton skeleton-text" style={{ width: '85%', height: '16px' }} />
                        <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                      </div>
                      <div className="skeleton-card">
                        <div className="skeleton skeleton-text" style={{ width: '35%' }} />
                        <div className="skeleton skeleton-text" style={{ width: '75%', height: '16px' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 && query ? (
              <div
                className="empty-state"
                style={{
                  background: '#fbfbf8',
                  border: '1px dashed #d5d8cd',
                  padding: '48px 24px',
                  borderRadius: '4px',
                  textAlign: 'center',
                }}
              >
                <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#555d4e' }}>
                  Tidak ditemukan peluang karier untuk pencarian &ldquo;<strong>{query}</strong>&rdquo;.
                </p>
                <button
                  type="button"
                  className="secondary compact-btn"
                  onClick={() => setQuery('')}
                >
                  Reset Filter Pencarian
                </button>
              </div>
            ) : view === 'board' ? (
              <div className="board">
                {statuses.slice(0, 6).map((status) => (
                  <div className="column" key={status}>
                    <div className="column-head">
                      <span className={`dot ${status.toLowerCase()}`} />
                      <h3>{status}</h3>
                      <span className="count">
                        {filtered.filter((a) => a.status === status).length}
                      </span>
                    </div>
                    <div className="cards">
                      {filtered
                        .filter((a) => a.status === status)
                        .map((a) => (
                          <ApplicationCard
                            key={a.id}
                            application={a}
                            onClick={() => setDrawer(a)}
                          />
                        ))}
                      <button className="ghost-add" onClick={() => setShowAdd(true)}>
                        <CirclePlus size={15} /> Add role
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <JobTable applications={filtered} onSelectApplication={setDrawer} />
            )}
          </section>

          {/* 2. Bento Grid & Modular Layout: Asymmetrical, characterful information hierarchy */}
          <section className="bento-grid">
            {/* Bento Card 1: Large Primary Feature Card - Follow-Up Radar */}
            <div className="bento-card bento-card-primary">
              <div className="card-heading">
                <div>
                  <p className="eyebrow">
                    <Activity size={12} /> FOLLOW-UP RADAR
                  </p>
                  <h2>
                    Small moves,
                    <br />
                    <em>better odds.</em>
                  </h2>
                </div>
                <ArrowUpRight size={18} />
              </div>
              {followups.length ? (
                followups.map((item, index) => {
                  const matchingApp = applications.find(
                    (a) =>
                      `${a.company} · ${a.position}` === item.title ||
                      item.title.startsWith(a.company)
                  );
                  return (
                    <FollowUp
                      key={`${item.title}-${index}`}
                      item={item}
                      onClick={() => {
                        if (matchingApp) {
                          setFollowUpApp(matchingApp);
                        }
                      }}
                    />
                  );
                })
              ) : (
                <div className="empty-card">No follow-ups scheduled yet.</div>
              )}
            </div>

            {/* Bento Card 2: Medium Analytical Story Card - CV Lab Experiments */}
            <div className="bento-card bento-card-story">
              <div className="card-heading">
                <div>
                  <p className="eyebrow">
                    <FileText size={12} /> CV LAB
                  </p>
                  <h2>
                    Which story
                    <br />
                    <em>travels furthest?</em>
                  </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="secondary compact-btn"
                    onClick={() => setIsAtsResumeOpen(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', padding: '4px 8px' }}
                    title="Open 1-Click Printable ATS Resume Formatter"
                  >
                    <Printer size={12} /> ATS Resume
                  </button>
                  <FileText size={18} />
                </div>
              </div>
              {cvs.length ? (
                cvs.map((c) => (
                  <div className="cv-row" key={c.id}>
                    <span className="cv-icon">
                      {c.version.split('-')[1]?.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="cv-name">
                      <b>{c.label}</b>
                      <small>
                        {c.version} · {c.applications} applications
                      </small>
                    </div>
                    <div className="rate">
                      <b>{responseRate(c.responses, c.applications)}%</b>
                      <small>response</small>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-card">No CV experiments yet.</div>
              )}
            </div>

            {/* Bento Card 3: Small Statistics & Monotonic Integrity Card */}
            <div className="bento-card bento-card-stat">
              <div className="card-heading">
                <div>
                  <p className="eyebrow">
                    <Zap size={12} /> {locale === 'id' ? 'PROGRES LAMARAN' : 'PIPELINE VELOCITY'}
                  </p>
                  <h3 style={{ fontSize: '18px', margin: '2px 0 0', fontWeight: 600 }}>
                    {locale === 'id' ? 'Status Lamaran Terjaga' : 'Monotonic Funnel Health'}
                  </h3>
                </div>
                <span className="status-pill" style={{ background: '#eef2e6', color: '#566e33' }}>
                  {locale === 'id' ? 'Aman' : 'Protected'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '18px' }}>
                <div style={{ background: '#f5f6f1', padding: '12px', borderRadius: '3px' }}>
                  <span style={{ font: "9px 'DM Mono'", color: '#82877c', textTransform: 'uppercase' }}>
                    {locale === 'id' ? 'Lamaran Berjalan' : 'Active In Flight'}
                  </span>
                  <b style={{ display: 'block', fontSize: '20px', color: '#202320', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
                    {applications.filter((a) => !['Rejected', 'Ghosted'].includes(a.status)).length}
                  </b>
                  <small style={{ fontSize: '10px', color: '#888e84' }}>
                    {locale === 'id' ? 'posisi aktif' : 'roles in motion'}
                  </small>
                </div>
                <div style={{ background: '#f5f6f1', padding: '12px', borderRadius: '3px' }}>
                  <span style={{ font: "9px 'DM Mono'", color: '#82877c', textTransform: 'uppercase' }}>
                    {locale === 'id' ? 'Peluang Wawancara' : 'Interview Rate'}
                  </span>
                  <b style={{ display: 'block', fontSize: '20px', color: '#7d9850', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
                    {applications.length > 0
                      ? Math.round(
                          (applications.filter((a) => ['Interview', 'Offer'].includes(a.status)).length /
                            applications.length) *
                            100
                        )
                      : 0}
                    %
                  </b>
                  <small style={{ fontSize: '10px', color: '#888e84' }}>
                    {locale === 'id' ? 'rasio wawancara' : 'interview ratio'}
                  </small>
                </div>
              </div>
              <p style={{ fontSize: '11px', color: '#7a8174', margin: '14px 0 0', lineHeight: 1.5 }}>
                {locale === 'id'
                  ? 'Status tahap seleksi tersimpan aman dan tidak akan turun jika ada email balasan masuk terlambat.'
                  : 'Protected against downgrade regressions. Late notifications preserve forward state progression.'}
              </p>
            </div>

            {/* Bento Card 4: Interactive Automation Card - Autonomous Telegram Briefing */}
            <div className="bento-card bento-card-sync">
              <div className="card-heading">
                <div>
                  <p className="eyebrow">
                    <Send size={12} /> TELEGRAM BOT
                  </p>
                  <h3 style={{ fontSize: '18px', margin: '2px 0 0', fontWeight: 600 }}>
                    {locale === 'id' ? 'Ringkasan Pagi Hari' : 'Morning Briefing'}
                  </h3>
                </div>
                <span className="status-pill" style={{ background: '#e3ebd3', color: '#445826' }}>
                  08:30 WIB
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#687063', margin: '14px 0', lineHeight: 1.55 }}>
                {locale === 'id'
                  ? 'Ringkasan lamaran harian, agenda wawancara terdekat, dan pengingat tindak lanjut terkirim otomatis ke akun Telegram Anda.'
                  : 'Daily application summaries, upcoming interviews, and follow-up alerts sent directly to your Telegram.'}
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="secondary compact-btn"
                  onClick={() => navigateTo('settings')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Settings size={12} /> {locale === 'id' ? 'Buka Pengaturan Telegram' : 'Configure Telegram'}
                </button>
              </div>
            </div>
          </section>
        </main>
      )}

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
    </div>
  );
}

export default App;
