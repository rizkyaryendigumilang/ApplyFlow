import React from 'react';
import { Shield, AlertTriangle, AlertCircle, Plus, RotateCcw, Info } from 'lucide-react';
import { useLinkedInQuota } from './useLinkedInQuota';

export const SafeQuotaTrackerCard: React.FC = () => {
  const { count, safeLimit, status, weekOf, increment, reset } = useLinkedInQuota();
  const percentage = Math.min(100, Math.round((count / safeLimit) * 100));

  const statusConfig = {
    safe: {
      label: 'Zona Aman',
      badgeClass:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      barClass: 'bg-emerald-500',
      icon: Shield,
    },
    caution: {
      label: 'Hampir Batas',
      badgeClass:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      barClass: 'bg-amber-500',
      icon: AlertTriangle,
    },
    danger: {
      label: 'Batas Maksimum',
      badgeClass:
        'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      barClass: 'bg-rose-500',
      icon: AlertCircle,
    },
  }[status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-white dark:bg-[#18181b] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl p-5 shadow-2xs select-none">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Safe Outreach Quota
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Pencegah shadowban & proteksi reputasi akun LinkedIn
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusConfig.badgeClass}`}
          >
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </span>
          <button
            type="button"
            onClick={reset}
            title="Reset Kuota"
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <div className="flex justify-between items-baseline text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">
            Koneksi Minggu Ini (Senin - Minggu):
          </span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums font-mono">
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{count}</span> / {safeLimit} invite
          </span>
        </div>

        <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200/60 dark:border-zinc-700/60">
          <div
            className={`h-full transition-all duration-300 rounded-full ${statusConfig.barClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-[10px] text-zinc-400 font-mono">Mulai: Senin, {weekOf}</span>
          <button
            type="button"
            onClick={increment}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-md transition-colors active:scale-[0.98]"
          >
            <Plus className="w-3 h-3" />
            Catat 1 Invite (+1)
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 text-[11px] text-zinc-500 dark:text-zinc-400">
        <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
        <span>
          <strong>Tips Aman:</strong> Untuk koneksi tingkat-2, kirim invitation <em>tanpa note</em> (Send without a note). LinkedIn membatasi kuota note lebih ketat daripada koneksi reguler.
        </span>
      </div>
    </div>
  );
};
