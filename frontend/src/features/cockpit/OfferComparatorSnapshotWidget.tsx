import React, { useMemo } from 'react';
import { Banknote, TrendingUp, ShieldCheck, ArrowUpRight, Calculator } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
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
      const commuteCost = app.mode === 'On-site' ? 1200000 : app.mode === 'Hybrid' ? 600000 : 0;

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
    <Card className="border-slate-800 bg-slate-900/90 shadow-2xl relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-400" />
              {offerApps.length > 0 ? 'Komparasi Penawaran & Real THP' : 'Estimasi Gaji Bersih (Real THP)'}
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Kalkulasi gaji bersih setelah potongan BPJS Ketenagakerjaan/Kesehatan dan estimasi komuter.
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToOffers}
            className="text-xs text-emerald-400 hover:text-emerald-300 border-emerald-500/30"
          >
            <span>Buka Kalkulator</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {offerPackages.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
            Tambahkan informasi gaji pada lamaran untuk melihat estimasi Take Home Pay bersih.
          </div>
        ) : (
          <div className="space-y-3">
            {offerApps.length === 0 && (
              <div className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <span>⚡ Belum ada tawaran resmi. Menampilkan simulasi target gaji tertinggi dari pipeline Anda:</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {offerPackages.slice(0, 2).map(({ app, thp }) => (
                <div
                  key={app.id}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors duration-150 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 truncate">{app.company}</div>
                      <div className="text-[11px] text-slate-400 truncate">{app.position}</div>
                    </div>
                    <Badge variant={app.status === 'Offer' ? 'offer' : 'outline'} className="text-[10px] py-0 shrink-0">
                      {app.status === 'Offer' ? 'Offer Aktif' : app.mode}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Gaji Kotor Bulanan:</span>
                      <strong className="text-slate-200 font-mono text-xs">{formatIdr(thp.grossMonthly)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 block font-medium">Real THP (Netto):</span>
                      <strong className="text-emerald-300 font-mono text-xs font-bold">
                        {formatIdr(thp.realNetTakeHome)}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-900/60 px-2 py-1.5 rounded-lg">
                    <span>Potongan BPJS & Pajak: {formatIdr(thp.totalDeductions)}</span>
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
