import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { Application } from '../../lib/pb-types';
import { idr, daysSince } from '../../lib/utils';

export interface ApplicationCardProps {
  application: Application;
  onClick: () => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ application: a, onClick }) => {
  const formattedSalary =
    a.salaryPeriod === 'monthly'
      ? idr(a.salaryMax)
      : `${Math.round(a.salaryMax / 12 / 1000000)}jt/bln`;

  return (
    <article
      className="twenty-card group relative bg-white dark:bg-[#18181b] border border-zinc-200/90 dark:border-zinc-800/90 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-lg p-3.5 shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer select-none"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick();
      }}
    >
      {/* Top row: Company avatar monogram + Quick Action */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/70 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center flex-shrink-0">
            {a.company[0]?.toUpperCase() || 'C'}
          </div>
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
            {a.company}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 opacity-60 group-hover:opacity-100 transition-opacity"
          aria-label="Application options"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Role Title */}
      <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mt-2.5 mb-1.5 line-clamp-1">
        {a.position}
      </h4>

      {/* Tags row */}
      <div className="flex items-center gap-1.5 flex-wrap my-2">
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60">
          {a.mode}
        </span>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60 truncate max-w-[110px]">
          {a.location}
        </span>
        {a.jobSource && (
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
            {a.jobSource}
          </span>
        )}
        {a.status === 'Viewed' && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            Dilihat HR
          </span>
        )}
      </div>

      {/* Card Footer: Salary + Time elapsed */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-[11px]">
        <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
          {formattedSalary}
        </span>
        <span className="text-[10px] text-zinc-400 font-mono">
          {daysSince(a.sentAt)}d lalu
        </span>
      </div>
    </article>
  );
};
