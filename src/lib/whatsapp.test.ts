import { describe, expect, it } from 'vitest';
import { buildWhatsAppLink } from './whatsapp';

describe('buildWhatsAppLink', () => {
  it('usa só os dígitos do número', () => {
    expect(buildWhatsAppLink('+55 (44) 99169-7273')).toBe('https://wa.me/5544991697273?text=');
  });
  it('codifica acento, espaço e pontuação da mensagem', () => {
    const url = buildWhatsAppLink('5544991697273', 'Olá, Garrido! Vim pelo site.');
    expect(url).toBe('https://wa.me/5544991697273?text=Ol%C3%A1%2C%20Garrido!%20Vim%20pelo%20site.');
    expect(decodeURIComponent(url.split('text=')[1] as string)).toBe('Olá, Garrido! Vim pelo site.');
  });
  it('recusa números inválidos', () => {
    expect(() => buildWhatsAppLink('123')).toThrow();
    expect(() => buildWhatsAppLink('abc')).toThrow();
  });
});
