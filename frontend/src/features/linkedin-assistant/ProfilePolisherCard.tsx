import React, { useState } from 'react';
import { Award, Copy, Check, Sparkles, User, Globe, CheckCircle2 } from 'lucide-react';
import {
  generateLinkedInHeadlines,
  generateLinkedInAbout,
  CandidateInfo,
} from './linkedin-templates';

interface ProfilePolisherCardProps {
  candidate?: CandidateInfo;
}

export const ProfilePolisherCard: React.FC<ProfilePolisherCardProps> = ({ candidate }) => {
  const [lang, setLang] = useState<'id' | 'en'>('id');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAbout, setCopiedAbout] = useState<boolean>(false);

  const headlines = generateLinkedInHeadlines({
    role: candidate?.currentRole || 'Software Engineer',
    skills: candidate?.skills || ['System Design', 'React', 'Node.js'],
    yearsExperience: candidate?.yearsExperience || 3,
  });

  const aboutText = generateLinkedInAbout({
    fullName: candidate?.fullName,
    currentRole: candidate?.currentRole,
    skills: candidate?.skills,
    yearsExperience: candidate?.yearsExperience,
    lang,
  });

  const handleCopyHeadline = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handleCopyAbout = async () => {
    try {
      await navigator.clipboard.writeText(aboutText);
      setCopiedAbout(true);
      setTimeout(() => setCopiedAbout(false), 2000);
    } catch {
      setCopiedAbout(true);
      setTimeout(() => setCopiedAbout(false), 2000);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">LinkedIn Profile & Headline Polish</h3>
            <p className="text-xs text-slate-400">Optimasi kata kunci pencarian rekruter berbasis profil ATS Anda</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
          <button
            type="button"
            onClick={() => setLang('id')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors duration-150 ${
              lang === 'id' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bahasa Indonesia
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors duration-150 ${
              lang === 'en' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Profil Banner */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-semibold shrink-0">
          <User className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <div className="text-slate-200 font-medium">
            {candidate?.fullName || 'Kandidat'} • {candidate?.currentRole || 'Professional'}
          </div>
          <div className="text-[11px] text-slate-400">
            Skills Utama: {(candidate?.skills || ['React', 'TypeScript', 'Node.js']).slice(0, 4).join(', ')}
          </div>
        </div>
      </div>

      {/* 3 Headline Variations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            3 Rekomendasi Headline LinkedIn (Tinggi Konversi Search)
          </h4>
        </div>

        <div className="space-y-2">
          {headlines.map((headline, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 transition-colors duration-150 group"
            >
              <div className="text-xs text-slate-200 leading-relaxed font-sans">{headline}</div>
              <button
                type="button"
                onClick={() => handleCopyHeadline(headline, idx)}
                className="shrink-0 p-2 text-xs font-medium text-slate-400 hover:text-purple-300 bg-slate-900 hover:bg-purple-950/40 rounded-lg border border-slate-800 hover:border-purple-500/30 transition-colors duration-150"
                title="Salin Headline"
              >
                {copiedIndex === idx ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* About Section */}
      <div className="space-y-3 pt-2 border-t border-slate-800/60">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Rekomendasi Deskripsi Profil (LinkedIn "About" Section)
          </h4>
          <button
            type="button"
            onClick={handleCopyAbout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-300 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-colors duration-150"
          >
            {copiedAbout ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Tersalin!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Salin About
              </>
            )}
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
          {aboutText}
        </div>
      </div>
    </div>
  );
};
