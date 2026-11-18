import React, { useState } from 'react';
import {
  X,
  Plus,
  Link2,
  Calendar,
  ChevronDown,
  RefreshCw,
  User,
  MapPin,
  List,
  Quote,
  Paperclip,
  Sparkles,
} from 'lucide-react';
import type { Application, ApplicationDraft, Status } from '../../lib/pb-types';
import { cn } from '../../lib/utils';

export interface AddOpportunityModalProps {
  onClose: () => void;
  onAdd: (a: ApplicationDraft) => Promise<Application | void>;
}

export const AddOpportunityModal: React.FC<AddOpportunityModalProps> = ({ onClose, onAdd }) => {
  const [position, setPosition] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('Jakarta / Remote');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<'Urgent' | 'High' | 'Medium' | 'Low'>('High');
  const [dueDate, setDueDate] = useState(() => {
    // Default to 7 days from now
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [status, setStatus] = useState<Status>('Wishlist');
  const [type, setType] = useState<Application['type']>('Full-time');
  const [mode, setMode] = useState<Application['mode']>('Remote');
  const [pay, setPay] = useState('');
  const [link, setLink] = useState('');
  const [contactName, setContactName] = useState('');
  const [contact, setContact] = useState('');
  const [createMore, setCreateMore] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  // Helper to insert markdown formatting in notes textarea
  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    const textarea = document.getElementById('work-item-notes') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const selectedText = notes.substring(start, end);
    const replacement = `${prefix}${selectedText || 'teks'}${suffix}`;
    const newNotes = notes.substring(0, start) + replacement + notes.substring(end);
    setNotes(newNotes);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText.length || 4));
    }, 0);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!company.trim() || !position.trim()) {
      setError('Harap isi judul posisi pekerjaan dan nama perusahaan.');
      return;
    }
    setError('');
    setBusy(true);

    try {
      let salaryPeriod: Application['salaryPeriod'] = 'monthly';
      let salaryMin = 0;
      let salaryMax = 0;

      const trimmedPay = pay.trim();
      if (trimmedPay) {
        if (
          trimmedPay.toLowerCase().includes('/hr') ||
          trimmedPay.toLowerCase().includes('hr') ||
          trimmedPay.toLowerCase().includes('hour')
        ) {
          salaryPeriod = 'hourly';
        } else if (
          trimmedPay.toLowerCase().includes('/yr') ||
          trimmedPay.toLowerCase().includes('annual') ||
          trimmedPay.toLowerCase().includes('thn')
        ) {
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
        location: location.trim() || 'Jakarta / Remote',
        notes: notes.trim() || undefined,
        type,
        mode,
        pay: trimmedPay || undefined,
        salaryMin,
        salaryMax,
        salaryPeriod,
        status,
        sentAt: new Date().toISOString().slice(0, 10),
        nextFollowUp: dueDate || undefined,
        cvVersion: 'CV-Tech-v1',
        link: link.trim() || undefined,
        contactName: contactName.trim() || undefined,
        contact: contact.trim() || undefined,
        jobSource: link.trim() ? 'Company Website' : 'Direct / Referral',
        applicationMethod: 'Manual',
      });

      if (createMore) {
        // Reset form for next item
        setPosition('');
        setCompany('');
        setNotes('');
        setPay('');
        setLink('');
        setSuccessToast(true);
        setTimeout(() => setSuccessToast(false), 3000);
      } else {
        onClose();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal menyimpan peluang karier');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md select-none animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Create new work item"
    >
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-[#151518] border border-zinc-200/90 dark:border-white/[0.08] shadow-2xl overflow-hidden animate-scaleUp">
        {/* 1. Header (Exact Cansaas Space Reference) */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
              <Plus size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Create new work item
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Turn your ideas into actionable tasks.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          {successToast && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <Sparkles size={14} className="text-emerald-600" />
              <span>Lowongan berhasil disimpan ke pipeline. Silakan buat entri berikutnya!</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Title Field with Character Counter (0/100) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Title <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                {position.length}/100
              </span>
            </div>
            <input
              type="text"
              autoFocus
              maxLength={100}
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Enter a clear and descriptive title (misal: Senior Frontend Engineer)..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              required
            />
          </div>

          {/* Company & Location (2 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                Company <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Nama Perusahaan (misal: Google, Tokopedia)..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                Location
              </label>
              <div className="relative">
                <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Jakarta, Bandung, Remote..."
                  className="w-full pl-8 pr-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Description / Notes with Embedded Formatting Toolbar */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
              Description
            </label>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
              {/* Rich-Text Toolbar */}
              <div className="flex items-center gap-1 px-3 py-1.5 bg-zinc-50/80 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs">
                <span className="font-medium text-[11px] px-1 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer">
                  Aa ▾
                </span>
                <span className="w-px h-3 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />
                <button
                  type="button"
                  onClick={() => insertFormatting('**')}
                  className="p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-700 font-bold text-xs"
                  title="Bold"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('*')}
                  className="p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-700 italic text-xs font-serif"
                  title="Italic"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('~~')}
                  className="p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-700 line-through text-xs"
                  title="Strikethrough"
                >
                  S
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('[', '](url)')}
                  className="p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-700"
                  title="Link"
                >
                  <Link2 size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('\n- ')}
                  className="p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-700"
                  title="List"
                >
                  <List size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('\n> ')}
                  className="p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-700"
                  title="Quote"
                >
                  <Quote size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('📎 ')}
                  className="p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-700"
                  title="Attachment"
                >
                  <Paperclip size={13} />
                </button>
                <span className="ml-auto text-zinc-400 font-mono text-[10px] cursor-pointer hover:text-zinc-600">
                  ···
                </span>
              </div>
              <textarea
                id="work-item-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add more details about this work item (catatan kualifikasi, deskripsi pekerjaan, dll)..."
                className="w-full px-3.5 py-2.5 text-xs bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Priority & Due Date (2 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                Priority
              </label>
              <div className="relative">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as typeof priority)}
                  className="w-full pl-8 pr-8 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all font-medium cursor-pointer"
                >
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <span
                  className={cn(
                    'w-2.5 h-2.5 rounded-full absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none',
                    priority === 'Urgent'
                      ? 'bg-rose-500 ring-2 ring-rose-500/20'
                      : priority === 'High'
                      ? 'bg-amber-500 ring-2 ring-amber-500/20'
                      : priority === 'Medium'
                      ? 'bg-blue-500 ring-2 ring-blue-500/20'
                      : 'bg-zinc-400'
                  )}
                />
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                Due Date
              </label>
              <div className="relative">
                <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
                />
              </div>
            </div>
          </div>

          {/* Assignee & Cycle / Status (2 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                Assignee
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-xs text-zinc-800 dark:text-zinc-200 font-medium">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                  <User size={11} />
                </div>
                <span className="truncate">Rizky Aryendi</span>
                <span className="ml-auto text-[10px] text-zinc-400 font-mono">Owner</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                Cycle / Status Pipeline
              </label>
              <div className="relative">
                <RefreshCw size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  className="w-full pl-8 pr-8 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all font-medium cursor-pointer"
                >
                  <option value="Wishlist">Wishlist (Rencana)</option>
                  <option value="Applied">Applied (Terkirim)</option>
                  <option value="Viewed">Viewed (Dilihat HR)</option>
                  <option value="Screening">Screening (Panggilan)</option>
                  <option value="Interview">Interview (Wawancara)</option>
                  <option value="Offer">Offer (Penawaran)</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Mode & Salary / Pay (2 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                Mode Kerja
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as Application['mode'])}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Remote">Remote (Kerja dari Mana Saja)</option>
                <option value="Hybrid">Hybrid (Fleksibel Kantor/Rumah)</option>
                <option value="On-site">On-site (Di Kantor Penuh)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                Perkiraan Gaji / Kompensasi
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 font-mono pointer-events-none">
                  Rp
                </span>
                <input
                  type="text"
                  value={pay}
                  onChange={(e) => setPay(e.target.value)}
                  placeholder="15.000.000 atau 135/hr..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Optional Link Lowongan */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
              Link Lowongan (URL / Job Board)
            </label>
            <div className="relative">
              <Link2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://www.linkedin.com/jobs/view/... atau portal karier"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </form>

        {/* 3. Footer (Exact Cansaas Space Reference) */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between">
          {/* Create More Toggle Switch */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setCreateMore(!createMore)}
              className={cn(
                'w-9 h-5 rounded-full transition-colors relative flex-shrink-0 focus:outline-none',
                createMore ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
              )}
              role="switch"
              aria-checked={createMore}
            >
              <span
                className={cn(
                  'w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform duration-200 ease-out',
                  createMore ? 'left-4.5 translate-x-0' : 'left-0.5'
                )}
              />
            </button>
            <span className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
              Create more
            </span>
          </label>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={busy}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 text-xs font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? 'Creating...' : 'Create Work Item'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
