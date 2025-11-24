import { Router } from 'express';
import { WhatsAppWebhookController } from '../../../application/controllers/WhatsAppWebhookController';
import { ConversationService } from '../../../application/services/ConversationService';
import { EvolutionAPIProvider } from '../../messaging/EvolutionAPIProvider';
import { PrismaUserRepository } from '../../database/repositories/PrismaUserRepository';
import { PrismaDriverConfigRepository } from '../../database/repositories/PrismaDriverConfigRepository';
import { PrismaFixedCostRepository } from '../../database/repositories/PrismaFixedCostRepository';
import { PrismaTripRepository } from '../../database/repositories/PrismaTripRepository';
import { PrismaExpenseRepository } from '../../database/repositories/PrismaExpenseRepository';
import { PrismaDailySummaryRepository } from '../../database/repositories/PrismaDailySummaryRepository';
import { PrismaPendingTripRepository } from '../../database/repositories/PrismaPendingTripRepository';
import { prisma } from '../../database/prisma';
import { env } from '../../../shared/utils/env';

/**
 * Rotas do Webhook WhatsApp
 */
export function createWhatsAppRoutes(): Router {
  const router = Router();

  // Repositories (usando Prisma)
  const userRepository = new PrismaUserRepository(prisma);
  const driverConfigRepository = new PrismaDriverConfigRepository(prisma);
  const fixedCostRepository = new PrismaFixedCostRepository(prisma);
  const tripRepository = new PrismaTripRepository(prisma);
  const expenseRepository = new PrismaExpenseRepository(prisma);
  const dailySummaryRepository = new PrismaDailySummaryRepository(prisma);
  const pendingTripRepository = new PrismaPendingTripRepository(prisma);

  // Messaging Provider
  const messagingProvider = new EvolutionAPIProvider({
    apiUrl: env.whatsapp.evolutionApiUrl,
    apiKey: env.whatsapp.evolutionApiKey,
    instanceName: env.whatsapp.evolutionInstanceName,
  });

  // Conversation Service
  const conversationService = new ConversationService(
    messagingProvider,
    userRepository,
    driverConfigRepository,
    fixedCostRepository,
    tripRepository,
    expenseRepository,
    dailySummaryRepository,
    pendingTripRepository,
    env.ai.groqApiKey,
    env.ai.deepseekApiKey
  );

  // Controller
  const webhookController = new WhatsAppWebhookController(conversationService);

  // Rotas
  router.post('/webhook', (req, res, next) => webhookController.handleWebhook(req, res, next));
  router.get('/webhook', (req, res) => webhookController.verifyWebhook(req, res));

  return router;
}

