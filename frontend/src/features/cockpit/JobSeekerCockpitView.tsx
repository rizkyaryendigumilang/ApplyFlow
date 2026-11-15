import React, { useMemo } from 'react';
import { LayoutDashboard, Compass, Send, Briefcase, Plus, ArrowUpRight } from 'lucide-react';
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800/90 rounded-3xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.3),0_20px_40px_-20px_rgba(0,0,0,0.7)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold ring-1 ring-inset ring-blue-500/20">
              <LayoutDashboard className="w-3.5 h-3.5" />
              {t('cockpit.eyebrow')}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              {t('cockpit.welcome', { name: candidateName })}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {t('cockpit.subtitle')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 font-mono text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] tabular-nums">
              📅 {dateLabel}
            </div>
            <Button
              onClick={onOpenAddModal}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_18px_-8px_rgba(37,99,235,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Lowongan
            </Button>
          </div>
        </div>
      </div>

      {/* 1. Daily Attention Radar (High priority action center) */}
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

      {/* 2. Kalender Wawancara & Pengingat (.ics) Widget */}
      <InterviewCalendarWidget
        interviews={interviews}
        applications={applications}
        onAddInterview={onAddInterview}
        onOpenStarCoach={onOpenStarCoach}
        onSelectApplication={onSelectApplication}
      />

      {/* 3. Bento Grid: Funnel Momentum & Safe Quota Habit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FunnelMomentumWidget stats={funnelStats} />
        
        <div className="space-y-4">
          <SafeQuotaTrackerCard />
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateTo('linkedin')}
              className="text-xs text-blue-400 hover:text-blue-300 border-blue-500/30"
            >
              <span>{t('cockpit.openLinkedIn')}</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Intelligence Grid: AI Job Scout & Real THP Offer Comparator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      {/* 5. Top 5 Priority Applications Queue */}
      <PriorityActionList
        applications={applications}
        onSelectApplication={onSelectApplication}
        onNavigateToPipeline={() => onNavigateTo('pipeline')}
      />
    </div>
  );
};
