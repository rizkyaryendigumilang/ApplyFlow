import React from 'react';
import { AlertCircle, Calendar, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
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
    <Card className="border-slate-800 bg-slate-900/90 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold text-slate-100 flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
              </span>
              {t('cockpit.attentionTitle')}
            </CardTitle>
            <CardDescription>{t('cockpit.attentionSubtitle')}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-2">
        {isAllClear ? (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs">{t('cockpit.allCaughtUp')}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Stale applications card */}
            <div
              className={`p-4 rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.2)] transition-[transform,border-color,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 active:scale-[0.99] ${
                hasStale
                  ? 'bg-slate-950/80 border-amber-500/30 hover:border-amber-500/60 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_16px_rgba(245,158,11,0.15)]'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <AlertCircle className="w-4 h-4" />
                </span>
                <Badge variant={hasStale ? 'interview' : 'outline'}>
                  {alerts.staleApplications.length}
                </Badge>
              </div>
              <h4 className="text-xs font-semibold text-slate-200 mb-1">
                {t('cockpit.staleAlert', { count: alerts.staleApplications.length })}
              </h4>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                {t('cockpit.staleDesc')}
              </p>
              {hasStale && (
                <div className="space-y-1.5">
                  {alerts.staleApplications.slice(0, 2).map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => onSelectApplication(app.id)}
                      className="w-full text-left text-[11px] px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 flex items-center justify-between transition-colors border border-slate-800/80 active:scale-[0.985]"
                    >
                      <span className="font-medium truncate">{app.company}</span>
                      <span className="text-slate-500 text-[10px] shrink-0">Tindak Lanjut &rarr;</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming interviews card */}
            <div
              className={`p-4 rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.2)] transition-[transform,border-color,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 active:scale-[0.99] ${
                hasInterviews
                  ? 'bg-slate-950/80 border-blue-500/30 hover:border-blue-500/60 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_16px_rgba(59,130,246,0.15)]'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-1.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <Calendar className="w-4 h-4" />
                </span>
                <Badge variant={hasInterviews ? 'applied' : 'outline'}>
                  {alerts.upcomingInterviews.length}
                </Badge>
              </div>
              <h4 className="text-xs font-semibold text-slate-200 mb-1">
                {t('cockpit.interviewsAlert', { count: alerts.upcomingInterviews.length })}
              </h4>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                {t('cockpit.interviewsDesc')}
              </p>
              {hasInterviews && (
                <div className="space-y-1.5">
                  {alerts.upcomingInterviews.slice(0, 2).map((iv) => (
                    <div
                      key={iv.id}
                      className="text-[11px] px-2.5 py-1.5 rounded-xl bg-slate-900/90 text-slate-300 flex items-center justify-between border border-slate-800/80"
                    >
                      <span className="font-medium truncate">{iv.company || 'Perusahaan'}</span>
                      {onOpenStarCoach && (
                        <button
                          type="button"
                          onClick={() => onOpenStarCoach(iv.company || 'Perusahaan', iv.stage || 'Interview')}
                          className="text-blue-400 hover:text-blue-300 text-[10px] font-semibold active:scale-95 transition-transform"
                        >
                          STAR Prep &rarr;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* High match leads card */}
            <div
              className={`p-4 rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.2)] transition-[transform,border-color,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 active:scale-[0.99] ${
                hasLeads
                  ? 'bg-slate-950/80 border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_16px_rgba(16,185,129,0.15)]'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <Sparkles className="w-4 h-4" />
                </span>
                <Badge variant={hasLeads ? 'offer' : 'outline'}>
                  {alerts.highMatchLeads.length}
                </Badge>
              </div>
              <h4 className="text-xs font-semibold text-slate-200 mb-1">
                {t('cockpit.leadsAlert', { count: alerts.highMatchLeads.length })}
              </h4>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                {t('cockpit.leadsDesc')}
              </p>
              {hasLeads && (
                <div className="space-y-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onNavigateToJobHunter}
                    className="w-full text-xs justify-between text-slate-300 hover:text-white"
                  >
                    <span>Buka Triage Lowongan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
