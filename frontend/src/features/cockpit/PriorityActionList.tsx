import React from 'react';
import { Briefcase, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import type { Application } from '../../lib/pb-types';
import { idr, daysSince } from '../../lib/utils';
import { useI18n } from '../../lib/i18n';

interface PriorityActionListProps {
  applications: Application[];
  onSelectApplication: (app: Application) => void;
  onNavigateToPipeline: () => void;
}

export const PriorityActionList: React.FC<PriorityActionListProps> = ({
  applications,
  onSelectApplication,
  onNavigateToPipeline,
}) => {
  const { t } = useI18n();

  // Pick top 5 active applications (prioritizing Interview, Screening, Offer, Applied)
  const priorityList = React.useMemo(() => {
    const rank: Record<string, number> = {
      Offer: 1,
      Interview: 2,
      Screening: 3,
      Applied: 4,
      Viewed: 5,
      Wishlist: 6,
      Rejected: 7,
      Ghosted: 8,
    };

    return [...(applications || [])]
      .filter((a) => a.status !== 'Rejected' && a.status !== 'Ghosted')
      .sort((a, b) => (rank[a.status] || 99) - (rank[b.status] || 99))
      .slice(0, 5);
  }, [applications]);

  const mapStatusVariant = (status: string) => {
    switch (status) {
      case 'Offer':
        return 'offer';
      case 'Interview':
        return 'interview';
      case 'Screening':
        return 'screening';
      case 'Applied':
        return 'applied';
      case 'Viewed':
        return 'viewed';
      case 'Wishlist':
        return 'wishlist';
      default:
        return 'default';
    }
  };

  return (
    <Card className="border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#18181b] shadow-2xs">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-zinc-500" />
              {t('cockpit.priorityTitle')}
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              {t('cockpit.prioritySubtitle')}
            </CardDescription>
          </div>
          <button
            onClick={onNavigateToPipeline}
            className="flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-100 transition-colors"
          >
            <span>Buka Pipeline</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {priorityList.length === 0 ? (
          <div className="text-center py-6 text-xs text-zinc-400">
            {t('cockpit.noApplications')}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Perusahaan & Posisi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Rentang Gaji</TableHead>
                <TableHead className="hidden md:table-cell">Hari Berjalan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priorityList.map((app) => (
                <TableRow
                  key={app.id}
                  className="cursor-pointer"
                  onClick={() => onSelectApplication(app)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] flex items-center justify-center border border-zinc-200/60 dark:border-zinc-700/60 flex-shrink-0">
                        {app.company[0]?.toUpperCase() || 'C'}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {app.company}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate">{app.position}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={mapStatusVariant(app.status)}>
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-zinc-700 dark:text-zinc-300 font-mono text-[11px] tabular-nums">
                    {app.salaryMin > 0 ? `${idr(app.salaryMin)} - ${idr(app.salaryMax)}` : 'Dirahasiakan'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-zinc-500 text-xs font-mono">
                    {daysSince(app.sentAt || app.created || new Date().toISOString())} hari lalu
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectApplication(app);
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Buka &rarr;
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
