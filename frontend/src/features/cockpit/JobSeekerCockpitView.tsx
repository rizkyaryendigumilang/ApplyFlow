import React, { useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Calendar,
  Sparkles,
  Compass,
  Radar,
  Target,
  Zap,
  Briefcase,
  FileText,
  Smile,
  FolderKanban,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import type { Application, Interview, JobLead } from '../../lib/pb-types';
import { useCandidateProfile } from '../../hooks/useCandidateProfile';
import { useI18n } from '../../lib/i18n';
import { DailyAttentionRadar } from './DailyAttentionRadar';
import { FunnelMomentumWidget } from './FunnelMomentumWidget';
import { PriorityActionList } from './PriorityActionList';
import { SafeQuotaTrackerCard } from '../linkedin-assistant/SafeQuotaTrackerCard';
import { InterviewCalendarWidget } from './InterviewCalendarWidget';
import { JobScoutMiniFeedWidget } from './JobScoutMiniFeedWidget';
import { OfferComparatorSnapshotWidget } from './OfferComparatorSnapshotWidget';
import { CansaasAnalyticsBento } from './CansaasAnalyticsBento';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import {
  calculateRadarAlerts,
  calculateFunnelStats,
  type RadarApp,
  type RadarInterview,
  type RadarLead,
} from './cockpit-helpers';

interface JobSeekerCockpitViewProps {
  applications: Application[];
  interviews?: Interview[];
  jobLeads?: JobLead[];
  onNavigateTo: (mod: string) => void;
  onSelectApplication: (app: Application) => void;
  onOpenAddModal: () => void;
  onOpenStarCoach?: (company: string, position: string) => void;
  onAddInterview?: (data: Omit<Interview, 'id'>) => Promise<Interview>;
  onPromoteLead?: (lead: JobLead) => void;
}

export const JobSeekerCockpitView: React.FC<JobSeekerCockpitViewProps> = ({
  applications,
  interviews = [],
  jobLeads = [],
  onNavigateTo,
  onSelectApplication,
  onOpenAddModal,
  onOpenStarCoach,
  onAddInterview,
  onPromoteLead,
}) => {
  const { profile } = useCandidateProfile();
  const { t, locale } = useI18n();

  const [activeTab, setActiveTab] = useState<'overview' | 'assigned' | 'created' | 'following' | 'activity'>('overview');

  const candidateName = profile?.fullName || 'Rizky';

  const dateLabel = useMemo(() => {
    return new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    }).format(new Date());
  }, [locale]);

  // Adapt data for radar helpers
  const radarApps: RadarApp[] = useMemo(() => {
    return (applications || []).map((a) => ({
      id: a.id,
      company: a.company,
      position: a.position,
      status: a.status,
      sentAt: a.sentAt || a.created,
      location: a.location,
      notes: a.notes,
    }));
  }, [applications]);

  const radarInterviews: RadarInterview[] = useMemo(() => {
    return (interviews || []).map((i) => {
      const matchedApp = applications.find((a) => a.id === i.application);
      return {
        id: i.id,
        company: matchedApp?.company || 'Target Company',
        scheduledAt: i.scheduledAt,
        stage: i.interviewType || i.round,
        prepNotes: i.prepNotes,
      };
    });
  }, [interviews, applications]);

  const radarLeads: RadarLead[] = useMemo(() => {
    return (jobLeads || []).map((l) => ({
      id: l.id,
      company: l.company,
      title: l.title,
      matchScore: l.matchScore,
      status: l.status,
    }));
  }, [jobLeads]);

  const radarAlerts = useMemo(() => {
    return calculateRadarAlerts(radarApps, radarInterviews, radarLeads);
  }, [radarApps, radarInterviews, radarLeads]);

  const funnelStats = useMemo(() => {
    return calculateFunnelStats(radarApps);
  }, [radarApps]);

  const followingCount = useMemo(() => {
    return applications.filter(
      (a) => a.status === 'Applied' || a.status === 'Screening' || a.status === 'Interview'
    ).length || Math.min(47, applications.length || 47);
  }, [applications]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none">
      {/* ========================================================
          1. Modern Cansaas Space Header Card
          ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
              ApplyFlow Workspace
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 px-2.5 py-0.5 rounded-full font-mono">
              <span className="bencho-live-dot">
                <span className="ping bg-emerald-400" />
                <span className="core bg-emerald-500" />
              </span>
              Live Sync
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Your workspace at a glance
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Clear view of delivery, priorities, and recent progress.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 text-xs text-zinc-600 dark:text-zinc-300 font-mono tabular-nums shadow-2xs">
            <Calendar size={13} className="text-zinc-400" />
            <span>{dateLabel}</span>
          </div>
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus size={14} />
            <span>Create New Work</span>
            <span className="bencho-kbd bg-zinc-800 text-zinc-300 dark:bg-zinc-200 dark:text-zinc-700 border-zinc-700 dark:border-zinc-300">
              N
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. Underline Navigation Tabs (Exact Cansaas Space)
          ======================================================== */}
      <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-zinc-800 text-xs font-medium">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'assigned', label: 'Assigned' },
          { key: 'created', label: 'Created' },
          { key: 'following', label: 'Following' },
          { key: 'activity', label: 'Activity' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={cn(
                'pb-2.5 transition-all relative font-medium text-xs',
                isActive
                  ? 'text-zinc-900 dark:text-zinc-100 font-bold border-b-2 border-blue-600'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================
          3. Squircle Metric Row (4 Sleek Cards from Reference)
          ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Created */}
        <div
          onClick={() => onNavigateTo('pipeline')}
          className="p-4 rounded-2xl bg-white dark:bg-[#151518] border border-zinc-200/80 dark:border-white/[0.08] shadow-2xs flex items-center gap-3.5 hover:shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 flex-shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">Created</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tracking-tight">
              {applications.length || 158}
            </span>
          </div>
        </div>

        {/* Card 2: Following */}
        <div
          onClick={() => onNavigateTo('pipeline')}
          className="p-4 rounded-2xl bg-white dark:bg-[#151518] border border-zinc-200/80 dark:border-white/[0.08] shadow-2xs flex items-center gap-3.5 hover:shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 flex-shrink-0">
            <Smile size={20} />
          </div>
          <div>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">Following</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tracking-tight">
              {followingCount}
            </span>
          </div>
        </div>

        {/* Card 3: Project Progress */}
        <div
          onClick={() => onNavigateTo('pipeline')}
          className="p-4 rounded-2xl bg-white dark:bg-[#151518] border border-zinc-200/80 dark:border-white/[0.08] shadow-2xs flex items-center gap-3.5 hover:shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white shadow-sm shadow-orange-500/20 flex-shrink-0">
            <FolderKanban size={20} />
          </div>
          <div>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">Project Progress</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tracking-tight">
              {funnelStats.responseRatePercent}%
            </span>
          </div>
        </div>

        {/* Card 4: Active Offers */}
        <div
          onClick={() => onNavigateTo('offers')}
          className="p-4 rounded-2xl bg-white dark:bg-[#151518] border border-zinc-200/80 dark:border-white/[0.08] shadow-2xs flex items-center gap-3.5 hover:shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-purple-500/20 flex-shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">Active Offers</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tracking-tight">
              {funnelStats.offerCount || 2}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. Cansaas Analytics Bento Grid (Bar & Donut Charts)
          ======================================================== */}
      {activeTab === 'overview' && (
        <CansaasAnalyticsBento
          applications={applications}
          onNavigateTo={onNavigateTo}
          onOpenAddModal={onOpenAddModal}
        />
      )}

      {/* ========================================================
          5. Interactive Guided Funnel Path (Alur 4 Langkah Mudah)
          ======================================================== */}
      {(activeTab === 'overview' || activeTab === 'assigned') && (
        <div className="horizonx-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                  <Compass size={15} />
                </span>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Alur 4 Langkah Mudah Sukses Melamar Kerja
                </h2>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Klik salah satu tahapan di bawah untuk langsung menuju aksi yang ingin Anda lakukan.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold self-start sm:self-auto">
              Panduan Terpadu
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Step 1: Temukan Lowongan */}
            <div
              onClick={() => onNavigateTo('jobscout')}
              className="group p-4 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/60 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-2xs cursor-pointer transition-all active:scale-[0.985] flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[11px] font-bold font-mono flex items-center justify-center">
                    1
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-zinc-400">
                    Cari Lowongan
                  </span>
                </div>
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-950 dark:group-hover:text-white flex items-center gap-1.5">
                  <Radar size={13} className="text-zinc-600 dark:text-zinc-400" />
                  <span>Auto Job Scout</span>
                  <ArrowRight size={13} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform ml-auto" />
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Pindai ratusan lowongan di Jobstreet, LinkedIn, dan Glints secara otomatis sesuai peran target Anda.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Aksi:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 group-hover:underline flex items-center gap-1">
                  Buka Radar <ArrowRight size={11} />
                </span>
              </div>
            </div>

            {/* Step 2: Evaluasi Kecocokan */}
            <div
              onClick={() => onNavigateTo('jobhunter')}
              className="group p-4 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/60 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-2xs cursor-pointer transition-all active:scale-[0.985] flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[11px] font-bold font-mono flex items-center justify-center">
                    2
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-zinc-400">
                    Uji CV & Triage
                  </span>
                </div>
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-950 dark:group-hover:text-white flex items-center gap-1.5">
                  <Target size={13} className="text-zinc-600 dark:text-zinc-400" />
                  <span>Job Hunter Engine</span>
                  <ArrowRight size={13} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform ml-auto" />
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Tempel link atau deskripsi lowongan untuk mengecek persentase kecocokan skill, dealbreaker, dan celah CV.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Aksi:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 group-hover:underline flex items-center gap-1">
                  Uji Kecocokan <ArrowRight size={11} />
                </span>
              </div>
            </div>

            {/* Step 3: Siapkan Lamaran */}
            <div
              onClick={() => onNavigateTo('applyflow')}
              className="group p-4 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/60 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-2xs cursor-pointer transition-all active:scale-[0.985] flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[11px] font-bold font-mono flex items-center justify-center">
                    3
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-zinc-400">
                    Draft & ATS
                  </span>
                </div>
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-950 dark:group-hover:text-white flex items-center gap-1.5">
                  <Zap size={13} className="text-zinc-600 dark:text-zinc-400" />
                  <span>ApplyFlow Studio</span>
                  <ArrowRight size={13} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform ml-auto" />
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Susun email lamaran profesional terarah ke HRD dan unduh resume format standar Harvard ATS 1-klik.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Aksi:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 group-hover:underline flex items-center gap-1">
                  Susun Lamaran <ArrowRight size={11} />
                </span>
              </div>
            </div>

            {/* Step 4: Lacak & Pantau */}
            <div
              onClick={() => onNavigateTo('pipeline')}
              className="group p-4 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/60 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-2xs cursor-pointer transition-all active:scale-[0.985] flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[11px] font-bold font-mono flex items-center justify-center">
                    4
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-zinc-400">
                    Lacak Kanban
                  </span>
                </div>
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-950 dark:group-hover:text-white flex items-center gap-1.5">
                  <Briefcase size={13} className="text-zinc-600 dark:text-zinc-400" />
                  <span>Pantau Lamaran</span>
                  <ArrowRight size={13} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform ml-auto" />
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Pantau perkembangan seleksi dari Wishlist, Wawancara, hingga Surat Penawaran (Offer) gaji terbaik.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Aksi:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 group-hover:underline flex items-center gap-1">
                  Buka Pipeline <ArrowRight size={11} />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          6. High Priority Action Center (Radar)
          ======================================================== */}
      {(activeTab === 'overview' || activeTab === 'assigned') && (
        <DailyAttentionRadar
          alerts={radarAlerts}
          onNavigateToPipeline={() => onNavigateTo('pipeline')}
          onNavigateToJobHunter={() => onNavigateTo('jobhunter')}
          onSelectApplication={(id) => {
            const app = applications.find((a) => a.id === id);
            if (app) onSelectApplication(app);
          }}
          onOpenStarCoach={onOpenStarCoach}
        />
      )}

      {/* ========================================================
          7. Kalender Wawancara & Pengingat (.ics)
          ======================================================== */}
      {(activeTab === 'overview' || activeTab === 'following') && (
        <InterviewCalendarWidget
          interviews={interviews}
          applications={applications}
          onAddInterview={onAddInterview}
          onOpenStarCoach={onOpenStarCoach}
          onSelectApplication={onSelectApplication}
        />
      )}

      {/* ========================================================
          8. Intelligence Row: Momentum & LinkedIn Quota
          ======================================================== */}
      {(activeTab === 'overview' || activeTab === 'created') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <FunnelMomentumWidget stats={funnelStats} />

          <div className="space-y-4">
            <SafeQuotaTrackerCard />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onNavigateTo('linkedin')}
                className="flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
              >
                <span>{t('cockpit.openLinkedIn')}</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          9. Feed Row: AI Job Scout & Real THP Offer Comparator
          ======================================================== */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <JobScoutMiniFeedWidget
            jobLeads={jobLeads}
            onNavigateToJobHunter={() => onNavigateTo('jobhunter')}
            onPromoteLead={onPromoteLead}
          />

          <OfferComparatorSnapshotWidget
            applications={applications}
            onNavigateToOffers={() => onNavigateTo('offers')}
          />
        </div>
      )}

      {/* ========================================================
          10. Top 5 Priority Applications Queue
          ======================================================== */}
      {(activeTab === 'overview' || activeTab === 'created') && (
        <PriorityActionList
          applications={applications}
          onSelectApplication={onSelectApplication}
          onNavigateToPipeline={() => onNavigateTo('pipeline')}
        />
      )}
    </div>
  );
};
