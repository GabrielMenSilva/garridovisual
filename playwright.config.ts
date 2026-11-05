import { defineConfig, devices } from '@playwright/test';

const PROD = 'http://localhost:4173';
const FIXTURES = 'http://localhost:4174';

const desktop = { testIgnore: ['**/menu-mobile.spec.ts'] };
const mobile = { testIgnore: ['**/nav-desktop.spec.ts'] };

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // WebKit + decodificação do vídeo do hero pesam; com muitos workers o próprio navegador
  // atrasa animações e IntersectionObserver e os testes ficam instáveis.
  workers: 3,
  forbidOnly: true,
  retries: 0,
  reporter: [['list']],
  // rolagem suave longa no WebKit com 3 navegadores em paralelo pode passar de 5 s
  expect: { timeout: 10_000 },
  // o WebKit no Windows é lento com axe + vídeo; os testes mais longos passam de 30 s
  timeout: 60_000,
  use: { baseURL: PROD, trace: 'retain-on-failure' },
  webServer: [
    {
      // build de produção (dist/)
      command: 'node node_modules/vite/bin/vite.js preview --port 4173 --strictPort',
      url: PROD,
      reuseExistingServer: true,
    },
    {
      // build com vídeos fictícios para testar o player (dist-e2e/, `vite build --mode e2e`)
      command: 'node node_modules/vite/bin/vite.js preview --outDir dist-e2e --port 4174 --strictPort',
      url: FIXTURES,
      reuseExistingServer: true,
    },
  ],
  projects: [
    {
      name: 'chromium-desktop',
      ...desktop,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'chromium-mobile',
      ...mobile,
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'webkit-desktop',
      ...desktop,
      use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'webkit-mobile',
      ...mobile,
      use: { ...devices['iPhone 14'], viewport: { width: 390, height: 844 } },
    },
  ],
});
