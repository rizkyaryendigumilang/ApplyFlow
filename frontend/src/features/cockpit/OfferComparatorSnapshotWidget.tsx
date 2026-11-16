import React, { useMemo } from 'react';
import { Banknote, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import type { Application } from '../../lib/pb-types';
import { calculateTHP, type OfferPackage } from '../../lib/thp-calculator';

interface OfferComparatorSnapshotWidgetProps {
  applications: Application[];
  onNavigateToOffers: () => void;
}

const formatIdr = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
};

export const OfferComparatorSnapshotWidget: React.FC<OfferComparatorSnapshotWidgetProps> = ({
  applications,
  onNavigateToOffers,
}) => {
  const offerApps = useMemo(() => {
    return applications.filter((a) => a.status === 'Offer');
  }, [applications]);

  // If no official 'Offer' yet, take the highest salary application as a benchmark
  const benchmarkApp = useMemo(() => {
    if (offerApps.length > 0) return null;
    return [...applications]
      .filter((a) => a.salaryMax && a.salaryMax > 0)
      .sort((a, b) => (b.salaryMax || 0) - (a.salaryMax || 0))[0] || null;
  }, [applications, offerApps]);

  const offerPackages: Array<{ app: Application; thp: ReturnType<typeof calculateTHP> }> = useMemo(() => {
    const list = offerApps.length > 0 ? offerApps : benchmarkApp ? [benchmarkApp] : [];
    return list.map((app) => {
      const salary = app.salaryMax || app.salaryMin || 15000000;
      const monthlyBase = app.salaryPeriod === 'annual' ? Math.round(salary / 12) : salary;
      const commuteCost = (app.mode === 'On-site' || app.mode === 'In-person') ? 1200000 : app.mode === 'Hybrid' ? 600000 : 0;

      const pkg: OfferPackage = {
        id: app.id,
        name: `${app.company} - ${app.position}`,
        company: app.company,
        position: app.position,
        placementType: app.type || 'In-house',
        workMode: app.mode || 'Remote',
        baseSalary: monthlyBase,
        fixedAllowance: 0,
        onCallAllowance: 0,
        shiftAllowance: 0,
        wfhAllowance: 0,
        thrMultiplier: 1.0,
        bonusMonths: 1.0,
        hasBpjs: true,
        ptkpCategory: 'TK/0',
        monthlyCommuteCost: commuteCost,
      };

      return {
        app,
        thp: calculateTHP(pkg),
      };
    });
  }, [offerApps, benchmarkApp]);

  return (
    <Card className="border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#18181b] shadow-2xs">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-zinc-500" />
              {offerApps.length > 0 ? 'Komparasi Penawaran & Real THP' : 'Estimasi Gaji Bersih (Real THP)'}
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Kalkulasi gaji bersih setelah potongan BPJS Ketenagakerjaan/Kesehatan dan estimasi komuter.
            </CardDescription>
          </div>

          <button
            onClick={onNavigateToOffers}
            className="flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-100 transition-colors"
          >
            <span>Buka Kalkulator</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        {offerPackages.length === 0 ? (
          <div className="p-5 rounded-lg bg-zinc-50/70 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
            Tambahkan informasi gaji pada lamaran untuk melihat estimasi Take Home Pay bersih.
          </div>
        ) : (
          <div className="space-y-3">
            {offerApps.length === 0 && (
              <div className="text-[11px] text-zinc-600 dark:text-zinc-400 bg-zinc-100/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 px-3 py-1.5 rounded-md flex items-center gap-1.5">
                <span>⚡ Menampilkan simulasi target gaji tertinggi dari pipeline aktif Anda:</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {offerPackages.slice(0, 2).map(({ app, thp }) => (
                <div
                  key={app.id}
                  className="p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors space-y-2.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {app.company}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate">{app.position}</div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 shrink-0">
                      {app.status === 'Offer' ? 'Offer Aktif' : app.mode}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Gaji Kotor Bulanan:</span>
                      <strong className="text-zinc-800 dark:text-zinc-200 font-mono text-xs tabular-nums">
                        {formatIdr(thp.grossMonthly)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                        Real THP (Netto):
                      </span>
                      <strong className="text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold tabular-nums">
                        {formatIdr(thp.realNetTakeHome)}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 bg-white dark:bg-zinc-800/60 px-2 py-1 rounded border border-zinc-200/50 dark:border-zinc-700/50 tabular-nums">
                    <span>Potongan BPJS: {formatIdr(thp.totalDeductions)}</span>
                    <span>Transpor: {formatIdr(app.mode === 'On-site' ? 1200000 : app.mode === 'Hybrid' ? 600000 : 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
