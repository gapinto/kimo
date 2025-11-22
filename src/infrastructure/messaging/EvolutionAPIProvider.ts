import axios, { AxiosInstance } from 'axios';
import {
  IMessagingProvider,
  SendMessageInput,
  SendMessageOutput,
} from './IMessagingProvider';
import { logger } from '../../shared/utils/logger';
import { AppError } from '../../shared/errors/AppError';

interface EvolutionAPIConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
}

/**
 * EvolutionAPIProvider
 * Implementa IMessagingProvider usando Evolution API
 * Princípio: Dependency Inversion
 */
export class EvolutionAPIProvider implements IMessagingProvider {
  private readonly client: AxiosInstance;
  private readonly instanceName: string;

  constructor(config: EvolutionAPIConfig) {
    this.instanceName = config.instanceName;

    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        apikey: config.apiKey,
      },
      timeout: 10000,
    });
  }

  async sendTextMessage(input: SendMessageInput): Promise<SendMessageOutput> {
    try {
      const formattedNumber = this.formatPhoneNumber(input.to);
      
      logger.info('Sending WhatsApp message', {
        to: input.to,
        formattedNumber,
        messageLength: input.message.length,
      });

      const response = await this.client.post(
        `/message/sendText/${this.instanceName}`,
        {
          number: formattedNumber,
          text: input.message,
        }
      );

      logger.info('WhatsApp message sent successfully', {
        messageId: response.data.key?.id,
      });

      return {
        messageId: response.data.key?.id || response.data.messageId || 'unknown',
        success: true,
      };
    } catch (error) {
      logger.error('Failed to send WhatsApp message', error);

      if (axios.isAxiosError(error)) {
        throw new AppError(
          `Failed to send WhatsApp message: ${error.message}`,
          500,
          'WHATSAPP_SEND_ERROR'
        );
      }

      throw new AppError('Unexpected error sending WhatsApp message', 500);
    }
  }

  async isConnected(): Promise<boolean> {
    try {
      const response = await this.client.get(`/instance/connectionState/${this.instanceName}`);

      const state = response.data?.instance?.state || response.data?.state;

      logger.debug('Evolution API connection state', { state });

      return state === 'open' || state === 'connected';
    } catch (error) {
      logger.error('Failed to check Evolution API connection', error);
      return false;
    }
  }

  /**
   * Formata número de telefone para o padrão esperado pela Evolution API
   * Remove caracteres especiais e adiciona código do país se necessário
   */
  private formatPhoneNumber(phone: string): string {
    // Remove todos os caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');

    // Adiciona código do país se não tiver
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }

    return cleaned;
  }

  /**
   * Envia mensagem com botões (Evolution API suporta)
   */
  async sendButtonMessage(
    to: string,
    message: string,
    buttons: Array<{ id: string; text: string }>
  ): Promise<SendMessageOutput> {
    try {
      logger.info('Sending WhatsApp button message', {
        to,
        buttonsCount: buttons.length,
      });

      const response = await this.client.post(
        `/message/sendButtons/${this.instanceName}`,
        {
          number: this.formatPhoneNumber(to),
          text: message,
          buttons: buttons.map((btn) => ({
            buttonId: btn.id,
            buttonText: {
              displayText: btn.text,
            },
            type: 1,
          })),
        }
      );

      return {
        messageId: response.data.key?.id || response.data.messageId || 'unknown',
        success: true,
      };
    } catch (error) {
      logger.error('Failed to send button message', error);
      throw new AppError('Failed to send button message', 500);
    }
  }
}

