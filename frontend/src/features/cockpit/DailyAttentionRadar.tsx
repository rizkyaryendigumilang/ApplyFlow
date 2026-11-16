import React from 'react';
import { AlertCircle, Calendar, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import type { RadarAlerts } from './cockpit-helpers';
import { useI18n } from '../../lib/i18n';

interface DailyAttentionRadarProps {
  alerts: RadarAlerts;
  onNavigateToPipeline: () => void;
  onNavigateToJobHunter: () => void;
  onSelectApplication: (id: string) => void;
  onOpenStarCoach?: (company: string, position: string) => void;
}

export const DailyAttentionRadar: React.FC<DailyAttentionRadarProps> = ({
  alerts,
  onNavigateToPipeline,
  onNavigateToJobHunter,
  onSelectApplication,
  onOpenStarCoach,
}) => {
  const { t } = useI18n();

  const hasStale = alerts.staleApplications.length > 0;
  const hasInterviews = alerts.upcomingInterviews.length > 0;
  const hasLeads = alerts.highMatchLeads.length > 0;
  const isAllClear = !hasStale && !hasInterviews && !hasLeads;

  return (
    <Card className="border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#18181b] shadow-2xs">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              {t('cockpit.attentionTitle')}
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              {t('cockpit.attentionSubtitle')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        {isAllClear ? (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-zinc-800/70 text-zinc-700 dark:text-zinc-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="text-xs">{t('cockpit.allCaughtUp')}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Stale applications card */}
            <div
              className={`p-3.5 rounded-lg border transition-all duration-150 ${
                hasStale
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                  : 'bg-zinc-50/40 dark:bg-zinc-900/20 border-zinc-200/60 dark:border-zinc-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-1 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                  <AlertCircle className="w-3.5 h-3.5" />
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">
                  {alerts.staleApplications.length}
                </span>
              </div>
              <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                {t('cockpit.staleAlert', { count: alerts.staleApplications.length })}
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2.5 leading-relaxed">
                {t('cockpit.staleDesc')}
              </p>
              {hasStale && (
                <div className="space-y-1.5 border-t border-amber-200/60 dark:border-amber-800/40 pt-2">
                  {alerts.staleApplications.slice(0, 2).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => onSelectApplication(a.id)}
                      className="w-full text-left p-1.5 rounded hover:bg-amber-100/60 dark:hover:bg-amber-900/30 flex items-center justify-between text-[11px] group transition-colors"
                    >
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                        {a.company}
                      </span>
                      <ArrowRight className="w-3 h-3 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 shrink-0" />
                    </button>
                  ))}
                  <button
                    onClick={onNavigateToPipeline}
                    className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 hover:underline block pt-1"
                  >
                    Buka Pipeline &rarr;
                  </button>
                </div>
              )}
            </div>

            {/* 2. Upcoming interviews card */}
            <div
              className={`p-3.5 rounded-lg border transition-all duration-150 ${
                hasInterviews
                  ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60'
                  : 'bg-zinc-50/40 dark:bg-zinc-900/20 border-zinc-200/60 dark:border-zinc-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-1 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  <Calendar className="w-3.5 h-3.5" />
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200">
                  {alerts.upcomingInterviews.length}
                </span>
              </div>
              <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                {t('cockpit.interviewAlert', { count: alerts.upcomingInterviews.length })}
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2.5 leading-relaxed">
                {t('cockpit.interviewDesc')}
              </p>
              {hasInterviews && (
                <div className="space-y-1.5 border-t border-blue-200/60 dark:border-blue-800/40 pt-2">
                  {alerts.upcomingInterviews.slice(0, 2).map((i) => (
                    <div
                      key={i.id}
                      className="p-1.5 rounded bg-white/70 dark:bg-zinc-800/60 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-[11px]"
                    >
                      <div className="truncate">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 block truncate">
                          {i.company}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {new Date(i.scheduledAt || Date.now()).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          WIB
                        </span>
                      </div>
                      {onOpenStarCoach && (
                        <button
                          onClick={() => onOpenStarCoach(i.company || '', i.stage || 'Interview')}
                          className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold shrink-0"
                        >
                          Latih STAR
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. High-match leads card */}
            <div
              className={`p-3.5 rounded-lg border transition-all duration-150 ${
                hasLeads
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-zinc-50/40 dark:bg-zinc-900/20 border-zinc-200/60 dark:border-zinc-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-1 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200">
                  {alerts.highMatchLeads.length}
                </span>
              </div>
              <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                {t('cockpit.leadsAlert', { count: alerts.highMatchLeads.length })}
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2.5 leading-relaxed">
                {t('cockpit.leadsDesc')}
              </p>
              {hasLeads && (
                <div className="space-y-1.5 border-t border-emerald-200/60 dark:border-emerald-800/40 pt-2">
                  {alerts.highMatchLeads.slice(0, 2).map((l) => (
                    <div
                      key={l.id}
                      className="p-1.5 rounded bg-white/70 dark:bg-zinc-800/60 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-[11px]"
                    >
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {l.company}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-1.5 rounded">
                        {l.matchScore}%
                      </span>
                    </div>
                  ))}
                  <button
                    onClick={onNavigateToJobHunter}
                    className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline block pt-1"
                  >
                    Buka Job Hunter &rarr;
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
