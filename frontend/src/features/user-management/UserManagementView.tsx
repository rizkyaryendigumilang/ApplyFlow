import { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  Check,
  X,
  Mail,
  Trash2,
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Candidate' | 'Career Coach' | 'Recruiter';
  status: 'Active' | 'Invited' | 'Suspended';
  joinedAt: string;
}

export function UserManagementView() {
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: 'usr-1',
      name: 'Rizky Aryendi Gumilang',
      email: 'admin@applyflow.local',
      role: 'Admin',
      status: 'Active',
      joinedAt: '2026-01-10',
    },
    {
      id: 'usr-2',
      name: 'Mentor Budi (Career Coach)',
      email: 'coach.budi@applyflow.local',
      role: 'Career Coach',
      status: 'Active',
      joinedAt: '2026-02-15',
    },
    {
      id: 'usr-3',
      name: 'DevOps Scout (Headhunter)',
      email: 'talent@techscout.id',
      role: 'Recruiter',
      status: 'Invited',
      joinedAt: '2026-03-01',
    },
  ]);

  const [activeTab, setActiveTab] = useState<'members' | 'roles' | 'security'>('members');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('Career Coach');
  const [notice, setNotice] = useState<string | null>(null);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    const newMember: TeamMember = {
      id: `usr-${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      status: 'Invited',
      joinedAt: new Date().toISOString().slice(0, 10),
    };

    setMembers([...members, newMember]);
    setIsInviteOpen(false);
    setInviteName('');
    setInviteEmail('');
    setNotice(`Undangan kolaborasi berhasil dikirim ke ${inviteEmail}`);
    setTimeout(() => setNotice(null), 5000);
  };

  const handleRemoveMember = (id: string) => {
    if (confirm('Hapus akses anggota tim ini?')) {
      setMembers(members.filter((m) => m.id !== id));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#18181b] shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center">
              <Users size={17} />
            </div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Manajemen Pengguna & Hak Akses
            </h1>
            <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              Multi-Tenant RBAC
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
            Kelola anggota tim, sesi review mentor karir, hak akses headhunter, dan izin delegasi akun.
          </p>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
        >
          <UserPlus size={14} /> Undang Anggota Baru
        </button>
      </div>

      {notice && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-emerald-800 dark:text-emerald-300 hover:opacity-75 font-bold cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-6 border-b border-zinc-200/80 dark:border-zinc-800 text-xs font-medium">
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'members'
              ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Users size={14} /> Anggota Tim ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'roles'
              ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Shield size={14} /> Matriks Peran & Izin
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'security'
              ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Key size={14} /> Keamanan & Sesi Aktif
        </button>
      </div>

      {/* Tab: Members */}
      {activeTab === 'members' && (
        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#18181b] overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-50/70 dark:bg-zinc-900/50 border-b border-zinc-200/80 dark:border-zinc-800 text-[10px] font-mono uppercase text-zinc-400">
                <th className="py-2.5 px-4 font-semibold">Pengguna</th>
                <th className="py-2.5 px-4 font-semibold">Peran (Role)</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Bergabung</th>
                <th className="py-2.5 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                        {member.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-semibold block">{member.name}</strong>
                        <span className="text-zinc-500 text-[11px] block">{member.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-850 text-zinc-700 dark:text-zinc-300">
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                        member.status === 'Active'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-500 text-[11px]">
                    {member.joinedAt}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {member.role !== 'Admin' && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1.5 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Hapus anggota"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Roles Matrix */}
      {activeTab === 'roles' && (
        <div className="p-6 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#18181b] shadow-2xs">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1 tracking-tight">
            Matriks Hak Akses & Kewenangan
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
            Keamanan multi-tenant memastikan kredensial OAuth terisolasi penuh, sementara coach hanya membaca catatan evaluasi.
          </p>

          <div className="rounded-lg border border-zinc-200/70 dark:border-zinc-800/70 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-50/70 dark:bg-zinc-900/50 border-b border-zinc-200/80 dark:border-zinc-800 text-[10px] font-mono uppercase text-zinc-400">
                  <th className="py-2 px-3.5 font-semibold">Kewenangan</th>
                  <th className="py-2 px-3.5 font-semibold text-center">Admin</th>
                  <th className="py-2 px-3.5 font-semibold text-center">Kandidat</th>
                  <th className="py-2 px-3.5 font-semibold text-center">Coach Karir</th>
                  <th className="py-2 px-3.5 font-semibold text-center">Rekruter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70 text-xs">
                {[
                  { perm: 'Kelola Lamaran & Gaji', adm: true, cand: true, coach: false, rec: false },
                  { perm: 'Lihat Ringkasan CV ATS', adm: true, cand: true, coach: true, rec: true },
                  { perm: 'Beri Catatan & Feedback STAR', adm: true, cand: true, coach: true, rec: false },
                  { perm: 'Akses Token OAuth Gmail', adm: true, cand: false, coach: false, rec: false },
                  { perm: 'Tambah Rekomendasi Lead Baru', adm: true, cand: true, coach: false, rec: true },
                  { perm: 'Ekspor Data CSV & Backup', adm: true, cand: true, coach: false, rec: false },
                ].map((row) => (
                  <tr key={row.perm} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                    <td className="py-2.5 px-3.5 font-medium text-zinc-800 dark:text-zinc-200">{row.perm}</td>
                    <td className="py-2.5 px-3.5 text-center">{row.adm ? <Check size={14} className="text-emerald-600 mx-auto" /> : <span className="text-zinc-300">-</span>}</td>
                    <td className="py-2.5 px-3.5 text-center">{row.cand ? <Check size={14} className="text-emerald-600 mx-auto" /> : <span className="text-zinc-300">-</span>}</td>
                    <td className="py-2.5 px-3.5 text-center">{row.coach ? <Check size={14} className="text-emerald-600 mx-auto" /> : <span className="text-zinc-300">-</span>}</td>
                    <td className="py-2.5 px-3.5 text-center">{row.rec ? <Check size={14} className="text-emerald-600 mx-auto" /> : <span className="text-zinc-300">-</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Security */}
      {activeTab === 'security' && (
        <div className="p-6 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#18181b] shadow-2xs">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1 tracking-tight">
            Sesi Login & Aktivitas Perangkat
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
            Hentikan sesi login yang tidak dikenal dan periksa jejak alamat IP terdaftar.
          </p>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs">
              <div>
                <strong className="text-zinc-900 dark:text-zinc-100 font-semibold block">Windows 11 · Chrome 133 (Sesi Saat Ini)</strong>
                <span className="text-zinc-500 text-[11px] block mt-0.5">Jakarta, Indonesia · IP: 182.253.110.12 · Aktif: Sekarang</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                Sesi Ini
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs">
              <div>
                <strong className="text-zinc-900 dark:text-zinc-100 font-semibold block">iOS 18.2 · Safari Mobile</strong>
                <span className="text-zinc-500 text-[11px] block mt-0.5">Bandung, Indonesia · IP: 36.85.22.40 · Aktif: 2 jam lalu</span>
              </div>
              <button className="px-2.5 py-1 text-[11px] font-medium rounded border border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition-colors cursor-pointer">
                Hentikan Sesi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-150" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl text-zinc-900 dark:text-zinc-100 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
                  <Mail size={13} />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-zinc-400">
                  UNDANG REKAN KOLABORASI
                </span>
              </div>
              <button onClick={() => setIsInviteOpen(false)} aria-label="Tutup modal" className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                <X size={16} />
              </button>
            </div>

            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Undang Rekan Tim atau Mentor
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Kirimkan tautan undangan dengan tingkat kewenangan peran yang ditentukan.
              </p>
            </div>

            <form onSubmit={handleSendInvite} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-zinc-400 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Contoh: Mentor Budi"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-zinc-400 mb-1">
                  Alamat Email *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="nama@perusahaan.com"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-zinc-400 mb-1">
                  Peran yang Ditugaskan
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamMember['role'])}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                >
                  <option value="Career Coach">Career Coach (Dapat meninjau CV dan memberi feedback)</option>
                  <option value="Candidate">Candidate (Dapat mengelola daftar lamaran)</option>
                  <option value="Recruiter">Recruiter (Dapat mengirim rekomendasi lead)</option>
                  <option value="Admin">Admin (Akses penuh sistem)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Kirim Undangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
