#!/usr/bin/env node
// Serve dist-pages/ em http://localhost:4175/garridovisual/ (como o GitHub Pages), para conferir antes de publicar.
import { spawn } from 'node:child_process';

const p = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--outDir', 'dist-pages', '--port', '4175', '--strictPort'],
  { stdio: 'inherit', env: { ...process.env, VITE_BASE: '/garridovisual/' } },
);
process.on('SIGTERM', () => p.kill());
p.on('exit', (c) => process.exit(c ?? 0));
