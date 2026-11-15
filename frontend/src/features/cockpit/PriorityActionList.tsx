import React from 'react';
import { Briefcase, Building2, ExternalLink, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
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
    <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-400" />
              {t('cockpit.priorityTitle')}
            </CardTitle>
            <CardDescription>{t('cockpit.prioritySubtitle')}</CardDescription>
          </div>
          <Button size="sm" variant="ghost" onClick={onNavigateToPipeline} className="text-xs text-blue-400 hover:text-blue-300">
            Lihat Semua Pipeline &rarr;
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-1">
        {priorityList.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
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
                <TableRow key={app.id} className="cursor-pointer" onClick={() => onSelectApplication(app)}>
                  <TableCell>
                    <div className="font-semibold text-slate-100">{app.company}</div>
                    <div className="text-[11px] text-slate-400">{app.position}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={mapStatusVariant(app.status)}>
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-slate-300 font-mono text-[11px] tabular-nums">
                    {app.salaryMin > 0 ? `${idr(app.salaryMin)} - ${idr(app.salaryMax)}` : 'Dirahasiakan'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-slate-400 text-xs">
                    {daysSince(app.sentAt || app.created || new Date().toISOString())} hari lalu
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectApplication(app);
                      }}
                      className="text-xs h-7 px-2.5 text-slate-300 hover:text-white"
                    >
                      Buka &rarr;
                    </Button>
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
