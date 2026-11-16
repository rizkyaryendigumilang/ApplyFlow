import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface EmptyStateProps {
  icon?: LucideIcon | React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'empty-state-card flex flex-col items-center justify-center text-center my-3 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/30 transition-colors',
        compact ? 'p-6 sm:p-8' : 'p-8 sm:p-12',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs mb-3.5',
          compact ? 'w-9 h-9' : 'w-11 h-11'
        )}
      >
        <Icon size={compact ? 18 : 22} />
      </div>

      <h3
        className={cn(
          'font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5 tracking-tight',
          compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
        )}
      >
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed mb-5">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center justify-center gap-2.5 flex-wrap">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 active:scale-[0.98] transition-all shadow-2xs cursor-pointer"
            >
              {actionLabel}
            </button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 active:scale-[0.98] transition-all cursor-pointer"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
