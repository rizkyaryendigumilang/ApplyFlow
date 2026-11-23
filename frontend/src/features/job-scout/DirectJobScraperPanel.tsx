import React, { useState, useMemo } from 'react';
import {
  Link2,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Trash2,
  Plus,
  Layers,
  Zap,
  Globe,
  Building2,
  Briefcase,
  AlertCircle,
  X,
  Search,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useScrapedJobs, type ScrapedJob } from '../../hooks/useScrapedJobs';
import { parseBatchJobUrls, type JobPlatform } from '../../lib/job-scout-engine';
import type { ApplicationDraft } from '../../lib/pb-types';

interface DirectJobScraperPanelProps {
  onSaveToPipeline: (draft: ApplicationDraft) => Promise<unknown>;
  className?: string;
}

export function DirectJobScraperPanel({ onSaveToPipeline, className }: DirectJobScraperPanelProps) {
  const {
    scrapedJobs,
    addSingleJob,
    addBatchJobs,
    removeJob,
    markAsSaved,
    clearAllJobs,
  } = useScrapedJobs();

  // Mode Tab: 'single' vs 'batch'
  const [inputMode, setInputMode] = useState<'single' | 'batch'>('single');

  // Single Link Inputs
  const [singleUrl, setSingleUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customCompany, setCustomCompany] = useState('');

  // Batch Links Input
  const [batchText, setBatchText] = useState('');

  // UI States
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Live count of detectable valid URLs in batch mode
  const detectedBatchCount = useMemo(() => {
    if (!batchText.trim()) return 0;
    return parseBatchJobUrls(batchText).length;
  }, [batchText]);

  // Handle single link submission
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleUrl.trim()) return;

    const added = addSingleJob(singleUrl, customTitle, customCompany);
    if (added) {
      setSingleUrl('');
      setCustomTitle('');
      setCustomCompany('');
      setFeedbackMsg({
        text: `Lowongan di ${added.company} (${added.title}) berhasil ditambahkan ke daftar link.`,
        type: 'success',
      });
    } else {
      setFeedbackMsg({
        text: 'Tautan sudah ada di dalam daftar atau format URL tidak valid.',
        type: 'info',
      });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Handle batch links submission
  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchText.trim()) return;

    const added = addBatchJobs(batchText);
    if (added.length > 0) {
      setBatchText('');
      setFeedbackMsg({
        text: `${added.length} tautan lowongan baru berhasil diekstrak dan ditambahkan ke daftar.`,
        type: 'success',
      });
    } else {
      setFeedbackMsg({
        text: 'Tidak ada tautan baru yang ditemukan atau semua tautan sudah ada di daftar.',
        type: 'info',
      });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Copy URL to clipboard with visual feedback
  const handleCopyLink = async (job: ScrapedJob) => {
    try {
      await navigator.clipboard.writeText(job.url);
      setCopiedId(job.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // Fallback
      setCopiedId(null);
    }
  };

  // 1-Click Save to Pipeline
  const handleSavePipeline = async (job: ScrapedJob) => {
    if (job.isSavedToPipeline || savingId === job.id) return;
    setSavingId(job.id);

    try {
      const getJobSource = (p: JobPlatform): 'JobStreet' | 'LinkedIn' | 'Company Website' | 'Other' => {
        if (p === 'Jobstreet') return 'JobStreet';
        if (p === 'LinkedIn') return 'LinkedIn';
        if (p === 'Greenhouse' || p === 'Lever' || p === 'Workday') return 'Company Website';
        return 'Other';
      };

      const draft: ApplicationDraft = {
        company: job.company,
        position: job.title,
        link: job.url,
        location: 'Indonesia',
        type: 'In-house',
        mode: 'Hybrid',
        status: 'Wishlist',
        salaryMin: 12000000,
        salaryMax: 20000000,
        salaryPeriod: 'monthly',
        pay: 'Rp 12.000.000 - Rp 20.000.000',
        sentAt: new Date().toISOString().slice(0, 10),
        cvVersion: 'CV-Master-v1',
        jobSource: getJobSource(job.platform),
        applicationMethod: 'Portal / ATS',
        notes: `Ditambahkan via Loker Scraper (${job.platform}). URL resmi: ${job.url}`,
      };

      await onSaveToPipeline(draft);
      markAsSaved(job.id);
      setFeedbackMsg({
        text: `${job.company} (${job.title}) berhasil disimpan ke Pipeline Pelacak.`,
        type: 'success',
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      console.error(err);
      setFeedbackMsg({
        text: 'Gagal menyimpan ke pipeline. Silakan coba kembali.',
        type: 'error',
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } finally {
      setSavingId(null);
    }
  };

  // Filtered jobs in the display list
  const filteredJobs = useMemo(() => {
    if (!searchFilter.trim()) return scrapedJobs;
    const q = searchFilter.toLowerCase();
    return scrapedJobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.platform.toLowerCase().includes(q) ||
        j.domain.toLowerCase().includes(q)
    );
  }, [scrapedJobs, searchFilter]);

  // Platform badge colors
  const getPlatformBadge = (platform: JobPlatform) => {
    switch (platform) {
      case 'Jobstreet':
        return 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/80';
      case 'LinkedIn':
        return 'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/80';
      case 'Glints':
        return 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/80';
      case 'Kalibrr':
        return 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/80';
      case 'Indeed':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/80';
      case 'Dealls':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80';
      case 'Greenhouse':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-700';
      case 'Lever':
        return 'bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/80';
      case 'Workday':
        return 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/80';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Smart Ingestion Box */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white/95 p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/90 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                <Link2 size={16} />
              </span>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Loker Scraper: Pengumpul Link Lowongan Mandiri
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Kumpulkan link lowongan dari portal karier apa pun. 1-klik buka halaman resmi, salin link, atau simpan ke pipeline pelacak.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setInputMode('single')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all',
                inputMode === 'single'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              )}
            >
              <Zap size={13} className={inputMode === 'single' ? 'text-amber-500' : ''} />
              <span>Tempel Cepat (1 Link)</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('batch')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all',
                inputMode === 'batch'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              )}
            >
              <Layers size={13} className={inputMode === 'batch' ? 'text-blue-500' : ''} />
              <span>Tempel Massal (Batch)</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedbackMsg && (
          <div
            className={cn(
              'mt-3.5 p-3 rounded-xl text-xs font-medium border flex items-center justify-between transition-all animate-in fade-in',
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800/60'
                : feedbackMsg.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800/60'
                : 'bg-zinc-50 text-zinc-800 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-200 dark:border-zinc-700'
            )}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>{feedbackMsg.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMsg(null)}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 rounded"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Form Mode 1: Single Link */}
        {inputMode === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-semibold">
                Tautan Lowongan Resmi (URL)
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={singleUrl}
                  onChange={(e) => setSingleUrl(e.target.value)}
                  placeholder="https://id.jobstreet.com/job/... atau https://boards.greenhouse.io/perusahaan/jobs/..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 shadow-2xs font-sans"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  Nama Posisi (Opsional, Otomatis Diekstrak)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Contoh: Technical Consultant Analyst"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  Nama Perusahaan (Opsional, Otomatis Diekstrak)
                </label>
                <input
                  type="text"
                  value={customCompany}
                  onChange={(e) => setCustomCompany(e.target.value)}
                  placeholder="Contoh: Bank Central Asia, Tokopedia..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!singleUrl.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 transition-all shadow-2xs disabled:opacity-50 active:scale-[0.98]"
              >
                <Plus size={14} />
                <span>Tambahkan ke Koleksi Link</span>
              </button>
            </div>
          </form>
        ) : (
          /* Form Mode 2: Batch Multi-Link */
          <form onSubmit={handleBatchSubmit} className="mt-4 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                  Tempel Kumpulan Link Sekaligus
                </label>
                <span className="text-[11px] font-mono font-medium text-zinc-500 dark:text-zinc-400">
                  Terdeteksi:{' '}
                  <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{detectedBatchCount}</strong> link
                  valid
                </span>
              </div>
              <textarea
                rows={4}
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder="Tempel beberapa link lowongan di sini (1 link per baris atau teks WhatsApp/LinkedIn campuran)..."
                className="w-full p-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 shadow-2xs font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Sistem otomatis membersihkan parameter pelacak dan mengabaikan link duplikat.
              </span>
              <button
                type="submit"
                disabled={detectedBatchCount === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 transition-all shadow-2xs disabled:opacity-50 active:scale-[0.98]"
              >
                <Layers size={14} />
                <span>Ekstrak & Tambahkan ({detectedBatchCount})</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Scraped Jobs List Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Koleksi Link Lowongan Mandiri</span>
              <span className="text-xs font-normal text-zinc-500 font-mono">({filteredJobs.length})</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {scrapedJobs.length > 3 && (
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Cari dalam koleksi..."
                  className="pl-8 pr-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 w-44 focus:outline-none"
                />
              </div>
            )}

            {scrapedJobs.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Hapus semua koleksi link lowongan yang telah ditempel?')) {
                    clearAllJobs();
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 rounded-md border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                title="Hapus seluruh daftar tautan yang ditempel"
              >
                <Trash2 size={12} />
                <span>Bersihkan Semua</span>
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {filteredJobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400 mb-2.5">
              <Link2 size={18} />
            </div>
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {searchFilter ? 'Tidak ada lowongan yang cocok dengan kata kunci pencarian.' : 'Belum ada link lowongan yang ditempel.'}
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1">
              {searchFilter
                ? 'Coba gunakan kata kunci posisi, perusahaan, atau nama platform yang lain.'
                : 'Salin link lowongan dari LinkedIn, grup chat, atau portal karier perusahaan, lalu tempelkan di kotak atas untuk mengumpulkannya di satu layar.'}
            </p>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredJobs.map((job) => {
              const isCopied = copiedId === job.id;
              const isSaving = savingId === job.id;

              return (
                <div
                  key={job.id}
                  className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-4 shadow-2xs hover:shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Platform & Domain */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={cn(
                            'text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border',
                            getPlatformBadge(job.platform)
                          )}
                        >
                          {job.platform}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 truncate max-w-[150px]">
                          {job.domain}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeJob(job.id)}
                        className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded transition-colors"
                        title="Hapus lowongan dari daftar"
                        aria-label={`Hapus ${job.title}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Job Title & Company */}
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight line-clamp-1">
                      {job.title}
                    </h4>
                    <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mt-0.5 truncate">
                      {job.company}
                    </p>

                    {/* Target URL Preview */}
                    <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 truncate mt-2 bg-zinc-50 dark:bg-zinc-800/60 px-2 py-1 rounded-md border border-zinc-100 dark:border-zinc-800">
                      {job.url}
                    </p>
                  </div>

                  {/* Actions Row */}
                  <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {/* 1-Click Launch External URL */}
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 transition-all shadow-2xs active:scale-[0.98]"
                        title="Buka halaman resmi lowongan di tab baru"
                      >
                        <span>Buka & Lamar</span>
                        <ExternalLink size={12} />
                      </a>

                      {/* Copy Link to Clipboard */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(job)}
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-[0.98]',
                          isCopied
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                        )}
                        title="Salin tautan resmi ke clipboard"
                      >
                        {isCopied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        <span>{isCopied ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>

                    {/* Save to Pipeline Button */}
                    <button
                      type="button"
                      disabled={job.isSavedToPipeline || isSaving}
                      onClick={() => handleSavePipeline(job)}
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                        job.isSavedToPipeline
                          ? 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-default'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80 dark:hover:bg-emerald-950/70 active:scale-[0.98]'
                      )}
                      title={job.isSavedToPipeline ? 'Sudah tersimpan di Pipeline pelacak' : 'Simpan ke Pipeline lamaran'}
                    >
                      {job.isSavedToPipeline ? (
                        <>
                          <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
                          <span>Tersimpan</span>
                        </>
                      ) : (
                        <>
                          <Plus size={12} />
                          <span>{isSaving ? 'Menyimpan...' : '+ Pipeline'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
