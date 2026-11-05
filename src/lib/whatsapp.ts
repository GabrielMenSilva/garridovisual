/**
 * Monta o link de conversa do WhatsApp.
 * O número aceita máscara; só os dígitos entram no link (formato internacional, sem "+").
 */
export function buildWhatsAppLink(numero: string, mensagem = ''): string {
  const digitos = numero.replace(/\D/g, '');
  if (digitos.length < 10 || digitos.length > 15) {
    throw new Error(`Número de WhatsApp inválido: "${numero}"`);
  }
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensagem)}`;
}
