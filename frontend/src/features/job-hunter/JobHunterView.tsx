import { useState, useEffect } from 'react';
import {
  Target,
  SlidersHorizontal,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowUpRight,
  FolderKanban,
  Trash2,
  FileText,
  ExternalLink,
  Sparkles,
  Printer,
  Bookmark,
  Radar,
  Plus,
  Compass,
} from 'lucide-react';
import { useCandidateProfile } from '../../hooks/useCandidateProfile';
import { useJobLeads } from '../../hooks/useJobLeads';
import { evaluateJobFit } from '../../lib/job-hunter';
import { parseJobUrlHeuristics } from '../../lib/job-scout-engine';
import { CandidateProfileModal } from './CandidateProfileModal';
import { AtsResumeFormatterModal } from '../resume-formatter/AtsResumeFormatterModal';
import { WebClipperModal } from './WebClipperModal';
import type { JobLead, ApplicationDraft } from '../../lib/pb-types';
import { EmptyState } from '../../components/ui/EmptyState';
import { cn } from '../../lib/cn';

export interface JobHunterInitialData {
  title?: string;
  company?: string;
  url?: string;
  workMode?: 'Remote' | 'Hybrid' | 'On-site';
  rawJd?: string;
  source?: string;
}

interface JobHunterViewProps {
  onPromoteToApplyFlow: (lead: {
    title: string;
    company: string;
    rawJd: string;
    url?: string;
    source?: string;
  }) => void;
  initialData?: JobHunterInitialData | null;
  onNavigateToJobScout?: () => void;
  onSaveToMainPipeline?: (draft: ApplicationDraft) => Promise<unknown>;
}

export function JobHunterView({
  onPromoteToApplyFlow,
  initialData,
  onNavigateToJobScout,
  onSaveToMainPipeline,
}: JobHunterViewProps) {
  const { profile, saveProfile } = useCandidateProfile();
  const { leads, addLead, updateLeadStatus, deleteLead } = useJobLeads();

  const [activeTab, setActiveTab] = useState<'evaluator' | 'pipeline'>('evaluator');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAtsModalOpen, setIsAtsModalOpen] = useState(false);
  const [isClipperOpen, setIsClipperOpen] = useState(false);
  const [selectedAtsLead, setSelectedAtsLead] = useState<{
    company: string;
    title: string;
    skills?: string[];
    rawJd?: string;
  } | null>(null);

  // Evaluator Form State
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [workMode, setWorkMode] = useState<'Remote' | 'Hybrid' | 'On-site'>('Remote');
  const [rawJd, setRawJd] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSavedToMain, setIsSavedToMain] = useState(false);

  // Evaluation Result State
  const [currentLead, setCurrentLead] = useState<Omit<JobLead, 'id'> | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Synchronize when initialData is passed from Auto Job Scout or Cockpit
  useEffect(() => {
    if (initialData) {
      if (initialData.title) setJobTitle(initialData.title);
      if (initialData.company) setCompany(initialData.company);
      if (initialData.url) setJobUrl(initialData.url);
      if (initialData.workMode) setWorkMode(initialData.workMode);
      if (initialData.rawJd) {
        setRawJd(initialData.rawJd);
        try {
          const effTitle = initialData.title || 'Posisi Terpilih';
          const effCompany = initialData.company || 'Perusahaan Terpilih';
          const { matchScore, evaluation } = evaluateJobFit(initialData.rawJd, effTitle, effCompany, profile);
          const leadData: Omit<JobLead, 'id'> = {
            title: effTitle,
            company: effCompany,
            url: initialData.url,
            workMode: initialData.workMode || 'Remote',
            rawJd: initialData.rawJd,
            source: /jobstreet/i.test(initialData.url || '')
              ? 'jobstreet'
              : /linkedin/i.test(initialData.url || '')
              ? 'linkedin'
              : 'manual',
            matchScore,
            evaluation,
            status: matchScore >= 80 ? 'shortlisted' : 'inbox',
          };
          setCurrentLead(leadData);
          setIsSavedToMain(false);
          setStatusMessage(
            `Data lowongan terisi otomatis dari Radar Lowongan. Skor kecocokan: ${matchScore}% (${evaluation.verdict.replace('_', ' ').toUpperCase()}).`
          );
        } catch (err) {
          console.error(err);
        }
      }
    }
  }, [initialData, profile]);

  // Handle URL change heuristics: automatically populate title or platform
  const handleJobUrlChange = (urlVal: string) => {
    setJobUrl(urlVal);
    const heuristics = parseJobUrlHeuristics(urlVal);
    if (heuristics.isValid && heuristics.suggestedTitle && !jobTitle) {
      setJobTitle(heuristics.suggestedTitle);
    }
  };

  const handleEvaluate = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveTitle = jobTitle.trim() || 'Posisi Terdeteksi';
    const effectiveCompany = company.trim() || (jobUrl ? 'Perusahaan (Via Link)' : 'Perusahaan Menunggu Konfirmasi');

    if (!rawJd.trim()) {
      setStatusMessage('Silakan masukkan Deskripsi Lowongan & Persyaratan (JD) untuk mengevaluasi.');
      return;
    }

    setIsEvaluating(true);
    setStatusMessage(null);
    setIsSavedToMain(false);

    try {
      const { matchScore, evaluation } = evaluateJobFit(rawJd, effectiveTitle, effectiveCompany, profile);
      const leadData: Omit<JobLead, 'id'> = {
        title: effectiveTitle,
        company: effectiveCompany,
        url: jobUrl.trim() || undefined,
        workMode,
        rawJd: rawJd.trim(),
        source: /jobstreet/i.test(jobUrl)
          ? 'jobstreet'
          : /linkedin/i.test(jobUrl)
          ? 'linkedin'
          : 'manual',
        matchScore,
        evaluation,
        status: matchScore >= 80 ? 'shortlisted' : 'inbox',
      };
      setCurrentLead(leadData);
      setStatusMessage(
        `Evaluasi selesai. Skor kesesuaian: ${matchScore}% (${evaluation.verdict
          .replace('_', ' ')
          .toUpperCase()}).`
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSaveToPipeline = async () => {
    if (!currentLead) return;
    await addLead(currentLead);
    setStatusMessage('Lowongan berhasil disimpan ke Lead Pipeline internal.');
  };

  const handleSaveDirectToMainPipeline = async () => {
    if (!currentLead || !onSaveToMainPipeline) return;
    try {
      const draft: ApplicationDraft = {
        company: currentLead.company,
        position: currentLead.title,
        link: currentLead.url,
        location: 'Indonesia',
        type: 'In-house',
        mode: (currentLead.workMode as 'Remote' | 'Hybrid' | 'On-site') || 'Remote',
        status: currentLead.matchScore >= 80 ? 'Applied' : 'Wishlist',
        salaryMin: 0,
        salaryMax: 0,
        salaryPeriod: 'monthly',
        sentAt: new Date().toISOString().slice(0, 10),
        cvVersion: 'CV-Master-v1',
        notes: `Dievaluasi lewat Job Hunter Engine. Skor kesesuaian profil: ${currentLead.matchScore}%.`,
      };
      await onSaveToMainPipeline(draft);
      setIsSavedToMain(true);
      setStatusMessage(`Peluang ${currentLead.title} di ${currentLead.company} berhasil dimasukkan ke Pipeline Pelacak.`);
    } catch (err) {
      console.error(err);
      setStatusMessage('Gagal menyimpan langsung ke Pipeline.');
    }
  };

  const handlePromote = () => {
    if (!currentLead) return;
    onPromoteToApplyFlow({
      title: currentLead.title,
      company: currentLead.company,
      rawJd: currentLead.rawJd,
      url: currentLead.url,
      source: currentLead.source,
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Banner: Candidate Profile Context in Twenty CRM Style */}
      <div className="bg-white dark:bg-[#18181b] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs shadow-2xs">
              <Target size={15} />
            </div>
            <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Job Hunter Engine
            </h1>
            <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60">
              Deterministic Triage
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Target:{' '}
            <b className="text-zinc-800 dark:text-zinc-200">
              {profile.targetRoles.slice(0, 3).join(', ') || 'Unset'}
            </b>{' '}
            · Skills:{' '}
            <span className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
              {profile.skills.slice(0, 5).join(', ')}...
            </span>{' '}
            · Min Base:{' '}
            <b className="text-zinc-800 dark:text-zinc-200 font-mono tabular-nums">
              Rp {(profile.minSalary || 0).toLocaleString('id-ID')}
            </b>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsClipperOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 active:scale-[0.975] transition-all shadow-2xs"
            title="Klip lowongan kerja dari LinkedIn / Jobstreet"
          >
            <Bookmark size={13} />
            <span>Web Clipper</span>
          </button>
          <button
            onClick={() => {
              setSelectedAtsLead(null);
              setIsAtsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 active:scale-[0.975] transition-all shadow-2xs"
          >
            <Printer size={13} />
            <span>ATS Resume</span>
          </button>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 active:scale-[0.975] transition-all shadow-2xs"
          >
            <SlidersHorizontal size={13} />
            <span>Kriteria Target</span>
          </button>
        </div>
      </div>

      {/* Cross-Link Banner: Quick Jump to Auto Job Scout */}
      {onNavigateToJobScout && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              <Radar size={16} />
            </span>
            <div className="text-xs">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                Cari Lowongan Langsung Lintas Platform
              </span>
              <span className="text-zinc-500 dark:text-zinc-400">
                Gunakan Auto Job Scout untuk memindai ratusan lowongan di Jobstreet, LinkedIn, dan Glints secara instan.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToJobScout}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-semibold shadow-2xs active:scale-[0.975] transition-all shrink-0"
          >
            <span>Buka Auto Job Scout</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-zinc-200/80 dark:border-zinc-800/80 gap-6 text-xs font-medium">
        <button
          onClick={() => setActiveTab('evaluator')}
          className={cn(
            "pb-2.5 border-b-2 flex items-center gap-2 transition-all active:scale-[0.98]",
            activeTab === 'evaluator'
              ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          )}
        >
          <Search size={14} />
          <span>Evaluator & Fit Scoring</span>
        </button>
        <button
          onClick={() => setActiveTab('pipeline')}
          className={cn(
            "pb-2.5 border-b-2 flex items-center gap-2 transition-all active:scale-[0.98]",
            activeTab === 'pipeline'
              ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          )}
        >
          <FolderKanban size={14} />
          <span>Lead Pipeline</span>
          <span className="text-[10px] font-mono px-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium tabular-nums">
            {leads.length}
          </span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 text-xs font-medium flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 dark:hover:text-emerald-100 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tab 1: Evaluator */}
      {activeTab === 'evaluator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Form Input */}
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 dark:bg-zinc-900/40 p-5 shadow-2xs dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800 pb-3">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FileText size={16} className="text-zinc-700 dark:text-zinc-300" />
                <span>Input Spesifikasi Lowongan</span>
              </h2>
              <span className="text-[10px] text-zinc-400 font-mono">
                Company opsional jika ada URL
              </span>
            </div>

            {/* Quick Helper Ribbon */}
            <div className="p-3 rounded-xl border border-zinc-200/70 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                Alur Evaluasi Cepat:
              </span>
              <p className="text-[11px] leading-relaxed">
                1. Masukkan tautan atau judul lowongan &bull; 2. Tempel deskripsi pekerjaan (JD) &bull; 3. Klik 'Jalankan Evaluasi' untuk melihat skor kecocokan CV, dealbreaker, dan celah skill.
              </p>
            </div>

            <form onSubmit={handleEvaluate} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Posisi Pekerjaan *
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Contoh: Technical Consultant Analyst"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 font-sans"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Nama Perusahaan <span className="text-zinc-400 font-normal lowercase">(opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Contoh: PT Lintas Media Danawa"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Link Lowongan <span className="text-zinc-400 font-normal lowercase">(opsional)</span>
                  </label>
                  <input
                    type="url"
                    value={jobUrl}
                    onChange={(e) => handleJobUrlChange(e.target.value)}
                    placeholder="https://id.jobstreet.com/job/..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Mode Kerja
                  </label>
                  <select
                    value={workMode}
                    onChange={(e) =>
                      setWorkMode(e.target.value as 'Remote' | 'Hybrid' | 'On-site')
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Deskripsi Lowongan & Persyaratan (JD) *
                </label>
                <textarea
                  rows={8}
                  value={rawJd}
                  onChange={(e) => setRawJd(e.target.value)}
                  placeholder="Tempel tanggung jawab, kualifikasi teknis, atau requirements dari iklan lowongan kerja di sini..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 font-mono leading-relaxed"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isEvaluating}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold shadow-2xs active:scale-[0.975] transition-all"
              >
                <Sparkles size={15} />
                <span>{isEvaluating ? 'Mengevaluasi Kriteria...' : 'Jalankan Evaluasi Deterministik'}</span>
              </button>
            </form>
          </div>

          {/* Result Card */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white dark:bg-[#18181b] p-6 shadow-2xs dark:border-zinc-800 min-h-[460px] flex flex-col justify-between">
            {currentLead && currentLead.evaluation ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                      {currentLead.title}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {currentLead.company} · {currentLead.workMode}
                    </p>
                    {currentLead.url && (
                      <a
                        href={currentLead.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 underline font-mono pt-1"
                      >
                        <span>Buka Tautan Asli</span>
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>

                  <div
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-center border font-mono tabular-nums shrink-0",
                      currentLead.matchScore >= 80
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        : currentLead.matchScore >= 60
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                        : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                    )}
                  >
                    <div className="text-2xl font-bold leading-none">
                      {currentLead.matchScore}%
                    </div>
                    <div className="text-[9px] uppercase tracking-wider mt-1 font-semibold">
                      {currentLead.evaluation.verdict.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                {/* Dealbreaker Alert */}
                {currentLead.evaluation.dealbreakers.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
                    <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <b className="font-semibold">Dealbreaker Terdeteksi:</b> {currentLead.evaluation.dealbreakers.join(', ')}
                    </div>
                  </div>
                )}

                {/* Matched Skills */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    <span>Skill yang Cocok ({currentLead.evaluation.strengths.length})</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {currentLead.evaluation.strengths.map((skill) => (
                      <span
                        key={skill}
                        className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      >
                        {skill}
                      </span>
                    ))}
                    {currentLead.evaluation.strengths.length === 0 && (
                      <span className="text-xs text-zinc-400 italic">
                        Belum ada skill profil yang cocok secara eksplisit.
                      </span>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    <span>Skill Kesenjangan / Gaps ({currentLead.evaluation.missingSkills.length})</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {currentLead.evaluation.missingSkills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                      >
                        {skill}
                      </span>
                    ))}
                    {currentLead.evaluation.missingSkills.length === 0 && (
                      <span className="text-xs text-zinc-400 italic">
                        Tidak ada kekurangan skill esensial yang terdeteksi.
                      </span>
                    )}
                  </div>
                </div>

                {/* Strategy Angle */}
                {currentLead.evaluation.suggestedAngle && (
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-xs space-y-1">
                    <span className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
                      <Lightbulb size={14} className="text-amber-500" />
                      <span>Strategi Pitching & Positioning:</span>
                    </span>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-[11px]">
                      {currentLead.evaluation.suggestedAngle}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center gap-2">
                  <button
                    onClick={handlePromote}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold shadow-2xs active:scale-[0.975] transition-all flex-1 min-w-[150px]"
                  >
                    <ArrowUpRight size={14} />
                    <span>Lamar via ApplyFlow</span>
                  </button>

                  {onSaveToMainPipeline && (
                    <button
                      type="button"
                      disabled={isSavedToMain}
                      onClick={handleSaveDirectToMainPipeline}
                      className={cn(
                        "inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold active:scale-[0.975] transition-all border",
                        isSavedToMain
                          ? "bg-zinc-100 text-zinc-400 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700 cursor-default"
                          : "bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-750 shadow-2xs"
                      )}
                    >
                      {isSavedToMain ? (
                        <>
                          <CheckCircle2 size={13} className="text-emerald-500" />
                          <span>Masuk Pipeline</span>
                        </>
                      ) : (
                        <>
                          <Plus size={13} />
                          <span>+ Simpan ke Pipeline</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAtsLead({
                        company: currentLead.company,
                        title: currentLead.title,
                        skills: currentLead.evaluation?.strengths || [],
                        rawJd: currentLead.rawJd,
                      });
                      setIsAtsModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 text-xs font-medium active:scale-[0.975] transition-all shadow-2xs"
                  >
                    <Printer size={13} />
                    <span>Format ATS</span>
                  </button>

                  <button
                    onClick={handleSaveToPipeline}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 text-xs font-medium active:scale-[0.975] transition-all shadow-2xs"
                  >
                    <span>Simpan ke Lead</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-8 text-zinc-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                  <Target size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Belum Ada Hasil Evaluasi Aktif
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
                    Ketik rincian lowongan di formulir sebelah kiri atau klik tombol evaluasi dari Auto Job Scout untuk melihat analisis kecocokan, dealbreaker, dan strategi pitching.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Leads Pipeline */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="rounded-2xl border border-zinc-200/80 bg-white dark:bg-[#18181b] p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between gap-4 dark:border-zinc-800"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                      {lead.title}
                    </h3>
                    <span
                      className={cn(
                        "text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border tabular-nums shrink-0",
                        lead.matchScore >= 80
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                      )}
                    >
                      {lead.matchScore}%
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {lead.company} · {lead.workMode || 'Remote'}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {lead.evaluation?.strengths.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
                  <select
                    value={lead.status}
                    onChange={(e) =>
                      updateLeadStatus(lead.id, e.target.value as JobLead['status'])
                    }
                    className="text-xs px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                  >
                    <option value="inbox">Inbox</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="promoted_to_apply">Promoted</option>
                    <option value="archived">Archived</option>
                  </select>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        onPromoteToApplyFlow({
                          title: lead.title,
                          company: lead.company,
                          rawJd: lead.rawJd,
                          url: lead.url,
                          source: lead.source,
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold active:scale-[0.975] transition-all"
                    >
                      <span>Lamar</span>
                      <ArrowUpRight size={12} />
                    </button>
                    <button
                      onClick={() => deleteLead(lead.id)}
                      className="p-1 rounded-md text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Hapus lead"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {leads.length === 0 && (
            <EmptyState
              icon={Target}
              title="Pipeline Lead Masih Kosong"
              description="Evaluasi deskripsi lowongan kerja (JD) dari tab Evaluator di atas untuk mendeteksi kecocokan skill dan menyaring dealbreaker otomatis."
              actionLabel="Uji Job Description Baru"
              onAction={() => setActiveTab('evaluator')}
            />
          )}
        </div>
      )}

      {/* Target Candidate Profile Modal */}
      <CandidateProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSave={saveProfile}
      />

      {/* 1-Click Printable ATS Resume Formatter Modal */}
      <AtsResumeFormatterModal
        isOpen={isAtsModalOpen}
        onClose={() => setIsAtsModalOpen(false)}
        profile={profile}
        targetJobPosting={selectedAtsLead}
      />

      {/* 1-Click Job Portal Web-Clipper Modal */}
      <WebClipperModal
        isOpen={isClipperOpen}
        onClose={() => setIsClipperOpen(false)}
        onImportLead={async (lead) => {
          await addLead(lead);
        }}
      />
    </div>
  );
}