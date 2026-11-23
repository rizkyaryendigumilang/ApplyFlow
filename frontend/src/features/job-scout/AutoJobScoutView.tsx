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
  Target,
  HelpCircle,
  X,
  Trash2,
  Globe,
  Share2,
  Link2,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useCandidateProfile } from '../../hooks/useCandidateProfile';
import { useJobPlatforms } from '../../hooks/useJobPlatforms';
import { useScrapedJobs } from '../../hooks/useScrapedJobs';
import { DirectJobScraperPanel } from './DirectJobScraperPanel';
import { idr } from '../../lib/utils';
import type { ApplicationDraft } from '../../lib/pb-types';
import {
  CURATED_TECH_VACANCIES,
  buildJobstreetSearchUrl,
  buildLinkedInSearchUrl,
  buildGlintsSearchUrl,
  buildCustomPlatformSearchUrl,
  parseJobUrlHeuristics,
  calculateScoutFitScore,
  type JobPlatform,
  type JobPlatformPreset,
  type ScoutVacancy,
} from '../../lib/job-scout-engine';
import { EmptyState } from '../../components/ui/EmptyState';

interface AutoJobScoutViewProps {
  onAddApplication: (draft: ApplicationDraft) => Promise<unknown>;
  onNavigateToTracker?: () => void;
  onEvaluateInHunter?: (job: {
    title: string;
    company: string;
    url: string;
    workMode: 'Remote' | 'Hybrid' | 'On-site';
    rawJd: string;
  }) => void;
  onApplyViaApplyFlow?: (job: {
    title: string;
    company: string;
    rawJd: string;
    url?: string;
    source?: string;
  }) => void;
}

export function AutoJobScoutView({
  onAddApplication,
  onNavigateToTracker,
  onEvaluateInHunter,
  onApplyViaApplyFlow,
}: AutoJobScoutViewProps) {
  const { profile } = useCandidateProfile();
  const { platforms, addPlatform, removePlatform } = useJobPlatforms();
  const { scrapedJobs } = useScrapedJobs();

  // Active View Tab: 'radar' | 'scraper'
  const [scoutViewMode, setScoutViewMode] = useState<'radar' | 'scraper'>('radar');

  // Filter State
  const defaultRole = profile.targetRoles?.[0] || 'Technical Consultant Analyst';
  const [selectedRole, setSelectedRole] = useState<string>(defaultRole);
  const [customQuery, setCustomQuery] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<JobPlatform | 'All'>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('Jakarta');
  const [selectedMode, setSelectedMode] = useState<'All' | 'Remote' | 'Hybrid' | 'On-site'>('All');

  // Form State for Adding Custom Platform
  const [isAddingPlatform, setIsAddingPlatform] = useState(false);
  const [newPlatformName, setNewPlatformName] = useState('');
  const [newPlatformUrl, setNewPlatformUrl] = useState('');
  const [newPlatformDesc, setNewPlatformDesc] = useState('');
  const [platformFormError, setPlatformFormError] = useState<string | null>(null);

  // Quick URL Ingestion State
  const [pasteUrl, setPasteUrl] = useState<string>('');
  const [quickPasteStatus, setQuickPasteStatus] = useState<string | null>(null);

  // Saved Application IDs Tracker
  const [savedVacancyIds, setSavedVacancyIds] = useState<Record<string, boolean>>({});
  const [savingVacancyId, setSavingVacancyId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Active query to run
  const activeQuery = customQuery.trim() || selectedRole;

  const handleCreateCustomPlatform = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlatformName.trim() || !newPlatformUrl.trim()) {
      setPlatformFormError('Nama platform dan tautan pencarian wajib diisi.');
      return;
    }
    addPlatform(newPlatformName, newPlatformUrl, newPlatformDesc);
    setNotification(`Platform ${newPlatformName.trim()} berhasil ditambahkan ke radar.`);
    setNewPlatformName('');
    setNewPlatformUrl('');
    setNewPlatformDesc('');
    setIsAddingPlatform(false);
    setPlatformFormError(null);
  };

  const handleLaunchAllPlatforms = () => {
    let openedCount = 0;
    platforms.forEach((p) => {
      const url = buildCustomPlatformSearchUrl(
        p,
        activeQuery,
        selectedLocation,
        selectedMode === 'Remote' ? 'remote' : undefined
      );
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
        openedCount++;
      }
    });
    setNotification(`Berhasil meluncurkan ${openedCount} platform pencarian di tab baru.`);
  };

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

  const handleQuickEvaluate = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!pasteUrl.trim()) {
      setQuickPasteStatus('Masukkan link lowongan terlebih dahulu.');
      return;
    }
    const parsed = parseJobUrlHeuristics(pasteUrl);
    if (!parsed.isValid) {
      setQuickPasteStatus('Format URL tidak valid. Masukkan link lowongan web (https://...).');
      return;
    }
    if (onEvaluateInHunter) {
      onEvaluateInHunter({
        title: parsed.suggestedTitle || activeQuery,
        company: parsed.suggestedCompany || `${parsed.platform} Opportunity`,
        url: pasteUrl.trim(),
        workMode: selectedMode === 'All' ? 'Hybrid' : selectedMode,
        rawJd: `Lowongan terdeteksi dari ${parsed.platform}.\nURL: ${pasteUrl.trim()}\nTarget Posisi: ${activeQuery}\nLokasi: ${selectedLocation}`,
      });
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
            Cari puluhan lowongan kerja di Jobstreet, LinkedIn, dan Glints, atau kumpulkan link lowongan mandiri di satu layar.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
          {/* Main Navigation Tabs */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200/70 dark:border-zinc-700/70">
            <button
              type="button"
              onClick={() => setScoutViewMode('radar')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                scoutViewMode === 'radar'
                  ? "bg-white text-zinc-900 shadow-2xs dark:bg-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              <Compass size={13} className={scoutViewMode === 'radar' ? "text-zinc-900 dark:text-zinc-100" : ""} />
              <span>Radar Multi-Platform</span>
            </button>

            <button
              type="button"
              onClick={() => setScoutViewMode('scraper')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                scoutViewMode === 'scraper'
                  ? "bg-white text-zinc-900 shadow-2xs dark:bg-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              <Link2 size={13} className={scoutViewMode === 'scraper' ? "text-amber-500" : ""} />
              <span>Loker Scraper</span>
              {scrapedJobs.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full font-mono text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                  {scrapedJobs.length}
                </span>
              )}
            </button>
          </div>

          {onNavigateToTracker && (
            <button
              onClick={onNavigateToTracker}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            >
              <Bookmark size={13} /> Buka Pipeline
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
          <button onClick={() => setNotification(null)} className="p-1 text-emerald-700 hover:text-emerald-950 dark:hover:text-emerald-100 transition-colors" aria-label="Tutup notifikasi">
            <X size={14} />
          </button>
        </div>
      )}

      {/* KPI Stats Row */}
      {scoutViewMode === 'scraper' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-md p-4 shadow-2xs hover:shadow-xs transition-shadow dark:border-zinc-800 dark:bg-zinc-900/80">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">
              Total Link di Koleksi
            </span>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono tabular-nums tracking-tight">
              {scrapedJobs.length}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Tautan resmi siap dilamar 1-klik
            </span>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-md p-4 shadow-2xs hover:shadow-xs transition-shadow dark:border-zinc-800 dark:bg-zinc-900/80">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400">
              Antrean Belum Dilamar
            </span>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono tabular-nums tracking-tight">
              {scrapedJobs.filter((j) => !j.isSavedToPipeline).length}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Menunggu dibuka dan disalin
            </span>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-md p-4 shadow-2xs hover:shadow-xs transition-shadow dark:border-zinc-800 dark:bg-zinc-900/80">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
              Tersimpan ke Pipeline
            </span>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono tabular-nums tracking-tight">
              {scrapedJobs.filter((j) => j.isSavedToPipeline).length}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Proses lamaran aktif di Kanban
            </span>
          </div>
        </div>
      ) : (
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
      )}

      {/* Main View Switch: Scraper Panel vs Radar Panel */}
      {scoutViewMode === 'scraper' ? (
        <DirectJobScraperPanel onSaveToPipeline={onAddApplication} />
      ) : (
        <>
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

          {/* Platform Selector for Feed Filtering */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              Filter Feed Radar
            </label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value as JobPlatform | 'All')}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
            >
              <option value="All">Semua Platform Feed</option>
              <option value="Jobstreet">Jobstreet Indonesia</option>
              <option value="LinkedIn">LinkedIn Jobs</option>
              <option value="Glints">Glints Indonesia</option>
              <option value="Indeed">Indeed Indonesia</option>
              <option value="Kalibrr">Kalibrr</option>
              <option value="Dealls">Dealls</option>
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

        {/* Radar Peluncur Multi-Platform Bento Grid */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Radar Peluncur Multi-Platform
                </span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60">
                  {platforms.length} Portal Siap Diluncurkan
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Semua link pencarian terisi otomatis dengan peran <b className="text-zinc-800 dark:text-zinc-200 font-semibold">{activeQuery}</b> di <b className="text-zinc-800 dark:text-zinc-200 font-semibold">{selectedLocation}</b>.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={() => setIsAddingPlatform(!isAddingPlatform)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-2xs active:scale-[0.98]"
              >
                <Plus size={13} />
                <span>+ Tambah Platform Kustom</span>
              </button>

              <button
                type="button"
                onClick={handleLaunchAllPlatforms}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 transition-all shadow-2xs active:scale-[0.98]"
                title="Buka seluruh platform di tab baru sekaligus"
              >
                <Share2 size={13} />
                <span>Buka Semua Platform Sekaligus</span>
              </button>
            </div>
          </div>

          {/* Form Tambah Platform Kustom (Collapsible) */}
          {isAddingPlatform && (
            <form
              onSubmit={handleCreateCustomPlatform}
              className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/90 dark:bg-zinc-800/60 space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-700/60 pb-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Globe size={14} className="text-zinc-500" />
                  Tambah Platform / Portal Karier Kustom
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingPlatform(false)}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded"
                  aria-label="Tutup form platform kustom"
                >
                  <X size={14} />
                </button>
              </div>

              {platformFormError && (
                <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-md p-2">
                  {platformFormError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                    Nama Platform / Perusahaan
                  </label>
                  <input
                    type="text"
                    value={newPlatformName}
                    onChange={(e) => setNewPlatformName(e.target.value)}
                    placeholder="Contoh: Tech in Asia Jobs, Karier BCA, Kalibrr..."
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 font-sans"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                    Format URL / Link Pencarian
                  </label>
                  <input
                    type="text"
                    value={newPlatformUrl}
                    onChange={(e) => setNewPlatformUrl(e.target.value)}
                    placeholder="https://contoh.com/jobs?q={query}&loc={location}"
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 font-mono text-[11px]"
                    required
                  />
                </div>
              </div>

              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                Tips: Sisipkan token <code className="bg-zinc-200 dark:bg-zinc-700 px-1 py-0.5 rounded">{"{query}"}</code> untuk kata kunci dan <code className="bg-zinc-200 dark:bg-zinc-700 px-1 py-0.5 rounded">{"{location}"}</code> untuk lokasi kota.
              </p>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingPlatform(false)}
                  className="px-3 py-1 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold rounded-md shadow-2xs"
                >
                  Simpan Platform
                </button>
              </div>
            </form>
          )}

          {/* Grid Platform Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {platforms.map((p) => {
              const targetUrl = buildCustomPlatformSearchUrl(
                p,
                activeQuery,
                selectedLocation,
                selectedMode === 'Remote' ? 'remote' : undefined
              );

              return (
                <div
                  key={p.id}
                  className="horizonx-card p-3.5 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center flex-shrink-0 font-mono">
                          {p.name[0]?.toUpperCase() || 'P'}
                        </div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
                          {p.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1">
                        {p.isCustom && (
                          <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80">
                            Kustom
                          </span>
                        )}
                        {p.isCustom && (
                          <button
                            type="button"
                            onClick={() => removePlatform(p.id)}
                            className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                            title="Hapus platform kustom ini"
                            aria-label={`Hapus ${p.name}`}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {p.description || `Pencarian lowongan aktif di ${p.domain || p.name}`}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/70 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 truncate max-w-[130px]">
                      {p.domain || 'portal web'}
                    </span>

                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 transition-all shadow-2xs active:scale-[0.97]"
                      title={`Buka hasil pencarian ${activeQuery} di ${p.name}`}
                    >
                      <span>Buka & Lamar</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Paste URL Bar */}
      <form onSubmit={handleQuickPaste} className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 backdrop-blur-md p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Punya Link Lowongan Spesifik? Tempel Langsung di Sini:
          </label>
          <button
            type="button"
            onClick={() => setScoutViewMode('scraper')}
            className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors"
          >
            <Link2 size={12} className="text-amber-500" />
            <span>Buka Loker Scraper (Koleksi & Mode Massal) &rarr;</span>
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={pasteUrl}
            onChange={(e) => setPasteUrl(e.target.value)}
            placeholder="Contoh: https://id.jobstreet.com/job/78912345 atau link LinkedIn..."
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 font-mono"
          />
          {onEvaluateInHunter && (
            <button
              type="button"
              onClick={handleQuickEvaluate}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-800 shadow-2xs hover:bg-zinc-100 active:scale-[0.975] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-all"
            >
              <Target size={14} className="text-emerald-500" />
              <span>Evaluasi di Hunter</span>
            </button>
          )}
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-zinc-800 active:scale-[0.975] dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all"
          >
            <Zap size={14} className="text-amber-400" />
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
        {/* Quick 3-Step Action Guide Banner */}
        <div className="p-3.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-md bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
              <HelpCircle size={14} />
            </span>
            <div className="text-xs">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Alur Aksi Mudah:
              </span>{' '}
              <span className="text-zinc-600 dark:text-zinc-400">
                1. Pilih target posisi di atas &bull; 2. Klik <b>Buka</b> untuk daftar di web portal &bull; 3. Klik <b>+ Simpan ke Pipeline</b> agar lamaran otomatis dipantau di Kanban.
              </span>
            </div>
          </div>
          {onNavigateToTracker && (
            <button
              type="button"
              onClick={onNavigateToTracker}
              className="inline-flex items-center gap-1 font-semibold text-zinc-800 dark:text-zinc-200 hover:underline shrink-0 text-xs"
            >
              <span>Lihat Pipeline Pelacak</span>
              <ArrowUpRight size={12} />
            </button>
          )}
        </div>

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
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 active:scale-[0.975] transition-all"
                      >
                        <span>Buka</span>
                        <ArrowUpRight size={13} />
                      </a>

                      {onEvaluateInHunter && (
                        <button
                          type="button"
                          onClick={() =>
                            onEvaluateInHunter({
                              title: v.title,
                              company: v.company,
                              url: v.url,
                              workMode: v.workMode,
                              rawJd: `${v.title} at ${v.company}\nLocation: ${v.location}\nWork Mode: ${v.workMode}\nSalary: Rp ${v.salaryMin.toLocaleString('id-ID')} - Rp ${v.salaryMax.toLocaleString('id-ID')} / month\n\nJob Description:\n${v.description}\n\nRequired Skills:\n${v.skills.join(', ')}`,
                            })
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-100 active:scale-[0.975] transition-all px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-2xs"
                          title="Evaluasi kecocokan skill dan dealbreaker di Job Hunter Engine"
                        >
                          <Target size={12} className="text-emerald-500" />
                          <span>Evaluasi Fit</span>
                        </button>
                      )}

                      {onApplyViaApplyFlow && (
                        <button
                          type="button"
                          onClick={() =>
                            onApplyViaApplyFlow({
                              title: v.title,
                              company: v.company,
                              url: v.url,
                              source: v.platform.toLowerCase(),
                              rawJd: `${v.title} at ${v.company}\nLocation: ${v.location}\nWork Mode: ${v.workMode}\nSalary: Rp ${v.salaryMin.toLocaleString('id-ID')} - Rp ${v.salaryMax.toLocaleString('id-ID')} / month\n\nJob Description:\n${v.description}\n\nRequired Skills:\n${v.skills.join(', ')}`,
                            })
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-100 active:scale-[0.975] transition-all px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-2xs"
                          title="Buat draft lamaran dan email terarah di ApplyFlow"
                        >
                          <Zap size={12} className="text-amber-500" />
                          <span>ApplyFlow</span>
                        </button>
                      )}
                    </div>

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
      </>
      )}
    </div>
  );
}
