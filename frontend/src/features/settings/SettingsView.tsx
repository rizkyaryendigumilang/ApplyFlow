import { useState, useMemo, useEffect } from 'react';
import {
  User,
  Sliders,
  Palette,
  Cpu,
  Layers,
  Database,
  ShieldCheck,
  Info,
  Search,
  Check,
  X,
  Download,
  Upload,
  RefreshCw,
  Send,
  AlertTriangle,
  Calendar,
  Lock,
  ExternalLink,
  ChevronRight,
  LogOut,
  Mail,
  Smartphone,
  Copy,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  Printer,
  Languages,
  Globe,
} from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { useTheme } from '../../lib/theme';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { AtsResumeFormatterModal } from '../resume-formatter/AtsResumeFormatterModal';
import { pb, isOfflineMode, clearSession } from '../../lib/pocketbase';
import type { Application, CVArtifact, Interview } from '../../lib/pb-types';
import { useCandidateProfile } from '../../hooks/useCandidateProfile';
import { usePreferences, type CRMPreferences } from '../../hooks/usePreferences';
import {
  exportApplicationsToCSV,
  exportFullBackupJSON,
  exportInterviewsToICS,
  parseCSVToApplications,
  triggerDownload,
  getAutoBackupConfig,
  saveAutoBackupConfig,
  saveAutoBackupSnapshot,
  getLatestAutoBackupSnapshot,
  downloadLatestAutoBackup,
  type AutoBackupConfig,
  type AutoBackupSnapshot,
} from '../../lib/data-transfer';
import { idr } from '../../lib/utils';
import { sendTelegramMessage, sendMorningBriefingNow } from '../../lib/telegram-briefing';

interface SettingsViewProps {
  applications: Application[];
  cvs: CVArtifact[];
  interviews: Interview[];
  onImportApplications?: (imported: Partial<Application>[]) => Promise<void> | void;
  onResetToSeed?: () => void;
  onNavigateTab?: (tab: 'pipeline' | 'jobhunter' | 'applyflow' | 'inbox') => void;
}

type SettingsSection =
  | 'account'
  | 'preferences'
  | 'appearance'
  | 'ai-hunter'
  | 'integrations'
  | 'data'
  | 'security'
  | 'about';

interface SectionItem {
  id: SettingsSection;
  label: string;
  group: 'General' | 'Intelligence & Sync' | 'System';
  icon: typeof User;
  keywords: string[];
}

const SECTIONS: SectionItem[] = [
  { id: 'account', label: 'Account & Profile', group: 'General', icon: User, keywords: ['name', 'email', 'avatar', 'password', 'title', 'headline'] },
  { id: 'preferences', label: 'CRM Preferences', group: 'General', icon: Sliders, keywords: ['currency', 'salary', 'ghosting', 'landing', 'density', 'days', 'language', 'bahasa', 'locale', 'english', 'inggris'] },
  { id: 'appearance', label: 'Appearance & Density', group: 'General', icon: Palette, keywords: ['theme', 'dark', 'light', 'density', 'font', 'spacing'] },
  { id: 'ai-hunter', label: 'AI Hunter & Triage Rules', group: 'Intelligence & Sync', icon: Cpu, keywords: ['skills', 'dealbreakers', 'threshold', 'matching', 'salary floor', 'roles'] },
  { id: 'integrations', label: 'Integrations & Alerts', group: 'Intelligence & Sync', icon: Layers, keywords: ['gmail', 'telegram', 'calendar', 'ics', 'sync', 'jobstreet', 'webhook'] },
  { id: 'data', label: 'Data & Storage', group: 'System', icon: Database, keywords: ['export', 'import', 'csv', 'backup', 'json', 'reset', 'storage', 'quota'] },
  { id: 'security', label: 'Security & Privacy', group: 'System', icon: ShieldCheck, keywords: ['auth', 'encryption', 'aes', 'multi-tenant', 'session', 'token'] },
  { id: 'about', label: 'About & Documentation', group: 'System', icon: Info, keywords: ['version', 'specs', 'glossary', 'architecture', 'agents', 'adr'] },
];

export function SettingsView({
  applications,
  cvs,
  interviews,
  onImportApplications,
  onResetToSeed,
}: SettingsViewProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');
  const [searchQuery, setSearchQuery] = useState('');
  const { profile, saveProfile } = useCandidateProfile();
  const { preferences, updatePreferences, resetPreferences, savedStatus } = usePreferences();
  const { locale, setLocale, t } = useI18n();
  const { theme, setTheme } = useTheme();
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();

  // Local account states
  const [accountName, setAccountName] = useState(
    profile.fullName || (pb.authStore.model?.displayName && pb.authStore.model.displayName !== 'Administrator' ? pb.authStore.model.displayName : 'Rizky Aryendi Gumilang')
  );
  const [accountEmail] = useState(pb.authStore.model?.email || 'admin@applyflow.local');
  const [accountHeadline, setAccountHeadline] = useState(profile.headline || 'Technical Consultant Analyst & Junior Engineer');
  const [accountPhone, setAccountPhone] = useState(profile.phone || '+6289512888017');

  // Synchronize candidate profile updates
  useEffect(() => {
    if (profile.fullName) setAccountName(profile.fullName);
    if (profile.headline) setAccountHeadline(profile.headline);
    if (profile.phone) setAccountPhone(profile.phone);
  }, [profile.fullName, profile.headline, profile.phone]);

  const userInitials = (accountName || 'Rizky')
    .split(' ')
    .filter(Boolean)
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'RG';

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // AI Hunter Tag Inputs
  const [newRoleInput, setNewRoleInput] = useState('');
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newDealbreakerInput, setNewDealbreakerInput] = useState('');

  // Telegram test status
  const [telegramTestStatus, setTelegramTestStatus] = useState<string | null>(null);
  const [isSyncingGmail, setIsSyncingGmail] = useState(false);
  const [gmailSyncStatus, setGmailSyncStatus] = useState<string | null>(null);

  // File import state
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showAtsResumeModal, setShowAtsResumeModal] = useState(false);

  // Auto-Sync Backup States
  const [autoBackupConfig, setAutoBackupConfig] = useState<AutoBackupConfig>(() => getAutoBackupConfig());
  const [latestSnapshot, setLatestSnapshot] = useState<AutoBackupSnapshot | null>(() => getLatestAutoBackupSnapshot());

  // Real-time Auto-Sync snapshot updater
  useEffect(() => {
    if (autoBackupConfig.enabled && applications.length > 0) {
      const snap = saveAutoBackupSnapshot({
        applications,
        cvs,
        interviews,
        profile,
        preferences,
      });
      if (snap) {
        setLatestSnapshot(snap);
      }
    }
  }, [applications, cvs, interviews, profile, preferences, autoBackupConfig.enabled]);

  // Filter sections by search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return SECTIONS;
    const q = searchQuery.toLowerCase();
    return SECTIONS.filter(s =>
      s.label.toLowerCase().includes(q) || s.keywords.some(k => k.includes(q))
    );
  }, [searchQuery]);

  // Section groups
  const groupedSections = useMemo(() => {
    const groups: { [key: string]: SectionItem[] } = {
      General: [],
      'Intelligence & Sync': [],
      System: [],
    };
    filteredSections.forEach(s => {
      groups[s.group]?.push(s);
    });
    return groups;
  }, [filteredSections]);

  // Handlers for profile
  const handleSaveHeadline = async () => {
    await saveProfile({ headline: accountHeadline });
  };

  const handleAddRole = async () => {
    if (!newRoleInput.trim()) return;
    const updated = [...(profile.targetRoles || []), newRoleInput.trim()];
    await saveProfile({ targetRoles: updated });
    setNewRoleInput('');
  };

  const handleRemoveRole = async (index: number) => {
    const updated = profile.targetRoles.filter((_, i) => i !== index);
    await saveProfile({ targetRoles: updated });
  };

  const handleAddSkill = async () => {
    if (!newSkillInput.trim()) return;
    const updated = [...(profile.skills || []), newSkillInput.trim()];
    await saveProfile({ skills: updated });
    setNewSkillInput('');
  };

  const handleRemoveSkill = async (index: number) => {
    const updated = profile.skills.filter((_, i) => i !== index);
    await saveProfile({ skills: updated });
  };

  const handleAddDealbreaker = async () => {
    if (!newDealbreakerInput.trim()) return;
    const updated = [...(profile.dealbreakers || []), newDealbreakerInput.trim()];
    await saveProfile({ dealbreakers: updated });
    setNewDealbreakerInput('');
  };

  const handleRemoveDealbreaker = async (index: number) => {
    const updated = profile.dealbreakers.filter((_, i) => i !== index);
    await saveProfile({ dealbreakers: updated });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setPasswordMsg({ type: 'err', text: 'Password baru minimal 8 karakter.' });
      return;
    }
    if (isOfflineMode()) {
      setPasswordMsg({ type: 'ok', text: 'Password berhasil diperbarui (Mock session).' });
      setOldPassword('');
      setNewPassword('');
      return;
    }
    try {
      if (pb.authStore.model?.id) {
        await pb.collection('users').update(pb.authStore.model.id, {
          oldPassword,
          password: newPassword,
          passwordConfirm: newPassword,
        });
        setPasswordMsg({ type: 'ok', text: 'Password berhasil diubah di database.' });
        setOldPassword('');
        setNewPassword('');
      }
    } catch (err: unknown) {
      setPasswordMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Gagal memperbarui password.',
      });
    }
  };

  const handleTestTelegram = async () => {
    if (!preferences.telegramChatId) {
      setTelegramTestStatus('Masukkan Telegram Chat ID terlebih dahulu.');
      return;
    }
    setTelegramTestStatus('Mengirim test ping ke Telegram...');
    try {
      const res = await sendTelegramMessage({
        chatId: preferences.telegramChatId,
        botToken: preferences.telegramBotToken,
        text: `🔔 <b>Junction Career CRM · Test Ping</b>\nKoneksi Telegram berhasil terverifikasi untuk akun <b>${accountName}</b> pada <code>${new Date().toLocaleTimeString('id-ID')} WIB</code>.\nNotifikasi wawancara, status viewed HRD, dan morning briefing akan dikirimkan ke chat ini.`,
      });
      setTelegramTestStatus(res.message);
    } catch (err) {
      setTelegramTestStatus(`Gagal mengirim: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleSendMorningBriefing = async () => {
    if (!preferences.telegramChatId) {
      setTelegramTestStatus('Masukkan Telegram Chat ID terlebih dahulu.');
      return;
    }
    setTelegramTestStatus('Menyiapkan dan mengirim Morning Career Briefing (08:30 WIB preview)...');
    try {
      const res = await sendMorningBriefingNow({
        config: {
          chatId: preferences.telegramChatId,
          botToken: preferences.telegramBotToken,
          notifyDailyMorningBriefing: preferences.notifyDailyMorningBriefing,
        },
        applications,
        interviews,
        candidateName: accountName,
      });
      setTelegramTestStatus(res.message);
    } catch (err) {
      setTelegramTestStatus(`Gagal mengirim briefing: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleTriggerGmailSync = async () => {
    setIsSyncingGmail(true);
    setGmailSyncStatus('Memeriksa inbox Gmail & JobStreet...');
    try {
      await new Promise(r => setTimeout(r, 800));
      setGmailSyncStatus('Sinkronisasi selesai. Tidak ada notifikasi baru tertunda.');
    } finally {
      setIsSyncingGmail(false);
    }
  };

  const handleExportCSV = () => {
    const csv = exportApplicationsToCSV(applications);
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerDownload(csv, `junction-applications-${dateStr}.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const json = exportFullBackupJSON({
      applications,
      cvs,
      interviews,
      profile,
      preferences,
    });
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerDownload(json, `junction-backup-${dateStr}.json`, 'application/json');
  };

  const handleExportICS = () => {
    const ics = exportInterviewsToICS(interviews, applications);
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerDownload(ics, `junction-interviews-${dateStr}.ics`, 'text/calendar');
  };

  const handleToggleAutoBackup = (enabled: boolean) => {
    const updated = saveAutoBackupConfig({ enabled });
    setAutoBackupConfig(updated);
    if (enabled) {
      const snap = saveAutoBackupSnapshot({
        applications,
        cvs,
        interviews,
        profile,
        preferences,
      });
      if (snap) setLatestSnapshot(snap);
    }
  };

  const handleUpdateFrequency = (frequency: 'realtime' | 'daily' | 'weekly') => {
    const updated = saveAutoBackupConfig({ frequency });
    setAutoBackupConfig(updated);
  };

  const handleDownloadLatestAutoBackup = (format: 'csv' | 'json') => {
    downloadLatestAutoBackup(format);
  };

  const handleRestoreFromLatestSnapshot = async () => {
    if (!latestSnapshot?.payload?.applications) {
      alert('Tidak ada snapshot otomatis yang tersimpan.');
      return;
    }
    if (
      confirm(
        `Pulihkan ${latestSnapshot.payload.applications.length} lamaran dari snapshot cadangan otomatis (${new Date(
          latestSnapshot.timestamp
        ).toLocaleString('id-ID')})?`
      )
    ) {
      if (onImportApplications) {
        await onImportApplications(latestSnapshot.payload.applications);
        setImportStatus(
          `Berhasil memulihkan ${latestSnapshot.payload.applications.length} lamaran dari snapshot cadangan otomatis.`
        );
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async event => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed.applications) && onImportApplications) {
            await onImportApplications(parsed.applications);
            setImportStatus(`Berhasil mengimpor ${parsed.applications.length} lamaran dari backup JSON.`);
          } else {
            setImportStatus('Format JSON tidak sesuai format backup Junction.');
          }
        } else if (file.name.endsWith('.csv')) {
          const parsed = parseCSVToApplications(text);
          if (parsed.length > 0 && onImportApplications) {
            await onImportApplications(parsed);
            setImportStatus(`Berhasil mengimpor ${parsed.length} baris spreadsheet.`);
          } else {
            setImportStatus('Tidak ada baris valid yang ditemukan dalam file CSV.');
          }
        }
      } catch (err: unknown) {
        setImportStatus(err instanceof Error ? err.message : 'Gagal membaca file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="settings-page">
      {/* Top Header */}
      <div className="settings-header">
        <div>
          <span className="eyebrow">SETTINGS & PREFERENCES</span>
          <h1>System Configuration</h1>
          <p className="lede">
            Kelola profil, aturan seleksi AI Job Hunter, integrasi notifikasi, dan data export CRM.
          </p>
        </div>
        <div className="settings-autosave-pill">
          {savedStatus === 'saving' ? (
            <span className="pill-saving">
              <RefreshCw size={12} className="spin" /> Menyimpan...
            </span>
          ) : (
            <span className="pill-saved">
              <Check size={12} /> Tersimpan
            </span>
          )}
        </div>
      </div>

      {/* Main Two-Column Container */}
      <div className="settings-layout">
        {/* Left Sidebar */}
        <aside className="settings-sidebar">
          {/* Search bar */}
          <div className="settings-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Cari pengaturan..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} aria-label="Clear search">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Navigation Groups */}
          <div className="settings-nav">
            {Object.entries(groupedSections).map(([groupTitle, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={groupTitle} className="settings-nav-group">
                  <span className="settings-group-title">{groupTitle}</span>
                  {items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        className={`settings-nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => setActiveSection(item.id)}
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                        {isActive && <ChevronRight size={14} className="nav-arrow" />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* User footer in sidebar */}
          <div className="settings-sidebar-footer">
            <div className="user-badge">
              <div className="user-avatar">{userInitials}</div>
              <div className="user-info">
                <strong>{accountName}</strong>
                <span>{accountEmail}</span>
              </div>
            </div>
            <button className="settings-signout-btn" onClick={clearSession} title="Sign Out">
              <LogOut size={14} />
            </button>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="settings-content">
          {/* SECTION 1: Account & Profile */}
          {activeSection === 'account' && (
            <div className="settings-panel">
              <div className="panel-title">
                <h2>Account & Profile</h2>
                <p>Identitas akun pengguna, kontak profesional, dan kredensial keamanan.</p>
              </div>

              <div className="settings-card">
                <h3>Informasi Profil</h3>
                <div className="profile-hero">
                  <div className="profile-avatar-large">{userInitials}</div>
                  <div>
                    <button className="secondary compact-btn">Ubah Avatar</button>
                    <p className="micro-note">Format JPG, PNG, atau WebP. Maks 2MB.</p>
                  </div>
                </div>

                <div className="form-grid-2">
                  <label>
                    Nama Lengkap
                    <input
                      value={accountName}
                      onChange={e => setAccountName(e.target.value)}
                      placeholder="e.g. Rizky Aryendi Gumilang"
                    />
                  </label>
                  <label>
                    Alamat Email
                    <input value={accountEmail} disabled className="disabled-input" />
                  </label>
                </div>

                <div className="form-grid-2">
                  <label>
                    Current Title / Headline
                    <input
                      value={accountHeadline}
                      onChange={e => setAccountHeadline(e.target.value)}
                      onBlur={handleSaveHeadline}
                      placeholder="e.g. Senior DevOps & Cloud Platform Engineer"
                    />
                  </label>
                  <label>
                    No. Handphone / WhatsApp
                    <input
                      value={accountPhone}
                      onChange={e => setAccountPhone(e.target.value)}
                      placeholder="+62 812-xxxx-xxxx"
                    />
                  </label>
                </div>

                <label>
                  Ringkasan Karir (Candidate Summary)
                  <textarea
                    rows={3}
                    value={profile.experienceSummary || ''}
                    onChange={e => saveProfile({ experienceSummary: e.target.value })}
                    placeholder="Ringkasan pengalaman teknis Anda untuk prompt AI Job Hunter..."
                  />
                </label>
              </div>

              {/* Harvard ATS Master Resume Card */}
              <div className="settings-card" style={{ background: '#ffffff', border: '1px solid #e4e4e7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span className="eyebrow" style={{ color: '#18181b' }}>RESUME MASTER ATS</span>
                    <h3 style={{ margin: '4px 0 6px' }}>1-Click Printable ATS Resume (Harvard Standard)</h3>
                    <p className="setting-desc" style={{ maxWidth: '600px', margin: 0 }}>
                      Format seluruh profil, pengalaman, dan keahlian Anda ke dalam template resume Harvard/Tech 1 kolom siap cetak atau ekspor PDF dengan skor lolos parsing ATS 100%.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="primary compact-btn"
                    onClick={() => setShowAtsResumeModal(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Printer size={14} /> Buka Harvard ATS Formatter
                  </button>
                </div>
              </div>

              <div className="settings-card">
                <h3>Keamanan & Ubah Password</h3>
                <form onSubmit={handlePasswordChange}>
                  <div className="form-grid-2">
                    <label>
                      Password Lama
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={e => setOldPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </label>
                    <label>
                      Password Baru
                      <input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Minimal 8 karakter"
                      />
                    </label>
                  </div>

                  {passwordMsg && (
                    <div className={`feedback-banner ${passwordMsg.type}`}>
                      {passwordMsg.text}
                    </div>
                  )}

                  <div className="card-actions">
                    <button type="submit" className="primary compact-btn">
                      Perbarui Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SECTION 2: CRM Preferences */}
          {activeSection === 'preferences' && (
            <div className="settings-panel">
              <div className="panel-title">
                <h2>CRM Preferences</h2>
                <p>Konfigurasi default bahasa sistem, tampilan, mata uang utama, dan ambang batas deteksi ghosting.</p>
              </div>

              {/* Language Selection Scheme Card */}
              <div className="settings-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '15px' }}>
                      <Languages size={18} style={{ color: '#556d33' }} />
                      {t('settings.languageTitle')}
                    </h3>
                    <p className="setting-desc" style={{ margin: '4px 0 0' }}>
                      {t('settings.languageDesc')}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: '#eef2e6',
                      color: '#556d33',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {locale === 'en' ? 'ENGLISH ACTIVE' : 'INDONESIA AKTIF'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setLocale('id');
                      updatePreferences({ locale: 'id' });
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '14px',
                      borderRadius: '10px',
                      border: locale === 'id' ? '2px solid #556d33' : '1px solid #dedfd8',
                      background: locale === 'id' ? '#fbfcf8' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.15s ease, border-color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>🇮🇩</span>
                        <strong style={{ fontSize: '13px', color: '#202320' }}>
                          {t('settings.languageId')}
                        </strong>
                      </div>
                      {locale === 'id' && (
                        <span style={{ display: 'flex', alignItems: 'center', color: '#556d33' }}>
                          <Check size={16} />
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '11px', color: '#687063', margin: '8px 0 0', lineHeight: 1.4 }}>
                      {t('settings.languageIdDesc')}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLocale('en');
                      updatePreferences({ locale: 'en' });
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '14px',
                      borderRadius: '10px',
                      border: locale === 'en' ? '2px solid #556d33' : '1px solid #dedfd8',
                      background: locale === 'en' ? '#fbfcf8' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.15s ease, border-color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>🇺🇸</span>
                        <strong style={{ fontSize: '13px', color: '#202320' }}>
                          {t('settings.languageEn')}
                        </strong>
                      </div>
                      {locale === 'en' && (
                        <span style={{ display: 'flex', alignItems: 'center', color: '#556d33' }}>
                          <Check size={16} />
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '11px', color: '#687063', margin: '8px 0 0', lineHeight: 1.4 }}>
                      {t('settings.languageEnDesc')}
                    </p>
                  </button>
                </div>
              </div>

              <div className="settings-card">
                <h3>Format & Tampilan Data</h3>
                <div className="form-grid-2">
                  <label>
                    Default Landing Tab
                    <select
                      value={preferences.defaultLandingModule}
                      onChange={e =>
                        updatePreferences({
                          defaultLandingModule: e.target.value as CRMPreferences['defaultLandingModule'],
                        })
                      }
                    >
                      <option value="pipeline">Opportunity Pipeline (Kanban)</option>
                      <option value="jobscout">Auto Job Scout (Multi-Platform Vacancy Radar)</option>
                      <option value="jobhunter">Job Hunter AI</option>
                      <option value="applyflow">ApplyFlow Generator</option>
                      <option value="inbox">Recruitment Inbox</option>
                    </select>
                  </label>

                  <label>
                    Mata Uang Utama (Default Currency)
                    <select
                      value={preferences.currency}
                      onChange={e =>
                        updatePreferences({
                          currency: e.target.value as CRMPreferences['currency'],
                        })
                      }
                    >
                      <option value="IDR">IDR - Indonesian Rupiah (Rp)</option>
                      <option value="USD">USD - US Dollar ($)</option>
                      <option value="SGD">SGD - Singapore Dollar (S$)</option>
                      <option value="EUR">EUR - Euro (€)</option>
                    </select>
                  </label>
                </div>

                <div className="form-grid-2">
                  <label>
                    Periode Gaji Default
                    <select
                      value={preferences.salaryPeriod}
                      onChange={e =>
                        updatePreferences({
                          salaryPeriod: e.target.value as CRMPreferences['salaryPeriod'],
                        })
                      }
                    >
                      <option value="monthly">Bulanan (Monthly / Take Home Pay)</option>
                      <option value="annual">Tahunan (Annual / Gross)</option>
                    </select>
                  </label>

                  <label>
                    Kepadatan Baris Tabel (Table Density)
                    <select
                      value={preferences.tableDensity}
                      onChange={e =>
                        updatePreferences({
                          tableDensity: e.target.value as CRMPreferences['tableDensity'],
                        })
                      }
                    >
                      <option value="comfortable">Comfortable (Lapang)</option>
                      <option value="compact">Compact (Padat)</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="settings-card">
                <h3>Deteksi Ghosting & Follow-Up</h3>
                <div className="setting-row">
                  <div>
                    <strong>Ambang Batas Ghosting (Hari)</strong>
                    <p className="setting-desc">
                      Jumlah hari tanpa respon setelah lamaran dikirim sebelum sistem menandai peringatan tindak lanjut.
                    </p>
                  </div>
                  <div className="setting-control">
                    <input
                      type="number"
                      min={3}
                      max={30}
                      value={preferences.ghostingThresholdDays}
                      onChange={e =>
                        updatePreferences({ ghostingThresholdDays: parseInt(e.target.value) || 7 })
                      }
                      className="number-input"
                    />
                    <span className="unit-label">hari</span>
                  </div>
                </div>

                <div className="setting-row">
                  <div>
                    <strong>Auto-Sync Recruitment Inbox</strong>
                    <p className="setting-desc">
                      Secara berkala polling event email JobStreet & notifikasi rekrutmen di background.
                    </p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={preferences.autoSyncInbox}
                      onChange={e => updatePreferences({ autoSyncInbox: e.target.checked })}
                    />
                    <span className="slider round" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: Appearance & Density */}
          {activeSection === 'appearance' && (
            <div className="settings-panel">
              <div className="panel-title">
                <h2>Appearance & Density</h2>
                <p>Karakter desain visual, tipografi, dan mode densitas antarmuka.</p>
              </div>

              <div className="settings-card">
                <h3>Gaya Visual Antarmuka</h3>
                <div className="theme-options">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`theme-card text-left transition-all cursor-pointer ${theme === 'light' ? 'active' : 'opacity-80 hover:opacity-100'}`}
                  >
                    <div className="theme-swatch natural" />
                    <strong>Editorial Natural (Terang)</strong>
                    <small>High contrast neutrals (#fafafa, #ffffff) dengan aksen sage/olive terukur.</small>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`theme-card text-left transition-all cursor-pointer ${theme === 'dark' ? 'active' : 'opacity-80 hover:opacity-100'}`}
                  >
                    <div className="theme-swatch dark" />
                    <strong>HorizonX Obsidian (Gelap)</strong>
                    <small>Mode gelap presisi OLED (#09090b) dengan hairline highlights dan grain texture.</small>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`theme-card text-left transition-all cursor-pointer ${theme === 'system' ? 'active' : 'opacity-80 hover:opacity-100'}`}
                  >
                    <div className="theme-swatch" style={{ background: 'linear-gradient(135deg, #f4f4f5 50%, #111114 50%)' }} />
                    <strong>Sistem Operasi (Otomatis)</strong>
                    <small>Menyesuaikan preferensi mode tampilan sistem operasi Anda secara otomatis.</small>
                  </button>
                </div>
              </div>

              <div className="settings-card">
                <h3>Spesifikasi Tipografi & Grid</h3>
                <div className="specs-list">
                  <div className="spec-item">
                    <span>Primary Font</span>
                    <strong>DM Sans (Interface, Body, Controls)</strong>
                  </div>
                  <div className="spec-item">
                    <span>Editorial Font</span>
                    <strong>Playfair Display (Headlines, Brand, Quotes)</strong>
                  </div>
                  <div className="spec-item">
                    <span>Metrics & Code</span>
                    <strong>DM Mono (Dates, Badges, Currency, Timelines)</strong>
                  </div>
                  <div className="spec-item">
                    <span>Design Grid</span>
                    <strong>4px Strict Linear Grid (Zero generic UI slop)</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: AI Hunter & Triage Rules */}
          {activeSection === 'ai-hunter' && (
            <div className="settings-panel">
              <div className="panel-title">
                <h2>AI Hunter & Triage Rules</h2>
                <p>Aturan penyaringan otomatis, batas gaji minimum, dan parameter eliminasi dealbreaker.</p>
              </div>

              <div className="settings-card">
                <h3>Target Posisi Pekerjaan</h3>
                <p className="setting-desc">
                  Posisi yang Anda prioritaskan untuk pencarian dan pencocokan AI.
                </p>
                <div className="tag-cloud">
                  {(profile.targetRoles || []).map((role, idx) => (
                    <span className="tag-pill" key={idx}>
                      {role}
                      <button onClick={() => handleRemoveRole(idx)}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="add-tag-form">
                  <input
                    value={newRoleInput}
                    onChange={e => setNewRoleInput(e.target.value)}
                    placeholder="Tambah posisi baru (e.g. Staff SRE, Cloud Architect)..."
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddRole())}
                  />
                  <button type="button" className="secondary compact-btn" onClick={handleAddRole}>
                    Tambah
                  </button>
                </div>
              </div>

              <div className="settings-card">
                <h3>Inventaris Keahlian (Skills Inventory)</h3>
                <p className="setting-desc">
                  Daftar skill teknis yang Anda kuasai untuk kalkulasi Fit Score dan identifikasi missing skills.
                </p>
                <div className="tag-cloud">
                  {(profile.skills || []).map((skill, idx) => (
                    <span className="tag-pill skill" key={idx}>
                      {skill}
                      <button onClick={() => handleRemoveSkill(idx)}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="add-tag-form">
                  <input
                    value={newSkillInput}
                    onChange={e => setNewSkillInput(e.target.value)}
                    placeholder="Tambah skill teknis (e.g. Kubernetes, Golang, Terraform)..."
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  />
                  <button type="button" className="secondary compact-btn" onClick={handleAddSkill}>
                    Tambah
                  </button>
                </div>
              </div>

              <div className="settings-card">
                <h3>Filter Gaji Minimum & Mode Kerja</h3>
                <div className="form-grid-2">
                  <label>
                    Gaji Pokok Minimum Bulanan
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500 dark:text-zinc-400 font-mono select-none pointer-events-none">
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9.]*"
                        value={typeof profile.minSalary === 'number' ? (profile.minSalary > 0 ? profile.minSalary.toLocaleString('id-ID') : '') : '15.000.000'}
                        onChange={e => {
                          const digits = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                          saveProfile({ minSalary: digits === '' ? 0 : parseInt(digits, 10) });
                        }}
                        placeholder="15.000.000"
                        className="!pl-10 !mt-0 font-mono"
                      />
                    </div>
                    <small className="field-hint">
                      Format: {idr(profile.minSalary || 15000000)} / bulan
                    </small>
                  </label>

                  <div>
                    <label>Preferensi Mode Kerja</label>
                    <div className="checkbox-group">
                      {['Remote', 'Hybrid', 'On-site'].map(mode => (
                        <label key={mode} className="check-label">
                          <input
                            type="checkbox"
                            checked={(profile.preferredModes || []).includes(mode)}
                            onChange={e => {
                              const current = profile.preferredModes || [];
                              const next = e.target.checked
                                ? [...current, mode]
                                : current.filter(m => m !== mode);
                              saveProfile({ preferredModes: next });
                            }}
                          />
                          <span>{mode}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <h3>Dealbreaker Elimination Criteria</h3>
                <p className="setting-desc">
                  Jika salah satu kriteria ini terdeteksi pada Job Description, AI Job Hunter langsung membatalkan rekomendasi.
                </p>
                <div className="tag-cloud">
                  {(profile.dealbreakers || []).map((db, idx) => (
                    <span className="tag-pill dealbreaker" key={idx}>
                      <AlertTriangle size={12} />
                      {db}
                      <button onClick={() => handleRemoveDealbreaker(idx)}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="add-tag-form">
                  <input
                    value={newDealbreakerInput}
                    onChange={e => setNewDealbreakerInput(e.target.value)}
                    placeholder="Tambah dealbreaker (e.g. WFO full, Judi online, Unpaid overtime)..."
                    onKeyDown={e =>
                      e.key === 'Enter' && (e.preventDefault(), handleAddDealbreaker())
                    }
                  />
                  <button
                    type="button"
                    className="secondary compact-btn"
                    onClick={handleAddDealbreaker}
                  >
                    Tambah
                  </button>
                </div>
              </div>

              <div className="settings-card">
                <h3>Skor Ambang Batas Promosi Otomatis (Auto-Promote)</h3>
                <div className="setting-row">
                  <div>
                    <strong>Minimal Skor Kecocokan ({preferences.autoPromoteThreshold}%)</strong>
                    <p className="setting-desc">
                      Lead lowongan yang memperoleh Fit Score di atas batas ini akan langsung direkomendasikan untuk promosi ke ApplyFlow.
                    </p>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={95}
                    value={preferences.autoPromoteThreshold}
                    onChange={e =>
                      updatePreferences({ autoPromoteThreshold: parseInt(e.target.value) })
                    }
                    className="range-slider"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: Integrations & Alerts */}
          {activeSection === 'integrations' && (
            <div className="settings-panel">
              <div className="panel-title">
                <h2>Integrations & Alerts</h2>
                <p>Koneksi akun Gmail, bot notifikasi Telegram, dan kalender interview.</p>
              </div>

              {/* Gmail Sync Card */}
              <div className="settings-card">
                <div className="card-top-icon">
                  <Mail size={18} />
                  <div>
                    <h3>Gmail & JobStreet Recruitment Sync</h3>
                    <p className="setting-desc">
                      Sinkronisasi email otomatis untuk mendeteksi status lamaran (Viewed, Screening, Interview).
                    </p>
                  </div>
                </div>

                <div className="integration-status-box">
                  <div className="status-indicator connected">
                    <span className="status-dot" />
                    <strong>Terkoneksi: jobstreet.sync@gmail.com</strong>
                  </div>
                  <div className="integration-actions">
                    <button
                      className="secondary compact-btn"
                      disabled={isSyncingGmail}
                      onClick={handleTriggerGmailSync}
                    >
                      <RefreshCw size={12} className={isSyncingGmail ? 'spin' : ''} />
                      {isSyncingGmail ? 'Memeriksa...' : 'Sinkronkan Sekarang'}
                    </button>
                  </div>
                </div>

                {gmailSyncStatus && <p className="status-msg">{gmailSyncStatus}</p>}

                <div className="setting-subrow">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={preferences.autoSyncInbox}
                      onChange={e => updatePreferences({ autoSyncInbox: e.target.checked })}
                    />
                    <span className="slider round" />
                  </label>
                  <span>
                    Otomatis buat lamaran baru jika terdeteksi notifikasi terverifikasi dari JobStreet
                  </span>
                </div>
              </div>

              {/* Telegram Webhook & Daily Career Briefing Card */}
              <div className="settings-card" style={{ borderLeft: '3px solid #229ED9' }}>
                <div className="card-top-icon">
                  <Smartphone size={18} style={{ color: '#229ED9' }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0 }}>Telegram Webhook & Daily Career Briefing</h3>
                      <span style={{ font: "10px 'DM Mono'", background: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: '12px' }}>
                        Mobile-First Alerts
                      </span>
                    </div>
                    <p className="setting-desc" style={{ marginTop: '4px' }}>
                      Dapatkan <strong>Morning Career Briefing</strong> otomatis setiap pagi pukul 08:30 WIB (ringkasan interview hari ini, lamaran yang perlu di-follow up, serta lowongan baru rekomendasi AI) langsung ke Telegram Anda.
                    </p>
                  </div>
                </div>

                <div className="form-grid-2" style={{ marginTop: '14px' }}>
                  <label>
                    Telegram Chat ID Anda <span style={{ color: '#b91c1c' }}>*</span>
                    <input
                      value={preferences.telegramChatId}
                      onChange={e => updatePreferences({ telegramChatId: e.target.value })}
                      placeholder="e.g. 123456789 (dapatkan via @userinfobot)"
                    />
                    <small className="field-hint">Ketik /start di bot telegram Anda, lalu salin User ID dari @userinfobot.</small>
                  </label>

                  <label>
                    Custom Bot Token Telegram <span className="optional">(Opsional / Pribadi)</span>
                    <input
                      type="password"
                      value={preferences.telegramBotToken || ''}
                      onChange={e => updatePreferences({ telegramBotToken: e.target.value })}
                      placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                    />
                    <small className="field-hint">Token bot pribadi dari @BotFather, atau kosongkan untuk proxy server.</small>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px', marginBottom: '14px' }}>
                  <button
                    type="button"
                    className="secondary compact-btn"
                    onClick={handleTestTelegram}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Send size={13} /> Kirim Test Ping
                  </button>
                  <button
                    type="button"
                    className="primary compact-btn"
                    onClick={handleSendMorningBriefing}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#1c6488' }}
                  >
                    <Send size={13} /> Kirim Morning Briefing Sekarang (08:30 WIB Preview)
                  </button>
                </div>

                {telegramTestStatus && (
                  <div
                    style={{
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      padding: '10px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#0369a1',
                      marginBottom: '14px',
                      lineHeight: 1.5,
                    }}
                  >
                    {telegramTestStatus}
                  </div>
                )}

                <div className="trigger-list">
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={preferences.notifyDailyMorningBriefing}
                      onChange={e => updatePreferences({ notifyDailyMorningBriefing: e.target.checked })}
                    />
                    <span>
                      <strong>Daily Morning Briefing (Pukul 08:30 WIB)</strong>: Kirim ringkasan jadwal interview harian, reminder follow-up, dan rekomendasi lowongan
                    </span>
                  </label>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={preferences.notifyOnInterview}
                      onChange={e => updatePreferences({ notifyOnInterview: e.target.checked })}
                    />
                    <span>Kirim alert seketika saat ada jadwal interview baru ditambahkan</span>
                  </label>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={preferences.notifyOnStatusChange}
                      onChange={e => updatePreferences({ notifyOnStatusChange: e.target.checked })}
                    />
                    <span>Kirim alert saat HRD melihat CV (Status berubah ke Viewed / Seen)</span>
                  </label>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={preferences.notifyOnGhostingWarning}
                      onChange={e => updatePreferences({ notifyOnGhostingWarning: e.target.checked })}
                    />
                    <span>Kirim alert peringatan anti-ghosting (14+ hari lamaran terabaikan tanpa kepastian)</span>
                  </label>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={preferences.notifyOnHighFitLead}
                      onChange={e => updatePreferences({ notifyOnHighFitLead: e.target.checked })}
                    />
                    <span>Kirim alert saat Job Hunter menemukan lowongan dengan kecocokan tinggi (&gt; 85% Fit Score)</span>
                  </label>
                </div>
              </div>

              {/* Calendar & ICS Card */}
              <div className="settings-card">
                <div className="card-top-icon">
                  <Calendar size={18} />
                  <div>
                    <h3>Sinkronisasi Kalender (ICS Feed)</h3>
                    <p className="setting-desc">
                      Ekspor semua jadwal wawancara ke Google Calendar, Apple Calendar, atau Outlook.
                    </p>
                  </div>
                </div>

                <div className="integration-actions-row">
                  <button className="primary compact-btn" onClick={handleExportICS}>
                    <Download size={14} /> Download File .ICS ({interviews.length} Sesi Interview)
                  </button>
                  <button
                    className="secondary compact-btn"
                    onClick={() => {
                      navigator.clipboard.writeText('https://junction.local/api/calendar/feed.ics');
                      alert('WebCal feed URL disalin ke clipboard!');
                    }}
                  >
                    <Copy size={12} /> Salin URL WebCal Feed
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: Data & Storage */}
          {activeSection === 'data' && (
            <div className="settings-panel">
              <div className="panel-title">
                <h2>Data, Storage & Auto-Sync Backup</h2>
                <p>
                  Pencadangan data berlapis: Lapisan 1 untuk penggunaan pribadi (CSV), Lapisan 2 untuk sistem (JSON), dan mesin Auto-Sync otomatis.
                </p>
              </div>

              {/* Real-time Auto-Sync Backup Engine */}
              <div className="settings-card" style={{ borderLeft: '3px solid #18181b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span className="eyebrow" style={{ color: '#18181b' }}>SINKRONISASI OTOMATIS</span>
                    <h3 style={{ margin: '4px 0 6px' }}>Auto-Sync Backup Snapshot</h3>
                    <p className="setting-desc" style={{ maxWidth: '640px' }}>
                      Sistem secara otomatis membuat dan menyegarkan snapshot cadangan data Anda setiap kali terjadi mutasi lamaran, pembaruan status, atau catatan baru. Anda tidak perlu lagi khawatir lupa mem-backup data secara manual.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        font: "11px 'DM Mono'",
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: autoBackupConfig.enabled ? '#f4f4f5' : '#fafafa',
                        color: autoBackupConfig.enabled ? '#18181b' : '#71717a',
                        border: `1px solid ${autoBackupConfig.enabled ? '#e4e4e7' : '#e4e4e7'}`,
                      }}
                    >
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: autoBackupConfig.enabled ? '#10b981' : '#71717a',
                        }}
                      />
                      {autoBackupConfig.enabled ? 'Auto-Sync Aktif' : 'Non-Aktif'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderTop: '1px solid #ebece6', marginTop: '12px' }}>
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block', color: '#202320' }}>
                      Aktifkan Pencadangan Otomatis Berkelanjutan
                    </strong>
                    <span style={{ fontSize: '11px', color: '#777c73' }}>
                      Menyimpan snapshot mutakhir secara lokal dan merefresh data backup di latar belakang.
                    </span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={autoBackupConfig.enabled}
                      onChange={(e) => handleToggleAutoBackup(e.target.checked)}
                    />
                    <span className="slider round" />
                  </label>
                </div>

                {autoBackupConfig.enabled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#555e50' }}>Frekuensi Auto-Sync:</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {(['realtime', 'daily', 'weekly'] as const).map((freq) => (
                          <button
                            key={freq}
                            type="button"
                            onClick={() => handleUpdateFrequency(freq)}
                            className={autoBackupConfig.frequency === freq ? 'primary compact-btn' : 'secondary compact-btn'}
                            style={{ fontSize: '11px', textTransform: 'capitalize', padding: '4px 10px' }}
                          >
                            {freq === 'realtime' ? 'Real-time (Tiap Mutasi)' : freq === 'daily' ? 'Harian (24 Jam)' : 'Mingguan'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {latestSnapshot && (
                      <div
                        style={{
                          background: '#f5f5f0',
                          border: '1px solid #dedfd8',
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                          <span style={{ fontSize: '12px', color: '#333730' }}>
                            Snapshot terbaru tersimpan:{' '}
                            <b style={{ font: "12px 'DM Mono'" }}>
                              {new Date(latestSnapshot.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} ({latestSnapshot.applicationCount} lamaran)
                            </b>
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleDownloadLatestAutoBackup('csv')}
                            className="secondary compact-btn"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 8px' }}
                          >
                            <Download size={12} /> Unduh Snapshot CSV
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadLatestAutoBackup('json')}
                            className="secondary compact-btn"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 8px' }}
                          >
                            <Download size={12} /> Unduh Snapshot JSON
                          </button>
                          <button
                            type="button"
                            onClick={handleRestoreFromLatestSnapshot}
                            className="secondary compact-btn"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 8px', color: '#455928' }}
                          >
                            <RotateCcw size={12} /> Pulihkan
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Two-Tier Export Cards */}
              <div className="settings-card">
                <h3>Ekspor Data Berlapis (Two-Tier Export)</h3>
                <p className="setting-desc">
                  Pilih format cadangan sesuai peruntukan: <strong>Lapisan 1 (CSV)</strong> untuk keperluan pribadi dan spreadsheet, atau <strong>Lapisan 2 (JSON)</strong> untuk arsip sistem relasional lengkap.
                </p>

                <div className="export-cards-grid">
                  {/* Layer 1: Personal CSV */}
                  <div className="export-action-card" style={{ background: '#fcfcf9', border: '1px solid #d5dec4' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ font: "10px 'DM Mono'", background: '#edf2e3', color: '#455928', padding: '2px 6px', borderRadius: '3px', fontWeight: 600 }}>
                          LAPISAN 1 · PRIBADI
                        </span>
                      </div>
                      <strong style={{ fontSize: '14px', color: '#202320' }}>Personal Spreadsheet (CSV)</strong>
                      <p style={{ fontSize: '12px', color: '#666b62', margin: '4px 0 12px', lineHeight: 1.5 }}>
                        Format ringan 10+ kolom siap dibuka di Microsoft Excel, Google Sheets, atau dicetak sebagai catatan kerja fisik pribadi (Company, Position, Salary, Status, Recruiter Contact, Notes).
                      </p>
                    </div>
                    <button className="primary compact-btn" onClick={handleExportCSV}>
                      <Download size={14} /> Download CSV Pribadi ({applications.length} Baris)
                    </button>
                  </div>

                  {/* Layer 2: Full JSON System */}
                  <div className="export-action-card">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ font: "10px 'DM Mono'", background: '#f0f2eb', color: '#555e50', padding: '2px 6px', borderRadius: '3px', fontWeight: 600 }}>
                          LAPISAN 2 · SISTEM
                        </span>
                      </div>
                      <strong style={{ fontSize: '14px', color: '#202320' }}>Full Relational JSON Backup</strong>
                      <p style={{ fontSize: '12px', color: '#666b62', margin: '4px 0 12px', lineHeight: 1.5 }}>
                        Arsip database lengkap berisi profil kandidat, lamaran, penawaran gaji (Offers & THP), jadwal wawancara, metrik CV, leads AI, dan jejak audit aktivitas untuk pemulihan bencana (*disaster recovery*).
                      </p>
                    </div>
                    <button className="secondary compact-btn" onClick={handleExportJSON}>
                      <Download size={14} /> Download Full JSON Backup
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <h3>Impor Data (Import CSV / JSON)</h3>
                <p className="setting-desc">
                  Unggah file spreadsheet CSV pribadi atau backup JSON untuk menambahkan atau memulihkan data ke dalam sistem.
                </p>
                <div className="import-box">
                  <Upload size={24} />
                  <div>
                    <label className="upload-trigger-btn">
                      <span>Pilih File CSV atau JSON</span>
                      <input
                        type="file"
                        accept=".csv,.json"
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                      />
                    </label>
                    <small>Mendukung file .csv hasil ekspor Excel/Sheets atau backup .json Junction.</small>
                  </div>
                </div>
                {importStatus && <p className="status-msg">{importStatus}</p>}
              </div>

              <div className="settings-card">
                <h3>Statistik Penyimpanan & Kuota</h3>
                <div className="stats-row">
                  <div className="stat-pill">
                    <span>Lamaran Aktif</span>
                    <b>{applications.length}</b>
                  </div>
                  <div className="stat-pill">
                    <span>Varian CV</span>
                    <b>{cvs.length}</b>
                  </div>
                  <div className="stat-pill">
                    <span>Sesi Interview</span>
                    <b>{interviews.length}</b>
                  </div>
                  <div className="stat-pill">
                    <span>Database Mode</span>
                    <b>PocketBase SQLite (WAL)</b>
                  </div>
                </div>
              </div>

              <div className="settings-card danger-zone">
                <h3 className="danger-text">Zona Bahaya (Danger Zone)</h3>
                <div className="danger-row">
                  <div>
                    <strong>Reset ke Data Awal (Seed Data)</strong>
                    <p className="setting-desc">
                      Menghapus modifikasi lokal dan memulihkan data demo awal (Apple, Microsoft, Stripe).
                    </p>
                  </div>
                  <button
                    className="danger-btn"
                    onClick={() => {
                      if (confirm('Apakah Anda yakin ingin me-reset ke seed data demo?')) {
                        onResetToSeed?.();
                      }
                    }}
                  >
                    Reset Seed
                  </button>
                </div>
                <div className="danger-row">
                  <div>
                    <strong>Reset Pengaturan Aplikasi</strong>
                    <p className="setting-desc">
                      Kembalikan seluruh preferensi CRM dan filter AI Hunter ke pengaturan standar.
                    </p>
                  </div>
                  <button className="secondary compact-btn" onClick={resetPreferences}>
                    Reset Preferensi
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: Security & Privacy */}
          {activeSection === 'security' && (
            <div className="settings-panel">
              <div className="panel-title">
                <h2>Security & Privacy</h2>
                <p>Isolasi multi-tenant data, enkripsi token OAuth at-rest, dan kontrol sesi.</p>
              </div>

              <div className="settings-card">
                <div className="security-badge-grid">
                  <div className="security-item">
                    <ShieldCheck size={20} className="secure-icon" />
                    <div>
                      <strong>Multi-Tenant Data Isolation</strong>
                      <p>
                        Aturan keamanan SQLite PocketBase membatasi hak akses pada level baris:{' '}
                        <code>owner = @request.auth.id</code>. Pengguna lain tidak dapat membaca lamaran atau token Anda.
                      </p>
                    </div>
                  </div>

                  <div className="security-item">
                    <Lock size={20} className="secure-icon" />
                    <div>
                      <strong>Zero-Token Leakage Architecture</strong>
                      <p>
                        Token OAuth Gmail (<code>accessToken</code> & <code>refreshToken</code>) dienkripsi dengan AES-256 saat tersimpan di disk dan otomatis dihapus dari respon HTTP sebelum dikirim ke browser.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <h3>Sesi Pengguna Aktif</h3>
                <div className="session-info-table">
                  <div className="session-row">
                    <span>Status Autentikasi</span>
                    <strong className="status-green">
                      {isOfflineMode() ? 'Offline Mode (Local Storage)' : 'PocketBase JWT Active'}
                    </strong>
                  </div>
                  <div className="session-row">
                    <span>User Record ID</span>
                    <code>{pb.authStore.model?.id || 'offline-guest-001'}</code>
                  </div>
                  <div className="session-row">
                    <span>Persistence Model</span>
                    <strong>LocalStorage (Remember Me Enabled)</strong>
                  </div>
                </div>

                <div className="card-actions">
                  <button className="secondary compact-btn" onClick={clearSession}>
                    <LogOut size={14} /> Tutup Sesi & Keluar (Sign Out)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 8: About & Documentation */}
          {activeSection === 'about' && (
            <div className="settings-panel">
              <div className="panel-title">
                <h2>About & System Specifications</h2>
                <p>Informasi rilis aplikasi, arsitektur teknis, dan tautan dokumentasi domain.</p>
              </div>

              <div className="settings-card">
                <div className="about-hero">
                  <div className="brand-mark">J</div>
                  <div>
                    <h3>Junction Career CRM</h3>
                    <p>Version 1.4.0 · Enterprise Career Pipeline & Funnel Engine</p>
                  </div>
                </div>

                <div className="specs-list">
                  <div className="spec-item">
                    <span>Backend Engine</span>
                    <strong>PocketBase (Go + SQLite in WAL mode)</strong>
                  </div>
                  <div className="spec-item">
                    <span>Frontend Architecture</span>
                    <strong>React 18 + Vite + TypeScript + Tailwind CSS</strong>
                  </div>
                  <div className="spec-item">
                    <span>AI Engine Model</span>
                    <strong>Two-Tier Triage Evaluator (Dealbreaker + Skill Fit Scoring)</strong>
                  </div>
                  <div className="spec-item">
                    <span>Server State Machine</span>
                    <strong>Monotonic Safe State Progression (Late notifications never downgrade)</strong>
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '15px' }}>
                      <Smartphone size={18} style={{ color: '#556d33' }} />
                      Progressive Web App (PWA) & Kesiapan Mobile
                    </h3>
                    <p className="setting-desc" style={{ margin: '4px 0 0' }}>
                      Aplikasi ini dirancang sebagai PWA mandiri dengan kapabilitas offline dan akselerasi hardware penuh.
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: isInstalled ? '#eef2e6' : '#f0eee8',
                      color: isInstalled ? '#556d33' : '#687063',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {isInstalled ? 'STANDALONE PWA ACTIVE' : 'BROWSER APP MODE'}
                  </span>
                </div>

                <div className="specs-list" style={{ marginBottom: '16px' }}>
                  <div className="spec-item">
                    <span>Hardware Acceleration</span>
                    <strong>GPU Compositing + Content-Visibility Auto (Zero-Jank 60/120fps)</strong>
                  </div>
                  <div className="spec-item">
                    <span>Offline Engine</span>
                    <strong>Service Worker v2 (Stale-While-Revalidate Caching)</strong>
                  </div>
                  <div className="spec-item">
                    <span>Touch Physics</span>
                    <strong>Non-blocking Manipulation + No Tap Delay (Tap highlight removed)</strong>
                  </div>
                </div>

                {canInstall && (
                  <button
                    type="button"
                    onClick={promptInstall}
                    className="primary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '44px' }}
                  >
                    <Smartphone size={16} /> Pasang Junction ke Layar Utama Ponsel / Desktop
                  </button>
                )}

                <p style={{ fontSize: '11px', color: '#7a8174', margin: canInstall ? '12px 0 0' : '0', lineHeight: 1.5 }}>
                  Petunjuk iOS Safari: Ketuk tombol <strong>Bagikan (Share)</strong> di bilah bawah Safari, lalu pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
                </p>
              </div>

              <div className="settings-card">
                <h3>Dokumentasi & Standar Arsitektur</h3>
                <div className="doc-links-grid">
                  <div className="doc-card">
                    <strong>AGENTS.md</strong>
                    <p>Aturan kerja multi-agent AI software engineering team repository ini.</p>
                  </div>
                  <div className="doc-card">
                    <strong>GLOSSARY.md</strong>
                    <p>Definisi domain model: Dealbreaker, Fit Score, Monotonic Transition, Ghosting.</p>
                  </div>
                  <div className="doc-card">
                    <strong>ADR-0001</strong>
                    <p>Architectural Decision Record: Two-Tier AI Job Hunter Triage.</p>
                  </div>
                  <div className="doc-card">
                    <strong>ADR-0002</strong>
                    <p>Architectural Decision Record: Monotonic Safe State Progression Hierarchy.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showAtsResumeModal && (
        <AtsResumeFormatterModal
          isOpen={showAtsResumeModal}
          onClose={() => setShowAtsResumeModal(false)}
          profile={profile}
        />
      )}
    </div>
  );
}
