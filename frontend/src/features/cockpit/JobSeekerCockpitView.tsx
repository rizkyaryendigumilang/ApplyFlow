import React, { useMemo } from 'react';
import { LayoutDashboard, Plus, ArrowUpRight, Calendar, Sparkles } from 'lucide-react';
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
import { Button } from '../../components/ui/button';
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

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8 select-none">
      {/* 1. Twenty CRM Workspace Header Card */}
      <div className="bg-white dark:bg-[#18181b] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Dasbor Utama
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.2 rounded-full">
                Sesi Aktif
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {t('cockpit.welcome', { name: candidateName })}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
              {t('cockpit.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="px-3 py-1.5 rounded-md bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 text-xs text-zinc-600 dark:text-zinc-300 font-mono text-center tabular-nums">
              📅 {dateLabel}
            </div>
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 rounded-md text-xs font-semibold shadow-2xs transition-all active:scale-[0.98]"
            >
              <Plus size={14} />
              <span>Tambah Lowongan</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Daily Attention Radar (High priority action center) */}
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

      {/* 3. Kalender Wawancara & Pengingat (.ics) Widget */}
      <InterviewCalendarWidget
        interviews={interviews}
        applications={applications}
        onAddInterview={onAddInterview}
        onOpenStarCoach={onOpenStarCoach}
        onSelectApplication={onSelectApplication}
      />

      {/* 4. Two-Column Row: Funnel Momentum & Safe Quota Habit */}
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

      {/* 5. Intelligence Row: AI Job Scout & Real THP Offer Comparator */}
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

      {/* 6. Top 5 Priority Applications Queue */}
      <PriorityActionList
        applications={applications}
        onSelectApplication={onSelectApplication}
        onNavigateToPipeline={() => onNavigateTo('pipeline')}
      />
    </div>
  );
};
