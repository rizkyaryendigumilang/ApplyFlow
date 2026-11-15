import React from 'react';
import { Shield, AlertTriangle, AlertCircle, Plus, RotateCcw, Info } from 'lucide-react';
import { useLinkedInQuota } from './useLinkedInQuota';

export const SafeQuotaTrackerCard: React.FC = () => {
  const { count, safeLimit, status, weekOf, increment, reset } = useLinkedInQuota();
  const percentage = Math.min(100, Math.round((count / safeLimit) * 100));

  const statusConfig = {
    safe: {
      label: 'Zona Aman',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      barClass: 'bg-emerald-500',
      icon: Shield,
    },
    caution: {
      label: 'Hampir Batas',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      barClass: 'bg-amber-500',
      icon: AlertTriangle,
    },
    danger: {
      label: 'Batas Maksimum Tercapai',
      badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      barClass: 'bg-rose-500',
      icon: AlertCircle,
    },
  }[status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Safe Outreach Quota</h3>
            <p className="text-[11px] text-slate-400">Pencegah shadowban & proteksi reputasi akun LinkedIn</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusConfig.badgeClass}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {statusConfig.label}
          </span>
          <button
            type="button"
            onClick={reset}
            title="Reset Kuota"
            className="p-1 text-slate-500 hover:text-slate-300 rounded-md hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <div className="flex justify-between items-baseline text-xs">
          <span className="text-slate-400">Koneksi Dikirim Minggu Ini (Senin - Minggu):</span>
          <span className="font-semibold text-slate-200">
            <span className="text-lg text-blue-400 font-bold">{count}</span> / {safeLimit} invite
          </span>
        </div>

        <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-[width] duration-500 ease-out rounded-full ${statusConfig.barClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-[10px] text-slate-500">Mulai: Senin, {weekOf}</span>
          <button
            type="button"
            onClick={increment}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-300 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition-colors duration-150 active:scale-95 transition-transform"
          >
            <Plus className="w-3.5 h-3.5" />
            Catat 1 Invite (+1)
          </button>
        </div>
      </div>

      <div className="mt-3.5 flex items-start gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
        <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
        <span>
          <strong>Tips Aman:</strong> Untuk koneksi tingkat-2, kirim invitation <em>tanpa note</em> (Send without a note). LinkedIn mengenakan kuota note yang jauh lebih ketat daripada koneksi reguler.
        </span>
      </div>
    </div>
  );
};
