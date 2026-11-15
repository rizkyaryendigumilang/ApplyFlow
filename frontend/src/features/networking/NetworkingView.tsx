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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner / KPIs */}
      <div
        style={{
          background: '#fbfbf8',
          border: '1px solid #dedfd8',
          padding: '20px 24px',
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
                background: '#eef2e6',
                color: '#556b2f',
                padding: '6px',
                borderRadius: '50%',
                display: 'inline-grid',
                placeItems: 'center',
              }}
            >
              <Users size={18} />
            </span>
            <h1 style={{ fontSize: '20px', margin: 0, fontWeight: 600 }}>Networking & Referral CRM</h1>
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
              P1 · Executive Headhunter & Referral Tracking
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#777c73', margin: '6px 0 0' }}>
            Kelola koneksi recruiter, headhunter, hiring manager, dan rekanan referral untuk membuka peluang kerja senior.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="primary compact-btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#202320', color: '#f5f5f0' }}
        >
          <UserPlus size={14} /> + Tambah Kontak Profesional
        </button>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div style={{ background: '#fff', border: '1px solid #dedfd8', padding: '16px', borderRadius: '4px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#777c73', fontWeight: 600 }}>
            Total Professional Network
          </span>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#202320', marginTop: '4px' }}>
            {stats.total}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #dedfd8', padding: '16px', borderRadius: '4px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#4e622b', fontWeight: 600 }}>
            Active Referral In-Flight
          </span>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#556b2f', marginTop: '4px' }}>
            {stats.activeReferrals}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #dedfd8', padding: '16px', borderRadius: '4px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: stats.pendingFollowups > 0 ? '#b43d3d' : '#777c73', fontWeight: 600 }}>
            Follow-Up Tertunda (&gt;14 Hari)
          </span>
          <div style={{ fontSize: '24px', fontWeight: 700, color: stats.pendingFollowups > 0 ? '#b43d3d' : '#202320', marginTop: '4px' }}>
            {stats.pendingFollowups}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888d82' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, perusahaan, atau peran..."
            style={{ width: '100%', padding: '8px 10px 8px 32px', border: '1px solid #dedfd8', fontSize: '12px', background: '#fff' }}
          />
        </div>

        <select
          value={selectedRelationship}
          onChange={(e) => setSelectedRelationship(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #dedfd8', background: '#fff', fontSize: '12px' }}
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
          style={{ padding: '8px 12px', border: '1px solid #dedfd8', background: '#fff', fontSize: '12px' }}
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filteredContacts.map((c) => {
          const days = c.lastContactDate ? daysSince(c.lastContactDate) : null;
          const isStale = days !== null && days >= 14;

          return (
            <div
              key={c.id}
              style={{
                background: '#fff',
                border: '1px solid #dedfd8',
                borderRadius: '4px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 600, color: '#202320' }}>
                      {c.name}
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#686d63' }}>
                      {c.role || 'Professional'} {c.company ? `@ ${c.company}` : ''}
                    </p>
                  </div>
                  <span
                    style={{
                      font: "10px 'DM Mono'",
                      textTransform: 'uppercase',
                      background: '#f5f5f0',
                      color: '#444840',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      border: '1px solid #e0e1d8',
                    }}
                  >
                    {c.relationship}
                  </span>
                </div>

                {/* Referral Status Badge */}
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 600,
                      background:
                        c.referralStatus === 'Interview Secured'
                          ? '#edf2e3'
                          : c.referralStatus === 'Submitted'
                          ? '#eef0fa'
                          : c.referralStatus === 'Requested'
                          ? '#fcf6e6'
                          : '#f5f5f0',
                      color:
                        c.referralStatus === 'Interview Secured'
                          ? '#455928'
                          : c.referralStatus === 'Submitted'
                          ? '#2b3f78'
                          : c.referralStatus === 'Requested'
                          ? '#8c6b1e'
                          : '#777c73',
                    }}
                  >
                    Referral: {c.referralStatus}
                  </span>

                  {days !== null && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: isStale ? '#b43d3d' : '#888d82',
                        fontWeight: isStale ? 600 : 400,
                      }}
                    >
                      {days === 0 ? 'Kontak hari ini' : `${days} hari lalu`}
                    </span>
                  )}
                </div>

                {/* Notes preview */}
                {c.notes && (
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#555a50',
                      background: '#f9f9f6',
                      padding: '8px 10px',
                      borderRadius: '3px',
                      margin: '10px 0 0',
                      lineHeight: 1.4,
                      borderLeft: '2px solid #7d9850',
                    }}
                  >
                    {c.notes}
                  </p>
                )}
              </div>

              {/* Action Toolbar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #f0f1ea',
                  paddingTop: '10px',
                }}
              >
                <div style={{ display: 'flex', gap: '6px' }}>
                  {c.linkedinUrl && (
                    <a
                      href={sanitizeUrl(c.linkedinUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="secondary compact-btn"
                      style={{ padding: '4px 8px', color: '#0a66c2' }}
                      title="Buka LinkedIn"
                    >
                      <Linkedin size={13} />
                    </a>
                  )}
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="secondary compact-btn"
                      style={{ padding: '4px 8px' }}
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
                      className="secondary compact-btn"
                      style={{ padding: '4px 8px', color: '#25d366' }}
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
                    className="secondary compact-btn"
                    style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Generate Outreach Message"
                  >
                    <Sparkles size={12} style={{ color: '#7d9850' }} /> Outreach
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
              <span className="eyebrow" style={{ color: '#556b2f' }}>
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
              <span className="eyebrow" style={{ color: '#556b2f' }}>
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
