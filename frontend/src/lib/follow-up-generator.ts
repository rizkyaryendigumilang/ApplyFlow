import type { Application } from './pb-types';

export type FollowUpChannel = 'email' | 'linkedin' | 'whatsapp';
export type FollowUpLanguage = 'id' | 'en';
export type FollowUpTone = 'polite_inquiry' | 'value_add' | 'closing_checkin';

export interface FollowUpOptions {
  application: Application;
  channel: FollowUpChannel;
  language: FollowUpLanguage;
  tone: FollowUpTone;
  contactName?: string;
  interviewRound?: string;
  daysSinceLastActivity?: number;
}

export interface GeneratedFollowUp {
  subject: string;
  body: string;
  tips: string[];
}

export function generateFollowUp(options: FollowUpOptions): GeneratedFollowUp {
  const {
    application,
    channel,
    language,
    tone,
    contactName = application.contactName || 'Tim Rekruter',
    interviewRound = 'wawancara sebelumnya',
    daysSinceLastActivity = 7,
  } = options;

  const isEn = language === 'en';
  const role = application.position;
  const company = application.company;

  let subject = '';
  let body = '';
  const tips: string[] = [];

  if (isEn) {
    if (channel === 'linkedin' || channel === 'whatsapp') {
      if (tone === 'polite_inquiry') {
        body = `Hi ${contactName}, hope you're having a productive week! I wanted to follow up on my application for the ${role} position at ${company}. I remain very enthusiastic about the opportunity to contribute to your team. Could you please share if there are any updates regarding the next steps? Thanks so much for your time!`;
      } else if (tone === 'value_add') {
        body = `Hi ${contactName}, hope you're well! Following our discussion on the ${role} role at ${company}, I was recently reflecting on the infrastructure challenges we touched upon and wanted to share a relevant architecture write-up/repo I worked on. Would love to hear your thoughts and see how the evaluation is progressing!`;
      } else {
        body = `Hi ${contactName}, checking in one last time regarding the ${role} role at ${company}. I understand priorities shift quickly and your team might be reviewing other candidates. If the position has been filled, no worries at all! Either way, I'd love to stay connected for future opportunities.`;
      }
    } else {
      // Email
      if (tone === 'polite_inquiry') {
        subject = `Follow-Up: ${role} Application - ${company}`;
        body = `Dear ${contactName},

I hope this email finds you well.

I am writing to politely follow up on the status of my application for the ${role} position at ${company}. It has been about ${daysSinceLastActivity} days since our last milestone, and I remain very enthusiastic about the prospect of joining your engineering team.

Please let me know if there are any additional materials, portfolio details, or references I can provide to assist in your decision-making process.

Thank you very much for your time and guidance. Looking forward to hearing from you.

Best regards,`;
      } else if (tone === 'value_add') {
        subject = `Additional Insights regarding ${role} role - ${company}`;
        body = `Dear ${contactName},

I hope you are having a wonderful week.

Reflecting on our discussion regarding the ${role} role at ${company}, I wanted to share a quick update and a project reference relevant to the engineering stack we discussed.

I have attached a brief overview of my recent implementation in cloud automation, which closely mirrors the challenges your team is currently solving. I would be thrilled to dive deeper into these topics in the next stage.

Could you kindly share an update on the recruitment timeline when convenient?

Warm regards,`;
      } else {
        subject = `Checking in on ${role} search - ${company}`;
        body = `Dear ${contactName},

I hope you are having a productive week.

I am reaching out for a brief check-in regarding the ${role} position. I realize your team is likely busy and recruitment timelines can naturally extend. 

If the position has already been filled or priorities have pivoted, please feel free to let me know so I can plan my schedule accordingly. In any case, I would value keeping in touch for future opportunities.

Thank you once again for the opportunity to connect.

Sincerely,`;
      }
    }

    tips.push(
      'Send between Tuesday and Thursday, ideally between 09:30 AM and 11:30 AM.',
      'Keep subject lines clean without exclamation marks.',
      'If messaging on LinkedIn, keep message below 400 characters for optimal mobile readability.'
    );
  } else {
    // Bahasa Indonesia
    if (channel === 'linkedin' || channel === 'whatsapp') {
      if (tone === 'polite_inquiry') {
        body = `Halo ${contactName}, salam hangat. Semoga kabarnya baik! Saya ingin menanyakan kelanjutan proses rekrutmen untuk posisi ${role} di ${company}. Saya sangat tertarik dengan tantangan engineering di ${company}. Kira-kira apakah ada kabar terbaru atau jadwal tahap selanjutnya? Terima kasih banyak atas waktunya!`;
      } else if (tone === 'value_add') {
        body = `Halo ${contactName}, semoga harinya menyenangkan. Mengingat diskusi kita seputar posisi ${role} di ${company}, saya baru saja mendokumentasikan implementasi teknis relevan yang sempat kita bahas. Senang sekali jika bisa berdiskusi lebih lanjut sembari menunggu perkembangan seleksi. Terima kasih!`;
      } else {
        body = `Halo ${contactName}, salam sehat. Saya ingin memastikan status posisi ${role} di ${company}. Jika proses seleksi sudah selesai atau posisinya telah terisi, tentu tidak masalah sama sekali. Semoga kita tetap bisa terhubung untuk kesempatan kolaborasi di masa mendatang. Terima kasih banyak!`;
      }
    } else {
      // Email
      if (tone === 'polite_inquiry') {
        subject = `Menindaklanjuti Lamaran: ${role} - ${company}`;
        body = `Yth. ${contactName},

Semoga Bapak/Ibu senantiasa dalam keadaan sehat dan lancar dalam menjalankan aktivitas.

Melalui email ini, saya bermaksud menanyakan kelanjutan proses seleksi untuk posisi ${role} di ${company} setelah ${daysSinceLastActivity} hari dari tahapan ${interviewRound}. 

Saya tetap memiliki antusiasme yang tinggi untuk dapat berkontribusi bersama tim engineering di ${company}. Apabila terdapat dokumen tambahan, studi kasus, atau informasi teknis yang dibutuhkan untuk melengkapi proses evaluasi, mohon jangan ragu untuk memberi tahu saya.

Terima kasih banyak atas perhatian dan waktu Bapak/Ibu. Saya menantikan kabar baik selanjutnya.

Salam hangat,`;
      } else if (tone === 'value_add') {
        subject = `Referensi Tambahan untuk Posisi ${role} - ${company}`;
        body = `Yth. ${contactName},

Semoga email ini menjumpai Bapak/Ibu dalam keadaan baik.

Menyambung pembicaraan kita sebelumnya terkait kebutuhan teknis untuk posisi ${role} di ${company}, saya menyempatkan diri untuk menyusun ringkasan arsitektur dan repositori proyek yang relevan dengan tantangan sistem yang sedang dihadapi tim.

Saya sangat antusias untuk mendiskusikan pendekatan ini lebih mendalam pada tahapan seleksi berikutnya. Apabila ada pembaruan mengenai jadwal proses seleksi, mohon dapat diinformasikan.

Terima kasih banyak atas kesempatan yang telah diberikan.

Hormat saya,`;
      } else {
        subject = `Konfirmasi Status Proses Seleksi: ${role} - ${company}`;
        body = `Yth. ${contactName},

Semoga Bapak/Ibu selalu sehat dan sukses.

Saya ingin melakukan konfirmasi singkat mengenai status proses seleksi untuk peran ${role} di ${company}. Saya memahami bahwa tim rekrutmen sedang memiliki agenda yang padat dalam meninjau para kandidat.

Apabila posisi tersebut saat ini telah terisi atau terdapat perubahan kebutuhan tim, mohon dapat diinformasikan agar saya dapat menyesuaikan perencanaan jadwal saya. Bagaimanapun keputusannya, saya sangat menghargai kesempatan yang telah diberikan dan berharap dapat tetap menjalin relasi profesional yang baik ke depannya.

Terima kasih banyak atas waktu dan kerjasamanya.

Salam hormat,`;
      }
    }

    tips.push(
      'Waktu terbaik mengirim email follow-up di Indonesia adalah Selasa - Kamis pukul 09:00 - 11:00 WIB.',
      'Hindari menanyakan follow-up di hari Senin pagi atau Jumat sore.',
      'Gunakan sapaan Bapak/Ibu atau nama recruiter secara personal agar pesan tidak terkesan blast otomatis.'
    );
  }

  return { subject, body, tips };
}

export function createMailtoLink(to: string, subject: string, body: string): string {
  const encSubject = encodeURIComponent(subject);
  const encBody = encodeURIComponent(body);
  return `mailto:${to}?subject=${encSubject}&body=${encBody}`;
}
