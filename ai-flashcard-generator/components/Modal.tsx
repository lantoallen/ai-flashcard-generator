'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './icons';

/** A modal built on the native <dialog>: focus is trapped and Escape closes it. */
export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop lands on the dialog element itself.
        if (e.target === ref.current) onClose();
      }}
      className="panel pop m-auto w-[min(32rem,calc(100vw-2rem))] p-0 text-fg backdrop:bg-black/40"
    >
      <div className="flex items-center justify-between gap-3 border-b-2 border-line px-5 py-4">
        <h2 className="font-display text-xl font-extrabold">{title}</h2>
        <button type="button" onClick={onClose} className="btn btn-ghost !p-1.5" aria-label="Close">
          <Icon name="x" size={18} />
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
    </dialog>
  );
}
