import { useState } from 'react';
import { X, ArrowUpRight } from 'lucide-react';
import type { Application, ApplicationDraft } from '../../lib/pb-types';

export interface AddOpportunityModalProps {
  onClose: () => void;
  onAdd: (a: ApplicationDraft) => Promise<Application | void>;
}

export function AddOpportunityModal({ onClose, onAdd }: AddOpportunityModalProps) {
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [location, setLocation] = useState('Jakarta');
  const [mode, setMode] = useState<'Remote' | 'Hybrid' | 'On-site'>('Hybrid');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!company.trim() || !position.trim()) {
      setError('Harap isi nama perusahaan dan posisi jabatan.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await onAdd({
        company: company.trim(),
        position: position.trim(),
        location: location.trim() || 'Jakarta',
        type: 'In-house',
        mode,
        salaryMin: 0,
        salaryMax: 0,
        salaryPeriod: 'monthly',
        status: 'Wishlist',
        sentAt: new Date().toISOString().slice(0, 10),
        cvVersion: 'CV-Infra-v3',
        jobSource: 'Other',
        applicationMethod: 'Manual',
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save opportunity');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="New Opportunity">
      <div className="modal">
        <div className="drawer-head">
          <span className="eyebrow">NEW OPPORTUNITY</span>
          <button onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <h2>Open a new door.</h2>
        <p className="muted">
          Start with the key details that matter most. You can enrich the compensation, contact, and tracking later.
        </p>

        <form onSubmit={handleSave}>
          <label>
            Company
            <input
              autoFocus
              autoComplete="organization"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Stripe, GoTo, or Traveloka"
              required
            />
          </label>
          <label>
            Position
            <input
              autoComplete="organization-title"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Staff Platform Engineer"
              required
            />
          </label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <label>
              Location
              <input
                autoComplete="address-level2"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Jakarta, Remote, Singapore"
              />
            </label>
            <label>
              Work Mode
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'Remote' | 'Hybrid' | 'On-site')}
                className="mt-1 block w-full p-2.5 rounded-xl border border-[#d9dbd2] bg-white text-xs font-medium focus:outline-none focus:border-[#7d9850] focus:ring-2 focus:ring-[#7d9850]/20 transition-all duration-150"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </label>
          </div>

          {error && <p className="auth-error mt-3">{error}</p>}

          <button
            type="submit"
            className="primary full mt-4"
            disabled={busy}
          >
            {busy ? 'Saving…' : 'Add to wishlist'}{' '}
            {!busy && <ArrowUpRight size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
