import type { SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
};

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" />
      <path
        d="M9 8.4c0 3.6 3 6.6 6.6 6.6l1-1.7-2.1-1-1 .9c-1-.4-2-1.4-2.4-2.4l.9-1-1-2.1L9 8.4z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export function ArrowIcon({
  direction = 'right',
  ...props
}: SVGProps<SVGSVGElement> & { direction?: 'left' | 'right' }) {
  return (
    <svg {...base} {...props} style={{ transform: direction === 'left' ? 'scaleX(-1)' : undefined }}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function PlayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
      <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
    </svg>
  );
}

export function GridIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l9 9-9 9-9-9z" />
      <path d="M12 8l4 4-4 4-4-4z" />
    </svg>
  );
}
