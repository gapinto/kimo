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

  // PRIORIDADE CORRETA: Primeiro tenta remoteJid, depois remoteJidAlt
  // remoteJid geralmente é o número válido
  // remoteJidAlt só é usado quando remoteJid é grupo/canal
  let remoteJid = payload.data.key.remoteJid;
  
  // Se remoteJid for grupo/canal/broadcast, tenta usar remoteJidAlt
  if (remoteJid.includes('@g.us') || remoteJid.includes('@lid') || remoteJid.includes('@broadcast')) {
    remoteJid = payload.data.key.remoteJidAlt || remoteJid;
  }

  // Agora verifica se o número final é válido (individual)
  // Ignorar se for canal/grupo/broadcast
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

