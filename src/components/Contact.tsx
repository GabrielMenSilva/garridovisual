import type { ReactNode } from 'react';
import { contact } from '../data/contact';
import { useReveal } from '../hooks/useReveal';
import { InstagramIcon, WhatsAppIcon } from './Icons';
import { SectionHeading } from './SectionHeading';

interface CardProps {
  href: string;
  label: string;
  title: string;
  detail: string;
  icon: ReactNode;
}

function ContactCard({ href, label, title, detail, icon }: CardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="group flex items-center gap-6 border border-line bg-surface p-6 transition-colors hover:border-gold hover:bg-surface-2 sm:p-8"
    >
      <span className="flex size-16 shrink-0 items-center justify-center border border-gold-deep text-gold transition-colors group-hover:border-gold group-hover:bg-gold group-hover:text-on-gold">
        {icon}
      </span>
      <span>
        <span className="block font-display text-2xl font-extrabold text-ink sm:text-3xl">{title}</span>
        <span className="mt-1 block text-muted">{detail}</span>
      </span>
    </a>
  );
}

export function Contact() {
  const reveal = useReveal<HTMLDivElement>();

  return (
    <section id="contato" aria-labelledby="contato-titulo" className="relative py-24 sm:py-32">
      <div className="container-x">
        <SectionHeading
          number="03"
          label="Vamos conversar"
          id="contato-titulo"
          title="Contato"
          intro="Vamos contar a sua história? Chame no WhatsApp ou acompanhe o trabalho no Instagram."
        />
        <div ref={reveal} className="reveal mt-14 grid gap-5 md:grid-cols-2">
          <ContactCard
            href={contact.instagram.url}
            label="Abrir Instagram do GarridoVisual"
            title="Instagram"
            detail={contact.instagram.handle}
            icon={<InstagramIcon className="size-8" />}
          />
          <ContactCard
            href={contact.whatsapp.url}
            label="Chamar no WhatsApp"
            title="WhatsApp"
            detail={contact.whatsapp.display}
            icon={<WhatsAppIcon className="size-8" />}
          />
        </div>
        {contact.email.visible && (
          <p className="mt-8 text-muted">
            Ou por e-mail:{' '}
            <a className="text-gold underline underline-offset-4" href={`mailto:${contact.email.address}`}>
              {contact.email.address}
            </a>
          </p>
        )}
        <p className="mt-10 text-sm font-semibold uppercase tracking-[0.22em] text-gold-deep">
          {contact.city}
        </p>
      </div>
    </section>
  );
}
