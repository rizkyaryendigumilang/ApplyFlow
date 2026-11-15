import { X, Command } from 'lucide-react';

export interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + K / ⌘K', description: 'Pencarian Global & Navigasi Cepat' },
    { key: 'N', description: 'Buka form Tambah Peluang Karier Baru' },
    { key: '/', description: 'Fokus ke kolom pencarian filter pipeline' },
    { key: 'Esc', description: 'Tutup drawer detail atau modal aktif' },
    { key: '?', description: 'Buka / tutup panduan pintasan keyboard ini' },
  ];

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Pintasan Keyboard"
      style={{ zIndex: 1100 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" style={{ maxWidth: '480px', width: '92vw' }}>
        <div className="drawer-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Command size={14} style={{ color: '#556b2f' }} />
            <span className="eyebrow">PINTASAN KEYBOARD</span>
          </div>
          <button onClick={onClose} aria-label="Tutup modal">
            <X size={18} />
          </button>
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#202320', margin: '4px 0 8px' }}>
          Navigasi Cepat Desktop
        </h2>
        <p className="muted" style={{ fontSize: '13px', margin: '0 0 20px', lineHeight: 1.5 }}>
          Gunakan pintasan keyboard berikut untuk mengelola lamaran tanpa perlu menyentuh mouse.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {shortcuts.map((s) => (
            <div
              key={s.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: '#fafaf8',
                border: '1px solid #e5e6df',
                borderRadius: '6px',
              }}
            >
              <span style={{ fontSize: '13px', color: '#333830' }}>{s.description}</span>
              <kbd
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#202320',
                  background: '#ecefe6',
                  border: '1px solid #d5d8cd',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  boxShadow: '0 1px 1px rgba(0,0,0,0.06)',
                  letterSpacing: '0.02em',
                }}
              >
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <button
            type="button"
            className="secondary compact-btn"
            onClick={onClose}
            style={{ fontSize: '12px' }}
          >
            Tutup (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
