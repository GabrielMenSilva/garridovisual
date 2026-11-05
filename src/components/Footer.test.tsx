import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Footer } from './Footer';

describe('Footer', () => {
  it('mostra o texto exato com o ano atual', () => {
    render(<Footer />);
    const ano = new Date().getFullYear();
    expect(screen.getByText(`© ${ano} GarridoVisual. Todos os direitos reservados.`)).toBeInTheDocument();
  });
  it('tem links de volta ao topo e ao Instagram com rel seguro', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: /voltar ao topo/i })).toHaveAttribute('href', '#home');
    const insta = screen.getByRole('link', { name: /instagram/i });
    expect(insta).toHaveAttribute('href', 'https://www.instagram.com/garridovisual/');
    expect(insta).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
