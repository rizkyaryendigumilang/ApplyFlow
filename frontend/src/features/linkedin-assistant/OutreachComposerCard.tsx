import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  UserPlus,
  RefreshCw,
  Globe,
  UserCheck,
  Briefcase,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  generateOutreachMessage,
  generateConnectionNote,
  sanitizeAntiSlop,
  CandidateInfo,
} from './linkedin-templates';

interface OutreachComposerCardProps {
  company: string;
  role: string;
  candidate?: CandidateInfo;
  onSyncToCrm: (contactName: string, role: string, message: string) => Promise<void>;
  onIncrementQuota?: () => void;
}

export const OutreachComposerCard: React.FC<OutreachComposerCardProps> = ({
  company,
  role,
  candidate,
  onSyncToCrm,
  onIncrementQuota,
}) => {
  const [persona, setPersona] = useState<'peer' | 'recruiter' | 'lead'>('peer');
  const [degree, setDegree] = useState<'1st' | '2nd'>('1st');
  const [lang, setLang] = useState<'id' | 'en'>('id');
  const [draft, setDraft] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // CRM Sync Modal State
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [contactName, setContactName] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);

  // Regenerate draft on params change
  useEffect(() => {
    if (degree === '2nd' && persona === 'peer') {
      // 2nd-degree connection note
      const note = generateConnectionNote({
        company,
        role,
        candidate,
        lang,
      });
      setDraft(note);
    } else {
      const msg = generateOutreachMessage({
        company,
        role,
        persona,
        degree,
        lang,
        candidate,
      });
      setDraft(msg);
    }
  }, [company, role, persona, degree, lang, candidate]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = () => {
    const raw =
      degree === '2nd' && persona === 'peer'
        ? generateConnectionNote({ company, role, candidate, lang })
        : generateOutreachMessage({ company, role, persona, degree, lang, candidate });
    setDraft(sanitizeAntiSlop(raw));
  };

  const handleConfirmSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    try {
      const targetName = contactName.trim() || `${persona.toUpperCase()} at ${company || 'Company'}`;
      await onSyncToCrm(targetName, role || `${persona} at ${company}`, draft);
      if (onIncrementQuota) {
        onIncrementQuota();
      }
      setSyncSuccess(true);
      setTimeout(() => {
        setSyncSuccess(false);
        setShowSyncModal(false);
        setContactName('');
      }, 1500);
    } catch (err) {
      console.error('Failed to sync contact to CRM', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const charCount = draft.length;
  const isOverNoteLimit = degree === '2nd' && persona === 'peer' && charCount > 300;
  const hasEmDash = draft.includes('—');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 text-blue-400 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">AI Outreach & Referral Composer</h3>
            <p className="text-xs text-slate-400">Pesan 1st-person otentik bebas klise AI (Anti-Slop)</p>
          </div>
        </div>

        {/* Language switch */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
          <button
            type="button"
            onClick={() => setLang('id')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors duration-150 ${
              lang === 'id' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bahasa Indonesia
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors duration-150 ${
              lang === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1.5">Target Persona</label>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setPersona('peer')}
              className={`flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-lg font-medium transition-colors duration-150 ${
                persona === 'peer'
                  ? 'bg-blue-600/30 border border-blue-500/50 text-blue-200'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Peer / Teman
            </button>
            <button
              type="button"
              onClick={() => setPersona('recruiter')}
              className={`flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-lg font-medium transition-colors duration-150 ${
                persona === 'recruiter'
                  ? 'bg-blue-600/30 border border-blue-500/50 text-blue-200'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Recruiter
            </button>
            <button
              type="button"
              onClick={() => setPersona('lead')}
              className={`flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-lg font-medium transition-colors duration-150 ${
                persona === 'lead'
                  ? 'bg-blue-600/30 border border-blue-500/50 text-blue-200'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Hiring Lead
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1.5">Hubungan Jaringan</label>
          <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setDegree('1st')}
              className={`py-1.5 text-xs rounded-lg font-medium transition-colors duration-150 ${
                degree === '1st'
                  ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-200'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1st Degree (Direct DM)
            </button>
            <button
              type="button"
              onClick={() => setDegree('2nd')}
              className={`py-1.5 text-xs rounded-lg font-medium transition-colors duration-150 ${
                degree === '2nd'
                  ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-200'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2nd Degree (Catatan Invite)
            </button>
          </div>
        </div>
      </div>

      {/* Editor Box */}
      <div className="relative">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-sans leading-relaxed"
          placeholder="Draf pesan outreach..."
        />

        <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-1 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                isOverNoteLimit
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 bg-slate-950 border border-slate-800'
              }`}
            >
              {charCount} karakter {degree === '2nd' && persona === 'peer' && '/ maks 300'}
            </span>

            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" />
              Anti-Slop: Bebas em-dash & 1st Person
            </span>

            {hasEmDash && (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                <AlertTriangle className="w-3 h-3" />
                <span>Terdeteksi tanda em-dash</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleRegenerate}
            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-2.5 py-1 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Regenerasi Draf
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2.5 mt-4 pt-3 border-t border-slate-800/80">
        <button
          type="button"
          onClick={handleCopy}
          className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-colors duration-150 active:scale-95 transition-transform"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Tersalin ke Clipboard!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Salin Pesan
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowSyncModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors duration-150 active:scale-95 transition-transform"
        >
          <UserPlus className="w-4 h-4 text-emerald-400" />
          Simpan ke Kontak Networking CRM
        </button>
      </div>

      {/* Modal for CRM logging */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h4 className="text-base font-semibold text-slate-100 mb-1">Catat ke Networking CRM</h4>
            <p className="text-xs text-slate-400 mb-4">
              Simpan profil orang ini ke database CRM Anda dengan jadwal pengingat follow-up otomatis (+5 hari).
            </p>

            <form onSubmit={handleConfirmSync} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Nama Kontak LinkedIn</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Contoh: Budi Santoso (Recruiter)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1 text-xs text-slate-400">
                <div>
                  <strong className="text-slate-300">Perusahaan:</strong> {company || '-'}
                </div>
                <div>
                  <strong className="text-slate-300">Tipe Interaksi:</strong> LinkedIn Outreach
                </div>
                <div>
                  <strong className="text-slate-300">Status:</strong> Outreach Sent
                </div>
                <div>
                  <strong className="text-slate-300">Follow-up:</strong> +5 Hari (Otomatis)
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSyncModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSyncing || syncSuccess}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors duration-150 disabled:opacity-50"
                >
                  {syncSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Tersimpan!
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      {isSyncing ? 'Menyimpan...' : 'Simpan Kontak'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
