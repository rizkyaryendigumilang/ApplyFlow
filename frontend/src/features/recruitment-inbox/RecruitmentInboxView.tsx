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
import { cn } from '../../lib/cn';
import { useRecruitmentNotifications } from '../../hooks/useRecruitmentNotifications';
import { useApplicationEvents } from '../../hooks/useApplicationEvents';
import { EmptyState } from '../../components/ui/EmptyState';
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
    <div className="space-y-6">
      {/* Header & Gmail Connection Card */}
      <div className="rounded-lg border border-zinc-200/90 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-[#18181b] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
              <Inbox size={16} />
            </span>
            <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Recruitment Inbox & Email Sync
            </h1>
            <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[10px] uppercase font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              JobStreet Sync Ready
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Connected Account: <b className="text-zinc-900 dark:text-zinc-100 font-medium">{gmailConnection.email}</b> · Last
            Synced:{' '}
            <span className="font-mono text-zinc-700 dark:text-zinc-300">
              {new Date(gmailConnection.lastSyncedAt || Date.now()).toLocaleTimeString('id-ID')}
            </span>{' '}
            · Auto-Create Applications:{' '}
            <b className={cn("font-medium", gmailConnection.autoCreateApplication ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400")}>
              {gmailConnection.autoCreateApplication ? 'Enabled' : 'Disabled'}
            </b>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <input
              type="checkbox"
              checked={Boolean(gmailConnection.autoCreateApplication)}
              onChange={(e) => updateGmailSetting(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
            />
            <span className="text-xs font-medium">Auto-create on discovery</span>
          </label>

          <button
            onClick={() => setIsIngestModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-zinc-800 active:scale-[0.98] transition-all dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Zap size={14} /> Quick Ingest Email
          </button>
        </div>
      </div>

      {message && (
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" aria-label="Tutup pesan">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-zinc-200/90 dark:border-zinc-800 pb-2.5 overflow-x-auto">
        {(['all', 'matched', 'needs_review', 'auto_created', 'unmatched'] as const).map((tab) => {
          const count = tab === 'all'
            ? notifications.length
            : notifications.filter((n) => n.matchStatus === tab).length;
          const isActive = activeFilter === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors whitespace-nowrap",
                isActive
                  ? "bg-zinc-900 text-white font-semibold dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              )}
            >
              {tab.replace('_', ' ')}
              <span
                className={cn(
                  "font-mono text-[10px] px-1.5 py-0.5 rounded-full",
                  isActive
                    ? "bg-zinc-800 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-800"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((item) => {
          const matchedApp = applications.find((a) => a.id === item.matchedApplication);
          return (
            <div
              key={item.id}
              className="rounded-lg border border-zinc-200/90 bg-white p-4 shadow-2xs hover:border-zinc-300 dark:border-zinc-800 dark:bg-[#18181b] flex flex-wrap items-center justify-between gap-4 transition-colors"
            >
              <div className="flex flex-col gap-1.5 flex-1 min-w-[280px]">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    className={cn(
                      "font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md border",
                      item.extractedEventType === 'employer_viewed'
                        ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800"
                        : item.extractedEventType === 'interview_invited'
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                        : item.extractedEventType === 'rejection_received'
                        ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
                        : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                    )}
                  >
                    {item.extractedEventType?.replace('_', ' ')}
                  </span>

                  <strong className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.extractedCompany} · {item.extractedPosition}
                  </strong>

                  <span className="text-xs text-zinc-400 font-mono">
                    via {item.platform?.toUpperCase()}
                  </span>
                </div>

                <p className="font-mono text-xs text-zinc-600 bg-zinc-50 border border-zinc-200/80 rounded-md p-2 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 italic">
                  "{item.evidenceSnippet || item.rawSubject}"
                </p>

                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <span>
                    Status:{' '}
                    <b className="text-zinc-700 dark:text-zinc-300 font-medium capitalize">
                      {item.matchStatus.replace('_', ' ')}
                    </b>
                  </span>
                  <span>·</span>
                  <span>
                    Confidence:{' '}
                    <b className="text-zinc-800 dark:text-zinc-200 font-mono">
                      {item.confidence}%
                    </b>
                  </span>
                  <span>·</span>
                  <span>{new Date(item.created || Date.now()).toLocaleDateString('id-ID')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {matchedApp && (
                  <button
                    onClick={() => onSelectApplication(matchedApp)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Open Application <ExternalLink size={12} />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(item.id)}
                  className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-rose-950 transition-colors"
                  title="Delete notification"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredNotifications.length === 0 && (
          <EmptyState
            icon={Inbox}
            title={notifications.length === 0 ? "Kotak Masuk Notifikasi Masih Kosong" : "Tidak Ada Notifikasi Sesuai Filter"}
            description={
              notifications.length === 0
                ? "Hubungkan akun Gmail atau tempelkan teks email undangan wawancara atau pengumuman HRD untuk diekstraksi otomatis ke pipeline."
                : "Coba ganti filter status di atas untuk melihat notifikasi lainnya."
            }
            actionLabel="+ Tempel Notifikasi Baru"
            onAction={() => setIsIngestModalOpen(true)}
          />
        )}
      </div>

      {/* Quick Ingest Modal */}
      {isIngestModalOpen && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Quick Ingest Notification">
          <div className="modal" style={{ maxWidth: '580px', width: '100%' }}>
            <div className="drawer-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={16} className="text-zinc-900 dark:text-zinc-100" />
                <span className="eyebrow" style={{ margin: 0 }}>QUICK INGEST NOTIFICATION</span>
              </div>
              <button onClick={() => setIsIngestModalOpen(false)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <h2 style={{ fontSize: '20px', margin: '14px 0 6px', fontWeight: 600 }}>Ingest recruitment alert</h2>
            <p className="muted" style={{ margin: '0 0 16px', lineHeight: 1.5 }}>
              Paste an email subject line or notification text from JobStreet, LinkedIn, or a recruiter. The parser extracts the company, position, and status while enforcing monotonic CRM hierarchy.
            </p>

            <form onSubmit={handleQuickIngest} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Notification / Email Text *
                </label>
                <textarea
                  rows={4}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="e.g. PT Lintas Media Danawa telah melihat lamaranmu untuk DevOps Engineer"
                  className="w-full rounded-md border border-zinc-200 bg-white p-3 font-mono text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  required
                />
              </div>

              {/* Sample Quick Buttons */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-zinc-400">Quick test samples:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleSampleFill(
                        'PT Lintas Media Danawa telah melihat lamaranmu untuk DevOps Engineer'
                      )
                    }
                    className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
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
                    className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                  >
                    Interview: Tokopedia SRE
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-3 pt-3.5 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  className="rounded-md border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                  onClick={() => setIsIngestModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-zinc-800 active:scale-[0.98] transition-all dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
