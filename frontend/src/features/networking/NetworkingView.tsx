import { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Linkedin,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Search,
  Building,
  Briefcase,
  Copy,
  Check,
  Trash2,
  Edit2,
  ExternalLink,
  Sparkles,
  X,
  Save,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useProfessionalContacts } from '../../hooks/useProfessionalContacts';
import type { ProfessionalContact, RelationshipType, ReferralStatus } from '../../lib/pb-types';
import { daysSince, sanitizeUrl } from '../../lib/utils';
import { EmptyState } from '../../components/ui/EmptyState';

export function NetworkingView() {
  const { contacts, loading, addContact, updateContact, deleteContact } = useProfessionalContacts();

  const [search, setSearch] = useState('');
  const [selectedRelationship, setSelectedRelationship] = useState<string>('all');
  const [selectedReferralStatus, setSelectedReferralStatus] = useState<string>('all');

  // Contact Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ProfessionalContact | null>(null);

  // Outreach Template Modal State
  const [outreachContact, setOutreachContact] = useState<ProfessionalContact | null>(null);
  const [templateType, setTemplateType] = useState<'referral_ask' | 'coffee_chat' | 'followup' | 'thank_you'>('referral_ask');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType>('Recruiter');
  const [referralStatus, setReferralStatus] = useState<ReferralStatus>('None');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingContact(null);
    setName('');
    setCompany('');
    setRole('');
    setEmail('');
    setPhone('');
    setLinkedinUrl('');
    setRelationship('Recruiter');
    setReferralStatus('None');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: ProfessionalContact) => {
    setEditingContact(c);
    setName(c.name);
    setCompany(c.company || '');
    setRole(c.role || '');
    setEmail(c.email || '');
    setPhone(c.phone || '');
    setLinkedinUrl(c.linkedinUrl || '');
    setRelationship(c.relationship);
    setReferralStatus(c.referralStatus);
    setNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingContact) {
      await updateContact(editingContact.id, {
        name,
        company,
        role,
        email,
        phone,
        linkedinUrl,
        relationship,
        referralStatus,
        notes,
        lastContactDate: new Date().toISOString(),
      });
    } else {
      await addContact({
        name,
        company,
        role,
        email,
        phone,
        linkedinUrl,
        relationship,
        referralStatus,
        notes,
        lastContactDate: new Date().toISOString(),
      });
    }
    setIsModalOpen(false);
  };

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        c.name.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.role && c.role.toLowerCase().includes(q));

      const matchRel =
        selectedRelationship === 'all' || c.relationship === selectedRelationship;
      const matchRef =
        selectedReferralStatus === 'all' || c.referralStatus === selectedReferralStatus;

      return matchSearch && matchRel && matchRef;
    });
  }, [contacts, search, selectedRelationship, selectedReferralStatus]);

  // Network Statistics
  const stats = useMemo(() => {
    const total = contacts.length;
    const activeReferrals = contacts.filter((c) =>
      ['Requested', 'Submitted', 'Interview Secured'].includes(c.referralStatus)
    ).length;
    const pendingFollowups = contacts.filter(
      (c) => c.lastContactDate && daysSince(c.lastContactDate) >= 14
    ).length;
    return { total, activeReferrals, pendingFollowups };
  }, [contacts]);

  // Outreach Template Generator
  const outreachMessage = useMemo(() => {
    if (!outreachContact) return '';
    const firstName = outreachContact.name.split(' ')[0] || outreachContact.name;
    const targetComp = outreachContact.company || 'perusahaan Anda';

    if (templateType === 'referral_ask') {
      return `Halo ${firstName}, salam kenal! Saya memperhatikan perkembangan tim engineering di ${targetComp} dan sangat terkesan dengan pencapaian tim baru-baru ini.

Saat ini saya sedang membuka peluang untuk posisi terkait DevOps / Cloud Platform Engineer. Saya melihat ada lowongan terbuka di ${targetComp} yang sangat selaras dengan rekam jejak saya dalam mengelola infrastruktur high-availability.

Bolehkah saya meminta kesediaan Anda untuk mereferensikan profil saya ke hiring team? Terlampir CV terstruktur dan portofolio saya. Terima kasih banyak atas waktu dan bantuannya!`;
    }

    if (templateType === 'coffee_chat') {
      return `Halo ${firstName}, semoga kabarnya baik. Saya mengikuti postingan dan pandangan Anda mengenai arsitektur sistem di ${targetComp}.

Sebagai sesama praktisi di bidang teknologi, apakah memungkinkan jika kita berdiskusi santai sekitar 15-20 menit via Google Meet atau virtual coffee chat minggu ini? Saya ingin bertukar wawasan seputar engineering culture dan inisiatif platform di ${targetComp}. Terima kasih!`;
    }

    if (templateType === 'followup') {
      return `Halo ${firstName}, semoga minggu Anda menyenangkan. Menindaklanjuti komunikasi kita sebelumnya mengenai peluang di ${targetComp}, saya ingin menanyakan apakah ada kabar terbaru dari tim talent acquisition?

Saya sangat antusias untuk melangkah ke tahap berikutnya. Jika ada dokumen atau portfolio teknis tambahan yang diperlukan, dengan senang hati akan saya siapkan. Terima kasih!`;
    }

    if (templateType === 'thank_you') {
      return `Halo ${firstName}, terima kasih banyak atas waktu dan diskusi yang sangat informatif dalam sesi wawancara tadi. Penjelasan Anda mengenai roadmap dan tantangan skala sistem di ${targetComp} semakin meyakinkan saya bahwa posisi ini sangat cocok dengan aspirasi saya.

Semoga hari Anda menyenangkan dan saya menantikan kabar baik berikutnya!`;
    }

    return '';
  }, [outreachContact, templateType]);

  const handleCopyOutreach = async () => {
    try {
      await navigator.clipboard.writeText(outreachMessage);
      setCopyFeedback('Draf pesan berhasil disalin ke clipboard!');
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch {
      setCopyFeedback('Gagal menyalin otomatis.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / KPIs */}
      <div className="rounded-lg border border-zinc-200/90 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-[#18181b] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
              <Users size={16} />
            </span>
            <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Networking & Referral CRM
            </h1>
            <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[10px] uppercase font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Executive Headhunter & Referral Tracking
            </span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            Kelola koneksi recruiter, headhunter, hiring manager, dan rekanan referral untuk membuka peluang kerja senior.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-zinc-800 active:scale-[0.98] transition-all dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <UserPlus size={14} /> + Tambah Kontak Profesional
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-lg border border-zinc-200/90 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-[#18181b]">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">
            Total Professional Network
          </span>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
            {stats.total}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200/90 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-[#18181b]">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
            Active Referral In-Flight
          </span>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
            {stats.activeReferrals}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200/90 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-[#18181b]">
          <span className={cn("text-[11px] uppercase tracking-wider font-semibold", stats.pendingFollowups > 0 ? "text-rose-600 dark:text-rose-400" : "text-zinc-500 dark:text-zinc-400")}>
            Follow-Up Tertunda (&gt;14 Hari)
          </span>
          <div className={cn("text-2xl font-bold mt-1 font-mono", stats.pendingFollowups > 0 ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-zinc-100")}>
            {stats.pendingFollowups}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, perusahaan, atau peran..."
            className="w-full rounded-md border border-zinc-200 bg-white pl-9 pr-3 py-1.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
          />
        </div>

        <select
          value={selectedRelationship}
          onChange={(e) => setSelectedRelationship(e.target.value)}
          className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        >
          <option value="all">Semua Hubungan</option>
          <option value="Recruiter">Recruiter / Headhunter</option>
          <option value="Hiring Manager">Hiring Manager</option>
          <option value="Former Colleague">Mantan Kolega</option>
          <option value="Alumni">Alumni Kampus</option>
          <option value="Peer">Peer / Rekan Sejawat</option>
          <option value="Mentor">Mentor</option>
        </select>

        <select
          value={selectedReferralStatus}
          onChange={(e) => setSelectedReferralStatus(e.target.value)}
          className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        >
          <option value="all">Semua Status Referral</option>
          <option value="None">Tanpa Referral</option>
          <option value="Requested">Referral Diminta</option>
          <option value="Submitted">Sudah Disubmit</option>
          <option value="Interview Secured">Lolos Interview</option>
          <option value="Declined">Ditolak / Gugur</option>
        </select>
      </div>

      {/* Contacts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredContacts.map((c) => {
          const days = c.lastContactDate ? daysSince(c.lastContactDate) : null;
          const isStale = days !== null && days >= 14;

          return (
            <div
              key={c.id}
              className="rounded-lg border border-zinc-200/90 bg-white p-4 shadow-2xs hover:border-zinc-300 dark:border-zinc-800 dark:bg-[#18181b] flex flex-col justify-between gap-3 transition-colors"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {c.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {c.role || 'Professional'} {c.company ? `@ ${c.company}` : ''}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md border border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                    {c.relationship}
                  </span>
                </div>

                {/* Referral Status Badge */}
                <div className="mt-2.5 flex items-center gap-2">
                  <span
                    className={cn(
                      "font-mono text-[10px] px-2 py-0.5 rounded-md font-semibold border",
                      c.referralStatus === 'Interview Secured'
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                        : c.referralStatus === 'Submitted'
                        ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800"
                        : c.referralStatus === 'Requested'
                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                        : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                    )}
                  >
                    Referral: {c.referralStatus}
                  </span>

                  {days !== null && (
                    <span
                      className={cn(
                        "text-[11px]",
                        isStale ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-zinc-400"
                      )}
                    >
                      {days === 0 ? 'Kontak hari ini' : `${days} hari lalu`}
                    </span>
                  )}
                </div>

                {/* Notes preview */}
                {c.notes && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 border-l-2 border-zinc-900 dark:border-zinc-100 p-2 rounded-r-md mt-2.5 leading-relaxed">
                    {c.notes}
                  </p>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-2.5 mt-1">
                <div className="flex items-center gap-1.5">
                  {c.linkedinUrl && (
                    <a
                      href={sanitizeUrl(c.linkedinUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-zinc-200 bg-white p-1.5 text-[#0a66c2] hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
                      title="Buka LinkedIn"
                    >
                      <Linkedin size={13} />
                    </a>
                  )}
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                      title="Kirim Email"
                    >
                      <Mail size={13} />
                    </a>
                  )}
                  {c.phone && (
                    <a
                      href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-zinc-200 bg-white p-1.5 text-emerald-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
                      title="Kirim WhatsApp"
                    >
                      <Phone size={13} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setOutreachContact(c);
                      setTemplateType('referral_ask');
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                    title="Generate Outreach Message"
                  >
                    <Sparkles size={12} className="text-zinc-900 dark:text-zinc-100" /> Outreach
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => openEditModal(c)}
                    className="secondary compact-btn"
                    style={{ padding: '4px 8px' }}
                    title="Edit Contact"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteContact(c.id)}
                    className="secondary compact-btn"
                    style={{ padding: '4px 8px', color: '#b43d3d' }}
                    title="Delete Contact"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredContacts.length === 0 && (
        <EmptyState
          icon={Users}
          title={contacts.length === 0 ? "Belum Ada Kontak Profesional" : "Tidak Ada Kontak Sesuai Filter"}
          description={
            contacts.length === 0
              ? "Bangun jejaring karir Anda. Catat kontak rekruter, hiring manager, atau rekanan untuk meminta referral dan memantau follow-up."
              : "Coba sesuaikan kata kunci pencarian atau ganti filter relasi di atas."
          }
          actionLabel="+ Tambah Kontak Baru"
          onAction={openAddModal}
        />
      )}

      {/* Add / Edit Contact Modal */}
      {isModalOpen && (
        <div className="overlay" role="dialog" aria-modal="true" style={{ zIndex: 1050 }}>
          <div className="modal" style={{ maxWidth: '540px', width: '95vw', background: '#fff' }}>
            <div className="drawer-head">
              <span className="eyebrow" style={{ color: '#18181b' }}>
                {editingContact ? 'EDIT KONTAK' : 'KONTAK BARU'}
              </span>
              <button onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <h2 style={{ fontSize: '18px', margin: '8px 0 16px' }}>
              {editingContact ? 'Edit Data Rekanan / Recruiter' : 'Catat Koneksi & Partner Referral'}
            </h2>

            <form onSubmit={handleSaveContact} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888d82' }}>Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Praditya"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #dedfd8', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888d82' }}>Perusahaan</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Tokopedia / GoTo"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #dedfd8', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888d82' }}>Posisi / Role</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Lead Platform Recruiter"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #dedfd8', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888d82' }}>Hubungan</label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value as RelationshipType)}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #dedfd8', fontSize: '12px' }}
                  >
                    <option value="Recruiter">Recruiter / Headhunter</option>
                    <option value="Hiring Manager">Hiring Manager</option>
                    <option value="Former Colleague">Mantan Kolega</option>
                    <option value="Alumni">Alumni Kampus</option>
                    <option value="Peer">Peer / Rekan Sejawat</option>
                    <option value="Mentor">Mentor</option>
                    <option value="Other">Lainnya</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888d82' }}>LinkedIn URL</label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #dedfd8', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888d82' }}>Status Referral</label>
                  <select
                    value={referralStatus}
                    onChange={(e) => setReferralStatus(e.target.value as ReferralStatus)}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #dedfd8', fontSize: '12px' }}
                  >
                    <option value="None">None</option>
                    <option value="Requested">Diminta (Requested)</option>
                    <option value="Submitted">Sudah Disubmit</option>
                    <option value="Interview Secured">Lolos Interview</option>
                    <option value="Declined">Ditolak / Gugur</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888d82' }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@company.com"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #dedfd8', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888d82' }}>No. HP / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+62 812-..."
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #dedfd8', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888d82' }}>Catatan / Touchpoint</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan diskusi terakhir, bantuan referral untuk posisi apa, dsb..."
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #dedfd8', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #dedfd8' }}>
                <button type="button" className="secondary compact-btn" onClick={() => setIsModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="primary compact-btn" style={{ background: '#202320', color: '#f5f5f0' }}>
                  <Save size={13} /> Simpan Kontak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Outreach Message Generator Modal */}
      {outreachContact && (
        <div className="overlay" role="dialog" aria-modal="true" style={{ zIndex: 1060 }}>
          <div className="modal" style={{ maxWidth: '600px', width: '95vw', background: '#fff' }}>
            <div className="drawer-head">
              <span className="eyebrow" style={{ color: '#18181b' }}>
                1-CLICK OUTREACH GENERATOR
              </span>
              <button onClick={() => setOutreachContact(null)}>
                <X size={18} />
              </button>
            </div>

            <h2 style={{ fontSize: '18px', margin: '8px 0 4px' }}>
              Pesan Siap Kirim ke {outreachContact.name}
            </h2>
            <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#686d63' }}>
              Pilih template pesan diplomatis untuk LinkedIn InMail atau WhatsApp:
            </p>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {[
                { id: 'referral_ask', label: 'Permintaan Referral' },
                { id: 'coffee_chat', label: 'Virtual Coffee Chat' },
                { id: 'followup', label: 'Follow-Up Status' },
                { id: 'thank_you', label: 'Thank-You Post Interview' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateType(t.id as typeof templateType)}
                  style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '3px',
                    border: '1px solid #dedfd8',
                    background: templateType === t.id ? '#202320' : '#f5f5f0',
                    color: templateType === t.id ? '#f5f5f0' : '#444840',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <textarea
              readOnly
              rows={8}
              value={outreachMessage}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #dedfd8',
                borderRadius: '4px',
                fontSize: '12px',
                lineHeight: 1.5,
                background: '#fcfcf9',
              }}
            />

            {copyFeedback && (
              <div style={{ marginTop: '8px', color: '#455928', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={13} /> {copyFeedback}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #dedfd8' }}>
              <button type="button" className="secondary compact-btn" onClick={() => setOutreachContact(null)}>
                Tutup
              </button>
              <button
                type="button"
                className="primary compact-btn"
                onClick={handleCopyOutreach}
                style={{ background: '#202320', color: '#f5f5f0' }}
              >
                <Copy size={13} /> Salin Pesan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
