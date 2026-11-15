import type { Application, Interview, JobLead } from './pb-types';
import { daysSince } from './utils';
import { pb } from './pocketbase';

export interface TelegramConfig {
  chatId: string;
  botToken?: string;
  webhookUrl?: string;
  notifyDailyMorningBriefing?: boolean;
  notifyOnInterview?: boolean;
  notifyOnStatusChange?: boolean;
  notifyOnGhostingWarning?: boolean;
  notifyOnHighFitLead?: boolean;
}

export function generateMorningBriefingText({
  applications,
  interviews,
  leads = [],
  candidateName = 'Kandidat',
}: {
  applications: Application[];
  interviews: Interview[];
  leads?: JobLead[];
  candidateName?: string;
}): string {
  const today = new Date();
  const dateStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(today);

  // Pipeline Counts
  const activeApps = applications.filter((a) => !['Rejected', 'Ghosted'].includes(a.status));
  const viewedApps = applications.filter((a) => a.status === 'Viewed');
  const interviewApps = applications.filter((a) => a.status === 'Interview');
  const offerApps = applications.filter((a) => a.status === 'Offer');

  // Upcoming Interviews (next 48 hours or scheduled)
  const upcomingInterviews = interviews
    .filter((i) => i.status === 'Scheduled' && i.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3)
    .map((i) => {
      const app = applications.find((a) => a.id === i.application);
      const interviewDate = new Date(i.scheduledAt);
      const timeStr = interviewDate.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
      });
      const dayStr = new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(interviewDate);
      return `• <b>${app?.company || 'Perusahaan'}</b>: ${i.round}\n  ⏰ <i>${dayStr} · ${timeStr} WIB</i>`;
    });

  // Follow-ups due & Anti-Ghosting alerts
  const todayTimestamp = today.setHours(0, 0, 0, 0);
  const dueFollowups = applications
    .filter((a) => {
      if (['Rejected', 'Ghosted'].includes(a.status)) return false;
      if (a.nextFollowUp) {
        return new Date(a.nextFollowUp).getTime() <= Date.now();
      }
      return daysSince(a.sentAt) >= 14;
    })
    .slice(0, 3)
    .map((a) => {
      const days = daysSince(a.sentAt);
      const reason = a.nextFollowUp && new Date(a.nextFollowUp).getTime() <= Date.now()
        ? 'Jadwal follow-up jatuh tempo'
        : `${days} hari tanpa kabar (Waspada Ghosting)`;
      return `• <b>${a.company}</b> (${a.position})\n  ⚠️ <i>${reason}</i>`;
    });

  // Hot AI Job Hunter Leads (High match score >= 80%)
  const hotLeads = leads
    .filter((l) => l.matchScore && l.matchScore >= 80 && ['inbox', 'triage_passed', 'shortlisted'].includes(l.status))
    .slice(0, 2)
    .map((l) => `• <b>${l.title}</b> @ ${l.company} (Match: ${l.matchScore}%)`);

  // Format message using Telegram HTML
  let msg = `🌅 <b>JUNCTION MORNING CAREER BRIEFING</b>\n`;
  msg += `📅 <code>${dateStr}</code>\n`;
  msg += `Halo <b>${candidateName}</b>, berikut ringkasan status pencarian kerja Anda pagi ini:\n\n`;

  msg += `📊 <b>Status Pipeline Aktif:</b>\n`;
  msg += `• Aktif: <b>${activeApps.length}</b> lamaran\n`;
  msg += `• Dilihat HRD (Viewed): <b>${viewedApps.length}</b>\n`;
  msg += `• Tahap Interview: <b>${interviewApps.length}</b>\n`;
  msg += `• Penawaran (Offer): <b>${offerApps.length}</b>\n\n`;

  if (upcomingInterviews.length > 0) {
    msg += `🎯 <b>Jadwal Interview Mendatang:</b>\n`;
    msg += upcomingInterviews.join('\n') + '\n\n';
  } else {
    msg += `🎯 <b>Jadwal Interview:</b>\n<i>Tidak ada jadwal wawancara untuk 48 jam ke depan.</i>\n\n`;
  }

  if (dueFollowups.length > 0) {
    msg += `⏳ <b>Tindakan Follow-Up & Anti-Ghosting:</b>\n`;
    msg += dueFollowups.join('\n') + '\n\n';
  }

  if (hotLeads.length > 0) {
    msg += `🔥 <b>Rekomendasi AI Job Hunter (&gt;80% Fit):</b>\n`;
    msg += hotLeads.join('\n') + '\n\n';
  }

  msg += `💡 <i>Pro-Tip: Mengirimkan follow-up santun 5–7 hari setelah lamaran terbukti meningkatkan peluang respon HRD hingga 30%.</i>\n\n`;
  msg += `🔗 <a href="http://localhost:5173">Buka Junction Career CRM</a>`;

  return msg;
}

export async function sendTelegramMessage({
  chatId,
  botToken,
  text,
  parseMode = 'HTML',
}: {
  chatId: string;
  botToken?: string;
  text: string;
  parseMode?: 'HTML' | 'Markdown';
}): Promise<{ success: boolean; message: string }> {
  if (!chatId.trim()) {
    return { success: false, message: 'Telegram Chat ID belum diisi.' };
  }

  // 1. Try Backend API first if available
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (pb.authStore && pb.authStore.isValid && pb.authStore.token) {
      headers['Authorization'] = `Bearer ${pb.authStore.token}`;
    }

    const res = await fetch('/api/junction/telegram/send', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        chatId: chatId.trim(),
        botToken: botToken?.trim(),
        message: text,
        parseMode,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: `Pesan berhasil dikirim via server ke Chat ID ${chatId} (ID: ${data.messageId || 'OK'})`,
      };
    }
  } catch (_) {
    // Backend endpoint not reachable or running standalone frontend
  }

  // 2. Direct client-side fetch to Telegram Bot API if botToken provided
  if (botToken && botToken.trim()) {
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${botToken.trim()}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId.trim(),
          text,
          parse_mode: parseMode,
          disable_web_page_preview: true,
        }),
      });

      const tgData = await tgRes.json();
      if (tgData.ok) {
        return {
          success: true,
          message: `Berhasil terkirim langsung ke Telegram (Message ID: ${tgData.result?.message_id})`,
        };
      } else {
        return {
          success: false,
          message: `Telegram API error: ${tgData.description || 'Gagal mengirim pesan'}`,
        };
      }
    } catch (err) {
      return {
        success: false,
        message: `Koneksi ke api.telegram.org gagal: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  // 3. Fallback demo simulation if running local without external bot token
  return {
    success: true,
    message: `[Mode Simulasi] Briefing siap dikirim ke Chat ID ${chatId}. Untuk pengiriman nyata, masukkan Bot Token Telegram Anda di pengaturan.`,
  };
}

export async function sendMorningBriefingNow({
  config,
  applications,
  interviews,
  leads = [],
  candidateName,
}: {
  config: TelegramConfig;
  applications: Application[];
  interviews: Interview[];
  leads?: JobLead[];
  candidateName?: string;
}): Promise<{ success: boolean; message: string }> {
  if (!config.chatId) {
    return { success: false, message: 'Silakan isi Telegram Chat ID terlebih dahulu.' };
  }

  const messageText = generateMorningBriefingText({
    applications,
    interviews,
    leads,
    candidateName,
  });

  return sendTelegramMessage({
    chatId: config.chatId,
    botToken: config.botToken,
    text: messageText,
    parseMode: 'HTML',
  });
}
