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

    // Sidebar Groups & Actions
    'sidebar.workspace': 'Ruang Kerja',
    'sidebar.tools': 'Alat & Pertumbuhan',
    'sidebar.admin': 'Pengaturan & Admin',
    'sidebar.createNewWork': 'Buat Peluang Baru',
    'sidebar.searchShortcut': 'Cari cepat',

    // TopBar
    'topbar.viewBoard': 'Papan',
    'topbar.viewTable': 'Tabel',
    'topbar.newOpportunity': 'Peluang Baru',
    'topbar.newShort': 'Baru',
    'topbar.shortcutsTitle': 'Pintasan Keyboard',
    'topbar.themeDark': 'Ganti ke Mode Gelap',
    'topbar.themeLight': 'Ganti ke Mode Terang',

    // Add Opportunity Modal
    'modal.addWork.title': 'Buat Peluang Baru',
    'modal.addWork.subtitle': 'Ubah peluang karier Anda menjadi langkah nyata.',
    'modal.addWork.position': 'Nama Posisi',
    'modal.addWork.positionPlaceholder': 'Masukkan nama posisi yang jelas (misal: Technical Consultant Analyst)...',
    'modal.addWork.company': 'Perusahaan',
    'modal.addWork.companyPlaceholder': 'Contoh: PT Bank Central Asia, Tokopedia...',
    'modal.addWork.description': 'Deskripsi & Catatan',
    'modal.addWork.descriptionPlaceholder': 'Tambahkan rincian mengenai peluang, keterampilan yang dibutuhkan, atau catatan penting...',
    'modal.addWork.priority': 'Prioritas',
    'modal.addWork.priorityUrgent': 'Mendesak',
    'modal.addWork.priorityHigh': 'Tinggi',
    'modal.addWork.priorityMedium': 'Sedang',
    'modal.addWork.priorityLow': 'Rendah',
    'modal.addWork.dueDate': 'Batas Waktu',
    'modal.addWork.assignee': 'Penanggung Jawab',
    'modal.addWork.cycle': 'Gelombang Seleksi',
    'modal.addWork.createMore': 'Buat lagi',
    'modal.addWork.discard': 'Batal',
    'modal.addWork.submit': 'Simpan Peluang',
    'modal.addWork.successToast': 'Lowongan berhasil disimpan ke pipeline. Silakan buat entri berikutnya!',

    // Bento Analytics
    'bento.priorityTitle': 'Sebaran Prioritas',
    'bento.priorityDesc': 'Sebaran intensitas dan urgensi peluang kerja di radar Anda.',
    'bento.liveChart': 'Grafik Langsung',
    'bento.workStatusTitle': 'Status Lamaran',
    'bento.totalLabel': 'Total',
    'bento.insightTitle': 'Pantau Perkembangan Lamaran',
    'bento.insightDesc': 'Sistem memantau pergerakan lamaran harian Anda agar peluang penawaran kerja maksimal.',
    'bento.recentActivityTitle': 'Aktivitas Terkini',
    'bento.recentActivityLive': 'Log Langsung',
    'bento.focusNextTitle': 'Fokus Tindakan Selanjutnya',
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

    // Sidebar Groups & Actions
    'sidebar.workspace': 'Workspace',
    'sidebar.tools': 'Tools & Growth',
    'sidebar.admin': 'Settings & Admin',
    'sidebar.createNewWork': 'Create New Work',
    'sidebar.searchShortcut': 'Quick search',

    // TopBar
    'topbar.viewBoard': 'Board',
    'topbar.viewTable': 'Table',
    'topbar.newOpportunity': 'New Opportunity',
    'topbar.newShort': 'New',
    'topbar.shortcutsTitle': 'Keyboard Shortcuts',
    'topbar.themeDark': 'Switch to Dark Mode',
    'topbar.themeLight': 'Switch to Light Mode',

    // Add Opportunity Modal
    'modal.addWork.title': 'Create New Work Item',
    'modal.addWork.subtitle': 'Turn your career leads into actionable tasks.',
    'modal.addWork.position': 'Position Title',
    'modal.addWork.positionPlaceholder': 'Enter a clear and descriptive title...',
    'modal.addWork.company': 'Company Name',
    'modal.addWork.companyPlaceholder': 'e.g. Acme Corp, Stripe...',
    'modal.addWork.description': 'Description & Notes',
    'modal.addWork.descriptionPlaceholder': 'Add more details about this work item, required skills, or notes...',
    'modal.addWork.priority': 'Priority',
    'modal.addWork.priorityUrgent': 'Urgent',
    'modal.addWork.priorityHigh': 'High',
    'modal.addWork.priorityMedium': 'Medium',
    'modal.addWork.priorityLow': 'Low',
    'modal.addWork.dueDate': 'Due Date',
    'modal.addWork.assignee': 'Assignee',
    'modal.addWork.cycle': 'Hiring Cycle',
    'modal.addWork.createMore': 'Create more',
    'modal.addWork.discard': 'Discard',
    'modal.addWork.submit': 'Create Work Item',
    'modal.addWork.successToast': 'Opportunity saved to pipeline successfully. Ready for next entry!',

    // Bento Analytics
    'bento.priorityTitle': 'Priority Distribution',
    'bento.priorityDesc': 'Intensity and urgency distribution of active opportunities in your radar.',
    'bento.liveChart': 'Live Chart',
    'bento.workStatusTitle': 'Application Status',
    'bento.totalLabel': 'Total',
    'bento.insightTitle': 'See how your applications progress',
    'bento.insightDesc': 'AI monitors your daily momentum to maximize conversion into job offers.',
    'bento.recentActivityTitle': 'Recent Activity',
    'bento.recentActivityLive': 'Live Logs',
    'bento.focusNextTitle': 'Focus Next',
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
