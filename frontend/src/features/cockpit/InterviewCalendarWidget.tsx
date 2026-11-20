import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Download,
  Plus,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Building,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
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
    return interviews.toSorted((a, b) => {
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
    <Card className="border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#18181b] shadow-2xs">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-zinc-500" />
              Kalender Interview & Pengingat (.ics)
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Jadwal wawancara aktif dengan ekspor langsung ke Google Calendar dan Apple Calendar.
            </CardDescription>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 rounded-md text-xs font-semibold shadow-2xs transition-all active:scale-[0.98] self-start sm:self-auto"
          >
            <Plus size={13} />
            <span>Jadwalkan Wawancara</span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        {upcomingInterviews.length === 0 ? (
          <div className="p-6 rounded-lg bg-zinc-50/70 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-1.5">
            <CalendarIcon className="w-6 h-6 text-zinc-400 mx-auto" />
            <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Belum Ada Jadwal Wawancara Aktif
            </h4>
            <p className="text-[11px] text-zinc-400 max-w-md mx-auto">
              Saat lamaran Anda memasuki tahap screening atau interview, jadwalkan sesi di sini untuk mengaktifkan notifikasi dan file kalender .ics otomatis.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcomingInterviews.map((interview) => {
              const app = applications.find((a) => a.id === interview.application);
              const dateObj = new Date(interview.scheduledAt);
              const dateStr = dateObj.toLocaleDateString('id-ID', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              });
              const timeStr = dateObj.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const compName = app?.company || 'Perusahaan';
              const posName = app?.position || 'Posisi';

              const googleCalUrl = getGoogleCalendarUrl({
                title: `Interview: ${compName} - ${posName}`,
                description: `Tahap: ${interview.interviewType || interview.round}\nCatatan: ${interview.prepNotes}`,
                startDate: interview.scheduledAt,
                durationMinutes: 60,
                location: interview.meetingLink || 'Online',
              });

              return (
                <div
                  key={interview.id}
                  className="p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/20 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex flex-col justify-between gap-3 text-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                          {compName[0]?.toUpperCase() || 'C'}
                        </div>
                        <div className="truncate">
                          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {compName}
                          </h4>
                          <span className="text-[10px] text-zinc-500 truncate block">
                            {posName}
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 flex-shrink-0">
                        {interview.interviewType || interview.round}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                      <Clock size={12} className="text-zinc-400" />
                      <span>{dateStr} · {timeStr} WIB</span>
                    </div>

                    {interview.prepNotes && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic line-clamp-2">
                        &quot;{interview.prepNotes}&quot;
                      </p>
                    )}
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleExportSingleICS(interview, app)}
                        className="p-1 rounded text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
                        title="Unduh file .ics kalender"
                      >
                        <Download size={13} />
                      </button>

                      <a
                        href={googleCalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:underline"
                      >
                        + Google Cal
                      </a>
                    </div>

                    {onOpenStarCoach && (
                      <button
                        onClick={() => onOpenStarCoach(compName, posName)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[10px] font-semibold shadow-2xs hover:opacity-90"
                      >
                        <Sparkles size={10} />
                        <span>Coach STAR</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Schedule Interview Modal in Twenty CRM Style */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
          <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl w-full max-w-md p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Jadwalkan Sesi Wawancara
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateInterview} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Pilih Lamaran Terkait
                </label>
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                >
                  <option value="">(Custom / Tambah Perusahaan Manual)</option>
                  {applications.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.company} - {a.position} ({a.status})
                    </option>
                  ))}
                </select>
              </div>

              {!selectedAppId && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Nama Perusahaan
                    </label>
                    <input
                      type="text"
                      value={customCompany}
                      onChange={(e) => setCustomCompany(e.target.value)}
                      placeholder="Contoh: GoTo"
                      className="w-full px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      required={!selectedAppId}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Posisi / Role
                    </label>
                    <input
                      type="text"
                      value={customPosition}
                      onChange={(e) => setCustomPosition(e.target.value)}
                      placeholder="Software Engineer"
                      className="w-full px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Tahapan Seleksi
                  </label>
                  <select
                    value={roundType}
                    onChange={(e) => setRoundType(e.target.value as Interview['interviewType'])}
                    className="w-full px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  >
                    <option value="HR Screening">HR Screening</option>
                    <option value="User Interview">User Interview</option>
                    <option value="Technical Interview">Technical Interview</option>
                    <option value="Take-Home Test Review">Take-Home Test Review</option>
                    <option value="Final / C-Level">Final / C-Level</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Waktu Sesi
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono text-[11px]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Link Meeting (Google Meet / Zoom / Teams)
                </label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Catatan Persiapan
                </label>
                <textarea
                  value={prepNotes}
                  onChange={(e) => setPrepNotes(e.target.value)}
                  placeholder="Contoh: Siapkan demo sistem arsitektur microservices dan portofolio..."
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 rounded-md font-semibold shadow-2xs transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? 'Menyimpan…' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
};
