import { useState } from 'react';
import {
  Inbox,
  Zap,
  Mail,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  X,
  FileCheck,
} from 'lucide-react';
import { useRecruitmentNotifications } from '../../hooks/useRecruitmentNotifications';
import { useApplicationEvents } from '../../hooks/useApplicationEvents';
import type { Application, ApplicationDraft } from '../../lib/pb-types';

interface RecruitmentInboxViewProps {
  applications: Application[];
  addApplication: (draft: ApplicationDraft) => Promise<Application | unknown>;
  onSelectApplication: (app: Application) => void;
}

export function RecruitmentInboxView({
  applications,
  addApplication,
  onSelectApplication,
}: RecruitmentInboxViewProps) {
  const {
    notifications,
    gmailConnection,
    loading,
    updateGmailSetting,
    processRawNotificationText,
    deleteNotification,
  } = useRecruitmentNotifications();

  const { addEvent } = useApplicationEvents();

  const [activeFilter, setActiveFilter] = useState<
    'all' | 'matched' | 'needs_review' | 'auto_created' | 'unmatched'
  >('all');
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    return n.matchStatus === activeFilter;
  });

  const handleQuickIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteText.trim()) return;
    setIsProcessing(true);
    setMessage(null);
    try {
      const result = await processRawNotificationText(
        pasteText,
        applications,
        addApplication,
        addEvent
      );
      setMessage(
        `Successfully ingested notification: ${result.extracted.company} · ${
          result.extracted.position
        } (${result.matchStatus.toUpperCase()})`
      );
      setPasteText('');
      setIsIngestModalOpen(false);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Could not process notification');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSampleFill = (sample: string) => {
    setPasteText(sample);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header & Gmail Connection Card */}
      <div
        style={{
          background: '#fbfbf8',
          border: '1px solid #dedfd8',
          padding: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                background: '#eef2e6',
                color: '#556b2f',
                padding: '6px',
                borderRadius: '50%',
                display: 'inline-grid',
                placeItems: 'center',
              }}
            >
              <Inbox size={18} />
            </span>
            <h1 style={{ fontSize: '20px', margin: 0, fontWeight: 600 }}>
              Recruitment Inbox & Email Sync
            </h1>
            <span
              style={{
                font: "10px 'DM Mono'",
                textTransform: 'uppercase',
                background: '#e8eedd',
                color: '#4e622b',
                padding: '4px 8px',
                borderRadius: '3px',
                border: '1px solid #d4dec3',
              }}
            >
              JobStreet Sync Ready
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#777c73', margin: '8px 0 0' }}>
            Connected Account: <b style={{ color: '#202320' }}>{gmailConnection.email}</b> · Last
            Synced:{' '}
            <span style={{ font: "12px 'DM Mono'" }}>
              {new Date(gmailConnection.lastSyncedAt || Date.now()).toLocaleTimeString('id-ID')}
            </span>{' '}
            · Auto-Create Applications:{' '}
            <b style={{ color: gmailConnection.autoCreateApplication ? '#455928' : '#888d82' }}>
              {gmailConnection.autoCreateApplication ? 'Enabled' : 'Disabled'}
            </b>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              background: '#f0f2eb',
              padding: '8px 12px',
              borderRadius: '3px',
            }}
          >
            <input
              type="checkbox"
              checked={Boolean(gmailConnection.autoCreateApplication)}
              onChange={(e) => updateGmailSetting(e.target.checked)}
              style={{ accentColor: '#7d9850' }}
            />
            <span>Auto-create on discovery</span>
          </label>

          <button
            onClick={() => setIsIngestModalOpen(true)}
            className="primary compact-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Zap size={14} /> Quick Ingest Email
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            background: '#edf2e3',
            border: '1px solid #cfddbe',
            color: '#455928',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{message}</span>
          <button onClick={() => setMessage(null)} style={{ color: '#455928', fontWeight: 'bold' }}>
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          borderBottom: '1px solid #dedfd8',
          fontSize: '13px',
          overflowX: 'auto',
        }}
      >
        {(['all', 'matched', 'needs_review', 'auto_created', 'unmatched'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            style={{
              paddingBottom: '12px',
              fontWeight: 600,
              textTransform: 'capitalize',
              borderBottom: activeFilter === tab ? '2px solid #7d9850' : '2px solid transparent',
              color: activeFilter === tab ? '#202320' : '#888d82',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.replace('_', ' ')}
            <span
              style={{
                font: "10px 'DM Mono'",
                background: '#e8ebd8',
                color: '#495a28',
                padding: '2px 7px',
                borderRadius: '12px',
              }}
            >
              {tab === 'all'
                ? notifications.length
                : notifications.filter((n) => n.matchStatus === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredNotifications.map((item) => {
          const matchedApp = applications.find((a) => a.id === item.matchedApplication);
          return (
            <div
              key={item.id}
              style={{
                background: '#fbfbf8',
                border: '1px solid #dedfd8',
                padding: '18px 20px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      font: "10px 'DM Mono'",
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: '3px',
                      background:
                        item.extractedEventType === 'employer_viewed'
                          ? '#e0f2fe'
                          : item.extractedEventType === 'interview_invited'
                          ? '#edf2e3'
                          : item.extractedEventType === 'rejection_received'
                          ? '#faece8'
                          : '#f0f2eb',
                      color:
                        item.extractedEventType === 'employer_viewed'
                          ? '#0369a1'
                          : item.extractedEventType === 'interview_invited'
                          ? '#455928'
                          : item.extractedEventType === 'rejection_received'
                          ? '#914030'
                          : '#4e5548',
                      border: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    {item.extractedEventType?.replace('_', ' ')}
                  </span>

                  <strong style={{ fontSize: '14px', color: '#202320' }}>
                    {item.extractedCompany} · {item.extractedPosition}
                  </strong>

                  <span style={{ fontSize: '11px', color: '#888d82' }}>
                    via {item.platform?.toUpperCase()}
                  </span>
                </div>

                <p
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#555a50',
                    background: '#f5f5f0',
                    padding: '8px 12px',
                    border: '1px solid #dedfd8',
                    margin: '4px 0',
                    fontStyle: 'italic',
                  }}
                >
                  "{item.evidenceSnippet || item.rawSubject}"
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '11px',
                    color: '#888d82',
                  }}
                >
                  <span>
                    Match status:{' '}
                    <b style={{ color: '#202320', textTransform: 'capitalize' }}>
                      {item.matchStatus.replace('_', ' ')}
                    </b>
                  </span>
                  <span>·</span>
                  <span>
                    Confidence:{' '}
                    <b style={{ color: '#455928', font: "11px 'DM Mono'" }}>
                      {item.confidence}%
                    </b>
                  </span>
                  <span>·</span>
                  <span>{new Date(item.created || Date.now()).toLocaleDateString('id-ID')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {matchedApp && (
                  <button
                    onClick={() => onSelectApplication(matchedApp)}
                    className="secondary compact-btn"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    Open Application <ExternalLink size={12} />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(item.id)}
                  className="secondary compact-btn"
                  style={{ padding: '6px 10px', color: '#b43d3d' }}
                  title="Delete notification"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredNotifications.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              border: '1px dashed #dedfd8',
              color: '#888d82',
              fontSize: '13px',
            }}
          >
            {loading ? 'Loading notifications...' : 'No notifications found for this filter.'}
          </div>
        )}
      </div>

      {/* Quick Ingest Modal */}
      {isIngestModalOpen && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Quick Ingest Notification">
          <div className="modal" style={{ maxWidth: '580px', width: '100%' }}>
            <div className="drawer-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={18} style={{ color: '#7d9850' }} />
                <span className="eyebrow" style={{ margin: 0 }}>QUICK INGEST NOTIFICATION</span>
              </div>
              <button onClick={() => setIsIngestModalOpen(false)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <h2 style={{ fontSize: '22px', margin: '14px 0 6px' }}>Ingest recruitment alert</h2>
            <p className="muted" style={{ margin: '0 0 16px', lineHeight: 1.5 }}>
              Paste an email subject line or notification text from JobStreet, LinkedIn, or a recruiter. The parser extracts the company, position, and status while enforcing monotonic CRM hierarchy.
            </p>

            <form onSubmit={handleQuickIngest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label
                  style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#888d82',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Notification / Email Text *
                </label>
                <textarea
                  rows={4}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="e.g. PT Lintas Media Danawa telah melihat lamaranmu untuk DevOps Engineer"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dedfd8',
                    background: '#fff',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    lineHeight: 1.5,
                  }}
                  required
                />
              </div>

              {/* Sample Quick Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#888d82' }}>Quick test samples:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() =>
                      handleSampleFill(
                        'PT Lintas Media Danawa telah melihat lamaranmu untuk DevOps Engineer'
                      )
                    }
                    className="secondary compact-btn"
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    Viewed: PT Lintas Media Danawa
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleSampleFill(
                        'Undangan Interview: Site Reliability Engineer di Tokopedia'
                      )
                    }
                    className="secondary compact-btn"
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    Interview: Tokopedia SRE
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '12px',
                  paddingTop: '14px',
                  borderTop: '1px solid #dedfd8',
                }}
              >
                <button
                  type="button"
                  className="secondary compact-btn"
                  onClick={() => setIsIngestModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary compact-btn"
                  disabled={isProcessing}
                >
                  <FileCheck size={14} /> {isProcessing ? 'Processing...' : 'Ingest to CRM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
