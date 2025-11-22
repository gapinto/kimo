/**
 * DTOs para WhatsApp Webhook
 */

export interface WhatsAppWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      remoteJidAlt?: string; // Número real quando vem de canal
      fromMe: boolean;
      id: string;
      participant?: string;
      addressingMode?: string;
    };
    pushName: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
      audioMessage?: {
        url: string;
        mimetype: string;
      };
    };
    messageType: string;
    messageTimestamp: number;
  };
}

export interface ParsedWhatsAppMessage {
  from: string; // Número do remetente
  messageId: string;
  text?: string;
  audioUrl?: string;
  timestamp: Date;
  senderName: string;
}

/**
 * Parseia payload do webhook da Evolution API
 */
export function parseEvolutionAPIWebhook(
  payload: WhatsAppWebhookPayload
): ParsedWhatsAppMessage | null {
  // Ignorar mensagens enviadas por nós
  if (payload.data.key.fromMe) {
    return null;
  }

  // Usar remoteJidAlt se disponível (mensagens via canal)
  // Caso contrário, usar remoteJid
  let remoteJid = payload.data.key.remoteJidAlt || payload.data.key.remoteJid;

  // Ignorar mensagens de canais/comunidades (@lid, @g.us, @broadcast)
  if (remoteJid.includes('@lid') || remoteJid.includes('@g.us') || remoteJid.includes('@broadcast')) {
    return null;
  }

  // Extrair número do remetente (apenas números individuais @s.whatsapp.net)
  if (!remoteJid.includes('@s.whatsapp.net')) {
    return null;
  }

  const from = remoteJid.replace('@s.whatsapp.net', '');

  // Extrair texto da mensagem
  let text: string | undefined;
  if (payload.data.message?.conversation) {
    text = payload.data.message.conversation;
  } else if (payload.data.message?.extendedTextMessage?.text) {
    text = payload.data.message.extendedTextMessage.text;
  }

  // Extrair URL de áudio (se for mensagem de voz)
  let audioUrl: string | undefined;
  if (payload.data.message?.audioMessage) {
    audioUrl = payload.data.message.audioMessage.url;
  }

  return {
    from,
    messageId: payload.data.key.id,
    text,
    audioUrl,
    timestamp: new Date(payload.data.messageTimestamp * 1000),
    senderName: payload.data.pushName,
  };
}

