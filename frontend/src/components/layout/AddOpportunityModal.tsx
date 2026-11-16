import { useState } from 'react';
import { X, ArrowUpRight, Link2, User, Mail, DollarSign, Send, MapPin, Briefcase } from 'lucide-react';
import type { Application, ApplicationDraft, Status } from '../../lib/pb-types';

export interface AddOpportunityModalProps {
  onClose: () => void;
  onAdd: (a: ApplicationDraft) => Promise<Application | void>;
}

export function AddOpportunityModal({ onClose, onAdd }: AddOpportunityModalProps) {
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [link, setLink] = useState('');
  const [contactName, setContactName] = useState('');
  const [contact, setContact] = useState('');
  const [location, setLocation] = useState('USA');
  const [type, setType] = useState<Application['type']>('Full-time');
  const [mode, setMode] = useState<Application['mode']>('Remote');
  const [pay, setPay] = useState('');
  const [sent, setSent] = useState('');
  const [status, setStatus] = useState<Status>('Wishlist');
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
      // Parse salary details from pay string if hourly or monthly
      let salaryPeriod: Application['salaryPeriod'] = 'monthly';
      let salaryMin = 0;
      let salaryMax = 0;

      const trimmedPay = pay.trim();
      if (trimmedPay) {
        if (trimmedPay.toLowerCase().includes('/hr') || trimmedPay.toLowerCase().includes('hr') || trimmedPay.toLowerCase().includes('hour')) {
          salaryPeriod = 'hourly';
        } else if (trimmedPay.toLowerCase().includes('/yr') || trimmedPay.toLowerCase().includes('annual') || trimmedPay.toLowerCase().includes('thn')) {
          salaryPeriod = 'annual';
        }

        const digitsMatch = trimmedPay.replace(/[,.]/g, '').match(/\d+/g);
        if (digitsMatch && digitsMatch.length > 0) {
          salaryMin = parseInt(digitsMatch[0], 10) || 0;
          if (digitsMatch.length > 1) {
            salaryMax = parseInt(digitsMatch[1], 10) || 0;
          }
        }
      }

      await onAdd({
        company: company.trim(),
        position: position.trim(),
        link: link.trim() || undefined,
        contactName: contactName.trim() || undefined,
        contact: contact.trim() || undefined,
        location: location.trim() || 'USA',
        type,
        mode,
        pay: trimmedPay || undefined,
        sent: sent.trim() || undefined,
        salaryMin,
        salaryMax,
        salaryPeriod,
        status,
        sentAt: new Date().toISOString().slice(0, 10),
        cvVersion: 'CV-Tech-v1',
        jobSource: link.trim() ? 'Company Website' : 'Direct / Referral',
        applicationMethod: sent.toLowerCase().includes('email') ? 'Email' : 'Manual',
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
      <div className="modal max-w-lg">
        <div className="drawer-head">
          <span className="eyebrow">NEW OPPORTUNITY · SPREADSHEET SCHEMA</span>
          <button onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <h2>Tambah Peluang Karier Baru</h2>
        <p className="muted text-xs mb-4">
          Sesuaikan dengan format 10 kolom Google Spreadsheet Anda (Company, Position, Link, Contact, Location, Type, Mode, Pay, Sent).
        </p>

        <form onSubmit={handleSave} className="space-y-3.5">
          {/* Row 1: Company & Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Company *
              <input
                autoFocus
                autoComplete="organization"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Contoh: Apple, Microsoft"
                required
                className="mt-1 block w-full px-3 py-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
              />
            </label>

            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Position *
              <input
                autoComplete="organization-title"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Contoh: Engineer, Data Analyst"
                required
                className="mt-1 block w-full px-3 py-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
              />
            </label>
          </div>

          {/* Row 2: Link */}
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
            Link (Job URL / Website)
            <div className="relative mt-1">
              <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 select-none pointer-events-none" />
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Contoh: www.apple.com atau https://jobs.apple.com"
                className="w-full pl-10 pr-3 py-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 font-mono"
              />
            </div>
          </label>

          {/* Row 3: Name of Contact & Email/Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Name of Contact
              <div className="relative mt-1">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 select-none pointer-events-none" />
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Contoh: Steve Jobs, Bill Gates"
                  className="w-full pl-10 pr-3 py-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 font-sans"
                />
              </div>
            </label>

            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Email / Phone
              <div className="relative mt-1">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 select-none pointer-events-none" />
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Contoh: steve@apple.com"
                  className="w-full pl-10 pr-3 py-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 font-mono"
                />
              </div>
            </label>
          </div>

          {/* Row 4: Location, Type, Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Location
              <div className="relative mt-1">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 select-none pointer-events-none" />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Contoh: USA, Jakarta"
                  className="w-full pl-10 pr-3 py-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 font-sans"
                />
              </div>
            </label>

            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Type
              <select
                value={type}
                onChange={(e) => setType(e.target.value as Application['type'])}
                className="mt-1 block w-full px-2.5 py-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="In-house">In-house</option>
                <option value="Vendor / Outsource">Vendor / Outsource</option>
              </select>
            </label>

            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Mode
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as Application['mode'])}
                className="mt-1 block w-full px-2.5 py-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
              >
                <option value="Remote">Remote</option>
                <option value="In-person">In-person</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </label>
          </div>

          {/* Row 5: Pay & Sent */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Pay (Kompensasi / Rate)
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-500 font-mono select-none pointer-events-none">
                  Rp
                </span>
                <input
                  value={pay}
                  onChange={(e) => setPay(e.target.value)}
                  placeholder="Contoh: 135/hr atau 15.000.000"
                  className="w-full pl-11 pr-3 py-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 font-mono"
                />
              </div>
            </label>

            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Sent (Materi Lamaran Terkirim)
              <div className="relative mt-1">
                <Send size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 select-none pointer-events-none" />
                <input
                  value={sent}
                  onChange={(e) => setSent(e.target.value)}
                  placeholder="Contoh: Email, resume / CV, short vid intro"
                  className="w-full pl-10 pr-3 py-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 font-sans"
                />
              </div>
            </label>
          </div>

          {/* Row 6: Initial Status */}
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
            Status Funnel Awal
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="mt-1 block w-full px-2.5 py-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
            >
              <option value="Wishlist">Wishlist</option>
              <option value="Applied">Applied</option>
              <option value="Viewed">Viewed</option>
              <option value="Screening">Screening</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
            </select>
          </label>

          {error && <p className="auth-error mt-2 text-xs text-rose-600">{error}</p>}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 text-xs font-semibold rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white shadow-2xs transition-colors inline-flex items-center gap-1.5"
            >
              {busy ? 'Menyimpan...' : 'Simpan Peluang'}
              {!busy && <ArrowUpRight size={14} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
