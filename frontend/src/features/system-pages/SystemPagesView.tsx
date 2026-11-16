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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Interactive Switcher Bar for Demonstration & Verification */}
      <div
        style={{
          background: '#fbfbf8',
          border: '1px solid #dedfd8',
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} style={{ color: '#18181b' }} />
          <span style={{ fontSize: '12px', fontWeight: 600 }}>System State Simulator:</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['404', '403', '500', 'maintenance', 'offline', 'session-expired'] as const).map(
            (code) => (
              <button
                key={code}
                onClick={() => setSelectedCode(code)}
                className={selectedCode === code ? 'primary compact-btn' : 'secondary compact-btn'}
                style={{ fontSize: '11px', textTransform: 'uppercase' }}
              >
                {code}
              </button>
            )
          )}
        </div>
      </div>

      {/* Rendered System Page Card */}
      <div
        style={{
          background: '#fbfbf8',
          border: '1px solid #dedfd8',
          padding: '60px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '680px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#f5f5f0',
            border: '1px solid #dedfd8',
            display: 'grid',
            placeItems: 'center',
            marginBottom: '20px',
            color: current.accentColor,
          }}
        >
          <IconComponent size={30} />
        </div>

        <span
          style={{
            font: "11px 'DM Mono'",
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#888d82',
            marginBottom: '8px',
          }}
        >
          {current.codeLabel}
        </span>

        <h1
          style={{
            fontSize: '32px',
            margin: '0 0 10px',
            letterSpacing: '-0.04em',
            fontWeight: 600,
          }}
        >
          {current.title}
        </h1>

        <p
          style={{
            fontSize: '15px',
            color: '#555e50',
            maxWidth: '480px',
            margin: '0 0 16px',
            lineHeight: 1.5,
          }}
        >
          {current.subtitle}
        </p>

        <p
          style={{
            fontSize: '12px',
            color: '#888d82',
            maxWidth: '460px',
            margin: '0 0 28px',
            lineHeight: 1.6,
          }}
        >
          {current.description}
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={onNavigateHome}
            className="primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={14} /> {current.actionText}
          </button>
          {current.secondaryText && (
            <button
              onClick={() => location.reload()}
              className="secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <RotateCcw size={14} /> {current.secondaryText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
