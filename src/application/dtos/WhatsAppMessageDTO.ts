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

  // SOLUÇÃO UNIVERSAL: Tentar ambos e escolher o que for válido
  // iOS envia número em remoteJid, Android envia em remoteJidAlt
  const jid1 = payload.data.key.remoteJid;
  const jid2 = payload.data.key.remoteJidAlt;

  // Escolher o que for um número individual válido (@s.whatsapp.net)
  let remoteJid: string | null = null;

  if (jid1 && jid1.includes('@s.whatsapp.net')) {
    remoteJid = jid1; // iOS geralmente usa remoteJid
  } else if (jid2 && jid2.includes('@s.whatsapp.net')) {
    remoteJid = jid2; // Android geralmente usa remoteJidAlt
  }

  // Se nenhum for válido, ignorar (é grupo/canal/broadcast)
  if (!remoteJid) {
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

