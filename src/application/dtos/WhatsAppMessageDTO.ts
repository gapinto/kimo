/**
 * DTOs para WhatsApp Webhook
 */

export interface WhatsAppWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
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

  // Extrair número do remetente
  const from = payload.data.key.remoteJid.replace('@s.whatsapp.net', '');

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

