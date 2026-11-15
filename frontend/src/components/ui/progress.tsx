import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  indicatorClassName?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, indicatorClassName, ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

    return (
      <div
        ref={ref}
        className={cn('relative h-2.5 w-full overflow-hidden rounded-full bg-slate-950 border border-slate-800', className)}
        {...props}
      >
        <div
          className={cn('h-full w-full flex-1 bg-primary transition-transform duration-500 ease-out rounded-full', indicatorClassName)}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';
