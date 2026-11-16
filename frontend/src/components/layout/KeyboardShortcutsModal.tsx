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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Pintasan Keyboard"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl text-zinc-900 dark:text-zinc-100 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
              <Command size={13} />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-zinc-400">
              PINTASAN KEYBOARD
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Navigasi Cepat Desktop
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
            Gunakan pintasan keyboard berikut untuk mengelola lamaran tanpa perlu menyentuh mouse.
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-1">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/50 dark:bg-zinc-900/40 text-xs transition-colors hover:bg-zinc-100/60 dark:hover:bg-zinc-850/60"
            >
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                {s.description}
              </span>
              <kbd className="font-mono text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-0.5 shadow-2xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all cursor-pointer"
          >
            Tutup (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
