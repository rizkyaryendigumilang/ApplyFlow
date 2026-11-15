import React from 'react';
import { Compass, Sparkles, MapPin, Briefcase, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
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
    <Card className="border-slate-800 bg-slate-900/90 shadow-2xl relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              AI Job Scout (Rekomendasi Lowongan Cocok)
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Lowongan terfilter otomatis dari Job Hunter dengan Fit Score kecocokan tinggi.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToJobHunter}
            className="text-xs text-emerald-400 hover:text-emerald-300 border-emerald-500/30"
          >
            <span>Buka Job Hunter</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {topLeads.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
            Belum ada rekomendasi lowongan baru. Buka Job Hunter untuk scrape atau tambahkan link lowongan.
          </div>
        ) : (
          <div className="space-y-2.5">
            {topLeads.map((lead) => (
              <div
                key={lead.id}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100 truncate">{lead.title}</span>
                    <Badge variant="offer" className="text-[10px] py-0 px-1.5 font-mono">
                      {lead.matchScore}% Match
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <span className="font-medium text-slate-300">{lead.company}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {lead.location || 'Remote'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-slate-500" />
                      {lead.workMode || 'Full-time'}
                    </span>
                  </div>

                  {lead.evaluation?.suggestedAngle && (
                    <div className="text-[11px] text-emerald-400/90 italic truncate pt-0.5">
                      💡 {lead.evaluation.suggestedAngle}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (onPromoteLead) {
                        onPromoteLead(lead);
                      } else {
                        onNavigateToJobHunter();
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Lamar Cepat
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
