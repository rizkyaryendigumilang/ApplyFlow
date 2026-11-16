import React from 'react';
import type { Application } from '../../lib/pb-types';
import { salary } from '../../lib/utils';
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchX } from 'lucide-react';

export interface JobTableProps {
  applications: Application[];
  onSelectApplication: (application: Application) => void;
  onResetFilters?: () => void;
}

const statusStyles: Record<string, string> = {
  Wishlist: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
  Applied: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  Viewed: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
  Screening: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  Interview: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  Offer: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
  Ghosted: 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
};

export const JobTable: React.FC<JobTableProps> = ({
  applications,
  onSelectApplication,
  onResetFilters,
}) => {
  if (applications.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="Tidak Ada Lamaran Ditemukan"
        description="Tidak ada peluang karier yang cocok dengan filter atau kata kunci saat ini. Coba sesuaikan kata kunci atau bersihkan filter."
        actionLabel={onResetFilters ? 'Reset Filter' : undefined}
        onAction={onResetFilters}
      />
    );
  }

  return (
    <div className="twenty-table-container border border-zinc-200/90 dark:border-zinc-800/90 rounded-lg overflow-hidden bg-white dark:bg-[#18181b] shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50/80 dark:bg-zinc-800/50 border-b border-zinc-200/80 dark:border-zinc-800 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider select-none">
              <th className="py-2.5 px-3.5 font-medium">Perusahaan</th>
              <th className="py-2.5 px-3.5 font-medium">Posisi / Role</th>
              <th className="py-2.5 px-3.5 font-medium">Status Funnel</th>
              <th className="py-2.5 px-3.5 font-medium">Mode Kerja</th>
              <th className="py-2.5 px-3.5 font-medium">Lokasi</th>
              <th className="py-2.5 px-3.5 font-medium">Sumber</th>
              <th className="py-2.5 px-3.5 font-medium">Kompensasi</th>
              <th className="py-2.5 px-3.5 font-medium">Tanggal Kirim</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {applications.map((a) => {
              const badgeStyle =
                statusStyles[a.status] ||
                'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';

              return (
                <tr
                  key={a.id}
                  onClick={() => onSelectApplication(a)}
                  className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] flex items-center justify-center border border-zinc-200/60 dark:border-zinc-700/60 flex-shrink-0">
                        {a.company[0]?.toUpperCase() || 'C'}
                      </div>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {a.company}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3.5 font-medium text-zinc-800 dark:text-zinc-200">
                    {a.position}
                  </td>
                  <td className="py-3 px-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${badgeStyle}`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-zinc-600 dark:text-zinc-400">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px]">
                      {a.mode}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-zinc-600 dark:text-zinc-400 truncate max-w-[140px]">
                    {a.location}
                  </td>
                  <td className="py-3 px-3.5 text-zinc-500">
                    {a.jobSource ? (
                      <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium">
                        {a.jobSource}
                      </span>
                    ) : (
                      <span className="text-[10px]">Direct</span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 font-mono text-zinc-700 dark:text-zinc-300 tabular-nums font-medium">
                    {salary(a)}
                  </td>
                  <td className="py-3 px-3.5 font-mono text-zinc-500 text-[11px] tabular-nums">
                    {a.sentAt}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
