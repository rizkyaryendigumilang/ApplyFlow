import React from 'react';
import { TrendingUp, BarChart2, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import type { FunnelStats } from './cockpit-helpers';
import { useI18n } from '../../lib/i18n';

interface FunnelMomentumWidgetProps {
  stats: FunnelStats;
}

export const FunnelMomentumWidget: React.FC<FunnelMomentumWidgetProps> = ({ stats }) => {
  const { t } = useI18n();

  const total =
    stats.wishlistCount +
    stats.appliedCount +
    stats.screeningCount +
    stats.interviewCount +
    stats.offerCount;

  return (
    <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              {t('cockpit.funnelTitle')}
            </CardTitle>
            <CardDescription>{t('cockpit.funnelSubtitle')}</CardDescription>
          </div>

          <Badge variant="offer" className="font-bold text-xs">
            {stats.responseRatePercent}% Respon Positif
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Stages breakdown */}
        <div className="space-y-2.5">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">1. Wishlist / Rencana</span>
              <span className="font-semibold text-slate-200">{stats.wishlistCount} lowongan</span>
            </div>
            <Progress value={stats.wishlistCount} max={Math.max(1, total)} indicatorClassName="bg-slate-400" />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">2. Applied / Terkirim</span>
              <span className="font-semibold text-blue-400">{stats.appliedCount} lamaran</span>
            </div>
            <Progress value={stats.appliedCount} max={Math.max(1, total)} indicatorClassName="bg-blue-500" />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">3. Screening / Tinjauan</span>
              <span className="font-semibold text-purple-400">{stats.screeningCount} tahap</span>
            </div>
            <Progress value={stats.screeningCount} max={Math.max(1, total)} indicatorClassName="bg-purple-500" />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">4. Interview / Wawancara</span>
              <span className="font-semibold text-amber-400">{stats.interviewCount} sesi</span>
            </div>
            <Progress value={stats.interviewCount} max={Math.max(1, total)} indicatorClassName="bg-amber-500" />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">5. Offer / Penawaran Resmi</span>
              <span className="font-semibold text-emerald-400 font-bold">{stats.offerCount} penawaran</span>
            </div>
            <Progress value={stats.offerCount} max={Math.max(1, total)} indicatorClassName="bg-emerald-500" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
          <span>Total Keseluruhan: <strong>{total}</strong> catatan</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            Momentum Aktif
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
