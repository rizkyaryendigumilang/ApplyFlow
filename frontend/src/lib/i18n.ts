import { useState, useEffect, useCallback } from 'react';

export type Locale = 'id' | 'en';

export const LOCALE_STORAGE_KEY = 'junction_crm_locale';

export const DICTIONARY: Record<Locale, Record<string, string>> = {
  id: {
    // Navigation & Shell
    'nav.cockpit': 'Dasbor Utama',
    'nav.pipeline': 'Pantau Lamaran',
    'nav.jobhunter': 'Pencari Lowongan',
    'nav.jobscout': 'Auto Job Scout',
    'nav.applyflow': 'ApplyFlow',
    'nav.inbox': 'Email Rekrutmen',
    'nav.networking': 'Kontak & Jejaring',
    'nav.linkedin': 'Asisten LinkedIn',
    'nav.offers': 'Kalkulator Gaji & Penawaran',
    'nav.aistudio': 'Otomasi & Asisten Karier',
    'nav.analytics': 'Statistik Karier',
    'nav.enterprise': 'Menu Lanjutan',
    'nav.users': 'Daftar Pengguna',
    'nav.help': 'Pusat Bantuan',
    'nav.system': 'Halaman Sistem',
    'nav.settings': 'Pengaturan',
    'nav.onboardingTour': 'Panduan Aplikasi',
    'nav.search': 'Cari',
    'nav.searchPlaceholder': 'Cari nama perusahaan, posisi, atau lokasi (Ctrl+K)...',
    'nav.notifications': 'Pemberitahuan',
    'nav.syncReady': 'Database terhubung',
    'nav.syncing': 'Menyinkronkan data...',

    // Settings & Preferences
    'settings.languageTitle': 'Bahasa Tampilan (System Language)',
    'settings.languageDesc': 'Pilih bahasa antarmuka: Bahasa Indonesia yang mudah dipahami atau English.',
    'settings.languageId': 'Bahasa Indonesia (ID)',
    'settings.languageIdDesc': 'Bahasa Indonesia yang komunikatif, lugas, dan sesuai konteks kerja lokal',
    'settings.languageEn': 'English (US)',
    'settings.languageEnDesc': 'Standard global career CRM and recruitment terminology',
    'settings.languageActiveNotice': 'Bahasa aktif saat ini: {lang}',
    'settings.savedNotice': 'Pengaturan berhasil disimpan',

    // Cockpit
    'cockpit.eyebrow': 'Ringkasan Aktivitas Karier',
    'cockpit.welcome': 'Dasbor Karier · {name}',
    'cockpit.subtitle': 'Berikut rangkuman hal penting yang perlu Anda tindak lanjuti hari ini.',
    'cockpit.attentionTitle': 'Radar Tindakan & Prioritas Hari Ini',
    'cockpit.attentionSubtitle': 'Fokus utama yang membutuhkan perhatian Anda dalam 24 hingga 48 jam ke depan',

    'cockpit.staleAlert': '{count} Lamaran Perlu Ditindaklanjuti',
    'cockpit.staleDesc': 'Sudah lebih dari 7 hari belum ada kabar. Disarankan segera mengirim pesan tindak lanjut ramah.',
    'cockpit.interviewsAlert': '{count} Jadwal Wawancara Mendatang',
    'cockpit.interviewsDesc': 'Segera tinjau profil perusahaan dan siapkan contoh jawaban pengalaman Anda.',
    'cockpit.leadsAlert': '{count} Lowongan Baru Sangat Cocok',
    'cockpit.leadsDesc': 'Tingkat kecocokan di atas 80%. Tinjau dan masukkan ke daftar lamaran aktif.',
    'cockpit.allCaughtUp': 'Seluruh lamaran dalam kondisi terpantau rapi. Tidak ada tindakan mendesak hari ini.',

    'cockpit.funnelTitle': 'Kemajuan Tahap Lamaran',
    'cockpit.funnelSubtitle': 'Pantau perjalanan lamaran Anda mulai dari tahap simpanan hingga menerima penawaran',
    'cockpit.responseRate': 'Tingkat Respons Positif',
    'cockpit.activeApplications': 'Lamaran Sedang Berjalan',

    'cockpit.quotaTitle': 'Batas Aman Undangan LinkedIn',
    'cockpit.quotaSubtitle': 'Batasi jumlah undangan per minggu agar akun Anda tetap aman dan terhindar dari pembatasan',
    'cockpit.quotaStatusSafe': 'Zona Aman',
    'cockpit.quotaStatusCaution': 'Mendekati Batas',
    'cockpit.quotaStatusDanger': 'Batas Maksimum Tercapai',
    'cockpit.quotaTargetTip': 'Saran hari ini: kirim 2 sampai 3 pesan perkenalan ke karyawan di perusahaan target Anda.',
    'cockpit.openLinkedIn': 'Buka Asisten LinkedIn',

    'cockpit.priorityTitle': '5 Lamaran Paling Mendesak',
    'cockpit.prioritySubtitle': 'Lowongan yang membutuhkan keputusan atau langkah selanjutnya',
    'cockpit.viewDetails': 'Buka Detail',
    'cockpit.noApplications': 'Belum ada lamaran aktif. Tambahkan lowongan pertama Anda sekarang.',
  },
  en: {
    // Navigation & Shell
    'nav.cockpit': 'Dashboard',
    'nav.pipeline': 'Applications',
    'nav.jobhunter': 'Job Hunter',
    'nav.jobscout': 'Auto Job Scout',
    'nav.applyflow': 'ApplyFlow',
    'nav.inbox': 'Recruitment Inbox',
    'nav.networking': 'Contacts & Network',
    'nav.linkedin': 'LinkedIn Assistant',
    'nav.offers': 'Salary & Offers',
    'nav.aistudio': 'AI Agent Studio',
    'nav.analytics': 'Career Analytics',
    'nav.enterprise': 'Advanced Menu',
    'nav.users': 'User Management',
    'nav.help': 'Help Center',
    'nav.system': 'System Pages',
    'nav.settings': 'Settings',
    'nav.onboardingTour': 'App Tour',
    'nav.search': 'Search',
    'nav.searchPlaceholder': 'Search company, position, or location (Ctrl+K)...',
    'nav.notifications': 'Notifications',
    'nav.syncReady': 'Database connected',
    'nav.syncing': 'Syncing data...',

    // Settings & Preferences
    'settings.languageTitle': 'Display Language',
    'settings.languageDesc': 'Choose your preferred language: clear Bahasa Indonesia or English.',
    'settings.languageId': 'Bahasa Indonesia (ID)',
    'settings.languageIdDesc': 'Natural Indonesian tailored for local employment context',
    'settings.languageEn': 'English (US)',
    'settings.languageEnDesc': 'Standard global career CRM and recruitment terminology',
    'settings.languageActiveNotice': 'Currently active language: {lang}',
    'settings.savedNotice': 'Settings saved successfully',

    // Cockpit
    'cockpit.eyebrow': 'Daily Overview for Job Seekers',
    'cockpit.welcome': 'Welcome back, {name}!',
    'cockpit.subtitle': 'Here is what requires your attention and follow-up today.',
    'cockpit.attentionTitle': 'Daily Action Radar & Priorities',
    'cockpit.attentionSubtitle': 'High-priority items requiring action within the next 24 to 48 hours',

    'cockpit.staleAlert': '{count} Applications Due for Follow-up',
    'cockpit.staleDesc': 'Over 7 days without response. Send a concise follow-up note.',
    'cockpit.interviewsAlert': '{count} Upcoming Interviews Scheduled',
    'cockpit.interviewsDesc': 'Review company context and STAR story prep before the call.',
    'cockpit.leadsAlert': '{count} High-Match Job Opportunities',
    'cockpit.leadsDesc': 'Scoring above 80% fit. Review and promote to active pipeline.',
    'cockpit.allCaughtUp': 'Everything is on track. No urgent follow-ups required today.',

    'cockpit.funnelTitle': 'Application Progress Funnel',
    'cockpit.funnelSubtitle': 'Track your journey from saved jobs to formal offers',
    'cockpit.responseRate': 'Positive Response Rate',
    'cockpit.activeApplications': 'Active Roles in Progress',

    'cockpit.quotaTitle': 'Safe LinkedIn Outreach Quota',
    'cockpit.quotaSubtitle': 'Safeguard your account by pacing weekly connection invitations',
    'cockpit.quotaStatusSafe': 'Safe Zone',
    'cockpit.quotaStatusCaution': 'Approaching Limit',
    'cockpit.quotaStatusDanger': 'Maximum Cap Reached',
    'cockpit.quotaTargetTip': 'Today recommendation: send 2 to 3 referral notes to connections at target companies.',
    'cockpit.openLinkedIn': 'Open LinkedIn Assistant',

    'cockpit.priorityTitle': 'Top 5 Priority Applications',
    'cockpit.prioritySubtitle': 'Roles requiring upcoming decisions or direct action',
    'cockpit.viewDetails': 'View Details',
    'cockpit.noApplications': 'No active applications found. Add your first opportunity now.',
  },
};

/**
 * Translates a key with dynamic parameter interpolation.
 */
export function translateKey(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const dict = DICTIONARY[locale] || DICTIONARY.id;
  let text = dict[key] || key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }

  return text;
}

/**
 * React hook for application-wide bilingual localization.
 */
export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'id';
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale;
    return saved === 'en' ? 'en' : 'id';
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      window.dispatchEvent(
        new CustomEvent('junction_locale_changed', { detail: newLocale })
      );
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleLocaleChange = (e: Event) => {
      const customEvent = e as CustomEvent<Locale>;
      if (
        customEvent.detail &&
        (customEvent.detail === 'id' || customEvent.detail === 'en')
      ) {
        setLocaleState(customEvent.detail);
      } else {
        const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale;
        setLocaleState(saved === 'en' ? 'en' : 'id');
      }
    };
    window.addEventListener('junction_locale_changed', handleLocaleChange);
    window.addEventListener('storage', handleLocaleChange);
    return () => {
      window.removeEventListener('junction_locale_changed', handleLocaleChange);
      window.removeEventListener('storage', handleLocaleChange);
    };
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return translateKey(locale, key, params);
    },
    [locale]
  );

  return {
    locale,
    setLocale,
    t,
  };
}
