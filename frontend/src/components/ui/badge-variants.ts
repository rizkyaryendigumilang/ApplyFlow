import { cva, type VariantProps } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ring-current/20 backdrop-blur-xs transition-[transform,background-color,border-color,color] duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground border-border',
        // Semantic Career CRM application status variants
        wishlist: 'border-slate-700/60 bg-slate-800/60 text-slate-300',
        applied: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
        viewed: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
        screening: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
        interview: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
        offer: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
        rejected: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
        ghosted: 'border-zinc-700/40 bg-zinc-800/40 text-zinc-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type BadgeVariantProps = VariantProps<typeof badgeVariants>;
