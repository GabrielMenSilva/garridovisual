import { buildWhatsAppLink } from '../lib/whatsapp';

const whatsappNumber = '(44) 99169-7273';

export const contact = {
  instagram: {
    handle: '@garridovisual',
    url: 'https://www.instagram.com/garridovisual/',
  },
  whatsapp: {
    display: whatsappNumber,
    url: buildWhatsAppLink(
      '5544991697273',
      'Olá, Garrido! Vim pelo site e gostaria de falar sobre um projeto.',
    ),
  },
  // O e-mail existe no site antigo, mas o pedido é só Instagram e WhatsApp.
  // Troque `visible` para true se o Garrido quiser exibi-lo.
  email: { address: 'garridovisual@hotmail.com', visible: false },
  city: 'Maringá, PR',
} as const;
