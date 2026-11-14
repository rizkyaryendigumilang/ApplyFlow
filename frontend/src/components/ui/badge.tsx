import * as React from 'react';
import { badgeVariants, type BadgeVariantProps } from './badge-variants';
import { cn } from '../../lib/utils';

export { badgeVariants };

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    BadgeVariantProps {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
