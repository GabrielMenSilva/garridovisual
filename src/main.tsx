import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/syne/latin-700.css';
import '@fontsource/syne/latin-800.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-600.css';
import './styles/global.css';
import App from './App';

document.documentElement.classList.add('js');

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
