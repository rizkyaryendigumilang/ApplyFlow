import React, { useState, useMemo } from 'react';
import {
  Compass,
  Award,
  Send,
  Building2,
  Users,
} from 'lucide-react';
import type { Application, RelationshipType } from '../../lib/pb-types';
import { useCandidateProfile } from '../../hooks/useCandidateProfile';
import { useProfessionalContacts } from '../../hooks/useProfessionalContacts';
import { CompanyDeepLinkCard } from './CompanyDeepLinkCard';
import { OutreachComposerCard } from './OutreachComposerCard';
import { SafeQuotaTrackerCard } from './SafeQuotaTrackerCard';
import { ProfilePolisherCard } from './ProfilePolisherCard';
import { useLinkedInQuota } from './useLinkedInQuota';

interface LinkedInAssistantViewProps {
  applications: Application[];
}

export const LinkedInAssistantView: React.FC<LinkedInAssistantViewProps> = ({ applications }) => {
  const { profile } = useCandidateProfile();
  const { addContact } = useProfessionalContacts();
  const { increment } = useLinkedInQuota();

  const [activeTab, setActiveTab] = useState<'outreach' | 'polish'>('outreach');

  // Extract unique active companies from applications
  const availableCompanies = useMemo(() => {
    const set = new Set<string>();
    applications.forEach((app) => {
      if (app.company?.trim()) {
        set.add(app.company.trim());
      }
    });
    return Array.from(set);
  }, [applications]);

  // Default to first application or fallback
  const [selectedCompany, setSelectedCompany] = useState<string>(() => {
    return availableCompanies[0] || 'Gojek';
  });

  const [selectedRole, setSelectedRole] = useState<string>(() => {
    const matched = applications.find(
      (a) => a.company?.toLowerCase() === (availableCompanies[0] || '').toLowerCase()
    );
    return matched?.position || 'Senior Software Engineer';
  });

  // When user picks a company from dropdown/chips
  const handleCompanyChange = (newCompany: string) => {
    setSelectedCompany(newCompany);
    const matched = applications.find(
      (a) => a.company?.toLowerCase() === newCompany.trim().toLowerCase()
    );
    if (matched?.position) {
      setSelectedRole(matched.position);
    }
  };

  const candidateInfo = useMemo(() => {
    return {
      fullName: profile?.fullName || 'Rizky Pratama',
      currentRole: profile?.targetRoles?.[0] || 'Software Engineer',
      skills: profile?.skills || ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
      yearsExperience: 4,
    };
  }, [profile]);

  const handleSyncToCrm = async (contactName: string, contactRole: string, message: string) => {
    // Map contactRole / persona to valid RelationshipType
    let relType: RelationshipType = 'Peer';
    const lower = contactRole.toLowerCase();
    if (lower.includes('recruiter') || lower.includes('talent')) {
      relType = 'Recruiter';
    } else if (lower.includes('lead') || lower.includes('manager') || lower.includes('head')) {
      relType = 'Hiring Manager';
    }

    const matchedApp = applications.find(
      (a) => a.company?.toLowerCase() === selectedCompany.trim().toLowerCase()
    );

    await addContact({
      name: contactName,
      company: selectedCompany || 'Target Company',
      role: contactRole,
      relationship: relType,
      referralStatus: 'Requested',
      lastContactDate: new Date().toISOString(),
      associatedApplication: matchedApp?.id,
      notes: `[LinkedIn Assistant Outreach]:\n${message}`,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/20 rounded-3xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
              <Compass className="w-3.5 h-3.5" />
              Career Outreach & Referral Command Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              LinkedIn Assistant
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Tingkatkan konversi lamaran hingga 4x melalui outreach referral ke orang dalam (1st-degree) dan rekruter. Dilengkapi filter deep-link instan, generator pesan anti-slop, dan pelacak kuota aman mingguan.
            </p>
          </div>

          {/* Quick tab switcher */}
          <div className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 shadow-inner self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('outreach')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'outreach'
                  ? 'bg-zinc-100 text-zinc-900 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Send className="w-4 h-4" />
              Outreach & Deep-Links
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('polish')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'polish'
                  ? 'bg-zinc-100 text-zinc-900 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-4 h-4" />
              Profile & Headline Polish
            </button>
          </div>
        </div>
      </div>

      {/* Target Application Quick Bar */}
      {activeTab === 'outreach' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400">Target Lowongan Terpilih:</div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>{selectedCompany}</span>
                <span className="text-slate-500">•</span>
                <span className="text-blue-400">{selectedRole}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCompany}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="" disabled>Pilih dari Lamaran Aktif</option>
              {availableCompanies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              placeholder="Posisi target (cth: Senior Frontend)"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors w-44"
            />
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === 'outreach' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CompanyDeepLinkCard
              company={selectedCompany}
              onCompanyChange={handleCompanyChange}
              availableCompanies={availableCompanies}
            />

            <OutreachComposerCard
              company={selectedCompany}
              role={selectedRole}
              candidate={candidateInfo}
              onSyncToCrm={handleSyncToCrm}
              onIncrementQuota={increment}
            />
          </div>

          <div className="space-y-6">
            <SafeQuotaTrackerCard />

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Alur Rutinitas Harian (Daily Routine)
              </h4>
              <ol className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                  <span>Pilih perusahaan dari target Wishlist atau Applied.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                  <span>Buka pencarian Koneksi Tingkat-1 untuk mencari orang dalam. Jika ada, minta referral via DM.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                  <span>Jika tidak ada, cari Recruiter / Lead dan kirim connection invite tanpa note (aman dari limit).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[10px]">4</span>
                  <span>Klik <em>"Simpan ke Kontak Networking CRM"</em> untuk mencatat follow-up otomatis +5 hari.</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      ) : (
        <ProfilePolisherCard candidate={candidateInfo} />
      )}
    </div>
  );
};
