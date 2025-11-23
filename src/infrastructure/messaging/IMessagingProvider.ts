/**
 * Interface IMessagingProvider
 * Define contrato para envio de mensagens (WhatsApp, Telegram, etc)
 * Princípio: Dependency Inversion + Interface Segregation
 */

export interface SendMessageInput {
  to: string; // Número do destinatário
  message: string;
  options?: {
    quotedMessageId?: string; // Responder mensagem específica
  };
}

export interface SendImageInput {
  to: string;
  imageUrl: string;
  caption?: string;
}

export interface SendMessageOutput {
  messageId: string;
  success: boolean;
}

export interface IMessagingProvider {
  /**
   * Envia mensagem de texto
   */
  sendTextMessage(input: SendMessageInput): Promise<SendMessageOutput>;

  /**
   * Envia imagem via URL
   */
  sendImageMessage(input: SendImageInput): Promise<SendMessageOutput>;

  /**
   * Envia mensagem com botões (opcional, nem todos providers suportam)
   */
  sendButtonMessage?(
    to: string,
    message: string,
    buttons: Array<{ id: string; text: string }>
  ): Promise<SendMessageOutput>;

  /**
   * Verifica se o provider está conectado/ativo
   */
  isConnected(): Promise<boolean>;
}

