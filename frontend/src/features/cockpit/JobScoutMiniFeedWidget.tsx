import React from 'react';
import { Compass, Lightbulb, MapPin, Briefcase, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import type { JobLead } from '../../lib/pb-types';

interface JobScoutMiniFeedWidgetProps {
  jobLeads: JobLead[];
  onNavigateToJobHunter: () => void;
  onPromoteLead?: (lead: JobLead) => void;
}

export const JobScoutMiniFeedWidget: React.FC<JobScoutMiniFeedWidgetProps> = ({
  jobLeads,
  onNavigateToJobHunter,
  onPromoteLead,
}) => {
  // Filter top matches sorted by score
  const topLeads = React.useMemo(() => {
    return [...jobLeads]
      .filter((l) => (l.matchScore || 0) >= 75)
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, 3);
  }, [jobLeads]);

  return (
    <Card className="border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#18181b] shadow-2xs">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Compass className="w-4 h-4 text-zinc-500" />
              Rekomendasi Lowongan Terpilih
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Lowongan terfilter dari pencarian kualifikasi dengan tingkat kecocokan tinggi.
            </CardDescription>
          </div>
          <button
            onClick={onNavigateToJobHunter}
            className="flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-100 transition-colors"
          >
            <span>Buka Hunter</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        {topLeads.length === 0 ? (
          <div className="p-5 rounded-lg bg-zinc-50/70 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
            Belum ada rekomendasi lowongan baru. Buka Job Hunter untuk scrape atau tambahkan link lowongan.
          </div>
        ) : (
          <div className="space-y-2.5">
            {topLeads.map((lead) => (
              <div
                key={lead.id}
                className="p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {lead.title}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200">
                        {lead.matchScore}% Cocok
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {lead.company}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-zinc-400" />
                        {lead.location || 'Remote'}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-zinc-400" />
                        {lead.workMode || 'Full-time'}
                      </span>
                    </div>

                    {lead.evaluation?.suggestedAngle && (
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 truncate pt-0.5">
                        <Lightbulb size={11} className="shrink-0 text-amber-500" />
                        <span>{lead.evaluation.suggestedAngle}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (onPromoteLead) {
                        onPromoteLead(lead);
                      } else {
                        onNavigateToJobHunter();
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 text-xs font-semibold shadow-2xs transition-all active:scale-[0.98]"
                  >
                    <CheckCircle2 size={12} />
                    <span>Lamar Cepat</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
