import { Router } from 'express';
import { WhatsAppWebhookController } from '../../application/controllers/WhatsAppWebhookController';
import { ConversationService } from '../../application/services/ConversationService';
import { EvolutionAPIProvider } from '../../infrastructure/messaging/EvolutionAPIProvider';
import { SupabaseUserRepository } from '../../infrastructure/database/repositories/SupabaseUserRepository';
import { SupabaseDriverConfigRepository } from '../../infrastructure/database/repositories/SupabaseDriverConfigRepository';
import { SupabaseFixedCostRepository } from '../../infrastructure/database/repositories/SupabaseFixedCostRepository';
import { SupabaseTripRepository } from '../../infrastructure/database/repositories/SupabaseTripRepository';
import { SupabaseExpenseRepository } from '../../infrastructure/database/repositories/SupabaseExpenseRepository';
import { SupabaseDailySummaryRepository } from '../../infrastructure/database/repositories/SupabaseDailySummaryRepository';
import { getSupabaseClient } from '../../infrastructure/database/supabase.client';
import { env } from '../../shared/utils/env';

/**
 * Rotas do Webhook WhatsApp
 */
export function createWhatsAppRoutes(): Router {
  const router = Router();

  // Inicializar dependências
  const supabaseClient = getSupabaseClient();
  
  // Repositories
  const userRepository = new SupabaseUserRepository(supabaseClient);
  const driverConfigRepository = new SupabaseDriverConfigRepository(supabaseClient);
  const fixedCostRepository = new SupabaseFixedCostRepository(supabaseClient);
  const tripRepository = new SupabaseTripRepository(supabaseClient);
  const expenseRepository = new SupabaseExpenseRepository(supabaseClient);
  const dailySummaryRepository = new SupabaseDailySummaryRepository(supabaseClient);

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
    dailySummaryRepository
  );

  // Controller
  const webhookController = new WhatsAppWebhookController(conversationService);

  // Rotas
  router.post('/webhook', (req, res, next) => webhookController.handleWebhook(req, res, next));
  router.get('/webhook', (req, res) => webhookController.verifyWebhook(req, res));

  return router;
}

