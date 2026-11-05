import { handleAnchorClick } from '../lib/nav';
import { useReveal } from '../hooks/useReveal';
import { SectionHeading } from './SectionHeading';

// TODO(garrido): confirmar e ampliar a história. Este rascunho usa SÓ fatos conhecidos
// (cidade, funções, tipos de cliente e a frase de assinatura). Não há ano de início,
// formação, equipamento nem anos de experiência, de propósito.
const story = [
  'Moro e trabalho em Maringá, no Paraná. Sou filmmaker, fotógrafo e editor de vídeo.',
  'Cuido de tudo o que acontece entre a captação e a edição final: direção, edição e motion design. Já fiz conteúdo para marcas, um restaurante, um parque, um casamento, um escritório de arquitetura e um criador de conteúdo.',
  'Em tudo o que faço, acredito em contar histórias de um jeito que prende e fica na memória.',
];

const services = ['Filmmaker', 'Fotografia', 'Edição de vídeo', 'Motion design', 'Direção'];

export function About() {
  const reveal = useReveal<HTMLDivElement>();

  return (
    <section
      id="sobre"
      aria-labelledby="sobre-titulo"
      className="relative border-t border-line bg-surface py-24 sm:py-32"
    >
      <div className="container-x">
        <SectionHeading number="02" label="Quem está por trás" id="sobre-titulo" title="Sobre" />
        <div
          ref={reveal}
          className="reveal mt-14 grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20"
        >
          {/* TODO(garrido): trocar o bloco "GV" pela foto do Garrido (retrato 4:5) */}
          <div
            aria-hidden="true"
            className="relative mx-auto flex aspect-[4/5] w-full max-w-md items-center justify-center overflow-hidden border border-line bg-bg"
          >
            <span className="font-display text-[clamp(5rem,16vw,9rem)] font-extrabold tracking-tight text-gold">
              GV
            </span>
            <span className="absolute inset-4 border border-gold-deep/40" />
          </div>

          <div>
            <div className="space-y-5 text-[length:var(--text-lead)] text-muted">
              {story.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <h3 className="mt-10 text-sm font-semibold uppercase tracking-[0.22em] text-gold-light">
              O que eu faço
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {services.map((service) => (
                <li key={service} className="chip">
                  {service}
                </li>
              ))}
            </ul>
            <a href="#projetos" onClick={handleAnchorClick('projetos')} className="btn btn-secondary mt-10">
              Ver projetos
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
