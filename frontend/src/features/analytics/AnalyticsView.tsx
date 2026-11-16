import { useMemo, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  FileText,
} from 'lucide-react';
import type { Application, CVArtifact } from '../../lib/pb-types';
import { idr, responseRate } from '../../lib/utils';
import { exportApplicationsToCSV, triggerDownload } from '../../lib/data-transfer';

export interface AnalyticsViewProps {
  applications: Application[];
  cvs: CVArtifact[];
}

export function AnalyticsView({ applications, cvs }: AnalyticsViewProps) {
  // Stage conversion counts
  const stageCounts = useMemo(() => {
    return {
      Wishlist: applications.filter((a) => a.status === 'Wishlist').length,
      Applied: applications.filter((a) => a.status === 'Applied').length,
      Viewed: applications.filter((a) => a.status === 'Viewed').length,
      Screening: applications.filter((a) => a.status === 'Screening').length,
      Interview: applications.filter((a) => a.status === 'Interview').length,
      Offer: applications.filter((a) => a.status === 'Offer').length,
      Rejected: applications.filter((a) => a.status === 'Rejected').length,
      Ghosted: applications.filter((a) => a.status === 'Ghosted').length,
    };
  }, [applications]);

  const totalSubmitted = applications.length - stageCounts.Wishlist;

  const responseCount =
    stageCounts.Viewed +
    stageCounts.Screening +
    stageCounts.Interview +
    stageCounts.Offer;

  const interviewCount = stageCounts.Interview + stageCounts.Offer;

  const overallResponseRate =
    totalSubmitted > 0 ? Math.round((responseCount / totalSubmitted) * 100) : 0;
  const interviewConversionRate =
    totalSubmitted > 0 ? Math.round((interviewCount / totalSubmitted) * 100) : 0;
  const offerConversionRate =
    interviewCount > 0 ? Math.round((stageCounts.Offer / interviewCount) * 100) : 0;

  // Salary distribution analysis
  const salaryStats = useMemo(() => {
    const salaries = applications
      .filter((a) => a.salaryMax > 0)
      .map((a) => (a.salaryPeriod === 'annual' ? a.salaryMax / 12 : a.salaryMax));

    if (salaries.length === 0) return { min: 0, max: 0, avg: 0, median: 0 };
    const sorted = [...salaries].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const avg = Math.round(sorted.reduce((acc, curr) => acc + curr, 0) / sorted.length);
    const median = sorted[Math.floor(sorted.length / 2)];
    return { min, max, avg, median };
  }, [applications]);

  const handleExportCSV = () => {
    const csv = exportApplicationsToCSV(applications);
    triggerDownload(csv, `junction_applications_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(applications, null, 2);
    triggerDownload(json, `junction_applications_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#18181b] shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center">
              <BarChart3 size={17} />
            </div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Statistik Funnel & Performa Peluang
            </h1>
            <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
              Real-time
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
            Metrik konversi tiap tahapan, rasio respon rekruter, efektivitas CV, dan distribusi penawaran gaji.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Download size={13} /> Ekspor CSV
          </button>
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Download size={13} /> Ekspor JSON
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#18181b] shadow-2xs space-y-1">
          <span className="text-[10px] font-mono uppercase font-semibold text-zinc-400 tracking-wider block">
            Lamaran Terkirim
          </span>
          <b className="font-mono text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 block">
            {totalSubmitted}
          </b>
          <span className="text-[11px] text-zinc-500 block">
            Di luar {stageCounts.Wishlist} posisi wishlist
          </span>
        </div>

        <div className="p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#18181b] shadow-2xs space-y-1">
          <span className="text-[10px] font-mono uppercase font-semibold text-zinc-400 tracking-wider block">
            Rasio Respon Rekruter
          </span>
          <b className="font-mono text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 block">
            {overallResponseRate}%
          </b>
          <span className="text-[11px] text-zinc-500 block">
            {responseCount} lamaran dilihat atau dikontak
          </span>
        </div>

        <div className="p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#18181b] shadow-2xs space-y-1">
          <span className="text-[10px] font-mono uppercase font-semibold text-zinc-400 tracking-wider block">
            Konversi Wawancara
          </span>
          <b className="font-mono text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 block">
            {interviewConversionRate}%
          </b>
          <span className="text-[11px] text-zinc-500 block">
            {interviewCount} lolos ke tahap wawancara
          </span>
        </div>

        <div className="p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#18181b] shadow-2xs space-y-1">
          <span className="text-[10px] font-mono uppercase font-semibold text-zinc-400 tracking-wider block">
            Konversi Penawaran (Offer)
          </span>
          <b className="font-mono text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 block">
            {offerConversionRate}%
          </b>
          <span className="text-[11px] text-zinc-500 block">
            {stageCounts.Offer} penawaran resmi diterima
          </span>
        </div>
      </div>

      {/* Visual Funnel Progression */}
      <div className="p-6 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#18181b] shadow-2xs">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">
          Progresi Konversi Tiap Tahap Seleksi
        </h3>

        <div className="flex flex-col gap-3">
          {[
            { label: 'Wishlist', count: stageCounts.Wishlist, color: 'bg-zinc-400' },
            { label: 'Applied', count: stageCounts.Applied, color: 'bg-blue-500' },
            { label: 'Viewed', count: stageCounts.Viewed, color: 'bg-teal-500' },
            { label: 'Screening', count: stageCounts.Screening, color: 'bg-purple-500' },
            { label: 'Interview', count: stageCounts.Interview, color: 'bg-amber-500' },
            { label: 'Offer', count: stageCounts.Offer, color: 'bg-emerald-500' },
          ].map((stage) => {
            const pct = applications.length > 0 ? Math.round((stage.count / applications.length) * 100) : 0;
            return (
              <div key={stage.label} className="grid grid-cols-[100px_1fr_80px] items-center gap-4 text-xs font-mono">
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">{stage.label}</span>
                <div className="h-5 rounded bg-zinc-100 dark:bg-zinc-800 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-xs ${stage.color} transition-all duration-300`}
                    style={{ width: `${Math.max(pct, stage.count > 0 ? 3 : 0)}%` }}
                  />
                </div>
                <span className="text-right text-zinc-500 dark:text-zinc-400 tabular-nums">
                  {stage.count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: CV Variant Experiments + Salary Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CV Variant Performance */}
        <div className="p-6 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#18181b] shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Efektivitas Sudut Pandang & Varian CV
            </h3>
            <FileText size={16} className="text-zinc-400" />
          </div>

          <div className="flex flex-col gap-2.5">
            {cvs.map((cv) => (
              <div
                key={cv.id}
                className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs"
              >
                <div>
                  <strong className="text-zinc-900 dark:text-zinc-100 font-medium block">
                    {cv.label}
                  </strong>
                  <span className="text-[11px] text-zinc-500 block mt-0.5">
                    {cv.version} · {cv.applications} lamaran dikirim
                  </span>
                </div>
                <div className="text-right">
                  <b className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100 block tabular-nums">
                    {responseRate(cv.responses, cv.applications)}%
                  </b>
                  <span className="text-[10px] text-zinc-400 block font-mono">respon</span>
                </div>
              </div>
            ))}
            {cvs.length === 0 && (
              <p className="text-xs text-zinc-400 italic py-2">
                Belum ada varian CV yang terdaftar.
              </p>
            )}
          </div>
        </div>

        {/* Salary & Take-Home-Pay Insights */}
        <div className="p-6 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#18181b] shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Distribusi Kompensasi & Gaji
            </h3>
            <TrendingUp size={16} className="text-zinc-400" />
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-xs">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-zinc-600 dark:text-zinc-400">Median Ekspektasi Gaji</span>
              <b className="font-mono text-zinc-900 dark:text-zinc-100">{idr(salaryStats.median)} / bln</b>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-zinc-600 dark:text-zinc-400">Rata-rata Batas Gaji Maksimal</span>
              <b className="font-mono text-zinc-900 dark:text-zinc-100">{idr(salaryStats.avg)} / bln</b>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-zinc-600 dark:text-zinc-400">Puncak Peluang Tertinggi</span>
              <b className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{idr(salaryStats.max)} / bln</b>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-zinc-600 dark:text-zinc-400">Total Peluang dengan Informasi Gaji</span>
              <b className="font-mono text-zinc-800 dark:text-zinc-200">
                {applications.filter((a) => a.salaryMax > 0).length} dari {applications.length} posisi
              </b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
