interface SectionHeadingProps {
  number: string;
  label: string;
  id: string;
  title: string;
  intro?: string;
}

export function SectionHeading({ number, label, id, title, intro }: SectionHeadingProps) {
  return (
    <header className="max-w-3xl">
      <p className="eyebrow">
        <span aria-hidden="true" className="block size-2 rotate-45 bg-gold" />
        <span>
          {number} <span aria-hidden="true">—</span> {label}
        </span>
      </p>
      <h2 id={id} className="mt-4 text-[length:var(--text-title)] text-ink">
        {title}
      </h2>
      {intro && <p className="mt-5 text-[length:var(--text-lead)] text-muted">{intro}</p>}
    </header>
  );
}
