import React from 'react';
import { Shield, AlertTriangle, AlertCircle, Plus, RotateCcw, Info } from 'lucide-react';
import { useLinkedInQuota } from './useLinkedInQuota';

export const SafeQuotaTrackerCard: React.FC = () => {
  const { count, safeLimit, status, weekOf, increment, reset } = useLinkedInQuota();
  const percentage = Math.min(100, Math.round((count / safeLimit) * 100));

  const statusConfig = {
    safe: {
      label: 'Zona Aman',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 ring-1 ring-inset ring-emerald-500/20',
      barClass: 'bg-emerald-500',
      icon: Shield,
    },
    caution: {
      label: 'Hampir Batas',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30 ring-1 ring-inset ring-amber-500/20',
      barClass: 'bg-amber-500',
      icon: AlertTriangle,
    },
    danger: {
      label: 'Batas Maksimum Tercapai',
      badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30 ring-1 ring-inset ring-rose-500/20',
      barClass: 'bg-rose-500',
      icon: AlertCircle,
    },
  }[status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.3),0_18px_36px_-20px_rgba(0,0,0,0.55)] backdrop-blur-md transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-slate-700/80 hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Safe Outreach Quota</h3>
            <p className="text-[11px] text-slate-400">Pencegah shadowban & proteksi reputasi akun LinkedIn</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border ring-1 ring-inset ring-current/20 ${statusConfig.badgeClass}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {statusConfig.label}
          </span>
          <button
            type="button"
            onClick={reset}
            title="Reset Kuota"
            className="p-1 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <div className="flex justify-between items-baseline text-xs">
          <span className="text-slate-400">Koneksi Dikirim Minggu Ini (Senin - Minggu):</span>
          <span className="font-semibold text-slate-200 tabular-nums">
            <span className="text-lg text-blue-400 font-bold">{count}</span> / {safeLimit} invite
          </span>
        </div>

        <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
          <div
            className={`h-full transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] rounded-full shadow-[0_0_10px_rgba(255,255,255,0.15)] ${statusConfig.barClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-[10px] text-slate-500">Mulai: Senin, {weekOf}</span>
          <button
            type="button"
            onClick={increment}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-300 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl transition-[transform,background-color,border-color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            Catat 1 Invite (+1)
          </button>
        </div>
      </div>

      <div className="mt-3.5 flex items-start gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
        <span>
          <strong>Tips Aman:</strong> Untuk koneksi tingkat-2, kirim invitation <em>tanpa note</em> (Send without a note). LinkedIn mengenakan kuota note yang jauh lebih ketat daripada koneksi reguler.
        </span>
      </div>
    </div>
  );
};
