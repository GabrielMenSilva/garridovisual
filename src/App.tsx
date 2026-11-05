import { useEffect } from 'react';
import { settleOnSection } from './lib/nav';
import { About } from './components/About';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Projects } from './components/Projects';
import { SkipLink } from './components/SkipLink';

export default function App() {
  // abrir a URL com #contato (etc.) cai na seção certa, mesmo com o conteúdo montado depois do carregamento
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const el = id ? document.getElementById(id) : null;
    if (!el) return;
    el.scrollIntoView({ behavior: 'instant' });
    settleOnSection(el);
    // o layout ainda muda depois da hidratação (fontes, seções renderizando): confere de novo
    const again = () => settleOnSection(el);
    void document.fonts?.ready.then(again);
    if (document.readyState !== 'complete') window.addEventListener('load', again, { once: true });
    return () => window.removeEventListener('load', again);
  }, []);

  return (
    <>
      <SkipLink />
      <Header />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        <Hero />
        <Projects />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
