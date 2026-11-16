import { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  Check,
  X,
  Mail,
  MoreVertical,
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
      name: 'Rizky Alamsyah',
      email: 'rizky@junction.local',
      role: 'Admin',
      status: 'Active',
      joinedAt: '2026-01-10',
    },
    {
      id: 'usr-2',
      name: 'Mentor Budi (Career Coach)',
      email: 'coach.budi@junction.local',
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
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('Career Coach');
  const [notice, setNotice] = useState<string | null>(null);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;

    const newMember: TeamMember = {
      id: `usr-${Date.now()}`,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      status: 'Invited',
      joinedAt: new Date().toISOString().slice(0, 10),
    };

    setMembers([...members, newMember]);
    setInviteEmail('');
    setInviteName('');
    setIsInviteOpen(false);
    setNotice(`Undangan berhasil dikirim ke ${newMember.email} dengan peran ${newMember.role}.`);
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
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
              <Users size={18} />
            </span>
            <h1 style={{ fontSize: '20px', margin: 0, fontWeight: 600 }}>
              User Management & Access Control
            </h1>
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
              Multi-Tenant RBAC
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#777c73', margin: '8px 0 0' }}>
            Manage team members, coach reviews, recruiter access permissions, and account delegations.
          </p>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="primary compact-btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <UserPlus size={14} /> Invite Team Member
        </button>
      </div>

      {notice && (
        <div
          style={{
            padding: '12px 16px',
            background: '#edf2e3',
            border: '1px solid #cfddbe',
            color: '#455928',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} style={{ color: '#455928', fontWeight: 'bold' }}>
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          borderBottom: '1px solid #dedfd8',
          fontSize: '13px',
        }}
      >
        <button
          onClick={() => setActiveTab('members')}
          style={{
            paddingBottom: '12px',
            fontWeight: 600,
            borderBottom: activeTab === 'members' ? '2px solid #18181b' : '2px solid transparent',
            color: activeTab === 'members' ? '#09090b' : '#71717a',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Users size={15} /> Members ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          style={{
            paddingBottom: '12px',
            fontWeight: 600,
            borderBottom: activeTab === 'roles' ? '2px solid #18181b' : '2px solid transparent',
            color: activeTab === 'roles' ? '#09090b' : '#71717a',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Shield size={15} /> Roles & Permissions Matrix
        </button>
        <button
          onClick={() => setActiveTab('security')}
          style={{
            paddingBottom: '12px',
            fontWeight: 600,
            borderBottom: activeTab === 'security' ? '2px solid #18181b' : '2px solid transparent',
            color: activeTab === 'security' ? '#09090b' : '#71717a',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Key size={15} /> Security & Active Sessions
        </button>
      </div>

      {/* Tab: Members */}
      {activeTab === 'members' && (
        <div style={{ background: '#fbfbf8', border: '1px solid #dedfd8', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f5f5f0', borderBottom: '1px solid #dedfd8' }}>
                <th style={{ padding: '12px 16px', font: "10px 'DM Mono'", color: '#888d82', textTransform: 'uppercase' }}>User</th>
                <th style={{ padding: '12px 16px', font: "10px 'DM Mono'", color: '#888d82', textTransform: 'uppercase' }}>Role</th>
                <th style={{ padding: '12px 16px', font: "10px 'DM Mono'", color: '#888d82', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', font: "10px 'DM Mono'", color: '#888d82', textTransform: 'uppercase' }}>Joined</th>
                <th style={{ padding: '12px 16px', font: "10px 'DM Mono'", color: '#888d82', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} style={{ borderBottom: '1px solid #ecece7' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#d9e5c1',
                          color: '#455928',
                          display: 'grid',
                          placeItems: 'center',
                          font: "12px 'DM Mono'",
                          fontWeight: 600,
                        }}
                      >
                        {member.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <strong style={{ display: 'block', fontSize: '13px', color: '#202320' }}>{member.name}</strong>
                        <span style={{ fontSize: '11px', color: '#888d82' }}>{member.email}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        font: "10px 'DM Mono'",
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '3px',
                        background: member.role === 'Admin' ? '#e2e7d7' : '#f0f2ea',
                        color: member.role === 'Admin' ? '#202320' : '#555e50',
                        fontWeight: 600,
                      }}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        font: "10px 'DM Mono'",
                        padding: '3px 8px',
                        borderRadius: '3px',
                        background: member.status === 'Active' ? '#edf2e3' : '#fcf6e6',
                        color: member.status === 'Active' ? '#455928' : '#8c6b1e',
                      }}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', font: "11px 'DM Mono'", color: '#888d82' }}>
                    {member.joinedAt}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    {member.role !== 'Admin' && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="secondary compact-btn"
                        style={{ padding: '4px 8px', color: '#b43d3d' }}
                        title="Remove member"
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
        <div style={{ background: '#fbfbf8', border: '1px solid #dedfd8', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 8px', fontWeight: 600 }}>
            Role Permissions Matrix
          </h3>
          <p className="muted" style={{ margin: '0 0 20px' }}>
            Multi-tenant security guarantees that OAuth credentials remain isolated to the primary user, while coaches can review feedback notes.
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #dedfd8', background: '#f5f5f0' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', font: "10px 'DM Mono'", color: '#888d82' }}>PERMISSION</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', font: "10px 'DM Mono'", color: '#888d82' }}>ADMIN</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', font: "10px 'DM Mono'", color: '#888d82' }}>CANDIDATE</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', font: "10px 'DM Mono'", color: '#888d82' }}>CAREER COACH</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', font: "10px 'DM Mono'", color: '#888d82' }}>RECRUITER</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['View Applications & Stages', true, true, true, false],
                ['Create & Advance Opportunities', true, true, false, false],
                ['View Salary & THP Simulator', true, true, false, false],
                ['Generate Follow-Up Letters', true, true, true, false],
                ['Add Coach Feedback & Notes', true, true, true, false],
                ['Manage OAuth & Email Connections', true, false, false, false],
                ['Export Data & Backup Archives', true, true, false, false],
              ].map(([perm, admin, cand, coach, rec], idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #ecece7' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 500 }}>{perm as string}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>{admin ? <Check size={16} style={{ color: '#10b981', margin: 'auto' }} /> : <span style={{ color: '#94a3b8' }}>-</span>}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>{cand ? <Check size={16} style={{ color: '#10b981', margin: 'auto' }} /> : <span style={{ color: '#94a3b8' }}>-</span>}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>{coach ? <Check size={16} style={{ color: '#10b981', margin: 'auto' }} /> : <span style={{ color: '#94a3b8' }}>-</span>}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>{rec ? <Check size={16} style={{ color: '#10b981', margin: 'auto' }} /> : <span style={{ color: '#94a3b8' }}>-</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Security */}
      {activeTab === 'security' && (
        <div style={{ background: '#fbfbf8', border: '1px solid #dedfd8', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 8px', fontWeight: 600 }}>
            Active Sessions & Device Activity
          </h3>
          <p className="muted" style={{ margin: '0 0 20px' }}>
            Revoke unrecognized sessions or review logged IP addresses.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px',
                background: '#f5f5f0',
                border: '1px solid #dedfd8',
              }}
            >
              <div>
                <strong style={{ fontSize: '13px', display: 'block' }}>Windows 11 · Chrome 133 (Current Session)</strong>
                <span style={{ fontSize: '11px', color: '#888d82' }}>Jakarta, Indonesia · IP: 182.253.110.12 · Last active: Just now</span>
              </div>
              <span
                style={{
                  font: "10px 'DM Mono'",
                  background: '#edf2e3',
                  color: '#455928',
                  padding: '3px 8px',
                  borderRadius: '3px',
                }}
              >
                Active Now
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px',
                background: '#fff',
                border: '1px solid #dedfd8',
              }}
            >
              <div>
                <strong style={{ fontSize: '13px', display: 'block' }}>iOS 18.2 · Safari Mobile</strong>
                <span style={{ fontSize: '11px', color: '#888d82' }}>Bandung, Indonesia · IP: 36.85.22.40 · Last active: 2 hours ago</span>
              </div>
              <button className="secondary compact-btn" style={{ fontSize: '11px', color: '#b43d3d' }}>
                Revoke Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Invite Team Member">
          <div className="modal" style={{ maxWidth: '480px', width: '100%' }}>
            <div className="drawer-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={18} style={{ color: '#18181b' }} />
                <span className="eyebrow" style={{ margin: 0 }}>INVITE TEAM MEMBER</span>
              </div>
              <button onClick={() => setIsInviteOpen(false)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <h2 style={{ fontSize: '22px', margin: '14px 0 6px' }}>Invite collaborator</h2>
            <p className="muted" style={{ margin: '0 0 16px', lineHeight: 1.5 }}>
              Send an invitation link with specified role permissions.
            </p>

            <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888d82', display: 'block', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Mentor Budi"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #dedfd8', background: '#fff', fontSize: '13px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888d82', display: 'block', marginBottom: '6px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #dedfd8', background: '#fff', fontSize: '13px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888d82', display: 'block', marginBottom: '6px' }}>
                  Assigned Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamMember['role'])}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #dedfd8', background: '#fff', fontSize: '13px' }}
                >
                  <option value="Career Coach">Career Coach (Can review CVs and leave feedback)</option>
                  <option value="Candidate">Candidate (Can view and edit applications)</option>
                  <option value="Recruiter">Recruiter (Can submit job leads)</option>
                  <option value="Admin">Admin (Full system access)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', paddingTop: '14px', borderTop: '1px solid #dedfd8' }}>
                <button type="button" className="secondary compact-btn" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary compact-btn">
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
