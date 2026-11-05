import { useEffect, useRef } from 'react';
import { contact } from '../data/contact';
import { sections } from '../data/site';
import { handleAnchorClick } from '../lib/nav';
import { useScrollLock } from '../hooks/useScrollLock';
import { CloseIcon } from './Icons';
import { Logo } from './Logo';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  active: string;
}

/** Menu em tela cheia para < 768 px, feito com <dialog> modal (foco preso, Esc fecha, fundo inerte). */
export function MobileMenu({ open, onClose, active }: MobileMenuProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useScrollLock(open);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // se a janela crescer até o desktop com o menu aberto, fecha
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => e.matches && onClose();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [open, onClose]);

  return (
    <dialog
      ref={ref}
      id="menu-mobile"
      aria-label="Menu principal"
      onClose={onClose}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-bg p-0 backdrop:bg-bg"
    >
      <div className="flex h-full flex-col px-6 pb-10 pt-4">
        <div className="flex items-center justify-between">
          <Logo variant="horizontal" size={30} />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 border border-line px-3 text-sm font-semibold text-ink hover:border-gold"
          >
            <CloseIcon className="size-5" />
            <span>Fechar</span>
          </button>
        </div>
        <nav aria-label="Seções" className="mt-12 flex-1">
          <ul className="flex flex-col">
            {sections.map((s, i) => (
              <li key={s.id} className="border-b border-line">
                <a
                  href={`#${s.id}`}
                  onClick={handleAnchorClick(s.id, onClose)}
                  aria-current={active === s.id ? 'location' : undefined}
                  className="flex min-h-14 items-baseline gap-4 py-4 font-display text-4xl font-extrabold text-ink aria-[current=location]:text-gold"
                >
                  <span className="text-sm font-semibold tracking-widest text-gold-deep">0{i + 1}</span>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a
          href={contact.whatsapp.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary w-full"
        >
          Fale comigo
        </a>
      </div>
    </dialog>
  );
}
