import React from 'react';
import { ExternalLink, Search, Users, ShieldCheck, UserCheck, Briefcase } from 'lucide-react';

interface CompanyDeepLinkCardProps {
  company: string;
  onCompanyChange: (newCompany: string) => void;
  availableCompanies: string[];
}

export const CompanyDeepLinkCard: React.FC<CompanyDeepLinkCardProps> = ({
  company,
  onCompanyChange,
  availableCompanies,
}) => {
  const trimmed = company.trim() || 'Tech';

  const firstDegreeUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
    trimmed
  )}&network=%5B%22F%22%5D`;

  const recruiterUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
    `${trimmed} recruiter`
  )}`;

  const managerUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
    `${trimmed} engineering manager`
  )}`;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Target Company Deep-Linker</h3>
            <p className="text-xs text-slate-400">Pencarian presisi langsung ke LinkedIn tanpa repot mengetik filter</p>
          </div>
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <label className="text-xs font-medium text-slate-300">Nama Perusahaan Target</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={company}
            onChange={(e) => onCompanyChange(e.target.value)}
            placeholder="Contoh: Gojek, Traveloka, Stripe..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {availableCompanies.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 font-medium">Dari Lamaran:</span>
            {availableCompanies.slice(0, 5).map((comp) => (
              <button
                key={comp}
                type="button"
                onClick={() => onCompanyChange(comp)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                  company.toLowerCase() === comp.toLowerCase()
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 font-medium'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {comp}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/60">
        <a
          href={firstDegreeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 hover:border-emerald-500/60 text-slate-200 hover:text-emerald-300 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300">
                Koneksi Tingkat-1
              </div>
              <div className="text-[10px] text-slate-400">Teman / Alumni di {trimmed}</div>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
        </a>

        <a
          href={recruiterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-blue-500/30 hover:border-blue-500/60 text-slate-200 hover:text-blue-300 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-300">
                Recruiter & TA
              </div>
              <div className="text-[10px] text-slate-400">Pemberi Kerja Langsung</div>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400" />
        </a>

        <a
          href={managerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-purple-500/30 hover:border-purple-500/60 text-slate-200 hover:text-purple-300 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <Briefcase className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <div className="text-xs font-semibold text-slate-200 group-hover:text-purple-300">
                Engineering Lead
              </div>
              <div className="text-[10px] text-slate-400">Hiring Manager / Team Lead</div>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400" />
        </a>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800/40">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>Prioritas: Hubungi 1st-degree (orang dalam) terlebih dahulu untuk meminta referral sebelum cold-message ke recruiter.</span>
      </div>
    </div>
  );
};
