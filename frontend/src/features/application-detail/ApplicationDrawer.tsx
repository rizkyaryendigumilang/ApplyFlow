import { useState } from 'react';
import { X, ShieldAlert, Send, Printer, Award, Scale } from 'lucide-react';
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

export function ApplicationDrawer({
  application: a,
  onClose,
  onUpdateStatus,
  onOpenFollowUp,
}: ApplicationDrawerProps) {
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
      setError(cause instanceof Error ? cause.message : 'Could not save status');
    }
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Opportunity Detail">
      <aside className="drawer">
        <div className="drawer-head">
          <span className="eyebrow">OPPORTUNITY DETAIL</span>
          <button onClick={onClose} aria-label="Close drawer">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-title">
          <span className="company-logo big">{a.company[0]}</span>
          <div>
            <h2>{a.position}</h2>
            <p>
              {a.company} · {a.location}
            </p>
          </div>
        </div>

        {/* Stage selection with monotonic guards */}
        <div className="drawer-section">
          <label htmlFor="status-select">Stage</label>
          <select
            id="status-select"
            value={a.status}
            onChange={(e) => handleStatusChange(e.target.value as Status)}
          >
            {allStatuses.map((s) => {
              const targetRank = STATUS_RANKS[s];
              const isTargetTerminal = ['Rejected', 'Ghosted'].includes(s);
              const isCurrentTerminal = ['Rejected', 'Ghosted'].includes(a.status);
              
              // Monotonic safe state check
              const isDowngrade =
                !isTargetTerminal && !isCurrentTerminal && targetRank < curRank;
              const isOfferToRejected = a.status === 'Offer' && s === 'Rejected';
              const isDisabled = isDowngrade || isOfferToRejected;

              return (
                <option key={s} value={s} disabled={isDisabled}>
                  {s}
                  {isDowngrade ? ' (Downgrade blocked)' : ''}
                  {isOfferToRejected ? ' (Offer locked)' : ''}
                </option>
              );
            })}
          </select>
          {error && <p className="auth-error mt-2">{error}</p>}
        </div>

        <div className="drawer-section">
          <label>Source & Tracking</label>
          <p className="muted">
            Origin: <b>{a.jobSource || 'Direct Entry'}</b>
            {a.applicationMethod && ` via ${a.applicationMethod}`}
            {a.autoCreated && ' (Auto-created from verified notification)'}
          </p>
        </div>

        <div className="drawer-section">
          <label>Compensation & Contract</label>
          <h3>{salary(a)}</h3>
          <p className="muted">
            {a.type} · {a.mode}
          </p>
          <button
            type="button"
            className="secondary compact-btn"
            style={{ marginTop: 8 }}
            onClick={() => setShowVendorRisk(true)}
          >
            <ShieldAlert size={13} /> Audit Klausul Kontrak ({a.type})
          </button>
        </div>

        <div className="drawer-section">
          <label>Contact & Anti-Ghosting</label>
          <p>{a.contactName || 'No contact yet'}</p>
          <p className="muted">
            {a.contact || 'Add a recruiter contact to unlock follow-up nudges.'}
          </p>
          <button
            type="button"
            className="secondary compact-btn"
            style={{ marginTop: 8 }}
            onClick={() => onOpenFollowUp(a)}
          >
            <Send size={13} /> Generate Follow-Up Nudge
          </button>
        </div>

        {/* Activity Timeline */}
        <div className="drawer-section">
          <label>Activity Timeline (JobStreet & Sync)</label>
          <div className="activity-timeline">
            {eventsLoading ? (
              <p className="muted">Loading activity...</p>
            ) : events.length > 0 ? (
              events.map((ev) => (
                <div className="activity-event" key={ev.id}>
                  <div className="activity-event-dot" />
                  <div className="activity-event-body">
                    <b>{ev.eventType.replace('_', ' ').toUpperCase()}</b>
                    <small>{ev.rawSubject || ev.evidenceSnippet?.slice(0, 80)}</small>
                    <small style={{ color: '#64748b' }}>
                      {new Date(ev.created || Date.now()).toLocaleString('id-ID')} via{' '}
                      {ev.sourcePlatform || 'system'}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">
                Belum ada riwayat email/notifikasi yang tercatat untuk lamaran ini.
              </p>
            )}
          </div>
        </div>

        <div className="drawer-section">
          <label>Document & ATS Tailoring</label>
          <p className="muted">
            CV Target: <b>{a.cvVersion || 'Default Master CV'}</b>
          </p>
          <button
            type="button"
            className="secondary compact-btn"
            style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f4f6ed', border: '1px solid #c9d7b5', color: '#3d5223' }}
            onClick={() => setShowAtsResume(true)}
          >
            <Printer size={13} /> Format Harvard ATS Resume
          </button>
        </div>

        {['Screening', 'Interview'].includes(a.status) && (
          <div className="drawer-section">
            <label>Interview Preparation Lab</label>
            <p className="muted">Latih jawaban wawancara perilaku & teknis dengan skoring otomatis:</p>
            <button
              type="button"
              className="primary compact-btn"
              style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#202320', color: '#f5f5f0' }}
              onClick={() => setShowStarCoach(true)}
            >
              <Award size={13} /> Buka STAR Answer Coach
            </button>
          </div>
        )}

        {a.status === 'Offer' && (
          <div className="drawer-section">
            <label>Offering & Contract Risk Audit</label>
            <p className="muted">Deteksi jebakan pinalti resign, ijazah, atau probation PKWT:</p>
            <button
              type="button"
              className="secondary compact-btn"
              style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fcf6e6', border: '1px solid #ebd8a8', color: '#8c6b1e' }}
              onClick={() => setShowContractInspector(true)}
            >
              <ShieldAlert size={13} /> Audit Draf Kontrak / Offering
            </button>
          </div>
        )}

        <div className="drawer-section">
          <label>Notes</label>
          <p className="note">{a.notes || 'No notes yet.'}</p>
        </div>

        <button className="primary full" onClick={onClose}>
          Done
        </button>
      </aside>

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
}
