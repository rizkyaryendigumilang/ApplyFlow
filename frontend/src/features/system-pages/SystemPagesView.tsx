import { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ServerOff,
  Wrench,
  WifiOff,
  Lock,
  ArrowLeft,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export type SystemCode = '404' | '403' | '500' | 'maintenance' | 'offline' | 'session-expired';

export interface SystemPagesViewProps {
  initialCode?: SystemCode;
  onNavigateHome: () => void;
}

export function SystemPagesView({
  initialCode = '404',
  onNavigateHome,
}: SystemPagesViewProps) {
  const [selectedCode, setSelectedCode] = useState<SystemCode>(initialCode);

  const pages: Record<
    SystemCode,
    {
      codeLabel: string;
      title: string;
      subtitle: string;
      description: string;
      icon: typeof AlertTriangle;
      accentColor: string;
      actionText: string;
      secondaryText?: string;
    }
  > = {
    '404': {
      codeLabel: 'ERROR 404',
      title: 'Opportunity Not Found',
      subtitle: 'The door you are trying to open does not exist or was deleted.',
      description:
        'The application record, lead URL, or feature route could not be found in your local database or synchronized cloud store.',
      icon: AlertTriangle,
      accentColor: '#888d82',
      actionText: 'Return to Pipeline',
      secondaryText: 'View All Opportunities',
    },
    '403': {
      codeLabel: 'ACCESS RESTRICTED 403',
      title: 'Insufficient Permissions',
      subtitle: 'This section requires elevated admin or account owner credentials.',
      description:
        'Your user role does not possess authorization to access sensitive OAuth token stores or modify global organization settings.',
      icon: ShieldAlert,
      accentColor: '#914030',
      actionText: 'Return to Dashboard',
      secondaryText: 'Request Access from Admin',
    },
    '500': {
      codeLabel: 'SERVER EXCEPTION 500',
      title: 'Database Engine Exception',
      subtitle: 'PocketBase backend encountered an unhandled hook rejection.',
      description:
        'The SQLite connection was momentarily locked during concurrent write evaluation or a hook script encountered a syntax boundary.',
      icon: ServerOff,
      accentColor: '#b43d3d',
      actionText: 'Retry Request',
      secondaryText: 'Report to Engineering',
    },
    maintenance: {
      codeLabel: 'SCHEDULED UPGRADE',
      title: 'System Under Maintenance',
      subtitle: 'Junction Career CRM is undergoing scheduled database schema migration.',
      description:
        'We are applying zero-downtime updates for statutory tax table updates (PMK 168/2023) and encrypted token migrations. Please check back in a few minutes.',
      icon: Wrench,
      accentColor: '#8c6b1e',
      actionText: 'Check Service Status',
      secondaryText: 'Refresh Page',
    },
    offline: {
      codeLabel: 'NETWORK DISCONNECTED',
      title: 'Operating in Offline Mode',
      subtitle: 'No internet connection detected; local fallback mode is active.',
      description:
        'You can continue browsing, editing applications, and drafting follow-up emails. All mutations are queued in encrypted localStorage and will sync once connection restores.',
      icon: WifiOff,
      accentColor: '#455928',
      actionText: 'Work Offline',
      secondaryText: 'Reconnect Now',
    },
    'session-expired': {
      codeLabel: 'AUTHENTICATION NOTICE',
      title: 'Session Expired',
      subtitle: 'Your security token has expired after 14 days of inactivity.',
      description:
        'To ensure zero-token leakage and uphold cryptographic session boundaries, please re-authenticate your PocketBase account.',
      icon: Lock,
      accentColor: '#18181b',
      actionText: 'Log In Again',
      secondaryText: 'Switch Account',
    },
  };

  const current = pages[selectedCode];
  const IconComponent = current.icon;

  return (
    <div className="flex flex-col gap-6">
      {/* Interactive Switcher Bar for Demonstration & Verification */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200/90 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-zinc-900 dark:text-zinc-100" />
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">System State Simulator:</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['404', '403', '500', 'maintenance', 'offline', 'session-expired'] as const).map(
            (code) => (
              <button
                key={code}
                onClick={() => setSelectedCode(code)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-mono uppercase transition-colors ${
                  selectedCode === code
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-2xs'
                    : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                {code}
              </button>
            )
          )}
        </div>
      </div>

      {/* Rendered System Page Card */}
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center rounded-2xl border border-zinc-200/90 bg-white px-6 py-16 text-center shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 shadow-2xs">
          <IconComponent size={28} />
        </div>

        <span className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {current.codeLabel}
        </span>

        <h1 className="mb-2.5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          {current.title}
        </h1>

        <p className="mb-4 max-w-lg text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
          {current.subtitle}
        </p>

        <p className="mb-8 max-w-md text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
          {current.description}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-zinc-800 active:scale-[0.98] transition-all dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <ArrowLeft size={14} /> {current.actionText}
          </button>
          {current.secondaryText && (
            <button
              onClick={() => location.reload()}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 active:scale-[0.98] transition-all dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              <RotateCcw size={14} /> {current.secondaryText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
