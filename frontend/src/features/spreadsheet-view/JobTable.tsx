import React, { useRef } from 'react';
import type { Application } from '../../lib/pb-types';
import { salary } from '../../lib/utils';
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchX, ExternalLink, Mail, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { parseCSVToApplications, exportApplicationsToCSV, triggerDownload } from '../../lib/data-transfer';

export interface JobTableProps {
  applications: Application[];
  onSelectApplication: (application: Application) => void;
  onResetFilters?: () => void;
  onImportApplications?: (imported: Partial<Application>[]) => Promise<void>;
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

const typeStyles: Record<string, string> = {
  'Full-time': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  'Part-time': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  Contract: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  'In-house': 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
  'Vendor / Outsource': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
};

const modeStyles: Record<string, string> = {
  Remote: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  'In-person': 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
  'On-site': 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
  Hybrid: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
};

export const JobTable: React.FC<JobTableProps> = ({
  applications,
  onSelectApplication,
  onResetFilters,
  onImportApplications,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportApplications) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      const parsed = parseCSVToApplications(text);
      if (parsed.length > 0) {
        await onImportApplications(parsed);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportCSV = () => {
    const csv = exportApplicationsToCSV(applications);
    triggerDownload(csv, `job-tracker-sheet-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  };

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="Belum Ada Peluang Kerja Tercatat"
        description="Tidak ada lamaran yang cocok atau daftar masih kosong. Tambahkan peluang karier pertama Anda atau impor dari file spreadsheet."
        actionLabel={onResetFilters ? 'Bersihkan Pencarian' : undefined}
        onAction={onResetFilters}
      />
    );
  }

  return (
    <div className="twenty-table-container horizonx-card overflow-hidden bg-white dark:bg-[#111114] shadow-2xs">
      {/* Table Toolbar */}
      <div className="px-4 py-2.5 bg-zinc-50/60 dark:bg-zinc-900/40 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={14} className="text-zinc-500" />
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
            Skema Spreadsheet ({applications.length} Peluang)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onImportApplications && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors shadow-2xs"
                title="Impor langsung dari file CSV Google Spreadsheet"
              >
                <Upload size={12} />
                <span>Impor Sheet CSV</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors shadow-2xs"
            title="Ekspor data dalam format Google Spreadsheet (10 kolom)"
          >
            <Download size={12} />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-zinc-50/80 dark:bg-zinc-800/50 border-b border-zinc-200/80 dark:border-zinc-800 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider select-none">
              <th className="py-2.5 px-3.5 font-medium">Company</th>
              <th className="py-2.5 px-3.5 font-medium">Position</th>
              <th className="py-2.5 px-3.5 font-medium">Link</th>
              <th className="py-2.5 px-3.5 font-medium">Name of Contact</th>
              <th className="py-2.5 px-3.5 font-medium">Email / Phone</th>
              <th className="py-2.5 px-3.5 font-medium">Location</th>
              <th className="py-2.5 px-3.5 font-medium">Type</th>
              <th className="py-2.5 px-3.5 font-medium">Mode</th>
              <th className="py-2.5 px-3.5 font-medium">Pay</th>
              <th className="py-2.5 px-3.5 font-medium">Sent</th>
              <th className="py-2.5 px-3.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {applications.map((a) => {
              const badgeStyle =
                statusStyles[a.status] ||
                'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';

              const typeBadge =
                typeStyles[a.type] ||
                'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';

              const modeBadge =
                modeStyles[a.mode] ||
                'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';

              const displayLink = a.link
                ? a.link.replace(/^https?:\/\//, '').replace(/\/$/, '')
                : '';

              const fullUrl = a.link
                ? a.link.startsWith('http') ? a.link : `https://${a.link}`
                : '';

              return (
                <tr
                  key={a.id}
                  onClick={() => onSelectApplication(a)}
                  className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                >
                  {/* 1. Company */}
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] flex items-center justify-center border border-zinc-200/60 dark:border-zinc-700/60 flex-shrink-0">
                        {a.company[0]?.toUpperCase() || 'C'}
                      </div>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">
                        {a.company}
                      </span>
                    </div>
                  </td>

                  {/* 2. Position */}
                  <td className="py-3 px-3.5 font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[160px]">
                    {a.position}
                  </td>

                  {/* 3. Link */}
                  <td className="py-3 px-3.5">
                    {a.link ? (
                      <a
                        href={fullUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 underline decoration-zinc-300 dark:decoration-zinc-700 hover:decoration-zinc-800 text-[11px] truncate max-w-[130px]"
                        title={a.link}
                      >
                        <span className="truncate">{displayLink}</span>
                        <ExternalLink size={10} className="flex-shrink-0 opacity-70" />
                      </a>
                    ) : (
                      <span className="text-zinc-400 text-[11px]">-</span>
                    )}
                  </td>

                  {/* 4. Name of Contact */}
                  <td className="py-3 px-3.5 text-zinc-700 dark:text-zinc-300 truncate max-w-[130px]">
                    {a.contactName ? (
                      <span className="font-medium">{a.contactName}</span>
                    ) : (
                      <span className="text-zinc-400">-</span>
                    )}
                  </td>

                  {/* 5. Email/Phone */}
                  <td className="py-3 px-3.5">
                    {a.contact ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 truncate max-w-[150px]">
                        <Mail size={11} className="text-zinc-400 flex-shrink-0" />
                        <span className="truncate">{a.contact}</span>
                      </span>
                    ) : (
                      <span className="text-zinc-400 text-[11px]">-</span>
                    )}
                  </td>

                  {/* 6. Location */}
                  <td className="py-3 px-3.5 text-zinc-600 dark:text-zinc-400 truncate max-w-[120px]">
                    {a.location || '-'}
                  </td>

                  {/* 7. Type */}
                  <td className="py-3 px-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${typeBadge}`}
                    >
                      {a.type}
                    </span>
                  </td>

                  {/* 8. Mode */}
                  <td className="py-3 px-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${modeBadge}`}
                    >
                      {a.mode}
                    </span>
                  </td>

                  {/* 9. Pay */}
                  <td className="py-3 px-3.5 font-mono text-zinc-800 dark:text-zinc-200 tabular-nums font-semibold">
                    {salary(a)}
                  </td>

                  {/* 10. Sent */}
                  <td className="py-3 px-3.5">
                    {a.sent ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 max-w-[160px] truncate" title={a.sent}>
                        {a.sent}
                      </span>
                    ) : (
                      <span className="font-mono text-zinc-400 text-[11px]">
                        {a.sentAt || '-'}
                      </span>
                    )}
                  </td>

                  {/* 11. Status */}
                  <td className="py-3 px-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${badgeStyle}`}
                    >
                      {a.status}
                    </span>
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
