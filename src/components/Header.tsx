import { useCallback, useRef, useState } from 'react';
import { contact } from '../data/contact';
import { sections } from '../data/site';
import { handleAnchorClick } from '../lib/nav';
import { useActiveSection } from '../hooks/useActiveSection';
import { useScrolled } from '../hooks/useScrolled';
import { Logo } from './Logo';
import { MobileMenu } from './MobileMenu';

const ids = sections.map((s) => s.id);

export function Header() {
  const scrolled = useScrolled(40);
  const active = useActiveSection(ids);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    menuButton.current?.focus();
  }, []);

  return (
    <header
      data-scrolled={scrolled}
      className="fixed inset-x-0 top-0 z-40 border-b border-transparent transition-[background-color,border-color,box-shadow] duration-300 data-[scrolled=true]:border-line data-[scrolled=true]:bg-surface data-[scrolled=true]:shadow-[0_8px_24px_rgb(0_0_0/0.45)] supports-[backdrop-filter]:data-[scrolled=true]:bg-bg/80 supports-[backdrop-filter]:data-[scrolled=true]:backdrop-blur-md"
    >
      <div className="container-x flex h-[var(--header-h)] items-center justify-between gap-6">
        <a
          href="#home"
          onClick={handleAnchorClick('home')}
          aria-label="GarridoVisual, ir para o início"
          className="inline-flex min-h-11 items-center"
        >
          <Logo variant="horizontal" />
        </a>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={handleAnchorClick(s.id)}
                  aria-current={active === s.id ? 'location' : undefined}
                  className="relative inline-flex min-h-11 items-center px-4 text-[0.9375rem] font-medium text-muted transition-colors hover:text-ink aria-[current=location]:text-gold after:absolute after:inset-x-4 after:bottom-1.5 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform aria-[current=location]:after:scale-x-100"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={contact.whatsapp.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary hidden !min-h-11 md:inline-flex"
          >
            Fale comigo
          </a>
          <button
            ref={menuButton}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            onClick={() => setMenuOpen(true)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center border border-line px-4 text-sm font-semibold text-ink hover:border-gold md:hidden"
          >
            Menu
          </button>
        </div>
      </div>
      <MobileMenu open={menuOpen} onClose={closeMenu} active={active} />
    </header>
  );
}
