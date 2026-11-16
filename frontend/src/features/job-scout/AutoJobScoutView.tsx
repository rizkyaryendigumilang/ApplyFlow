import { useState, useMemo } from 'react';
import {
  Compass,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  Bookmark,
  Sparkles,
  Zap,
  Building2,
  MapPin,
  Briefcase,
  Layers,
  ArrowUpRight,
  Plus,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useCandidateProfile } from '../../hooks/useCandidateProfile';
import { idr } from '../../lib/utils';
import type { ApplicationDraft } from '../../lib/pb-types';
import {
  CURATED_TECH_VACANCIES,
  buildJobstreetSearchUrl,
  buildLinkedInSearchUrl,
  buildGlintsSearchUrl,
  parseJobUrlHeuristics,
  calculateScoutFitScore,
  type JobPlatform,
  type ScoutVacancy,
} from '../../lib/job-scout-engine';
import { EmptyState } from '../../components/ui/EmptyState';

interface AutoJobScoutViewProps {
  onAddApplication: (draft: ApplicationDraft) => Promise<unknown>;
  onNavigateToTracker?: () => void;
}

export function AutoJobScoutView({
  onAddApplication,
  onNavigateToTracker,
}: AutoJobScoutViewProps) {
  const { profile } = useCandidateProfile();

  // Filter State
  const defaultRole = profile.targetRoles?.[0] || 'Technical Consultant Analyst';
  const [selectedRole, setSelectedRole] = useState<string>(defaultRole);
  const [customQuery, setCustomQuery] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<JobPlatform | 'All'>('Jobstreet');
  const [selectedLocation, setSelectedLocation] = useState<string>('Jakarta');
  const [selectedMode, setSelectedMode] = useState<'All' | 'Remote' | 'Hybrid' | 'On-site'>('All');

  // Quick URL Ingestion State
  const [pasteUrl, setPasteUrl] = useState<string>('');
  const [quickPasteStatus, setQuickPasteStatus] = useState<string | null>(null);

  // Saved Application IDs Tracker
  const [savedVacancyIds, setSavedVacancyIds] = useState<Record<string, boolean>>({});
  const [savingVacancyId, setSavingVacancyId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Active query to run
  const activeQuery = customQuery.trim() || selectedRole;

  // Compute live search URL for currently selected platform
  const liveSearchUrl = useMemo(() => {
    if (selectedPlatform === 'Jobstreet' || selectedPlatform === 'All') {
      return buildJobstreetSearchUrl(activeQuery, selectedLocation, selectedMode === 'Remote' ? 'remote' : undefined);
    }
    if (selectedPlatform === 'LinkedIn') {
      return buildLinkedInSearchUrl(activeQuery, selectedLocation, selectedMode === 'Remote' ? 'remote' : selectedMode === 'Hybrid' ? 'hybrid' : undefined);
    }
    if (selectedPlatform === 'Glints') {
      return buildGlintsSearchUrl(activeQuery, selectedLocation);
    }
    return buildJobstreetSearchUrl(activeQuery, selectedLocation);
  }, [activeQuery, selectedLocation, selectedMode, selectedPlatform]);

  // Filter vacancies
  const filteredVacancies = useMemo(() => {
    return CURATED_TECH_VACANCIES.filter((v) => {
      // Platform filter
      if (selectedPlatform !== 'All' && v.platform !== selectedPlatform) {
        return false;
      }
      // Mode filter
      if (selectedMode !== 'All' && v.workMode !== selectedMode) {
        return false;
      }
      // Role filter if custom query is provided
      if (customQuery.trim()) {
        const q = customQuery.toLowerCase();
        const matchesTitle = v.title.toLowerCase().includes(q);
        const matchesSkills = v.skills.some((s) => s.toLowerCase().includes(q));
        const matchesDesc = v.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSkills && !matchesDesc) {
          return false;
        }
      }
      return true;
    }).map((v) => {
      const fit = calculateScoutFitScore(v, profile);
      return { ...v, fit };
    }).sort((a, b) => b.fit.score - a.fit.score);
  }, [selectedPlatform, selectedMode, customQuery, profile]);

  // Handle 1-click pipeline save
  const handleSaveToPipeline = async (v: ScoutVacancy) => {
    if (savedVacancyIds[v.id]) return;
    setSavingVacancyId(v.id);

    try {
      const draft: ApplicationDraft = {
        company: v.company,
        position: v.title,
        link: v.url,
        location: v.location,
        type: 'In-house',
        mode: v.workMode,
        status: 'Wishlist',
        salaryMin: v.salaryMin,
        salaryMax: v.salaryMax,
        salaryPeriod: 'monthly',
        pay: `${idr(v.salaryMin)} - ${idr(v.salaryMax)}`,
        sentAt: new Date().toISOString().slice(0, 10),
        cvVersion: 'CV-Master-v1',
        jobSource: v.platform === 'Jobstreet' ? 'JobStreet' : v.platform === 'LinkedIn' ? 'LinkedIn' : 'Other',
        applicationMethod: 'Portal / ATS',
        notes: `Ditemukan via Auto Job Scout (${v.platform}). Cocok dengan keahlian: ${v.skills.slice(0, 3).join(', ')}.`,
      };

      await onAddApplication(draft);
      setSavedVacancyIds((prev) => ({ ...prev, [v.id]: true }));
      setNotification(`Lowongan ${v.company} (${v.title}) berhasil disimpan ke Pipeline.`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error(err);
      setNotification('Gagal menyimpan lowongan. Silakan coba lagi.');
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setSavingVacancyId(null);
    }
  };

  // Handle quick link ingestion
  const handleQuickPaste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteUrl.trim()) return;

    const parsed = parseJobUrlHeuristics(pasteUrl);
    if (!parsed.isValid) {
      setQuickPasteStatus('Format URL tidak valid. Masukkan link lowongan web (https://...).');
      return;
    }

    try {
      const draft: ApplicationDraft = {
        company: parsed.suggestedCompany || `${parsed.platform} Opportunity`,
        position: parsed.suggestedTitle || activeQuery,
        link: pasteUrl.trim(),
        location: selectedLocation,
        type: 'In-house',
        mode: selectedMode === 'All' ? 'Hybrid' : selectedMode,
        status: 'Wishlist',
        salaryMin: profile.minSalary || 12000000,
        salaryMax: (profile.minSalary || 12000000) * 1.5,
        salaryPeriod: 'monthly',
        pay: `${idr(profile.minSalary || 12000000)} / bln`,
        sentAt: new Date().toISOString().slice(0, 10),
        cvVersion: 'CV-Master-v1',
        jobSource: parsed.platform === 'Jobstreet' ? 'JobStreet' : parsed.platform === 'LinkedIn' ? 'LinkedIn' : 'Other',
        applicationMethod: 'Portal / ATS',
        notes: `Tautan cepat ditambahkan via Auto Job Scout dari ${parsed.platform}.`,
      };

      await onAddApplication(draft);
      setPasteUrl('');
      setQuickPasteStatus(null);
      setNotification(`Tautan ${parsed.platform} berhasil disimpan langsung ke Pipeline.`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error(err);
      setQuickPasteStatus('Gagal menyimpan tautan cepat ke database.');
    }
  };

  const highMatchCount = filteredVacancies.filter((v) => v.fit.isHighMatch).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200/90 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
              <Compass size={18} />
            </span>
            <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Auto Job Scout
            </h1>
            <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[10px] uppercase font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Multi-Platform Vacancy Radar
            </span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            Cari puluhan lowongan kerja di Jobstreet, LinkedIn, dan Glints sekaligus tanpa repot mengisi formulir manual.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToTracker && (
            <button
              onClick={onNavigateToTracker}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            >
              <Bookmark size={13} /> Buka Pipeline Pelacak
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs text-emerald-600 hover:text-emerald-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-md p-4 shadow-2xs hover:shadow-xs transition-shadow dark:border-zinc-800 dark:bg-zinc-900/80">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">
            Total Lowongan di Radar
          </span>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono tabular-nums tracking-tight">
            {filteredVacancies.length}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Aktif siap dilamar di platform
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-md p-4 shadow-2xs hover:shadow-xs transition-shadow dark:border-zinc-800 dark:bg-zinc-900/80">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
            Kecocokan Tinggi (&gt;= 80%)
          </span>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono tabular-nums tracking-tight">
            {highMatchCount}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Sesuai profil teknis & batas gaji
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-md p-4 shadow-2xs hover:shadow-xs transition-shadow dark:border-zinc-800 dark:bg-zinc-900/80">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">
            Tersimpan ke Pipeline
          </span>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono tabular-nums tracking-tight">
            {Object.keys(savedVacancyIds).length}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Siap dipantau proses seleksinya
          </span>
        </div>
      </div>

      {/* Control Box: Target Role, Platform, Location, and Live Launch */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-md p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/80 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            Pilih Target Posisi dari Profil Anda:
          </label>
          <div className="flex flex-wrap gap-2">
            {(profile.targetRoles || ['Technical Consultant Analyst', 'DevOps', 'Data Engineer']).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => {
                  setSelectedRole(role);
                  setCustomQuery('');
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.975] border",
                  selectedRole === role && !customQuery
                    ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 font-semibold shadow-2xs"
                    : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                )}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Bar Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          {/* Custom Search Query */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              Kata Kunci Kustom
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Contoh: APM Dynatrace, SRE..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
              />
            </div>
          </div>

          {/* Platform Selector */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              Platform Target
            </label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value as JobPlatform | 'All')}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
            >
              <option value="Jobstreet">Jobstreet Indonesia</option>
              <option value="LinkedIn">LinkedIn Jobs</option>
              <option value="Glints">Glints Indonesia</option>
              <option value="All">Semua Platform</option>
            </select>
          </div>

          {/* Location Selector */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              Lokasi Domisili
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
            >
              <option value="Jakarta">Jakarta (Jabodetabek)</option>
              <option value="Bandung">Bandung</option>
              <option value="Surabaya">Surabaya</option>
              <option value="Indonesia">Seluruh Indonesia</option>
            </select>
          </div>

          {/* Work Mode */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              Mode Kerja
            </label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as 'All' | 'Remote' | 'Hybrid' | 'On-site')}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
            >
              <option value="All">Semua Mode</option>
              <option value="Remote">Hanya Remote</option>
              <option value="Hybrid">Hanya Hybrid</option>
              <option value="On-site">On-site</option>
            </select>
          </div>
        </div>

        {/* Live Search Launcher Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Mencari: <b className="text-zinc-800 dark:text-zinc-200">{activeQuery}</b> di{' '}
            <b className="text-zinc-800 dark:text-zinc-200">{selectedLocation}</b> ({selectedPlatform})
          </div>

          <a
            href={liveSearchUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-zinc-800 active:scale-[0.975] transition-all dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <span>Buka Pencarian Live di {selectedPlatform === 'All' ? 'Jobstreet' : selectedPlatform}</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Quick Paste URL Bar */}
      <form onSubmit={handleQuickPaste} className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 backdrop-blur-md p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
          Punya Link Lowongan Spesifik? Tempel Langsung di Sini:
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={pasteUrl}
            onChange={(e) => setPasteUrl(e.target.value)}
            placeholder="Contoh: https://id.jobstreet.com/job/78912345 atau link LinkedIn..."
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 font-mono"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 shadow-2xs hover:bg-zinc-100 active:scale-[0.975] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-all"
          >
            <Zap size={14} className="text-amber-500" />
            <span>Ekstrak & Simpan Cepat</span>
          </button>
        </div>
        {quickPasteStatus && (
          <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
            {quickPasteStatus}
          </p>
        )}
      </form>

      {/* Vacancy Radar Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Daftar Lowongan Terfilter ({filteredVacancies.length})
          </h2>
          <span className="text-xs text-zinc-400">
            Diurutkan berdasarkan kecocokan profil
          </span>
        </div>

        {filteredVacancies.length === 0 ? (
          <EmptyState
            title="Tidak Ada Lowongan yang Sesuai Filter"
            description="Coba ubah kata kunci pencarian, ganti opsi platform, atau perluas preferensi mode kerja."
            actionLabel="Reset Filter Pencarian"
            onAction={() => {
              setCustomQuery('');
              setSelectedPlatform('All');
              setSelectedMode('All');
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVacancies.map((v) => {
              const isSaved = !!savedVacancyIds[v.id];
              const isSaving = savingVacancyId === v.id;

              return (
                <div
                  key={v.id}
                  className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-150 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Platform & Fit Score */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold uppercase border backdrop-blur-sm",
                            v.platform === 'Jobstreet'
                              ? "bg-violet-50/80 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800"
                              : v.platform === 'LinkedIn'
                              ? "bg-sky-50/80 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800"
                              : "bg-amber-50/80 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                          )}
                        >
                          {v.platform}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono tabular-nums">
                          {v.postedDate}
                        </span>
                      </div>

                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border tabular-nums",
                          v.fit.isHighMatch
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                            : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                        )}
                      >
                        {v.fit.score}% Match
                      </span>
                    </div>

                    {/* Title & Company */}
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                        {v.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {v.company}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={11} className="text-zinc-400" />
                          {v.location}
                        </span>
                        <span>•</span>
                        <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono">
                          {v.workMode}
                        </span>
                      </div>
                    </div>

                    {/* Salary Range */}
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
                      {idr(v.salaryMin)} - {idr(v.salaryMax)} <span className="text-[10px] font-normal text-zinc-400 font-sans">/ bulan</span>
                    </div>

                    {/* Description Snippet */}
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {v.description}
                    </p>

                    {/* Skills Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {v.skills.map((skill) => {
                        const isMatched = v.fit.matchedSkills.includes(skill.toLowerCase());
                        return (
                          <span
                            key={skill}
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-md font-mono border",
                              isMatched
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-semibold"
                                : "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:border-zinc-700"
                            )}
                          >
                            {skill}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card Actions Bottom */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 active:scale-[0.975] transition-all"
                    >
                      <span>Buka & Lamar</span>
                      <ArrowUpRight size={13} />
                    </a>

                    <button
                      type="button"
                      disabled={isSaved || isSaving}
                      onClick={() => handleSaveToPipeline(v)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs active:scale-[0.975]",
                        isSaved
                          ? "bg-zinc-100 text-zinc-400 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700 cursor-default"
                          : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                      )}
                    >
                      {isSaved ? (
                        <>
                          <CheckCircle2 size={13} className="text-emerald-500" />
                          <span>Tersimpan di Pipeline</span>
                        </>
                      ) : (
                        <>
                          <Plus size={13} />
                          <span>{isSaving ? 'Menyimpan...' : '+ Simpan ke Pipeline'}</span>
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
