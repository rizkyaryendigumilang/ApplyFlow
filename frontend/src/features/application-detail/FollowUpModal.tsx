import { useState, useMemo } from 'react';
import {
  X,
  Mail,
  Linkedin,
  MessageSquare,
  Copy,
  Check,
  Send,
  Sparkles,
  ExternalLink,
  Clock,
  Info,
} from 'lucide-react';
import type { Application } from '../../lib/pb-types';
import {
  generateFollowUp,
  createMailtoLink,
  type FollowUpChannel,
  type FollowUpLanguage,
  type FollowUpTone,
} from '../../lib/follow-up-generator';
import { daysSince } from '../../lib/utils';

interface FollowUpModalProps {
  application: Application;
  onClose: () => void;
  onLogFollowUp?: (appId: string, nextFollowUpDate: string, note: string) => Promise<void> | void;
}

export function FollowUpModal({ application, onClose, onLogFollowUp }: FollowUpModalProps) {
  const [channel, setChannel] = useState<FollowUpChannel>('email');
  const [language, setLanguage] = useState<FollowUpLanguage>('id');
  const [tone, setTone] = useState<FollowUpTone>('polite_inquiry');
  const [copied, setCopied] = useState(false);
  const [customBody, setCustomBody] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);

  const daysWaiting = daysSince(application.sentAt);

  const generated = useMemo(() => {
    return generateFollowUp({
      application,
      channel,
      language,
      tone,
      daysSinceLastActivity: daysWaiting,
    });
  }, [application, channel, language, tone, daysWaiting]);

  const activeBody = customBody !== null ? customBody : generated.body;

  const handleCopy = () => {
    const textToCopy = channel === 'email' ? `Subject: ${generated.subject}\n\n${activeBody}` : activeBody;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkSent = async () => {
    setIsLogging(true);
    try {
      // Calculate next follow-up in 5 days
      const nextDate = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
      const note = `Follow-up terkirim via ${channel.toUpperCase()} (${tone.replace('_', ' ')}).`;
      await onLogFollowUp?.(application.id, nextDate, note);
      setLogSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } finally {
      setIsLogging(false);
    }
  };

  const mailtoHref = useMemo(() => {
    const recipient = application.contact || 'recruitment@company.com';
    return createMailtoLink(recipient, generated.subject, activeBody);
  }, [application.contact, generated.subject, activeBody]);

  return (
    <div className="overlay">
      <div className="modal followup-modal">
        <div className="drawer-head">
          <div className="modal-title-with-badge">
            <span className="eyebrow">SMART ANTI-GHOSTING NUDGE</span>
            <h2>Follow-Up Generator</h2>
          </div>
          <button onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <p className="muted" style={{ marginBottom: 18 }}>
          Kirim tindak lanjut terukur untuk <b>{application.position}</b> di <b>{application.company}</b>{' '}
          (menunggu respon {daysWaiting} hari).
        </p>

        {/* Control Bar: Channel, Language, Tone */}
        <div className="followup-controls">
          <div className="control-group">
            <label>Saluran (Channel)</label>
            <div className="segmented-tabs">
              <button
                className={channel === 'email' ? 'active' : ''}
                onClick={() => { setChannel('email'); setCustomBody(null); }}
              >
                <Mail size={13} /> Email
              </button>
              <button
                className={channel === 'linkedin' ? 'active' : ''}
                onClick={() => { setChannel('linkedin'); setCustomBody(null); }}
              >
                <Linkedin size={13} /> LinkedIn
              </button>
              <button
                className={channel === 'whatsapp' ? 'active' : ''}
                onClick={() => { setChannel('whatsapp'); setCustomBody(null); }}
              >
                <MessageSquare size={13} /> WhatsApp
              </button>
            </div>
          </div>

          <div className="control-group">
            <label>Bahasa</label>
            <div className="segmented-tabs">
              <button
                className={language === 'id' ? 'active' : ''}
                onClick={() => { setLanguage('id'); setCustomBody(null); }}
              >
                Indonesia
              </button>
              <button
                className={language === 'en' ? 'active' : ''}
                onClick={() => { setLanguage('en'); setCustomBody(null); }}
              >
                English
              </button>
            </div>
          </div>
        </div>

        <div className="control-group" style={{ marginTop: 12 }}>
          <label>Pendekatan (Tone)</label>
          <div className="tone-cards">
            <div
              className={`tone-pill ${tone === 'polite_inquiry' ? 'active' : ''}`}
              onClick={() => { setTone('polite_inquiry'); setCustomBody(null); }}
            >
              <b>Polite Inquiry</b>
              <small>Menanyakan kelanjutan timeline secara sopan (7-10 hari)</small>
            </div>
            <div
              className={`tone-pill ${tone === 'value_add' ? 'active' : ''}`}
              onClick={() => { setTone('value_add'); setCustomBody(null); }}
            >
              <b>Value-Add</b>
              <small>Membagikan insight teknis/portfolio relevan</small>
            </div>
            <div
              className={`tone-pill ${tone === 'closing_checkin' ? 'active' : ''}`}
              onClick={() => { setTone('closing_checkin'); setCustomBody(null); }}
            >
              <b>Closing Check-in</b>
              <small>Konfirmasi kepastian status & penutupan loop (14+ hari)</small>
            </div>
          </div>
        </div>

        {/* Message Editor Preview */}
        <div className="message-preview-box">
          {channel === 'email' && (
            <div className="subject-line">
              <span className="field-tag">Subject:</span>
              <strong>{generated.subject}</strong>
            </div>
          )}

          <textarea
            className="followup-textarea"
            rows={8}
            value={activeBody}
            onChange={e => setCustomBody(e.target.value)}
          />
        </div>

        {/* Tips box */}
        <div className="followup-tips">
          <Info size={14} />
          <div>
            {generated.tips.map((t, idx) => (
              <p key={idx}>{t}</p>
            ))}
          </div>
        </div>

        {logSuccess && (
          <div className="feedback-banner ok" style={{ marginTop: 12 }}>
            <Check size={14} /> Follow-up berhasil dicatat di timeline aktivitas!
          </div>
        )}

        {/* Action Buttons */}
        <div className="modal-actions-split">
          <button className="secondary" onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Tersalin ke Clipboard' : 'Salin Pesan'}
          </button>

          {channel === 'email' && (
            <a
              href={mailtoHref}
              target="_blank"
              rel="noopener noreferrer"
              className="secondary"
              style={{ textDecoration: 'none' }}
            >
              <ExternalLink size={14} /> Buka Email Client
            </a>
          )}

          <button
            className="primary"
            disabled={isLogging || logSuccess}
            onClick={handleMarkSent}
          >
            <Send size={14} />
            {isLogging ? 'Mencatat...' : 'Tandai Terkirim & Jadwalkan'}
          </button>
        </div>
      </div>
    </div>
  );
}
