import { useState } from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  Clock,
  Calendar,
  Settings2,
  CheckCircle2,
  Check,
} from 'lucide-react';
import type { Application, Interview } from '../../lib/pb-types';
import { daysSince } from '../../lib/utils';
import { useI18n } from '../../lib/i18n';

export interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  applications: Application[];
  interviews: Interview[];
  onSelectApplication: (app: Application) => void;
}

export function NotificationCenter({
  isOpen,
  onClose,
  applications,
  interviews,
  onSelectApplication,
}: NotificationCenterProps) {
  const { locale } = useI18n();
  const isId = locale === 'id';
  const [activeTab, setActiveTab] = useState<'alerts' | 'reminders' | 'preferences'>('alerts');
  const [readItems, setReadItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('junction_read_notifications');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [channels, setChannels] = useState({
    emailAlerts: true,
    telegramBot: true,
    browserPush: false,
    ghostingWarningDays: 14,
    interviewReminderHours: 24,
  });

  if (!isOpen) return null;

  // 1. Ghosting alerts: applications applied > 14 days ago without response
  const ghostingAlerts = applications
    .filter(
      (a) =>
        ['Applied', 'Viewed'].includes(a.status) &&
        daysSince(a.sentAt) >= channels.ghostingWarningDays
    )
    .map((a) => {
      const days = daysSince(a.sentAt);
      return {
        id: `ghost-${a.id}`,
        type: 'ghosting' as const,
        title: isId ? `Belum ada kabar: ${a.company}` : `No response yet: ${a.company}`,
        message: isId
          ? `Sudah ${days} hari belum ada respons untuk posisi "${a.position}". Anda disarankan mengirim pesan tindak lanjut yang sopan.`
          : `No response for ${days} days on "${a.position}". Consider sending a polite follow-up message.`,
        date: a.sentAt,
        app: a,
      };
    });

  // 2. Due Follow-ups
  const dueFollowups = applications
    .filter((a) => a.nextFollowUp && new Date(a.nextFollowUp).getTime() <= Date.now())
    .map((a) => ({
      id: `followup-${a.id}`,
      type: 'followup' as const,
      title: isId ? `Jadwal tindak lanjut: ${a.company}` : `Follow-up due: ${a.company}`,
      message: isId
        ? `Jadwal kontak tindak lanjut dengan ${a.contactName || 'perekrut'} jatuh tempo hari ini.`
        : `Scheduled follow-up with ${a.contactName || 'recruiter'} is due today.`,
      date: a.nextFollowUp!,
      app: a,
    }));

  // 3. Interview reminders
  const interviewReminders = interviews
    .filter((i) => i.status === 'Scheduled' && i.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
    .map((i) => {
      const app = applications.find((a) => a.id === i.application);
      const formattedDate = new Date(i.scheduledAt!).toLocaleString(isId ? 'id-ID' : 'en-US');
      return {
        id: `interview-${i.id}`,
        title: isId
          ? `Jadwal Wawancara: ${app?.company || 'Peluang Kerja'}`
          : `Upcoming Interview: ${app?.company || 'Opportunity'}`,
        message: isId
          ? `Tahap ${i.round} dijadwalkan pada ${formattedDate}.`
          : `${i.round} scheduled for ${formattedDate}.`,
        date: i.scheduledAt!,
        app,
      };
    });

  const allAlerts = [...dueFollowups, ...ghostingAlerts];
  const unreadAlertsCount = allAlerts.filter((item) => !readItems[item.id]).length;

  const markAsRead = (id: string) => {
    const updated = { ...readItems, [id]: true };
    setReadItems(updated);
    try {
      localStorage.setItem('junction_read_notifications', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const markAllAsRead = () => {
    const updated: Record<string, boolean> = { ...readItems };
    allAlerts.forEach((item) => {
      updated[item.id] = true;
    });
    setReadItems(updated);
    try {
      localStorage.setItem('junction_read_notifications', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={isId ? 'Pusat Pemberitahuan' : 'Notification Center'}>
      <aside className="drawer" style={{ width: 'min(480px, 100%)' }}>
        <div className="drawer-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} style={{ color: '#7d9850' }} />
            <span className="eyebrow" style={{ margin: 0 }}>
              {isId ? 'PUSAT PEMBERITAHUAN' : 'NOTIFICATION CENTER'}
            </span>
          </div>
          <button onClick={onClose} aria-label={isId ? 'Tutup pusat pemberitahuan' : 'Close notification center'}>
            <X size={18} />
          </button>
        </div>

        <div style={{ margin: '20px 0 16px' }}>
          <h2 style={{ fontSize: '20px', margin: '0 0 4px', fontWeight: 600 }}>
            {isId ? 'Peringatan & Pengingat' : 'Alerts & Reminders'}
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            {isId
              ? 'Pantau lamaran yang menunggu balasan, risiko belum ada kabar, dan jadwal wawancara.'
              : 'Stay ahead of stale applications, response delays, and upcoming interviews.'}
          </p>
        </div>

        {/* Tab navigation */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            borderBottom: '1px solid #dedfd8',
            marginBottom: '16px',
            fontSize: '12px',
          }}
        >
          <button
            onClick={() => setActiveTab('alerts')}
            style={{
              paddingBottom: '10px',
              fontWeight: 600,
              borderBottom: activeTab === 'alerts' ? '2px solid #7d9850' : '2px solid transparent',
              color: activeTab === 'alerts' ? '#202320' : '#888d82',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertTriangle size={14} /> {isId ? 'Peringatan' : 'Alerts'}
            {unreadAlertsCount > 0 && (
              <span
                style={{
                  font: "10px 'DM Mono'",
                  background: '#fcf0ed',
                  color: '#9e3f2d',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  border: '1px solid #f4cfc7',
                }}
              >
                {unreadAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reminders')}
            style={{
              paddingBottom: '10px',
              fontWeight: 600,
              borderBottom: activeTab === 'reminders' ? '2px solid #7d9850' : '2px solid transparent',
              color: activeTab === 'reminders' ? '#202320' : '#888d82',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Calendar size={14} /> {isId ? 'Jadwal Wawancara' : 'Interview Reminders'}
            <span
              style={{
                font: "10px 'DM Mono'",
                background: '#e8ebd8',
                color: '#495a28',
                padding: '1px 6px',
                borderRadius: '10px',
              }}
            >
              {interviewReminders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            style={{
              paddingBottom: '10px',
              fontWeight: 600,
              borderBottom: activeTab === 'preferences' ? '2px solid #7d9850' : '2px solid transparent',
              color: activeTab === 'preferences' ? '#202320' : '#888d82',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Settings2 size={14} /> {isId ? 'Pengaturan' : 'Preferences'}
          </button>
        </div>

        {/* Tab Content: Alerts */}
        {activeTab === 'alerts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#888d82' }}>
                {isId ? `Menampilkan ${allAlerts.length} pengingat aktif` : `Showing ${allAlerts.length} actionable alerts`}
              </span>
              {unreadAlertsCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    fontSize: '11px',
                    color: '#7d9850',
                    fontWeight: 600,
                    textDecoration: 'underline',
                  }}
                >
                  {isId ? 'Tandai semua dibaca' : 'Mark all as read'}
                </button>
              )}
            </div>

            {allAlerts.map((item) => {
              const isRead = readItems[item.id];
              return (
                <div
                  key={item.id}
                  style={{
                    background: isRead ? '#f5f5f0' : '#fbfbf8',
                    border: `1px solid ${isRead ? '#e5e7de' : '#d5dec4'}`,
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: item.type === 'ghosting' ? '#e27357' : '#e6ab32',
                          flexShrink: 0,
                        }}
                      />
                      <strong style={{ fontSize: '13px', color: '#202320' }}>{item.title}</strong>
                    </div>
                    {!isRead && (
                      <button
                        onClick={() => markAsRead(item.id)}
                        title={isId ? 'Tandai sudah dibaca' : 'Mark as read'}
                        style={{ color: '#888d82', padding: '2px' }}
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>

                  <p style={{ fontSize: '12px', color: '#666b62', margin: 0, lineHeight: 1.5 }}>
                    {item.message}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '4px',
                      paddingTop: '8px',
                      borderTop: '1px solid #ecece7',
                    }}
                  >
                    <span style={{ font: "10px 'DM Mono'", color: '#888d82' }}>
                      {isId ? 'Tercatat' : 'Logged'}: {item.date}
                    </span>
                    <button
                      onClick={() => {
                        markAsRead(item.id);
                        if (item.app) {
                          onSelectApplication(item.app);
                          onClose();
                        }
                      }}
                      className="secondary compact-btn"
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                    >
                      {isId ? 'Lihat Lamaran' : 'View Role'}
                    </button>
                  </div>
                </div>
              );
            })}

            {allAlerts.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 16px',
                  color: '#888d82',
                  border: '1px dashed #dedfd8',
                }}
              >
                <CheckCircle2 size={32} style={{ color: '#7d9850', marginBottom: '8px' }} />
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#202320', margin: '0 0 4px' }}>
                  {isId ? 'Semua Beres!' : 'All clear!'}
                </p>
                <p style={{ fontSize: '11px', margin: 0 }}>
                  {isId
                    ? 'Tidak ada jadwal tindak lanjut atau lamaran yang tertunda saat ini.'
                    : 'No pending follow-ups or response delays detected in your pipeline.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Reminders */}
        {activeTab === 'reminders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
            {interviewReminders.map((item) => (
              <div
                key={item.id}
                style={{
                  background: '#fbfbf8',
                  border: '1px solid #dedfd8',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={15} style={{ color: '#7d9850' }} />
                  <strong style={{ fontSize: '13px', color: '#202320' }}>{item.title}</strong>
                </div>
                <p style={{ fontSize: '12px', color: '#666b62', margin: 0 }}>{item.message}</p>
                <div style={{ display: 'flex', justifySelf: 'flex-end', justifyContent: 'flex-end', marginTop: '6px' }}>
                  {item.app && (
                    <button
                      onClick={() => {
                        onSelectApplication(item.app!);
                        onClose();
                      }}
                      className="secondary compact-btn"
                      style={{ fontSize: '11px' }}
                    >
                      {isId ? 'Buka Lamaran' : 'Open Application'}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {interviewReminders.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 16px',
                  color: '#888d82',
                  border: '1px dashed #dedfd8',
                }}
              >
                <Clock size={32} style={{ color: '#888d82', marginBottom: '8px' }} />
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#202320', margin: '0 0 4px' }}>
                  {isId ? 'Belum Ada Jadwal Wawancara' : 'No upcoming interviews scheduled'}
                </p>
                <p style={{ fontSize: '11px', margin: 0 }}>
                  {isId
                    ? 'Saat perekrut mengundang Anda, jadwal wawancara akan muncul di sini.'
                    : 'When recruiters invite you, scheduled rounds will appear here.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Preferences */}
        {activeTab === 'preferences' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
            <div style={{ background: '#fbfbf8', border: '1px solid #dedfd8', padding: '16px' }}>
              <h3 style={{ fontSize: '13px', margin: '0 0 12px', fontWeight: 600 }}>
                {isId ? 'Saluran Pemberitahuan' : 'Notification Channels'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', cursor: 'pointer' }}>
                  <span>{isId ? 'Notifikasi email untuk undangan wawancara' : 'Email notifications for interview invites'}</span>
                  <input
                    type="checkbox"
                    checked={channels.emailAlerts}
                    onChange={(e) => setChannels({ ...channels, emailAlerts: e.target.checked })}
                    style={{ accentColor: '#7d9850' }}
                  />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', cursor: 'pointer' }}>
                  <span>{isId ? 'Pemberitahuan instan via bot Telegram' : 'Telegram bot instant alerts'}</span>
                  <input
                    type="checkbox"
                    checked={channels.telegramBot}
                    onChange={(e) => setChannels({ ...channels, telegramBot: e.target.checked })}
                    style={{ accentColor: '#7d9850' }}
                  />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', cursor: 'pointer' }}>
                  <span>{isId ? 'Notifikasi push di peramban' : 'Browser desktop push alerts'}</span>
                  <input
                    type="checkbox"
                    checked={channels.browserPush}
                    onChange={(e) => setChannels({ ...channels, browserPush: e.target.checked })}
                    style={{ accentColor: '#7d9850' }}
                  />
                </label>
              </div>
            </div>

            <div style={{ background: '#fbfbf8', border: '1px solid #dedfd8', padding: '16px' }}>
              <h3 style={{ fontSize: '13px', margin: '0 0 12px', fontWeight: 600 }}>
                {isId ? 'Batas Waktu & Frekuensi' : 'Thresholds & Timing'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#888d82', marginBottom: '4px' }}>
                    {isId ? 'Batas Hari Tanpa Kabar (hari sebelum diingatkan)' : 'No-Response Warning Threshold (days without response)'}
                  </label>
                  <select
                    value={channels.ghostingWarningDays}
                    onChange={(e) => setChannels({ ...channels, ghostingWarningDays: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #dedfd8', background: '#fff', fontSize: '12px' }}
                  >
                    <option value={7}>{isId ? '7 hari (Lebih Awal)' : '7 days (Aggressive)'}</option>
                    <option value={14}>{isId ? '14 hari (Standar)' : '14 days (Standard)'}</option>
                    <option value={21}>{isId ? '21 hari (Santai)' : '21 days (Patient)'}</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#888d82', marginBottom: '4px' }}>
                    {isId ? 'Pengingat Sebelum Wawancara' : 'Interview Pre-alarm'}
                  </label>
                  <select
                    value={channels.interviewReminderHours}
                    onChange={(e) => setChannels({ ...channels, interviewReminderHours: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #dedfd8', background: '#fff', fontSize: '12px' }}
                  >
                    <option value={12}>{isId ? '12 jam sebelumnya' : '12 hours before'}</option>
                    <option value={24}>{isId ? '24 jam sebelumnya' : '24 hours before'}</option>
                    <option value={48}>{isId ? '48 jam sebelumnya' : '48 hours before'}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #dedfd8' }}>
          <button className="primary full" onClick={onClose}>
            {isId ? 'Tutup' : 'Close'}
          </button>
        </div>
      </aside>
    </div>
  );
}
