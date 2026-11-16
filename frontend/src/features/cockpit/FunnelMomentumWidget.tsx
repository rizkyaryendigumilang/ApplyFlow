import React from 'react';
import { BarChart2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
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
    <Card className="border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#18181b] shadow-2xs">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-zinc-500" />
              {t('cockpit.funnelTitle')}
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              {t('cockpit.funnelSubtitle')}
            </CardDescription>
          </div>

          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            {stats.responseRatePercent}% Respon Positif
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3.5">
        {/* Stages breakdown */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-600 dark:text-zinc-400">1. Wishlist / Rencana</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                {stats.wishlistCount} posisi
              </span>
            </div>
            <Progress value={stats.wishlistCount} max={Math.max(1, total)} indicatorClassName="bg-zinc-400" />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-600 dark:text-zinc-400">2. Applied / Terkirim</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono">
                {stats.appliedCount} lamaran
              </span>
            </div>
            <Progress value={stats.appliedCount} max={Math.max(1, total)} indicatorClassName="bg-blue-500" />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-600 dark:text-zinc-400">3. Screening HR</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400 font-mono">
                {stats.screeningCount} sesi
              </span>
            </div>
            <Progress value={stats.screeningCount} max={Math.max(1, total)} indicatorClassName="bg-purple-500" />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-600 dark:text-zinc-400">4. Interview User/Teknis</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400 font-mono">
                {stats.interviewCount} tahap
              </span>
            </div>
            <Progress value={stats.interviewCount} max={Math.max(1, total)} indicatorClassName="bg-amber-500" />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-600 dark:text-zinc-400">5. Offering / Penawaran</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                {stats.offerCount} penawaran
              </span>
            </div>
            <Progress value={stats.offerCount} max={Math.max(1, total)} indicatorClassName="bg-emerald-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
