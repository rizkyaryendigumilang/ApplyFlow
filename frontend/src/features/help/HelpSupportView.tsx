import { useState } from 'react';
import {
  HelpCircle,
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  CheckCircle2,
  Send,
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'tax' | 'sync' | 'architecture' | 'ai';
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'tax',
    question: 'Bagaimana Take Home Pay (THP) dan PPh 21 dihitung?',
    answer:
      'Perhitungan menggunakan tarif efektif rata-rata (TER) PP 58/2023 & PMK 168/2023. Kategori PTKP (TK/0, K/1, dsb.) menentukan tabel TER (A, B, atau C). Iuran BPJS Ketenagakerjaan (JHT 2%, JP 1%) dan BPJS Kesehatan (1%) dipotong sesuai batas upah maksimum resmi 2024.',
  },
  {
    id: 'faq-2',
    category: 'sync',
    question: 'Bagaimana sistem keamanan membaca email JobStreet?',
    answer:
      'Sinkronisasi menggunakan OAuth 2.0 Gmail dengan izin read-only terbatas. Token akses dienkripsi menggunakan AES-256 pada database server dan dihapus dari respons HTTP ke browser demi privasi penuh.',
  },
  {
    id: 'faq-3',
    category: 'architecture',
    question: 'Apakah status lamaran bisa turun atau mundur?',
    answer:
      'Tidak. State machine mengikuti hierarki monotonik (Wishlist < Applied < Viewed < Screening < Interview < Offer). Notifikasi atau email susulan tidak akan menurunkan progress lamaran yang sudah dicapai.',
  },
  {
    id: 'faq-4',
    category: 'ai',
    question: 'Bagaimana AI Job Hunter menyaring dan menilai kecocokan lowongan?',
    answer:
      'AI Job Hunter melakukan eliminasi bertingkat: menyaring kriteria dealbreaker (misal: industri perjudian, tanpa BPJS, atau batas gaji di bawah minimum), kemudian menghitung fit score berbasis kata kunci keahlian dari CV master Anda.',
  },
];

export function HelpSupportView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openFaq, setOpenFaq] = useState<string | null>('faq-1');

  // Support ticket form state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCat = activeCategory === 'all' || faq.category === activeCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;
    setTicketSubmitted(true);
    setTicketSubject('');
    setTicketMessage('');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#18181b] shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center">
              <HelpCircle size={17} />
            </div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Pusat Bantuan & Panduan Sistem
            </h1>
            <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              Dokumentasi
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
            Panduan kalkulasi pajak PPh 21, integrasi email rekrutmen, playbook negosiasi, dan dukungan teknis.
          </p>
        </div>

        <div className="flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 rounded-lg px-3 py-1.5 w-full sm:w-64">
          <Search size={14} className="text-zinc-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pertanyaan atau topik..."
            className="w-full text-xs bg-transparent border-0 outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
          />
        </div>
      </div>

      {/* Main Content Grid: FAQ & Playbooks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Searchable FAQ */}
        <div className="p-6 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#18181b] shadow-2xs">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3.5 tracking-tight">
            Pertanyaan yang Sering Diajukan (FAQ)
          </h2>

          <div className="flex gap-1.5 mb-4 flex-wrap">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'tax', label: 'PPh 21 & THP' },
              { id: 'sync', label: 'Sinkronisasi' },
              { id: 'architecture', label: 'Keamanan Data' },
              { id: 'ai', label: 'AI Hunter' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                  activeCategory === cat.id
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-950 font-semibold'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {filteredFaqs.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-lg border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/50 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                    className="w-full p-3.5 flex justify-between items-center text-left text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50/70 dark:hover:bg-zinc-850/50 transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? <ChevronUp size={15} className="text-zinc-400 shrink-0 ml-2" /> : <ChevronDown size={15} className="text-zinc-400 shrink-0 ml-2" />}
                  </button>
                  {isOpen && (
                    <div className="px-3.5 pb-3.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/60 pt-2.5">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Career Playbooks & Support Form */}
        <div className="flex flex-col gap-6">
          {/* Career Playbooks */}
          <div className="p-6 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#18181b] shadow-2xs">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Playbook & Strategi Negosiasi
              </h3>
              <BookOpen size={16} className="text-zinc-400" />
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3.5 rounded-lg border border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/50 dark:bg-zinc-900/30">
                <strong className="text-zinc-900 dark:text-zinc-100 font-semibold block">
                  Protokol Follow-up 3 Tahap (Anti-Ghosting)
                </strong>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-1 leading-relaxed">
                  Jadwal pengingat bertahap: Hari +4 evaluasi singkat, Hari +9 pembaruan portofolio, Hari +16 penegasan kesiapan posisi.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/50 dark:bg-zinc-900/30">
                <strong className="text-zinc-900 dark:text-zinc-100 font-semibold block">
                  Gross vs Nett: Perlindungan Hak JHT BPJS
                </strong>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-1 leading-relaxed">
                  Memahami alasan kontrak berstatus nett sering kali memotong basis pelaporan upah BPJS Ketenagakerjaan ke ambang minimum.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Support Ticket */}
          <div className="p-6 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#18181b] shadow-2xs">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Hubungi Dukungan Rekayasa Sistem
              </h3>
              <MessageSquare size={16} className="text-zinc-400" />
            </div>

            {ticketSubmitted ? (
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs text-center space-y-1">
                <CheckCircle2 size={22} className="mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
                <b className="block">Tiket Dukungan Berhasil Dikirim</b>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80">
                  Tim teknis kami telah menerima pertanyaan Anda dan akan menindaklanjutinya dalam 4 jam kerja.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendTicket} className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-mono uppercase font-semibold text-zinc-400 mb-1">
                    Topik / Subjek
                  </label>
                  <input
                    type="text"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Contoh: Pertanyaan seputar perhitungan BPJS atau PPh 21"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-semibold text-zinc-400 mb-1">
                    Rincian Pertanyaan
                  </label>
                  <textarea
                    rows={3}
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Tuliskan kendala atau pertanyaan yang ingin Anda konsultasikan..."
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 active:scale-[0.98] transition-all cursor-pointer mt-1"
                >
                  <Send size={13} /> Kirim Tiket Dukungan
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
