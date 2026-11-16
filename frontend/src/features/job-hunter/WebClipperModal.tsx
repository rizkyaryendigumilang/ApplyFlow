import { useState } from 'react';
import {
  X,
  Bookmark,
  Copy,
  Check,
  Globe,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Code,
  Zap,
} from 'lucide-react';
import type { JobLead } from '../../lib/pb-types';

function parseJobPostingText(text: string): {
  title: string;
  company: string;
  location: string;
} {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let title = lines[0] || 'Software Engineer';
  let company = lines[1] || 'Tech Enterprise';
  let location = 'Indonesia / Remote';

  for (const line of lines.slice(0, 8)) {
    if (/(pt\b|inc\b|ltd\b|corp\b|tech\b|technologies|solutions|group)/i.test(line)) {
      company = line.replace(/^(perusahaan|company|at)\s*[:\-]?\s*/i, '');
    } else if (/(jakarta|bandung|surabaya|yogyakarta|bali|remote|hybrid|singapore)/i.test(line)) {
      location = line.replace(/^(lokasi|location)\s*[:\-]?\s*/i, '');
    } else if (/(engineer|developer|architect|lead|manager|analyst|specialist|devops|sre|designer)/i.test(line)) {
      title = line.replace(/^(posisi|role|position|title)\s*[:\-]?\s*/i, '');
    }
  }

  return { title, company, location };
}

export interface WebClipperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportLead: (lead: Omit<JobLead, 'id'>) => Promise<void>;
}

export function WebClipperModal({
  isOpen,
  onClose,
  onImportLead,
}: WebClipperModalProps) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'bookmarklet' | 'quickpaste'>('bookmarklet');
  const [pasteText, setPasteText] = useState('');
  const [pasteUrl, setPasteUrl] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Bookmarklet Code snippet
  const appOrigin = window.location.origin;
  const bookmarkletCode = `javascript:(function(){
    try {
      const url = window.location.href;
      let title = document.querySelector('h1')?.innerText?.trim() || document.title || '';
      let company = document.querySelector('[data-automation="jobCompany"], .topcard__org-name-link, .employer-name, .company-name, [class*="company"]')?.innerText?.trim() || '';
      let location = document.querySelector('[data-automation="jobLocation"], .topcard__flavor--bullet, [class*="location"]')?.innerText?.trim() || '';
      
      let jdElem = document.querySelector('[data-automation="jobDescription"], .show-more-less-html__markup, .job-details, article, [class*="description"]') || document.body;
      let rawJd = jdElem ? jdElem.innerText.slice(0, 15000) : '';

      const query = new URLSearchParams({
        title: title.slice(0, 120),
        company: company.slice(0, 100),
        location: location.slice(0, 80),
        url: url,
        source: window.location.hostname.replace('www.', '')
      });

      const targetUrl = '${appOrigin}/?clip=true&' + query.toString();
      window.open(targetUrl, '_blank');
    } catch(e) {
      alert('Career CRM Clipper Error: ' + e.message);
    }
  })();`.replace(/\s+/g, ' ');

  const handleCopyBookmarklet = async () => {
    try {
      await navigator.clipboard.writeText(bookmarkletCode);
      setCopyFeedback('Kode Bookmarklet berhasil disalin! Buat Bookmark baru di browser dan paste kode ini di kolom URL.');
      setTimeout(() => setCopyFeedback(null), 4000);
    } catch {
      setCopyFeedback('Gagal menyalin kode otomatis.');
    }
  };

  const handleQuickPasteImport = async () => {
    if (!pasteText.trim()) return;
    setIsImporting(true);
    try {
      const parsed = parseJobPostingText(pasteText);
      await onImportLead({
        title: parsed.title || 'Extracted Job Lead',
        company: parsed.company || 'Unknown Company',
        location: parsed.location || 'Indonesia / Remote',
        rawJd: pasteText,
        source: pasteUrl ? new URL(pasteUrl).hostname.replace('www.', '') : 'web-clipper',
        url: pasteUrl || undefined,
        matchScore: 0,
        status: 'inbox',
      });
      setCopyFeedback('Lowongan berhasil di-klip ke Job Leads Inbox!');
      setPasteText('');
      setPasteUrl('');
      setTimeout(() => {
        setCopyFeedback(null);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      setCopyFeedback(`Gagal impor: ${msg}`);
      setTimeout(() => setCopyFeedback(null), 3500);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true" style={{ zIndex: 1050 }}>
      <div
        className="modal"
        style={{
          maxWidth: '680px',
          width: '95vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
          background: '#fcfcf9',
          border: '1px solid #dedfd8',
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #dedfd8',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                font: "10px 'DM Mono'",
                textTransform: 'uppercase',
                background: '#eef2e6',
                color: '#4e622b',
                padding: '3px 8px',
                borderRadius: '3px',
                border: '1px solid #d4dec3',
              }}
            >
              P1 · 1-CLICK WEB CLIPPER
            </span>
            <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 600 }}>
              Job Portal Web-Clipper & Bookmarklet
            </h2>
          </div>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label="Close modal"
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '6px' }}
          >
            <X size={18} />
          </button>
        </header>

        {copyFeedback && (
          <div
            style={{
              background: '#eef2e6',
              color: '#36481b',
              padding: '8px 20px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderBottom: '1px solid #d4dec3',
            }}
          >
            <Check size={14} /> {copyFeedback}
          </div>
        )}

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #dedfd8',
            background: '#f5f5f0',
            padding: '0 20px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('bookmarklet')}
            style={{
              padding: '10px 16px',
              fontSize: '12px',
              fontWeight: 600,
              background: activeTab === 'bookmarklet' ? '#fff' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'bookmarklet' ? '2px solid #18181b' : 'none',
              color: activeTab === 'bookmarklet' ? '#202320' : '#777c73',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Bookmark size={14} /> Browser Bookmarklet (1-Klik dari LinkedIn/Jobstreet)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quickpaste')}
            style={{
              padding: '10px 16px',
              fontSize: '12px',
              fontWeight: 600,
              background: activeTab === 'quickpaste' ? '#fff' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'quickpaste' ? '2px solid #18181b' : 'none',
              color: activeTab === 'quickpaste' ? '#202320' : '#777c73',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Zap size={14} /> Quick Paste & Clip
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'bookmarklet' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#444840', lineHeight: 1.5 }}>
                Pasang bookmarklet ini di baris bookmark browser Anda (Chrome / Edge / Safari / Firefox). Ketika Anda membuka halaman lowongan di <b>LinkedIn</b>, <b>Jobstreet</b>, <b>Glints</b>, atau <b>Kalibrr</b>, cukup klik tombol bookmarklet ini untuk langsung mengklip info pekerjaan ke Job Hunter CRM!
              </p>

              {/* Drag button */}
              <div
                style={{
                  background: '#f9f9f5',
                  border: '1px dashed #18181b',
                  padding: '20px',
                  borderRadius: '6px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '12px', color: '#18181b', fontWeight: 600 }}>
                  👇 Drag tombol ini ke Bookmarks Bar browser Anda:
                </span>
                <a
                  href={bookmarkletCode}
                  onClick={(e) => e.preventDefault()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#202320',
                    color: '#f5f5f0',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    cursor: 'grab',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  }}
                  title="Drag me to your Bookmarks Bar"
                >
                  <Bookmark size={14} /> Clip to Career CRM
                </a>
                <span style={{ fontSize: '11px', color: '#888d82' }}>
                  Atau jika menggunakan HP / tablet, salin kode JavaScript di bawah ini:
                </span>
              </div>

              {/* Code snippet & copy */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: '#777c73' }}>
                    Javascript Bookmarklet Source
                  </label>
                  <button
                    type="button"
                    className="secondary compact-btn"
                    onClick={handleCopyBookmarklet}
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                  >
                    <Copy size={12} /> Copy Bookmarklet Code
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={4}
                  value={bookmarkletCode}
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    border: '1px solid #dedfd8',
                    background: '#f5f5f0',
                    borderRadius: '3px',
                    color: '#555a50',
                  }}
                />
              </div>

              {/* Supported portals */}
              <div style={{ borderTop: '1px solid #dedfd8', paddingTop: '12px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: '#777c73', display: 'block', marginBottom: '8px' }}>
                  Teruji & Kompatibel Dengan:
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['LinkedIn Jobs', 'JobStreet Indonesia', 'Glints', 'Kalibrr', 'Indeed', 'Karier.com', 'Halaman Karir Perusahaan'].map((p) => (
                    <span
                      key={p}
                      style={{
                        fontSize: '11px',
                        background: '#edf2e3',
                        color: '#4e622b',
                        padding: '3px 8px',
                        borderRadius: '3px',
                        border: '1px solid #cfddbe',
                      }}
                    >
                      ✓ {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: '#777c73', display: 'block', marginBottom: '4px' }}>
                  Job URL (opsional)
                </label>
                <input
                  type="url"
                  value={pasteUrl}
                  onChange={(e) => setPasteUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/jobs/view/..."
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #dedfd8', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: '#777c73', display: 'block', marginBottom: '4px' }}>
                  Paste Text Lowongan Kerja (Judul, Perusahaan, Deskripsi) *
                </label>
                <textarea
                  rows={8}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Tempelkan seluruh teks lowongan dari portal kerja di sini..."
                  style={{ width: '100%', padding: '10px', border: '1px solid #dedfd8', fontSize: '12px', lineHeight: 1.4 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '10px', borderTop: '1px solid #dedfd8' }}>
                <button type="button" className="secondary compact-btn" onClick={onClose}>
                  Batal
                </button>
                <button
                  type="button"
                  className="primary compact-btn"
                  onClick={handleQuickPasteImport}
                  disabled={!pasteText.trim() || isImporting}
                  style={{ background: '#202320', color: '#f5f5f0' }}
                >
                  <Sparkles size={13} /> {isImporting ? 'Mengimpor...' : 'Klip ke Job Leads'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
