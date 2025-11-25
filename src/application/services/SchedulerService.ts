import cron from 'node-cron';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IDailySummaryRepository } from '../../domain/repositories/IDailySummaryRepository';
import { IPendingTripRepository } from '../../domain/repositories/IPendingTripRepository';
import { IMessagingProvider } from '../../infrastructure/messaging/IMessagingProvider';
import { GetWeeklyProgress } from '../../domain/usecases/GetWeeklyProgress';
import { logger } from '../../shared/utils/logger';

/**
 * SchedulerService
 * Gerencia jobs agendados (cron) para mensagens automáticas
 */
export class SchedulerService {
  private jobs: cron.ScheduledTask[] = [];

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly dailySummaryRepository: IDailySummaryRepository,
    private readonly pendingTripRepository: IPendingTripRepository,
    private readonly messagingProvider: IMessagingProvider
  ) {}

  /**
   * Inicia todos os jobs agendados
   */
  start(): void {
    logger.info('Starting scheduled jobs...');

    // Bom dia diário - 8h (horário de Brasília)
    this.jobs.push(
      cron.schedule(
        '0 8 * * *',
        () => this.sendGoodMorningMessages(),
        {
          scheduled: true,
          timezone: 'America/Sao_Paulo',
        }
      )
    );

    // Resumo semanal - Domingos às 20h
    this.jobs.push(
      cron.schedule(
        '0 20 * * 0',
        () => this.sendWeeklySummaries(),
        {
          scheduled: true,
          timezone: 'America/Sao_Paulo',
        }
      )
    );

    // Lembrete de registro - A cada 3 horas (10h, 13h, 16h, 19h)
    this.jobs.push(
      cron.schedule(
        '0 10,13,16,19 * * *',
        () => this.sendRegistrationReminders(),
        {
          scheduled: true,
          timezone: 'America/Sao_Paulo',
        }
      )
    );

    // NÍVEL 2: Lembretes de corridas pendentes - A cada 10 minutos
    this.jobs.push(
      cron.schedule(
        '*/10 * * * *',
        () => this.sendPendingTripReminders(),
        {
          scheduled: true,
          timezone: 'America/Sao_Paulo',
        }
      )
    );

    logger.info(`Started ${this.jobs.length} scheduled jobs`);
  }

  /**
   * Para todos os jobs
   */
  stop(): void {
    this.jobs.forEach((job) => job.stop());
    this.jobs = [];
    logger.info('Stopped all scheduled jobs');
  }

  /**
   * Envia mensagem de bom dia com resumo do dia anterior
   */
  private async sendGoodMorningMessages(): Promise<void> {
    try {
      logger.info('Sending good morning messages...');

      // Buscar todos os usuários ativos
      const users = await this.userRepository.findAll();

      for (const user of users) {
        try {
          // ANTI-SPAM: Respeitar modo descanso
          if (!user.isActive) {
            logger.info('User is inactive (rest mode), skipping good morning', {
              userId: user.id
            });
            continue;
          }

          // Buscar resumo de ontem
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);

          const yesterdaySummary = await this.dailySummaryRepository.findByUserAndDate(
            user.id,
            yesterday
          );

          let message = `🌅 *Bom dia!*\n\n`;

          if (yesterdaySummary) {
            message += `📊 *Resumo de ontem:*\n`;
            message += `💰 Ganhos: R$ ${yesterdaySummary.earnings.value.toFixed(2)}\n`;
            message += `💸 Despesas: R$ ${yesterdaySummary.expenses.value.toFixed(2)}\n`;
            message += `✅ Lucro: R$ ${yesterdaySummary.profit.value.toFixed(2)}\n`;
            message += `🚗 KM: ${yesterdaySummary.km.value} km\n\n`;
            message += `💪 Bora fazer mais hoje!\n\n`;
          } else {
            message += `Pronto para mais um dia de trabalho?\n\n`;
          }

          message += `💡 Lembre-se de registrar suas corridas!\n`;
          message += `Digite: *45 12* (rápido!)`;

          await this.messagingProvider.sendTextMessage({
            to: user.phone.value,
            message,
          });

          logger.info('Good morning sent', { userId: user.id });

          // Aguardar 1s entre mensagens para não sobrecarregar
          await this.sleep(1000);
        } catch (error) {
          logger.error('Error sending good morning to user', { userId: user.id, error });
        }
      }

      logger.info('Good morning messages sent successfully');
    } catch (error) {
      logger.error('Error in sendGoodMorningMessages', error);
    }
  }

  /**
   * Envia resumo semanal (domingos)
   */
  private async sendWeeklySummaries(): Promise<void> {
    try {
      logger.info('Sending weekly summaries...');

      const users = await this.userRepository.findAll();

      for (const user of users) {
        try {
          // ANTI-SPAM: Respeitar modo descanso
          if (!user.isActive) {
            logger.info('User is inactive (rest mode), skipping weekly summary', {
              userId: user.id
            });
            continue;
          }

          const getWeeklyProgress = new GetWeeklyProgress(
            this.userRepository,
            this.dailySummaryRepository
          );

          const progress = await getWeeklyProgress.execute({
            userId: user.id,
            referenceDate: new Date(),
          });

          let message = `📅 *RESUMO DA SEMANA*\n\n`;
          message += `💰 Total ganho: R$ ${progress.totalProfit.toFixed(2)}\n`;
          
          if (progress.weeklyGoal) {
            message += `🎯 Meta semanal: R$ ${progress.weeklyGoal.toFixed(2)}\n`;
            message += `📊 Atingido: ${progress.percentageComplete.toFixed(0)}%\n\n`;

            if (progress.percentageComplete >= 100) {
              message += `🎉 *PARABÉNS!* Você bateu a meta!\n\n`;
            } else if (progress.percentageComplete >= 80) {
              message += `👏 *Quase lá!* Falta só R$ ${progress.remainingToGoal.toFixed(2)}\n\n`;
            } else {
              message += `💪 Continue firme! Faltam R$ ${progress.remainingToGoal.toFixed(2)}\n\n`;
            }
          } else {
            message += `⚠️ *Meta não definida*\n\n`;
            message += `💡 *Dica:* Configure suas metas para ter melhor controle!\n`;
            message += `Digite *oi* para recalcular suas metas sugeridas.\n\n`;
          }

          message += `Dias trabalhados: ${progress.daysWithData}/7\n\n`;
          message += `Ótimo final de semana! 🚀`;

          await this.messagingProvider.sendTextMessage({
            to: user.phone.value,
            message,
          });

          logger.info('Weekly summary sent', { userId: user.id });

          await this.sleep(1000);
        } catch (error) {
          logger.error('Error sending weekly summary to user', { userId: user.id, error });
        }
      }

      logger.info('Weekly summaries sent successfully');
    } catch (error) {
      logger.error('Error in sendWeeklySummaries', error);
    }
  }

  /**
   * Envia lembretes para quem não registrou nada hoje
   */
  private async sendRegistrationReminders(): Promise<void> {
    try {
      logger.info('Sending registration reminders...');

      const users = await this.userRepository.findAll();
      const today = new Date();

      for (const user of users) {
        try {
          // ANTI-SPAM: Respeitar modo descanso
          if (!user.isActive) {
            logger.info('User is inactive (rest mode), skipping registration reminder', {
              userId: user.id
            });
            continue;
          }

          // Verificar se já registrou algo hoje
          const todaySummary = await this.dailySummaryRepository.findByUserAndDate(
            user.id,
            today
          );

          // Se não registrou nada, enviar lembrete
          if (!todaySummary || todaySummary.earnings.value === 0) {
            const message = `👋 Oi!\n\n` +
              `Lembra de registrar suas corridas de hoje? 😊\n\n` +
              `É rapidinho:\n` +
              `*45 12* = R$45 e 12km\n\n` +
              `Ou digite *registrar* para o passo a passo!`;

            await this.messagingProvider.sendTextMessage({
              to: user.phone.value,
              message,
            });

            logger.info('Reminder sent', { userId: user.id });

            await this.sleep(1000);
          }
        } catch (error) {
          logger.error('Error sending reminder to user', { userId: user.id, error });
        }
      }

      logger.info('Registration reminders sent successfully');
    } catch (error) {
      logger.error('Error in sendRegistrationReminders', error);
    }
  }

  /**
   * NÍVEL 2: Envia lembretes de corridas pendentes que passaram do tempo estimado
   * ANTI-SPAM: Respeita modo descanso (isActive)
   */
  private async sendPendingTripReminders(): Promise<void> {
    try {
      logger.info('Checking pending trips for reminders...');

      // Buscar corridas pendentes que precisam de lembrete
      const pendingTrips = await this.pendingTripRepository.findPendingForReminders();

      if (pendingTrips.length === 0) {
        logger.info('No pending trips need reminders');
        return;
      }

      logger.info(`Found ${pendingTrips.length} pending trips needing reminders`);

      for (const pendingTrip of pendingTrips) {
        try {
          // Buscar usuário
          const user = await this.userRepository.findById(pendingTrip.userId);
          
          if (!user) {
            logger.warn('User not found for pending trip', { 
              pendingTripId: pendingTrip.id, 
              userId: pendingTrip.userId 
            });
            continue;
          }

          // ANTI-SPAM: Verificar se o usuário está ativo (não está em modo descanso)
          if (!user.isActive) {
            logger.info('User is inactive (rest mode), skipping reminder', {
              userId: user.id,
              pendingTripId: pendingTrip.id
            });
            continue;
          }

          // Calcular tempo decorrido
          const elapsed = Math.floor(
            (new Date().getTime() - pendingTrip.evaluatedAt.getTime()) / (1000 * 60)
          );

          // Montar mensagem
          let message = `🔔 *Lembrete*\n\n`;
          message += `Você avaliou uma corrida há ${elapsed} min:\n\n`;
          message += `💰 R$ ${pendingTrip.earnings.value.toFixed(0)} / ${pendingTrip.km.toFixed(0)}km\n\n`;
          message += `*O que aconteceu?*\n\n`;
          message += `✅ *Aceitou:*\n`;
          message += `• *ok* → Se não abasteceu\n`;
          message += `• *ok g30* → Se abasteceu R$ 30\n`;
          message += `  _(qualquer valor: g50, g80, etc)_\n\n`;
          message += `❌ *Não aceitou:*\n`;
          message += `• *cancelar* → Não aceitei a corrida\n\n`;
          message += `😴 *Parou de trabalhar?*\n`;
          message += `• *descanso* → Pausar lembretes`;
          message += `😴 Parou de trabalhar? Digite *descanso*`;

          await this.messagingProvider.sendTextMessage({
            to: user.phone.value,
            message,
          });

          // Marcar lembrete como enviado
          pendingTrip.markReminderSent();
          await this.pendingTripRepository.update(pendingTrip);

          logger.info('Pending trip reminder sent', { 
            pendingTripId: pendingTrip.id, 
            userId: user.id,
            elapsed 
          });

          // Aguardar 1s entre mensagens para não sobrecarregar
          await this.sleep(1000);
        } catch (error) {
          logger.error('Error sending pending trip reminder', { 
            pendingTripId: pendingTrip.id, 
            error 
          });
        }
      }

      logger.info('Pending trip reminders sent successfully');
    } catch (error) {
      logger.error('Error in sendPendingTripReminders', error);
    }
  }

  /**
   * Retorna o início da semana (segunda-feira)
   */
  private getStartOfWeek(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Se domingo, volta 6 dias
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  /**
   * Aguarda X milissegundos
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

