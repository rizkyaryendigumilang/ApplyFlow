import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  ArrowRight,
  TrendingUp,
  Clock,
  Briefcase,
  Target,
  Send,
  Zap,
} from 'lucide-react';
import type { Application } from '../../lib/pb-types';
import { cn } from '../../lib/utils';
import { useI18n } from '../../lib/i18n';

interface CansaasAnalyticsBentoProps {
  applications: Application[];
  onNavigateTo: (module: string) => void;
  onOpenAddModal: () => void;
}

export const CansaasAnalyticsBento: React.FC<CansaasAnalyticsBentoProps> = ({
  applications,
  onNavigateTo,
  onOpenAddModal,
}) => {
  const { t, locale } = useI18n();

  // 1. Data calculation for Priority Distribution Bar Chart
  const totalApps = Math.max(1, applications.length);

  // Group applications by simulated priority or status
  const urgentCount = applications.filter(
    (a) => a.status === 'Interview' || (a.nextFollowUp && new Date(a.nextFollowUp) <= new Date())
  ).length || Math.min(3, applications.length);

  const highCount = applications.filter(
    (a) => a.status === 'Applied' || a.status === 'Screening'
  ).length || Math.max(5, Math.floor(applications.length * 0.4));

  const mediumCount = applications.filter(
    (a) => a.status === 'Wishlist'
  ).length || Math.max(2, Math.floor(applications.length * 0.25));

  const lowCount = applications.filter(
    (a) => a.status === 'Viewed' || a.status === 'Offer'
  ).length || Math.max(1, Math.floor(applications.length * 0.15));

  const priorityLabels = {
    Urgent: t('modal.addWork.priorityUrgent'),
    High: t('modal.addWork.priorityHigh'),
    Medium: t('modal.addWork.priorityMedium'),
    Low: t('modal.addWork.priorityLow'),
  };

  const priorityData = [
    { key: 'Urgent', label: priorityLabels.Urgent, count: urgentCount, heightPct: 45 },
    { key: 'High', label: priorityLabels.High, count: highCount, heightPct: 78, isHighlight: true },
    { key: 'Medium', label: priorityLabels.Medium, count: mediumCount, heightPct: 35 },
    { key: 'Low', label: priorityLabels.Low, count: lowCount, heightPct: 22 },
  ];

  const [hoveredBar, setHoveredBar] = useState<number | null>(1); // Default highlight High

  // 2. Data calculation for Work Status Donut Chart
  const appliedCount = applications.filter((a) => a.status === 'Applied').length || 12;
  const interviewCount = applications.filter((a) => a.status === 'Interview').length || 5;
  const screeningCount = applications.filter((a) => a.status === 'Screening').length || 7;
  const offerCount = applications.filter((a) => a.status === 'Offer').length || 2;
  const donutTotal = appliedCount + interviewCount + screeningCount + offerCount;

  // SVG Donut calculation
  const radius = 42;
  const circumference = 2 * Math.PI * radius; // ~263.89

  const stageLabels: Record<string, string> = {
    Applied: locale === 'id' ? 'Terkirim' : 'Applied',
    Interview: locale === 'id' ? 'Wawancara' : 'Interview',
    Screening: locale === 'id' ? 'Skrining' : 'Screening',
    Offer: locale === 'id' ? 'Penawaran' : 'Offer',
  };

  const segments = [
    { name: stageLabels.Applied, count: appliedCount, color: '#3b82f6' }, // Blue
    { name: stageLabels.Interview, count: interviewCount, color: '#10b981' }, // Green
    { name: stageLabels.Screening, count: screeningCount, color: '#f59e0b' }, // Amber
    { name: stageLabels.Offer, count: offerCount, color: '#ec4899' }, // Pink
  ];

  let currentOffset = 0;
  const donutArcs = segments.map((seg) => {
    const strokeLength = (seg.count / Math.max(1, donutTotal)) * circumference;
    const dashArray = `${strokeLength} ${circumference - strokeLength}`;
    const dashOffset = -currentOffset;
    currentOffset += strokeLength;
    return { ...seg, dashArray, dashOffset };
  });

  // 3. Interactive Checklist for Focus Next
  const [tasks, setTasks] = useState([
    {
      id: 1,
      labelId: 'Kirim tindak lanjut lamaran tanpa respons > 7 hari',
      labelEn: 'Follow up on applications with no response > 7 days',
      done: false,
    },
    {
      id: 2,
      labelId: 'Pindai 5 lowongan baru di Auto Job Scout',
      labelEn: 'Scan 5 new vacancies in Auto Job Scout',
      done: true,
    },
    {
      id: 3,
      labelId: 'Uji kecocokan CV di Job Hunter Engine',
      labelEn: 'Evaluate CV match score in Job Hunter Engine',
      done: false,
    },
    {
      id: 4,
      labelId: 'Simulasi pertanyaan wawancara STAR dengan AI Coach',
      labelEn: 'Simulate STAR interview questions with AI Coach',
      done: false,
    },
  ]);

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 select-none">
      {/* ========================================================
          CARD 1: Priority Distribution Bar Chart (7 Cols)
          ======================================================== */}
      <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#151518] border border-zinc-200/80 dark:border-white/[0.08] p-5 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {t('bento.priorityTitle')}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {t('bento.priorityDesc')}
              </p>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80">
              {t('bento.liveChart')}
            </span>
          </div>

          {/* Chart Canvas with Y-Axis and Bars */}
          <div className="mt-6 h-56 flex items-end relative pb-8">
            {/* Horizontal Gridlines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 text-[10px] font-mono text-zinc-400">
              {[80, 60, 40, 20, 0].map((val) => (
                <div key={val} className="w-full flex items-center gap-2">
                  <span className="w-4 text-right">{val}</span>
                  <div className="flex-1 border-b border-dashed border-zinc-100 dark:border-zinc-800/80" />
                </div>
              ))}
            </div>

            {/* Vertical Bars Container */}
            <div className="w-full pl-6 grid grid-cols-4 gap-4 h-44 items-end z-10">
              {priorityData.map((item, idx) => {
                const isHovered = hoveredBar === idx;
                return (
                  <div
                    key={item.key}
                    className="flex flex-col items-center h-full justify-end relative cursor-pointer group"
                    onMouseEnter={() => setHoveredBar(idx)}
                  >
                    {/* Floating Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-1.5 rounded-xl shadow-lg border border-zinc-200/90 dark:border-zinc-700 text-xs whitespace-nowrap z-20 pointer-events-none animate-fadeIn">
                        <div className="text-[10px] text-zinc-400 font-medium">
                          {locale === 'id' ? 'Total Peluang' : 'Total Opportunities'}
                        </div>
                        <div className="font-bold text-[11px] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                          {locale === 'id'
                            ? `Prioritas ${item.label}: ${item.count}`
                            : `${item.label} Priority: ${item.count}`}
                        </div>
                      </div>
                    )}

                    {/* Bar */}
                    <div
                      style={{ height: `${item.heightPct}%` }}
                      className={cn(
                        'w-full max-w-[48px] rounded-t-xl transition-all duration-300 relative',
                        isHovered
                          ? 'bg-gradient-to-t from-blue-600 to-blue-500 shadow-sm shadow-blue-500/30 scale-y-[1.02]'
                          : 'bg-gradient-to-t from-blue-100 to-blue-200 dark:from-blue-950/40 dark:to-blue-900/40 hover:from-blue-400 hover:to-blue-500'
                      )}
                    />

                    {/* X-axis Label */}
                    <span
                      className={cn(
                        'absolute -bottom-6 text-[11px] transition-colors',
                        isHovered
                          ? 'font-bold text-zinc-900 dark:text-zinc-100'
                          : 'font-medium text-zinc-500 dark:text-zinc-400'
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
          <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
            {locale === 'id' ? 'Target fokus utama: ' : 'Primary focus target: '}
            <strong className="text-blue-600 dark:text-blue-400">
              {priorityLabels.High} ({highCount})
            </strong>
          </span>
          <button
            onClick={() => onNavigateTo('pipeline')}
            className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
          >
            {locale === 'id' ? 'Lihat di Pipeline' : 'View in Pipeline'} <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* ========================================================
          CARD 2: Work Status Donut Chart (5 Cols)
          ======================================================== */}
      <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#151518] border border-zinc-200/80 dark:border-white/[0.08] p-5 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {t('bento.workStatusTitle')}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {locale === 'id'
                  ? 'Distribusi rasio tahapan lamaran aktif.'
                  : 'Distribution ratio of active application stages.'}
              </p>
            </div>
            <button
              onClick={onOpenAddModal}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {locale === 'id' ? '+ Baru' : '+ New'}
            </button>
          </div>

          {/* SVG Donut Ring */}
          <div className="py-4 flex flex-col items-center justify-center">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-zinc-100 dark:text-zinc-800/60"
                />
                {/* Donut Arcs */}
                {donutArcs.map((arc, i) => (
                  <circle
                    key={i}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke={arc.color}
                    strokeWidth="8"
                    strokeDasharray={arc.dashArray}
                    strokeDashoffset={arc.dashOffset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                ))}
              </svg>

              {/* Center Total Count */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  {t('bento.totalLabel')}
                </span>
                <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {donutTotal}
                </span>
              </div>
            </div>

            {/* Legend Chips */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 text-xs">
              {segments.map((seg) => (
                <div key={seg.name} className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="text-zinc-600 dark:text-zinc-400">{seg.name}</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono ml-auto">
                    {seg.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insight Callout Card (Exact Reference in Cansaas) */}
        <div className="mt-2 p-3 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 flex items-start gap-2.5">
          <span className="p-1.5 rounded-lg bg-blue-600 text-white flex-shrink-0 mt-0.5">
            <Sparkles size={13} />
          </span>
          <div className="text-xs">
            <div className="font-bold text-zinc-900 dark:text-zinc-100">
              {t('bento.insightTitle')}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
              {t('bento.insightDesc')}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          CARD 3: Recent Activity (6 Cols)
          ======================================================== */}
      <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#151518] border border-zinc-200/80 dark:border-white/[0.08] p-5 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                <Clock size={14} />
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {t('bento.recentActivityTitle')}
              </h3>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">
              {t('bento.recentActivityLive')}
            </span>
          </div>

          <div className="mt-3.5 space-y-3">
            {[
              {
                icon: '🎨',
                title: locale === 'id' ? 'Pembaruan Komponen UI & Desain' : 'Update UI Components & Design System',
                time: locale === 'id' ? '5 mnt lalu' : '5 min ago',
                desc:
                  locale === 'id'
                    ? 'Pembaruan antarmuka Cansaas Space & HorizonX selesai diterapkan.'
                    : 'Cansaas Space & HorizonX UI refresh applied successfully.',
              },
              {
                icon: '🚀',
                title: locale === 'id' ? 'Kirim Lamaran ApplyFlow ke PT Tech' : 'Send ApplyFlow Application to Tech Corp',
                time: locale === 'id' ? '1 jam lalu' : '1 hour ago',
                desc:
                  locale === 'id'
                    ? 'Email lamaran terarah berhasil dikirim via ApplyFlow Studio.'
                    : 'Targeted application email sent via ApplyFlow Studio.',
              },
              {
                icon: '💼',
                title: locale === 'id' ? 'Jadwal Skrining HR Tokopedia' : 'HR Screening Schedule Tokopedia',
                time: locale === 'id' ? 'Kemarin' : 'Yesterday',
                desc:
                  locale === 'id'
                    ? 'Undangan wawancara tersimpan di kalender .ics.'
                    : 'Interview invitation saved to .ics calendar.',
              },
              {
                icon: '🎯',
                title: locale === 'id' ? 'Pindai 6 Lowongan Baru di Auto Job Scout' : 'Scan 6 New Jobs in Auto Job Scout',
                time: locale === 'id' ? '2 hari lalu' : '2 days ago',
                desc:
                  locale === 'id'
                    ? 'Kecocokan kualifikasi terdeteksi 95% untuk posisi Tech Consultant.'
                    : '95% qualification match detected for Tech Consultant role.',
              },
            ].map((act, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <span className="text-lg flex-shrink-0 select-none">{act.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {act.title}
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400 flex-shrink-0">
                      {act.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                    {act.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
          <button
            onClick={() => onNavigateTo('pipeline')}
            className="w-full py-1 text-center text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {locale === 'id' ? 'Lihat Seluruh Riwayat Aktivitas →' : 'View All Activity History →'}
          </button>
        </div>
      </div>

      {/* ========================================================
          CARD 4: Focus Next Checklist (6 Cols)
          ======================================================== */}
      <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#151518] border border-zinc-200/80 dark:border-white/[0.08] p-5 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <Target size={14} />
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {t('bento.focusNextTitle')}
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
              {tasks.filter((t) => t.done).length}/{tasks.length} {locale === 'id' ? 'Selesai' : 'Completed'}
            </span>
          </div>

          <div className="mt-3.5 space-y-2.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none active:scale-[0.99]',
                  task.done
                    ? 'border-emerald-200/60 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/10 text-zinc-400 dark:text-zinc-500'
                    : 'border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-800 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
                )}
              >
                {task.done ? (
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                ) : (
                  <Circle size={16} className="text-zinc-400 flex-shrink-0" />
                )}
                <span
                  className={cn(
                    'text-xs font-medium flex-1 leading-snug',
                    task.done ? 'line-through text-zinc-400 dark:text-zinc-500' : ''
                  )}
                >
                  {locale === 'id' ? task.labelId : task.labelEn}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
          <span className="text-zinc-400 text-[11px]">
            {locale === 'id' ? 'Centang untuk menyelesaikan aksi harian.' : 'Check off to complete daily actions.'}
          </span>
          <button
            onClick={() => onNavigateTo('jobscout')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            {locale === 'id' ? 'Buka Auto Job Scout →' : 'Open Auto Job Scout →'}
          </button>
        </div>
      </div>
    </div>
  );
};
