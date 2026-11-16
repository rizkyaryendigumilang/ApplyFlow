import { useState } from 'react';
import {
  HelpCircle,
  Search,
  BookOpen,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  FileText,
  Star,
  CheckCircle2,
} from 'lucide-react';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export function HelpSupportView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openFaq, setOpenFaq] = useState<string | null>('faq-1');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const faqs: FAQItem[] = [
    {
      id: 'faq-1',
      category: 'tax',
      question: 'Bagaimana Junction menghitung PPh 21 TER 2024 dan Take Home Pay (THP)?',
      answer:
        'Kalkulator THP Junction menerapkan skema Tarif Efektif Rata-Rata (TER) resmi sesuai PMK 168/2023. Perhitungan mencakup batas maksimal upah dasar untuk BPJS Ketenagakerjaan (JP cap Rp 10.042.300) dan BPJS Kesehatan (cap Rp 12.000.000), serta memperhitungkan potongan biaya komuter riil (bensin/kos/tol).',
    },
    {
      id: 'faq-2',
      category: 'sync',
      question: 'Bagaimana cara kerja sinkronisasi notifikasi JobStreet?',
      answer:
        'Junction membaca teks email notifikasi JobStreet tanpa mengekspos token OAuth (Zero-Token Leakage). Parser regex otomatis mendeteksi baris subjek ("PT X telah melihat lamaranmu") dan memperbarui status aplikasi ke "Viewed" dengan bukti riwayat.',
    },
    {
      id: 'faq-3',
      category: 'architecture',
      question: 'Mengapa status aplikasi tidak bisa diturunkan (Monotonic State Safety)?',
      answer:
        'Berdasarkan ADR-0002, status kemajuan CRM bersifat monoton (Wishlist < Applied < Viewed < Screening < Interview < Offer). Hal ini mencegah email lama atau delayed webhooks secara tidak sengaja menurunkan status wawancara yang sudah aktif ke tahapan sebelumnya.',
    },
    {
      id: 'faq-4',
      category: 'ai',
      question: 'Bagaimana Job Hunter AI menyaring lowongan kerja?',
      answer:
        'Job Hunter menggunakan deterministic two-tier triage. Pertama, lowongan diperiksa terhadap strict dealbreakers (misal: lokasi di luar preferensi, lembur tak berbayar). Jika lolos, algoritma menghitung weighted fit score berdasarkan grafik ekuivalensi teknologi.',
    },
    {
      id: 'faq-5',
      category: 'data',
      question: 'Apakah data lamaran saya aman saat offline?',
      answer:
        'Ya. Ketika mode offline atau PocketBase belum tersambung, Junction secara otomatis menyimpan seluruh draf aplikasi, event, dan catatan ke enkripsi lokal browser (localStorage) dan menyinkronkan kembali saat online.',
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    setTicketSubmitted(true);
    setTicketSubject('');
    setTicketMessage('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div
        style={{
          background: '#fbfbf8',
          border: '1px solid #dedfd8',
          padding: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                background: '#f4f4f5',
                color: '#18181b',
                padding: '6px',
                borderRadius: '6px',
                display: 'inline-grid',
                placeItems: 'center',
              }}
            >
              <HelpCircle size={18} />
            </span>
            <h1 style={{ fontSize: '20px', margin: 0, fontWeight: 600 }}>Help & Knowledge Center</h1>
            <span
              style={{
                font: "10px 'DM Mono'",
                textTransform: 'uppercase',
                background: '#e8eedd',
                color: '#4e622b',
                padding: '4px 8px',
                borderRadius: '3px',
                border: '1px solid #d4dec3',
              }}
            >
              Support & Docs
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#777c73', margin: '8px 0 0' }}>
            Find answers regarding Indonesian tax calculations, JobStreet sync, negotiation playbooks, or contact engineering support.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #dedfd8', background: '#fff', padding: '6px 12px', width: '260px' }}>
          <Search size={14} style={{ color: '#888d82' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions or keywords..."
            style={{ border: 0, outline: 0, fontSize: '12px', width: '100%', background: 'transparent' }}
          />
        </div>
      </div>

      {/* Main Content Grid: FAQ & Playbooks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Left: Searchable FAQ */}
        <div style={{ background: '#fbfbf8', border: '1px solid #dedfd8', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>
            Frequently Asked Questions
          </h2>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'tax', label: 'PPh 21 & THP' },
              { id: 'sync', label: 'JobStreet & Sync' },
              { id: 'architecture', label: 'State Safety' },
              { id: 'ai', label: 'AI Hunter' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={activeCategory === cat.id ? 'primary compact-btn' : 'secondary compact-btn'}
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredFaqs.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #dedfd8',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#202320',
                    }}
                  >
                    <span>{faq.question}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        padding: '0 14px 14px',
                        fontSize: '12px',
                        lineHeight: 1.6,
                        color: '#555e50',
                        borderTop: '1px solid #f0f2eb',
                        paddingTop: '10px',
                      }}
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Career Playbooks & Support Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Career Playbooks */}
          <div style={{ background: '#fbfbf8', border: '1px solid #dedfd8', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', margin: 0, fontWeight: 600 }}>
                Career Negotiation Playbook
              </h3>
              <BookOpen size={16} style={{ color: '#18181b' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '12px', background: '#f5f5f0', border: '1px solid #dedfd8' }}>
                <strong style={{ fontSize: '13px', display: 'block' }}>
                  The 3-Email Anti-Ghosting Protocol
                </strong>
                <p style={{ fontSize: '11px', color: '#666b62', margin: '4px 0 0', lineHeight: 1.5 }}>
                  Cadence: Day +4 soft value check, Day +9 project milestone update, Day +16 gracious break-up email that triggers immediate recruiter replies.
                </p>
              </div>

              <div style={{ padding: '12px', background: '#f5f5f0', border: '1px solid #dedfd8' }}>
                <strong style={{ fontSize: '13px', display: 'block' }}>
                  Gross vs. Nett: Protecting Your Severance Rights
                </strong>
                <p style={{ fontSize: '11px', color: '#666b62', margin: '4px 0 0', lineHeight: 1.5 }}>
                  Why contracts written as "Gaji Bersih / Nett" often under-report your base salary in BPJS JHT calculations, and how to negotiate a statutory Gross equivalent.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Support Ticket */}
          <div style={{ background: '#fbfbf8', border: '1px solid #dedfd8', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', margin: 0, fontWeight: 600 }}>
                Contact Engineering Support
              </h3>
              <MessageSquare size={16} style={{ color: '#18181b' }} />
            </div>

            {ticketSubmitted ? (
              <div
                style={{
                  padding: '16px',
                  background: '#edf2e3',
                  border: '1px solid #cfddbe',
                  color: '#455928',
                  fontSize: '12px',
                  textAlign: 'center',
                }}
              >
                <CheckCircle2 size={24} style={{ margin: '0 auto 8px' }} />
                <b>Support Ticket Received</b>
                <p style={{ margin: '4px 0 0' }}>
                  Our engineering team has received your ticket and will respond via email within 4 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendTicket} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888d82', display: 'block', marginBottom: '4px' }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="e.g. Question about PPh 21 TER Category B calculation"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #dedfd8', background: '#fff', fontSize: '12px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888d82', display: 'block', marginBottom: '4px' }}>
                    Issue or Question Details *
                  </label>
                  <textarea
                    rows={3}
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Describe what you observed or what help you require..."
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #dedfd8', background: '#fff', fontSize: '12px' }}
                    required
                  />
                </div>

                <button type="submit" className="primary compact-btn" style={{ justifyContent: 'center' }}>
                  <Send size={13} /> Submit Ticket
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
