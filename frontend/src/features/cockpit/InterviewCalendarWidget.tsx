import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Download,
  ExternalLink,
  Plus,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Building,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import type { Application, Interview } from '../../lib/pb-types';
import { generateICS, downloadICSFile, getGoogleCalendarUrl } from '../../lib/ics-calendar';
import { sanitizeUrl } from '../../lib/utils';

interface InterviewCalendarWidgetProps {
  interviews: Interview[];
  applications: Application[];
  onAddInterview?: (data: Omit<Interview, 'id'>) => Promise<Interview>;
  onOpenStarCoach?: (company: string, position: string) => void;
  onSelectApplication?: (app: Application) => void;
}

export const InterviewCalendarWidget: React.FC<InterviewCalendarWidgetProps> = ({
  interviews,
  applications,
  onAddInterview,
  onOpenStarCoach,
  onSelectApplication,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [selectedAppId, setSelectedAppId] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [customPosition, setCustomPosition] = useState('');
  const [scheduledAt, setScheduledAt] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [roundType, setRoundType] = useState<Interview['interviewType']>('Technical Interview');
  const [meetingLink, setMeetingLink] = useState('');
  const [prepNotes, setPrepNotes] = useState('');
  const [autoExportICS, setAutoExportICS] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sort interviews ascending by date
  const sortedInterviews = useMemo(() => {
    return [...interviews].sort((a, b) => {
      const timeA = new Date(a.scheduledAt).getTime();
      const timeB = new Date(b.scheduledAt).getTime();
      return timeA - timeB;
    });
  }, [interviews]);

  const upcomingInterviews = useMemo(() => {
    const now = Date.now();
    return sortedInterviews.filter((i) => new Date(i.scheduledAt).getTime() >= now - 3600000);
  }, [sortedInterviews]);

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportSingleICS = (interview: Interview, app?: Application) => {
    const compName = app?.company || customCompany || 'Perusahaan';
    const posName = app?.position || customPosition || 'Posisi';
    const title = `Interview: ${compName} - ${posName} (${interview.interviewType || interview.round})`;
    const description = `Jadwal wawancara dengan ${compName} untuk posisi ${posName}.\nTahap: ${interview.interviewType || interview.round}\nCatatan: ${interview.prepNotes || 'Siapkan portofolio dan cerita STAR.'}`;

    const icsContent = generateICS({
      title,
      description,
      meetingUrl: interview.meetingLink,
      location: interview.meetingLink || 'Online Meeting',
      startDate: interview.scheduledAt,
      durationMinutes: 60,
      alarmMinutesBefore: [30, 10],
    });

    downloadICSFile(`interview-${compName.toLowerCase().replace(/\s+/g, '-')}`, icsContent);
  };

  const handleCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddInterview) return;

    setIsSubmitting(true);
    try {
      const targetApp = applications.find((a) => a.id === selectedAppId);
      const compName = targetApp?.company || customCompany || 'Perusahaan';
      const posName = targetApp?.position || customPosition || 'Posisi';

      const newInterviewData: Omit<Interview, 'id'> = {
        application: selectedAppId || 'custom',
        round: roundType || 'Technical Interview',
        interviewType: roundType,
        scheduledAt: new Date(scheduledAt).toISOString(),
        status: 'Scheduled',
        questions: [],
        meetingLink: meetingLink.trim(),
        prepNotes: prepNotes.trim(),
        locationType: meetingLink.trim() ? 'Online' : 'On-site',
      };

      await onAddInterview(newInterviewData);

      if (autoExportICS) {
        const title = `Interview: ${compName} - ${posName} (${roundType})`;
        const icsContent = generateICS({
          title,
          description: `Wawancara dengan ${compName} posisi ${posName}.\nTahap: ${roundType}\nLink: ${meetingLink}\nCatatan: ${prepNotes}`,
          meetingUrl: meetingLink.trim(),
          location: meetingLink.trim() || 'Online Meeting',
          startDate: scheduledAt,
          durationMinutes: 60,
          alarmMinutesBefore: [30, 10],
        });
        downloadICSFile(`interview-${compName.toLowerCase().replace(/\s+/g, '-')}`, icsContent);
      }

      setShowModal(false);
      setMeetingLink('');
      setPrepNotes('');
    } catch (err) {
      console.error('Failed to create interview schedule:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/90 shadow-2xl relative overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-blue-400" />
              Kalender Interview & Pengingat (.ics)
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Jadwal wawancara aktif dengan ekspor otomatis ke Google Calendar dan Apple Calendar.
            </CardDescription>
          </div>

          <Button
            size="sm"
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-500/20"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Jadwalkan Wawancara
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {upcomingInterviews.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-slate-200">Belum Ada Jadwal Wawancara Mendatang</div>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              Saat lamaran Anda masuk ke tahap interview, catat jadwal di sini untuk mendapatkan reminder kalender otomatis (.ics).
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowModal(true)}
              className="mt-2 text-xs border-slate-700 text-slate-300 hover:text-white"
            >
              + Buat Jadwal Pertama
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingInterviews.map((interview) => {
              const matchedApp = applications.find((a) => a.id === interview.application);
              const compName = matchedApp?.company || 'Target Company';
              const posName = matchedApp?.position || 'Target Role';

              const dateObj = new Date(interview.scheduledAt);
              const formattedDate = new Intl.DateTimeFormat('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }).format(dateObj);

              const diffHours = Math.round((dateObj.getTime() - Date.now()) / (1000 * 60 * 60));
              const countdownLabel =
                diffHours < 0
                  ? 'Sedang Berlangsung'
                  : diffHours < 24
                  ? `${diffHours} Jam Lagi`
                  : `${Math.round(diffHours / 24)} Hari Lagi`;

              const gcalUrl = getGoogleCalendarUrl({
                title: `Interview: ${compName} - ${posName}`,
                description: `Wawancara tahap ${interview.interviewType || interview.round}.\nLink: ${interview.meetingLink || '-'}\nCatatan: ${interview.prepNotes || '-'}`,
                location: interview.meetingLink || 'Online',
                startDate: interview.scheduledAt,
              });

              return (
                <div
                  key={interview.id}
                  className="p-4 rounded-2xl bg-slate-950/75 border border-slate-800/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.2)] hover:border-slate-700/90 hover:bg-slate-950/90 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_16px_rgba(0,0,0,0.35)] transition-[transform,border-color,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.99] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-center shrink-0 text-blue-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                      <Building className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-100 truncate">{compName}</span>
                        <span className="text-slate-500 text-xs">•</span>
                        <span className="text-xs text-slate-300 truncate">{posName}</span>
                        <Badge variant="interview" className="text-[10px] py-0 px-2 font-medium">
                          {interview.interviewType || interview.round}
                        </Badge>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          ⏳ {countdownLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{formattedDate} WIB</span>
                      </div>

                      {interview.meetingLink && (
                        <div className="flex items-center gap-2 pt-0.5">
                          <Video className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <a
                            href={sanitizeUrl(interview.meetingLink)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-400 hover:underline truncate max-w-xs"
                          >
                            {interview.meetingLink}
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(interview.meetingLink!, interview.id)}
                            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 active:scale-95 transition-all duration-150"
                            title="Salin Link Meeting"
                          >
                            {copiedId === interview.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {onOpenStarCoach && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenStarCoach(compName, posName)}
                        className="text-xs border-purple-500/30 text-purple-300 hover:bg-purple-950/40 hover:-translate-y-0.5 active:translate-y-0 transition-[transform,background-color,border-color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      >
                        <Sparkles className="w-3 h-3 mr-1 text-purple-400" />
                        STAR Prep
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExportSingleICS(interview, matchedApp)}
                      className="text-xs border-slate-700 text-slate-300 hover:text-white hover:-translate-y-0.5 active:translate-y-0 transition-[transform,border-color,color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      title="Download file kalender universal (.ics) dengan pengingat alarm H-30 menit"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Unduh .ics
                    </Button>

                    <a
                      href={gcalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-medium hover:bg-slate-800/80 hover:-translate-y-0.5 active:translate-y-0 transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      title="Simpan langsung ke Google Calendar"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Google Cal
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Modal Jadwalkan Wawancara */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_24px_64px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-in zoom-in-95 ease-[cubic-bezier(0.22,1,0.36,1)] duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-blue-400" />
                  Jadwalkan Wawancara Baru
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Input jadwal dan dapatkan file pengingat kalender (.ics) dengan alarm otomatis.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 text-lg leading-none p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateInterview} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Pilih Lamaran Terdaftar
                </label>
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-[border-color,box-shadow] duration-150"
                >
                  <option value="">-- Pilih dari pipeline atau isi manual --</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.company} - {app.position} ({app.status})
                    </option>
                  ))}
                </select>
              </div>

              {!selectedAppId && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Nama Perusahaan
                    </label>
                    <input
                      type="text"
                      required={!selectedAppId}
                      value={customCompany}
                      onChange={(e) => setCustomCompany(e.target.value)}
                      placeholder="Contoh: Shopee"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-[border-color,box-shadow] duration-150"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Posisi Lamaran
                    </label>
                    <input
                      type="text"
                      required={!selectedAppId}
                      value={customPosition}
                      onChange={(e) => setCustomPosition(e.target.value)}
                      placeholder="Contoh: Senior DevOps"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-[border-color,box-shadow] duration-150"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Tahapan Wawancara
                  </label>
                  <select
                    value={roundType}
                    onChange={(e) => setRoundType(e.target.value as Interview['interviewType'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-[border-color,box-shadow] duration-150"
                  >
                    <option value="HR Screening">HR Screening</option>
                    <option value="Technical Interview">Technical Interview</option>
                    <option value="System Design">System Design</option>
                    <option value="User / Hiring Manager">User / Hiring Manager</option>
                    <option value="Cultural Fit">Cultural Fit</option>
                    <option value="Final / Offering">Final / Offering</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Tanggal & Jam (WIB)
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-[border-color,box-shadow] duration-150"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Link Meeting (Opsional)
                </label>
                <input
                  type="url"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx atau Zoom URL"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-[border-color,box-shadow] duration-150"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Catatan Persiapan
                </label>
                <textarea
                  rows={2}
                  value={prepNotes}
                  onChange={(e) => setPrepNotes(e.target.value)}
                  placeholder="Siapkan arsitektur microservices, proyek portfolio..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-[border-color,box-shadow] duration-150 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoExport"
                  checked={autoExportICS}
                  onChange={(e) => setAutoExportICS(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0"
                />
                <label htmlFor="autoExport" className="text-xs text-slate-300 cursor-pointer">
                  Langsung unduh file pengingat kalender (<strong>.ics</strong>) setelah disimpan
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="text-xs border-slate-700 text-slate-400 hover:text-slate-200"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Jadwal'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
};
