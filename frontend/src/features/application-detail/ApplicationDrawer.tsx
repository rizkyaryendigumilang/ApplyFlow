import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Send,
  Printer,
  Award,
  ExternalLink,
  Briefcase,
  MapPin,
  Clock,
  User,
  Mail,
  FileText,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import type { Application, Status } from '../../lib/pb-types';
import { salary } from '../../lib/utils';
import { useApplicationEvents } from '../../hooks/useApplicationEvents';
import { VendorRiskModal } from './VendorRiskModal';
import { AtsResumeFormatterModal } from '../resume-formatter/AtsResumeFormatterModal';
import { StarCoachModal } from '../interview-prep/StarCoachModal';
import { ContractInspectorModal } from '../offer-calculator/ContractInspectorModal';

export const STATUS_RANKS: Record<Status, number> = {
  Wishlist: 0,
  Applied: 1,
  Viewed: 2,
  Screening: 3,
  Interview: 4,
  Offer: 5,
  Rejected: 90,
  Ghosted: 95,
};

const allStatuses: Status[] = [
  'Wishlist',
  'Applied',
  'Viewed',
  'Screening',
  'Interview',
  'Offer',
  'Rejected',
  'Ghosted',
];

export interface ApplicationDrawerProps {
  application: Application;
  onClose: () => void;
  onUpdateStatus: (id: string, s: Status) => Promise<void>;
  onOpenFollowUp: (a: Application) => void;
}

export const ApplicationDrawer: React.FC<ApplicationDrawerProps> = ({
  application: a,
  onClose,
  onUpdateStatus,
  onOpenFollowUp,
}) => {
  const [activeTab, setActiveTab] = useState<'properties' | 'activity' | 'notes'>('properties');
  const [error, setError] = useState('');
  const [showVendorRisk, setShowVendorRisk] = useState(false);
  const [showAtsResume, setShowAtsResume] = useState(false);
  const [showStarCoach, setShowStarCoach] = useState(false);
  const [showContractInspector, setShowContractInspector] = useState(false);
  const { events, loading: eventsLoading } = useApplicationEvents(a.id);

  const curRank = STATUS_RANKS[a.status] ?? 0;

  const handleStatusChange = async (newStatus: Status) => {
    setError('');

    // Monotonic State Progression Guard (ADR-0002)
    const newRank = STATUS_RANKS[newStatus] ?? 0;
    const isTerminal = ['Rejected', 'Ghosted'].includes(newStatus);
    const isCurrentTerminal = ['Rejected', 'Ghosted'].includes(a.status);

    if (!isTerminal && !isCurrentTerminal && newRank < curRank) {
      setError(
        `Regresi status ditolak: Tidak dapat menurunkan tahapan dari "${a.status}" ke "${newStatus}". Hierarki kemajuan bersifat monoton demi integritas funnel (ADR-0002).`
      );
      return;
    }

    if (a.status === 'Offer' && newStatus === 'Rejected') {
      setError(
        'Inkonsistensi status: Posisi yang telah mencapai status "Offer" tidak dapat diubah menjadi "Rejected" (ADR-0002).'
      );
      return;
    }

    try {
      await onUpdateStatus(a.id, newStatus);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal menyimpan status');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150 select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Detail Peluang Karier"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="relative z-10 w-full max-w-xl h-full bg-white dark:bg-[#121214] border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* 1. Header Toolbar (Twenty CRM style) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 text-xs">
          <div className="flex items-center gap-2 text-zinc-500">
            <Briefcase size={14} className="text-zinc-400" />
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Peluang Karier</span>
          </div>

          <div className="flex items-center gap-1.5">
            {a.link && (
              <a
                href={a.link}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Buka Link Lowongan Asli"
              >
                <ExternalLink size={14} />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Tutup Panel"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 2. Record Header Card */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/20">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
              {a.company[0]?.toUpperCase() || 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
                {a.position}
              </h2>
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{a.company}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin size={11} /> {a.location}
                </span>
              </div>
            </div>
          </div>

          {/* Status selector pill in Twenty CRM style */}
          <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Tahap Seleksi:</span>
            <div className="relative">
              <select
                id="status-select"
                value={a.status}
                onChange={(e) => handleStatusChange(e.target.value as Status)}
                className="px-3 py-1 text-xs font-semibold rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
              >
                {allStatuses.map((s) => {
                  const targetRank = STATUS_RANKS[s];
                  const isTargetTerminal = ['Rejected', 'Ghosted'].includes(s);
                  const isCurrentTerminal = ['Rejected', 'Ghosted'].includes(a.status);
                  const isDowngrade =
                    !isTargetTerminal && !isCurrentTerminal && targetRank < curRank;
                  const isOfferToRejected = a.status === 'Offer' && s === 'Rejected';
                  const isDisabled = isDowngrade || isOfferToRejected;

                  return (
                    <option key={s} value={s} disabled={isDisabled}>
                      {s}
                      {isDowngrade ? ' (Regresi diblokir)' : ''}
                      {isOfferToRejected ? ' (Offer terkunci)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {error && (
            <div className="mt-2.5 p-2 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* 3. Action Buttons Row (Twenty CRM style) */}
        <div className="px-6 py-2.5 bg-white dark:bg-[#121214] border-b border-zinc-200/70 dark:border-zinc-800/70 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => onOpenFollowUp(a)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors flex-shrink-0"
          >
            <Send size={12} className="text-emerald-600" />
            <span>Follow-Up</span>
          </button>

          <button
            onClick={() => setShowStarCoach(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors flex-shrink-0"
          >
            <Award size={12} className="text-amber-500" />
            <span>STAR Coach</span>
          </button>

          <button
            onClick={() => setShowVendorRisk(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors flex-shrink-0"
          >
            <ShieldAlert size={12} className="text-purple-500" />
            <span>Audit Vendor ({a.type})</span>
          </button>

          <button
            onClick={() => setShowAtsResume(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors flex-shrink-0"
          >
            <Printer size={12} className="text-blue-500" />
            <span>Format ATS</span>
          </button>

          {a.status === 'Offer' && (
            <button
              onClick={() => setShowContractInspector(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors flex-shrink-0"
            >
              <ShieldAlert size={12} />
              <span>Inspeksi Offering</span>
            </button>
          )}
        </div>

        {/* 4. Tab Navigation (Twenty CRM style) */}
        <div className="flex border-b border-zinc-200/80 dark:border-zinc-800/80 px-6 gap-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('properties')}
            className={`py-2.5 border-b-2 transition-colors ${
              activeTab === 'properties'
                ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Properti & Kompensasi
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'activity'
                ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <span>Riwayat Aktivitas</span>
            {events.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {events.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-2.5 border-b-2 transition-colors ${
              activeTab === 'notes'
                ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Catatan
          </button>
        </div>

        {/* 5. Tab Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {activeTab === 'properties' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/50 dark:bg-zinc-900/30">
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider block mb-1">
                    Estimasi Gaji / THP
                  </span>
                  <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {salary(a)}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/50 dark:bg-zinc-900/30">
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider block mb-1">
                    Mode & Penempatan
                  </span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {a.type} · {a.mode}
                  </span>
                </div>
              </div>

              {/* Properties table in Twenty CRM style */}
              <div className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg overflow-hidden text-xs">
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  <div className="flex items-center justify-between p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <Clock size={13} className="text-zinc-400" /> Tanggal Kirim
                    </span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-200">{a.sentAt}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <Briefcase size={13} className="text-zinc-400" /> Asal Sumber
                    </span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {a.jobSource || 'Direct Entry'}
                      {a.applicationMethod && ` via ${a.applicationMethod}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <User size={13} className="text-zinc-400" /> Kontak HR
                    </span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]">
                      {a.contactName || 'Belum ada kontak'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <Mail size={13} className="text-zinc-400" /> Email / Telepon
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">
                      {a.contact || 'Tidak dicantumkan'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <FileText size={13} className="text-zinc-400" /> Varian CV
                    </span>
                    <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
                      {a.cvVersion || 'CV-Default'}
                    </span>
                  </div>

                  {a.nextFollowUp && (
                    <div className="flex items-center justify-between p-2.5 bg-amber-50/50 dark:bg-amber-950/20">
                      <span className="text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-2">
                        <Clock size={13} /> Target Follow-Up
                      </span>
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                        {a.nextFollowUp}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              {eventsLoading ? (
                <p className="text-xs text-zinc-400">Memuat riwayat aktivitas…</p>
              ) : events.length > 0 ? (
                <div className="space-y-3 border-l-2 border-zinc-200 dark:border-zinc-800 ml-2 pl-4">
                  {events.map((ev) => (
                    <div key={ev.id} className="relative group">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-400 dark:bg-zinc-600 group-hover:bg-zinc-800 transition-colors" />
                      <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {ev.eventType.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                        {ev.rawSubject || ev.evidenceSnippet?.slice(0, 100)}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono mt-1">
                        {new Date(ev.created || Date.now()).toLocaleString('id-ID')} via{' '}
                        {ev.sourcePlatform || 'system'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-zinc-400">
                  Belum ada riwayat email atau notifikasi otomatis yang tercatat.
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                Catatan Wawancara & Peluang
              </label>
              <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed min-h-[140px] whitespace-pre-wrap">
                {a.notes || 'Belum ada catatan untuk lowongan ini.'}
              </div>
            </div>
          )}
        </div>

        {/* 6. Footer Button */}
        <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/20">
          <button
            onClick={onClose}
            className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 text-xs font-semibold rounded-md shadow-2xs transition-all active:scale-[0.98]"
          >
            Selesai
          </button>
        </div>
      </aside>

      {/* Sub-modals */}
      {showVendorRisk && (
        <VendorRiskModal
          companyName={a.company}
          positionTitle={a.position}
          onClose={() => setShowVendorRisk(false)}
        />
      )}

      {showAtsResume && (
        <AtsResumeFormatterModal
          isOpen={showAtsResume}
          onClose={() => setShowAtsResume(false)}
          targetApplication={a}
        />
      )}

      {showStarCoach && (
        <StarCoachModal
          isOpen={showStarCoach}
          onClose={() => setShowStarCoach(false)}
          roleTitle={a.position}
          companyName={a.company}
        />
      )}

      {showContractInspector && (
        <ContractInspectorModal
          isOpen={showContractInspector}
          onClose={() => setShowContractInspector(false)}
          application={a}
        />
      )}
    </div>
  );
};
