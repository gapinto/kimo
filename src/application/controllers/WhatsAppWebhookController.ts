import { Request, Response, NextFunction } from 'express';
import {
  WhatsAppWebhookPayload,
  parseEvolutionAPIWebhook,
} from '../dtos/WhatsAppMessageDTO';
import { ConversationService } from '../services/ConversationService';
import { logger } from '../../shared/utils/logger';

/**
 * WhatsAppWebhookController
 * Recebe e processa webhooks do WhatsApp (Evolution API)
 * Princípio: Single Responsibility
 */
export class WhatsAppWebhookController {
  constructor(private readonly conversationService: ConversationService) {}

  /**
   * Processa webhook recebido
   */
  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload: WhatsAppWebhookPayload = req.body;

      logger.info('Received WhatsApp webhook', {
        event: payload.event,
        instance: payload.instance,
      });

      // Processar apenas mensagens recebidas
      if (payload.event === 'messages.upsert') {
        const parsedMessage = parseEvolutionAPIWebhook(payload);

        if (parsedMessage && parsedMessage.text) {
          // Processar mensagem de forma assíncrona (não bloquear resposta)
          this.conversationService
            .processMessage(parsedMessage.from, parsedMessage.text)
            .catch((error) => {
              logger.error('Error processing message async', error);
            });
        }
      }

      // Responder rapidamente ao webhook (importante!)
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Error handling webhook', error);
      next(error);
    }
  }

  /**
   * Webhook de verificação (usado por alguns providers)
   */
  async verifyWebhook(req: Request, res: Response): Promise<void> {
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (token === verifyToken) {
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Invalid verify token');
    }
  }
}

