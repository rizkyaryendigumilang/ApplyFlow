import { useState } from 'react';
import {
  Sparkles,
  Compass,
  Sliders,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Shield,
  Layers,
  Send,
  Mail,
  Briefcase,
  MapPin,
  Check,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { idr } from '../../lib/utils';

export interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: OnboardingData) => void;
}

export interface OnboardingData {
  targetRole: string;
  expectedSalary: number;
  workMode: 'Remote' | 'Hybrid' | 'On-site';
  targetLocation: string;
  cvTemplate: 'harvard-ats' | 'tech-deep';
  telegramBriefing: boolean;
  gmailAutoSync: boolean;
}

export function OnboardingWizardModal({
  isOpen,
  onClose,
  onComplete,
}: OnboardingWizardModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Initial config state
  const [targetRole, setTargetRole] = useState('Senior Frontend Engineer');
  const [expectedSalary, setExpectedSalary] = useState(25000000);
  const [workMode, setWorkMode] = useState<'Remote' | 'Hybrid' | 'On-site'>('Hybrid');
  const [targetLocation, setTargetLocation] = useState('Jakarta / Remote');
  const [cvTemplate, setCvTemplate] = useState<'harvard-ats' | 'tech-deep'>('harvard-ats');
  const [telegramBriefing, setTelegramBriefing] = useState(true);
  const [gmailAutoSync, setGmailAutoSync] = useState(true);

  if (!isOpen) return null;

  const handleFinish = () => {
    const data: OnboardingData = {
      targetRole,
      expectedSalary,
      workMode,
      targetLocation,
      cvTemplate,
      telegramBriefing,
      gmailAutoSync,
    };
    try {
      localStorage.setItem('junction_onboarding_completed', 'true');
      localStorage.setItem('junction_onboarding_data', JSON.stringify(data));
    } catch {
      // ignore storage errors
    }
    onComplete(data);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className={cn(
          'w-full max-w-2xl rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950',
          'flex flex-col gap-6 text-zinc-900 dark:text-zinc-100'
        )}
      >
        {/* Header with step progress */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold text-sm">
              J
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Setup Panduan Karier
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Langkah {step} dari 4: {step === 1 ? 'Selamat Datang' : step === 2 ? 'Tur Fitur Inti' : step === 3 ? 'Target Karier' : 'Konfigurasi Sistem'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-3">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={cn(
                    'h-1.5 rounded-full transition-[width] duration-300 ease-out',
                    s === step
                      ? 'w-6 bg-zinc-900 dark:bg-zinc-100'
                      : s < step
                      ? 'w-2 bg-zinc-400 dark:bg-zinc-600'
                      : 'w-2 bg-zinc-200 dark:bg-zinc-800'
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Step 1: Welcome Screen */}
        {step === 1 && (
          <div className="flex flex-col gap-5 py-2">
            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                <Sparkles size={14} className="text-amber-500" /> Ruang Kerja Karier Pribadi
              </div>
              <h3 className="mt-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Selamat Datang di ApplyFlow Career CRM
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                Aplikasi privat untuk mencatat lamaran kerja, persiapan wawancara, perhitungan gaji bersih (THP), dan pengingat tindak lanjut tanpa membagikan data Anda ke pihak ketiga.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-zinc-200/70 p-3.5 dark:border-zinc-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 mb-2">
                  <Shield size={16} />
                </div>
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Keamanan Akun Terjaga</h4>
                <p className="mt-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                  Koneksi email Anda dienkripsi aman dan hanya tersimpan di perangkat database pribadi Anda.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-200/70 p-3.5 dark:border-zinc-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 mb-2">
                  <Layers size={16} />
                </div>
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Tahapan Seleksi Aman</h4>
                <p className="mt-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                  Status wawancara Anda tidak akan turun kembali secara otomatis jika ada email balasan yang terlambat.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-200/70 p-3.5 dark:border-zinc-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 mb-2">
                  <Briefcase size={16} />
                </div>
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Hitung Gaji Bersih Realistis</h4>
                <p className="mt-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                  Estimasi nominal bawa pulang (THP) sesuai aturan potongan pajak PPh 21 dan BPJS ketenagakerjaan.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Product Tour */}
        {step === 2 && (
          <div className="flex flex-col gap-4 py-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Aplikasi ini menyediakan 4 fitur utama untuk mendampingi proses pencarian kerja Anda:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                <div className="flex items-center gap-2 font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 text-xs">
                    1
                  </span>
                  Dasbor Aktivitas Harian
                </div>
                <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                  Rangkuman cepat untuk melihat lamaran yang butuh kabar, jadwal wawancara terdekat, dan peluang lowongan yang sesuai.
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                <div className="flex items-center gap-2 font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 text-xs">
                    2
                  </span>
                  Papan Pantau Lamaran
                </div>
                <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                  Tampilan kartu atau tabel untuk memantau status lamaran dari Wishlist hingga Tawaran Kerja dengan rapi dan teratur.
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                <div className="flex items-center gap-2 font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 text-xs">
                    3
                  </span>
                  Penyesuai CV & Resume ATS
                </div>
                <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                  Format resume bersih berstandar industri dan panduan penulisan pencapaian kerja yang mudah dibaca sistem seleksi (ATS).
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                <div className="flex items-center gap-2 font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 text-xs">
                    4
                  </span>
                  Penyaring Lowongan Kerja
                </div>
                <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                  Penyaring otomatis lowongan baru berdasarkan kriteria utama Anda (seperti gaji dan lokasi) serta kecocokan keahlian teknis.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Setup Wizard */}
        {step === 3 && (
          <div className="flex flex-col gap-4 py-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Target Posisi / Peran Utama
              </label>
              <div className="relative">
                <Briefcase size={16} className="absolute left-3 top-3 text-zinc-400" />
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  placeholder="Contoh: Senior Frontend Engineer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Ekspektasi Gaji Bersih Bulanan (THP)
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500 dark:text-zinc-400 font-mono select-none pointer-events-none">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9.]*"
                    value={expectedSalary > 0 ? expectedSalary.toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                      setExpectedSalary(digits === '' ? 0 : parseInt(digits, 10));
                    }}
                    placeholder="10.000.000"
                    className="w-full rounded-lg border border-zinc-300 bg-white !pl-11 pr-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 font-mono"
                  />
                </div>
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg font-mono">
                  {idr(expectedSalary)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Preferensi Mode Kerja
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Remote', 'Hybrid', 'On-site'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setWorkMode(m)}
                      className={cn(
                        'py-2 px-3 text-xs font-medium rounded-lg border transition-colors duration-150 active:scale-[0.98] transition-transform',
                        workMode === m
                          ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-950 font-semibold'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Lokasi Target Domisili
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-3 text-zinc-400" />
                  <input
                    type="text"
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    placeholder="Jakarta, Bandung, Remote"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Initial Configuration */}
        {step === 4 && (
          <div className="flex flex-col gap-4 py-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Pilih Format Standar CV ATS
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCvTemplate('harvard-ats')}
                  className={cn(
                    'p-3.5 rounded-xl border text-left transition-colors duration-150 active:scale-[0.98] transition-transform',
                    cvTemplate === 'harvard-ats'
                      ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900 dark:border-zinc-100 dark:bg-zinc-900 dark:ring-zinc-100'
                      : 'border-zinc-200 bg-white hover:bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Format Standar Harvard ATS
                    </span>
                    {cvTemplate === 'harvard-ats' && <Check size={16} className="text-zinc-900 dark:text-zinc-100" />}
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                    Format 1 kolom minimalis dan bersih, ramah dibaca mesin seleksi berkas (ATS).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setCvTemplate('tech-deep')}
                  className={cn(
                    'p-3.5 rounded-xl border text-left transition-colors duration-150 active:scale-[0.98] transition-transform',
                    cvTemplate === 'tech-deep'
                      ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900 dark:border-zinc-100 dark:bg-zinc-900 dark:ring-zinc-100'
                      : 'border-zinc-200 bg-white hover:bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Format Fokus Teknis
                    </span>
                    {cvTemplate === 'tech-deep' && <Check size={16} className="text-zinc-900 dark:text-zinc-100" />}
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                    Fokus menonjolkan lingkup proyek, teknologi yang dikuasai, dan dampak terukur.
                  </p>
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/60 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                    <Send size={15} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Ringkasan Pagi Telegram (08:30 WIB)
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Terima ringkasan jadwal wawancara dan pengingat tindak lanjut setiap pagi melalui Telegram.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={telegramBriefing}
                  onChange={(e) => setTelegramBriefing(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <Mail size={15} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Sinkronisasi Email Rekrutmen
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Pembaruan status saat lamaran dilihat atau menerima undangan wawancara.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={gmailAutoSync}
                  onChange={(e) => setGmailAutoSync(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer controls with Apple-style tactile buttons */}
        <div className="flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 active:scale-[0.98] transition-colors duration-150 transition-transform dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <ArrowLeft size={14} /> Kembali
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Lewati Panduan
              </button>
            )}
          </div>

          <div>
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 active:scale-[0.98] transition-colors duration-150 transition-transform dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
              >
                Lanjutkan <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 active:scale-[0.98] transition-colors duration-150 transition-transform dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
              >
                <CheckCircle2 size={15} /> Mulai Gunakan ApplyFlow
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
