import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';

/** Gera o HTML da página no build (pré-renderização); o navegador só "hidrata" depois. */
export function render(): string {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
