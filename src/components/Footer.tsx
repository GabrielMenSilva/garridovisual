import { contact } from '../data/contact';
import { site } from '../data/site';
import { handleAnchorClick } from '../lib/nav';
import { useCurrentYear } from '../hooks/useCurrentYear';
import { Logo } from './Logo';

export function Footer({ year: fixedYear }: { year?: number }) {
  const currentYear = useCurrentYear();
  const year = fixedYear ?? currentYear;
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-x flex flex-col items-center justify-between gap-6 py-10 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-4">
          <Logo variant="mark" size={28} />
          <p className="text-sm text-muted">
            © {year} {site.name}. Todos os direitos reservados.
          </p>
        </div>
        <nav aria-label="Rodapé">
          <ul className="flex items-center gap-2 text-sm font-medium">
            <li>
              <a
                href="#home"
                onClick={handleAnchorClick('home')}
                className="inline-flex min-h-11 items-center px-3 text-gold hover:text-gold-light"
              >
                Voltar ao topo
              </a>
            </li>
            <li>
              <a
                href={contact.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center px-3 text-gold hover:text-gold-light"
              >
                Instagram
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
