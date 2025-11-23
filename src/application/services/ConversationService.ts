import { IMessagingProvider } from '../../infrastructure/messaging/IMessagingProvider';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IDriverConfigRepository } from '../../domain/repositories/IDriverConfigRepository';
import { IFixedCostRepository } from '../../domain/repositories/IFixedCostRepository';
import { ITripRepository } from '../../domain/repositories/ITripRepository';
import { IExpenseRepository } from '../../domain/repositories/IExpenseRepository';
import { IDailySummaryRepository } from '../../domain/repositories/IDailySummaryRepository';
import { CreateUser } from '../../domain/usecases/CreateUser';
import { RegisterTrip } from '../../domain/usecases/RegisterTrip';
import { RegisterExpense } from '../../domain/usecases/RegisterExpense';
import { CalculateDailySummary } from '../../domain/usecases/CalculateDailySummary';
import { CalculateBreakeven } from '../../domain/usecases/CalculateBreakeven';
import { GetInsights } from '../../domain/usecases/GetInsights';
import { GetWeeklyProgress } from '../../domain/usecases/GetWeeklyProgress';
import { DriverConfig } from '../../domain/entities/DriverConfig';
import { FixedCost } from '../../domain/entities/FixedCost';
import { Phone } from '../../domain/value-objects/Phone';
import { Money } from '../../domain/value-objects/Money';
import { DriverProfile, FixedCostType, CostFrequency, ExpenseType } from '../../domain/enums';
import {
  ConversationState,
  ConversationSession,
} from './ConversationTypes';
import { AudioTranscriptionService } from './AudioTranscriptionService';
import { NLPService } from './NLPService';
import { logger } from '../../shared/utils/logger';

/**
 * ConversationService
 * Gerencia fluxos de conversa no WhatsApp
 * Princípio: Single Responsibility - apenas lógica de conversa
 */
export class ConversationService {
  // Armazena sessões em memória (em produção, usar Redis)
  private sessions: Map<string, ConversationSession> = new Map();
  private audioTranscriptionService?: AudioTranscriptionService;
  private nlpService?: NLPService;

  constructor(
    private readonly messagingProvider: IMessagingProvider,
    private readonly userRepository: IUserRepository,
    private readonly driverConfigRepository: IDriverConfigRepository,
    private readonly fixedCostRepository: IFixedCostRepository,
    private readonly tripRepository: ITripRepository,
    private readonly expenseRepository: IExpenseRepository,
    private readonly dailySummaryRepository: IDailySummaryRepository,
    groqApiKey?: string,
    deepseekApiKey?: string
  ) {
    // Inicializar serviços de IA se as chaves estiverem disponíveis
    if (groqApiKey) {
      this.audioTranscriptionService = new AudioTranscriptionService(groqApiKey);
    }
    if (deepseekApiKey) {
      this.nlpService = new NLPService(deepseekApiKey);
    }
  }

  /**
   * Processa mensagem recebida
   */
  async processMessage(from: string, text: string): Promise<void> {
    try {
      logger.info('Processing message', { from, text });

      // Buscar ou criar sessão
      let session = this.getSession(from);
      if (!session) {
        session = this.createSession(from);
      }

      // Atualizar última interação
      session.lastInteraction = new Date();

      // DETECTAR COMANDOS RÁPIDOS PRIMEIRO (funcionam em qualquer estado)
      const normalizedText = text.toLowerCase().trim();

      // Comando rápido de corrida: "45 12" ou "45 12 5"
      const quickRegisterMatch = normalizedText.match(/^(\d+(?:[.,]\d+)?)\s+(\d+(?:[.,]\d+)?)(?:\s+(\d+(?:[.,]\d+)?))?$/);
      
      if (quickRegisterMatch) {
        // Resetar estado para IDLE antes de processar
        session.state = ConversationState.IDLE;
        await this.handleQuickRegister(session, quickRegisterMatch);
        this.saveSession(session);
        return;
      }

      // Comando rápido de despesa: "g80", "m150 reparo"
      const quickExpenseMatch = text.match(/^([gmpel])(\d+(?:[.,]\d+)?)(?:\s+(.+))?$/i);
      
      if (quickExpenseMatch) {
        // Resetar estado para IDLE antes de processar
        session.state = ConversationState.IDLE;
        await this.handleQuickExpense(session, quickExpenseMatch);
        this.saveSession(session);
        return;
      }

      // Comandos ultra-curtos
      if (normalizedText === 'r' || normalizedText === 'resumo') {
        session.state = ConversationState.IDLE;
        await this.showSummary(session);
        this.saveSession(session);
        return;
      }

      if (normalizedText === 'm' || normalizedText === 'meta') {
        session.state = ConversationState.IDLE;
        await this.showWeeklyProgress(session);
        this.saveSession(session);
        return;
      }

      // Histórico
      if (normalizedText === 'ontem' || normalizedText === 'yesterday') {
        session.state = ConversationState.IDLE;
        await this.showYesterday(session);
        this.saveSession(session);
        return;
      }

      if (normalizedText === 'semana' || normalizedText.includes('semana passada')) {
        session.state = ConversationState.IDLE;
        await this.showLastWeek(session);
        this.saveSession(session);
        return;
      }

      // Processar baseado no estado atual
      switch (session.state) {
        case ConversationState.IDLE:
          await this.handleIdleState(session, text);
          break;

        case ConversationState.ONBOARDING_PROFILE:
          await this.handleOnboardingProfile(session, text);
          break;

        case ConversationState.ONBOARDING_FUEL_CONSUMPTION:
          await this.handleOnboardingFuelConsumption(session, text);
          break;

        case ConversationState.ONBOARDING_FUEL_PRICE:
          await this.handleOnboardingFuelPrice(session, text);
          break;

        case ConversationState.ONBOARDING_AVG_KM:
          await this.handleOnboardingAvgKm(session, text);
          break;

        case ConversationState.ONBOARDING_RENTAL:
          await this.handleOnboardingRental(session, text);
          break;

        case ConversationState.ONBOARDING_CAR_VALUE:
          await this.handleOnboardingCarValue(session, text);
          break;

        case ConversationState.REGISTER_EARNINGS:
          await this.handleRegisterEarnings(session, text);
          break;

        case ConversationState.REGISTER_KM:
          await this.handleRegisterKm(session, text);
          break;

        case ConversationState.REGISTER_FUEL:
          await this.handleRegisterFuel(session, text);
          break;

        case ConversationState.REGISTER_OTHER_EXPENSES:
          await this.handleRegisterOtherExpenses(session, text);
          break;

        case ConversationState.REGISTER_CONFIRM:
          await this.handleRegisterConfirm(session, text);
          break;

        default:
          await this.sendMessage(
            from,
            '❌ Desculpe, algo deu errado. Digite "oi" para recomeçar.'
          );
          this.resetSession(from);
      }

      // Salvar sessão atualizada
      this.saveSession(session);
    } catch (error) {
      logger.error('Error processing message', error);
      await this.sendMessage(
        from,
        '❌ Desculpe, ocorreu um erro. Digite "oi" para recomeçar.'
      );
    }
  }

  /**
   * Processa mensagem de áudio
   */
  async processAudio(from: string, audioUrl: string): Promise<void> {
    try {
      logger.info('Processing audio message', { from, audioUrl });

      // Verificar se os serviços de IA estão disponíveis
      if (!this.audioTranscriptionService || !this.nlpService) {
        await this.sendMessage(
          from,
          '❌ Desculpe, o processamento de áudio não está disponível no momento. Use texto.'
        );
        return;
      }

      // Enviar mensagem de "processando"
      await this.sendMessage(from, '🎤 Processando áudio...');

      // 1. Transcrever áudio
      const transcription = await this.audioTranscriptionService.transcribe(audioUrl);

      logger.info('Audio transcribed', { from, transcription });

      // 2. Extrair dados do texto
      const extractedData = await this.nlpService.extractData(transcription);

      logger.info('Data extracted from audio', { from, extractedData });

      // 3. Processar baseado na intenção
      if (extractedData.confidence < 0.6) {
        // Baixa confiança - pedir confirmação
        await this.sendMessage(
          from,
          `⚠️ Não entendi muito bem. Você disse:\n\n"${transcription}"\n\nPoderia repetir ou escrever?`
        );
        return;
      }

      // Processar baseado na intenção
      switch (extractedData.intent) {
        case 'trip':
          await this.handleAudioTrip(from, extractedData);
          break;

        case 'expense':
          await this.handleAudioExpense(from, extractedData);
          break;

        case 'summary':
          await this.handleAudioSummary(from);
          break;

        default:
          await this.sendMessage(
            from,
            `📝 Entendi: "${transcription}"\n\nMas não sei como processar isso. Tente:\n\n• "Fiz uma corrida de R$ 45 e rodei 12km"\n• "Abasteci R$ 80"\n• "Quanto eu lucrei hoje?"`
          );
      }
    } catch (error) {
      logger.error('Error processing audio', error);
      await this.sendMessage(
        from,
        '❌ Erro ao processar áudio. Tente enviar como texto.'
      );
    }
  }

  /**
   * Processa corrida extraída de áudio
   */
  private async handleAudioTrip(
    from: string,
    data: import('./NLPService').ExtractedData
  ): Promise<void> {
    const session = this.getSession(from) || this.createSession(from);

    // Montar mensagem de confirmação
    let confirmMessage = `✅ Entendi:\n\n`;

    if (data.earnings) {
      confirmMessage += `💰 Ganho: R$ ${data.earnings.toFixed(2)}\n`;
    }

    if (data.km) {
      confirmMessage += `🚗 KM rodados: ${data.km} km\n`;
    }

    confirmMessage += `\n*Está correto?* (sim/não)`;

    // Salvar dados temporários na sessão
    session.data.audioConfirmation = {
      type: 'trip',
      earnings: data.earnings,
      km: data.km,
    };

    session.state = ConversationState.REGISTER_CONFIRM;

    await this.sendMessage(from, confirmMessage);
    this.saveSession(session);
  }

  /**
   * Processa despesa extraída de áudio
   */
  private async handleAudioExpense(
    from: string,
    data: import('./NLPService').ExtractedData
  ): Promise<void> {
    const session = this.getSession(from) || this.createSession(from);

    const expenseTypeLabels: Record<string, string> = {
      fuel: 'Combustível',
      maintenance: 'Manutenção',
      toll: 'Pedágio',
      parking: 'Estacionamento',
      cleaning: 'Lavagem',
      other: 'Outro',
    };

    let confirmMessage = `✅ Entendi:\n\n`;
    confirmMessage += `💸 Despesa: R$ ${data.expenseAmount?.toFixed(2)}\n`;
    confirmMessage += `📋 Tipo: ${expenseTypeLabels[data.expenseType || 'other'] || 'Outro'}\n`;
    confirmMessage += `\n*Está correto?* (sim/não)`;

    // Salvar dados temporários na sessão
    session.data.audioConfirmation = {
      type: 'expense',
      amount: data.expenseAmount,
      expenseType: data.expenseType,
    };

    session.state = ConversationState.REGISTER_CONFIRM;

    await this.sendMessage(from, confirmMessage);
    this.saveSession(session);
  }

  /**
   * Processa solicitação de resumo via áudio
   */
  private async handleAudioSummary(from: string): Promise<void> {
    const session = this.getSession(from) || this.createSession(from);
    await this.showSummary(session);
  }

  /**
   * Estado IDLE - Primeira interação ou menu principal
   */
  private async handleIdleState(session: ConversationSession, text: string): Promise<void> {
    const normalizedText = text.toLowerCase().trim();

    // Verificar se usuário existe
    const phone = Phone.create(session.phone);
    const existingUser = await this.userRepository.findByPhone(phone);

    if (!existingUser) {
      // Novo usuário - iniciar onboarding
      await this.startOnboarding(session);
    } else {
      // Usuário existente - mostrar menu
      session.userId = existingUser.id;
      
      // Processar comando (texto, número ou ID de botão)
      if (
        normalizedText.includes('registrar') ||
        normalizedText === '1' ||
        normalizedText === 'c' ||
        normalizedText === 'corrida'
      ) {
        await this.startRegistration(session);
      } else if (
        normalizedText.includes('despesa') ||
        normalizedText === '2' ||
        normalizedText === 'd'
      ) {
        await this.startExpenseRegistration(session);
      } else if (
        normalizedText.includes('resumo') ||
        normalizedText === '3' ||
        normalizedText === 'r'
      ) {
        await this.showSummary(session);
      } else if (
        normalizedText.includes('meta') ||
        normalizedText === '4' ||
        normalizedText === 'm'
      ) {
        await this.showWeeklyProgress(session);
      } else if (
        normalizedText.includes('insights') ||
        normalizedText === '5' ||
        normalizedText === 'i'
      ) {
        await this.showInsights(session);
      } else {
        // Menu principal
        await this.showMainMenu(session, existingUser.name);
      }
    }
  }

  /**
   * Inicia processo de onboarding
   */
  private async startOnboarding(session: ConversationSession): Promise<void> {
    const message = `👋 Olá! Sou o *KIMO*, seu assistente financeiro.

Vou te fazer algumas perguntas rápidas para te ajudar melhor.

*1️⃣ Você dirige com:*

1 - Carro próprio quitado
2 - Carro próprio financiado
3 - Carro alugado (Localiza, Movida, Kovi)
4 - Híbrido (uso pessoal + apps)

Digite o número da sua opção:`;

    await this.sendMessage(session.phone, message);
    session.state = ConversationState.ONBOARDING_PROFILE;
  }

  /**
   * Processa escolha do perfil
   */
  private async handleOnboardingProfile(
    session: ConversationSession,
    text: string
  ): Promise<void> {
    const option = text.trim();

    let profile: DriverProfile;
    let profileName: string;

    switch (option) {
      case '1':
        profile = DriverProfile.OWN_PAID;
        profileName = 'Carro próprio quitado';
        break;
      case '2':
        profile = DriverProfile.OWN_FINANCED;
        profileName = 'Carro próprio financiado';
        break;
      case '3':
        profile = DriverProfile.RENTED;
        profileName = 'Carro alugado';
        break;
      case '4':
        profile = DriverProfile.HYBRID;
        profileName = 'Híbrido';
        break;
      default:
        await this.sendMessage(
          session.phone,
          '❌ Opção inválida. Digite um número de 1 a 4:'
        );
        return;
    }

    session.data.profile = profile;
    session.data.profileName = profileName;

    // Próxima pergunta baseada no perfil
    if (profile === DriverProfile.RENTED) {
      await this.askRental(session);
    } else {
      await this.askCarValue(session);
    }
  }

  /**
   * Pergunta valor do aluguel
   */
  private async askRental(session: ConversationSession): Promise<void> {
    const message = `✅ ${session.data.profileName}!

*2️⃣ Quanto você paga de aluguel por semana?*

Digite apenas o valor (ex: 900):`;

    await this.sendMessage(session.phone, message);
    session.state = ConversationState.ONBOARDING_RENTAL;
  }

  /**
   * Pergunta valor do carro
   */
  private async askCarValue(session: ConversationSession): Promise<void> {
    const message = `✅ ${session.data.profileName}!

*2️⃣ Qual o valor aproximado do seu carro?*

Digite apenas o valor (ex: 50000):`;

    await this.sendMessage(session.phone, message);
    session.state = ConversationState.ONBOARDING_CAR_VALUE;
  }

  private async handleOnboardingRental(
    session: ConversationSession,
    text: string
  ): Promise<void> {
    const rental = this.parseNumber(text);

    if (!rental || rental <= 0) {
      await this.sendMessage(
        session.phone,
        '❌ Valor inválido. Digite apenas números (ex: 900):'
      );
      return;
    }

    session.data.rental = rental;

    await this.askFuelConsumption(session);
  }

  private async handleOnboardingCarValue(
    session: ConversationSession,
    text: string
  ): Promise<void> {
    const carValue = this.parseNumber(text);

    if (!carValue || carValue <= 0) {
      await this.sendMessage(
        session.phone,
        '❌ Valor inválido. Digite apenas números (ex: 50000):'
      );
      return;
    }

    session.data.carValue = carValue;

    // Se tiver financiamento, perguntar valor da parcela
    if (session.data.profile === DriverProfile.OWN_FINANCED) {
      const message = `✅ R$ ${carValue.toLocaleString('pt-BR')}

*3️⃣ Quanto é a parcela do financiamento por mês?*

Digite apenas o valor (ex: 800):`;

      await this.sendMessage(session.phone, message);
      // Próximo estado seria ONBOARDING_FINANCING (adicionar depois)
    }

    await this.askFuelConsumption(session);
  }

  private async askFuelConsumption(session: ConversationSession): Promise<void> {
    const message = `✅ Anotado!

*Quantos km/litro seu carro faz?*

Digite apenas o número (ex: 12):`;

    await this.sendMessage(session.phone, message);
    session.state = ConversationState.ONBOARDING_FUEL_CONSUMPTION;
  }

  private async handleOnboardingFuelConsumption(
    session: ConversationSession,
    text: string
  ): Promise<void> {
    const fuelConsumption = this.parseNumber(text);

    if (!fuelConsumption || fuelConsumption <= 0 || fuelConsumption > 30) {
      await this.sendMessage(
        session.phone,
        '❌ Valor inválido. Digite um número entre 1 e 30 (ex: 12):'
      );
      return;
    }

    session.data.fuelConsumption = fuelConsumption;

    const message = `✅ ${fuelConsumption} km/litro

*Quanto custa o litro de gasolina na sua região?*

Digite apenas o valor (ex: 5.50):`;

    await this.sendMessage(session.phone, message);
    session.state = ConversationState.ONBOARDING_FUEL_PRICE;
  }

  private async handleOnboardingFuelPrice(
    session: ConversationSession,
    text: string
  ): Promise<void> {
    const fuelPrice = this.parseNumber(text);

    if (!fuelPrice || fuelPrice <= 0) {
      await this.sendMessage(
        session.phone,
        '❌ Valor inválido. Digite apenas números (ex: 5.50):'
      );
      return;
    }

    session.data.fuelPrice = fuelPrice;

    const message = `✅ R$ ${fuelPrice.toFixed(2)}/litro

*Quantos KM você roda em média por dia?*

Digite apenas o número (ex: 150):`;

    await this.sendMessage(session.phone, message);
    session.state = ConversationState.ONBOARDING_AVG_KM;
  }

  private async handleOnboardingAvgKm(
    session: ConversationSession,
    text: string
  ): Promise<void> {
    const avgKm = this.parseNumber(text);

    if (!avgKm || avgKm <= 0) {
      await this.sendMessage(
        session.phone,
        '❌ Valor inválido. Digite apenas números (ex: 150):'
      );
      return;
    }

    session.data.avgKm = avgKm;

    // Finalizar onboarding
    await this.completeOnboarding(session);
  }

  private async completeOnboarding(session: ConversationSession): Promise<void> {
    try {
      // 1. Criar usuário
      const createUser = new CreateUser(this.userRepository);
      const userResult = await createUser.execute({
        phone: session.phone,
      });

      session.userId = userResult.userId;

      // 2. Criar configuração do motorista
      const config = DriverConfig.create({
        userId: userResult.userId,
        profile: session.data.profile as DriverProfile,
        carValue: session.data.carValue ? Money.create(session.data.carValue as number) : undefined,
        fuelConsumption: session.data.fuelConsumption as number,
        avgFuelPrice: Money.create(session.data.fuelPrice as number),
        avgKmPerDay: session.data.avgKm as number,
        workDaysPerWeek: 6,
      });

      await this.driverConfigRepository.save(config);

      // 3. Se tiver aluguel, criar custo fixo
      if (session.data.rental) {
        const rental = FixedCost.create({
          userId: userResult.userId,
          type: FixedCostType.RENTAL,
          amount: Money.create(session.data.rental as number),
          frequency: CostFrequency.WEEKLY,
          description: 'Aluguel do carro',
        });

        await this.fixedCostRepository.save(rental);
      }

      logger.info('Onboarding completed', { userId: userResult.userId });

      // 4. Mensagem de sucesso
      const fuelCost = this.calculateFuelCost(session);
      const message = `🎉 *Pronto! Perfil configurado.*

📊 Seu custo estimado de combustível: *R$ ${fuelCost.toFixed(2)}/dia*

Comandos disponíveis:
1️⃣ *Registrar dia* - Registrar ganhos e despesas
2️⃣ *Resumo* - Ver resumo de hoje
3️⃣ *Meta* - Ver progresso semanal
4️⃣ *Insights* - Dicas personalizadas

Digite o número ou o nome do comando!`;

      await this.sendMessage(session.phone, message);
      session.state = ConversationState.IDLE;
    } catch (error) {
      logger.error('Error completing onboarding', error);
      await this.sendMessage(
        session.phone,
        '❌ Erro ao salvar configurações. Digite "oi" para tentar novamente.'
      );
      this.resetSession(session.phone);
    }
  }

  // Métodos auxiliares
  /**
   * Registra corrida rapidamente: "45 12" ou "45 12 5"
   */
  private async handleQuickRegister(
    session: ConversationSession,
    match: RegExpMatchArray
  ): Promise<void> {
    try {
      if (!session.userId) {
        throw new Error('User ID not found');
      }

      const earnings = parseFloat(match[1]!.replace(',', '.'));
      const km = parseFloat(match[2]!.replace(',', '.'));
      const fuel = match[3] ? parseFloat(match[3].replace(',', '.')) : undefined;

      // Validar
      if (isNaN(earnings) || isNaN(km) || earnings <= 0 || km <= 0) {
        await this.sendMessage(
          session.phone,
          '❌ Valores inválidos. Use: VALOR KM\nExemplo: 45 12'
        );
        return;
      }

      // Montar mensagem de confirmação
      let confirmMessage = `✅ *Confirme os dados:*\n\n`;
      confirmMessage += `💰 Ganho: R$ ${earnings.toFixed(2)}\n`;
      confirmMessage += `🚗 KM: ${km} km\n`;
      
      if (fuel && fuel > 0 && !isNaN(fuel)) {
        confirmMessage += `⛽ Combustível: R$ ${fuel.toFixed(2)}\n`;
      }
      
      confirmMessage += `\n*Está correto?*\n\n`;
      confirmMessage += `Digite:\n`;
      confirmMessage += `✅ *sim* para salvar\n`;
      confirmMessage += `❌ *não* para cancelar`;

      // Salvar dados temporários na sessão para confirmar depois
      session.data.quickRegisterConfirmation = {
        earnings,
        km,
        fuel,
      };

      session.state = ConversationState.REGISTER_CONFIRM;

      await this.sendMessage(session.phone, confirmMessage);

      logger.info('Quick register pending confirmation', { userId: session.userId, earnings, km, fuel });
    } catch (error) {
      logger.error('Error in quick register', error);
      await this.sendMessage(
        session.phone,
        '❌ Erro ao processar. Use: VALOR KM\nExemplo: 45 12'
      );
    }
  }

  /**
   * Registra despesa rapidamente: "g80", "m150 reparo freio"
   */
  private async handleQuickExpense(
    session: ConversationSession,
    match: RegExpMatchArray
  ): Promise<void> {
    try {
      if (!session.userId) {
        throw new Error('User ID not found');
      }

      const typeCode = match[1]!.toLowerCase();
      const amount = parseFloat(match[2]!.replace(',', '.'));
      const description = match[3] ? match[3].trim() : undefined;

      // Validar
      if (isNaN(amount) || amount <= 0) {
        await this.sendMessage(
          session.phone,
          '❌ Valor inválido.\n\nExemplos:\ng80 → Combustível R$80\nm150 reparo freio → Manutenção R$150'
        );
        return;
      }

      // Mapear código para tipo de despesa
      let expenseType: ExpenseType;
      let typeName: string;

      switch (typeCode) {
        case 'g':
          expenseType = ExpenseType.FUEL;
          typeName = 'Combustível';
          break;
        case 'm':
          expenseType = ExpenseType.MAINTENANCE_CORRECTIVE;
          typeName = 'Manutenção';
          break;
        case 'p':
          expenseType = ExpenseType.TOLL;
          typeName = 'Pedágio';
          break;
        case 'e':
          expenseType = ExpenseType.PARKING;
          typeName = 'Estacionamento';
          break;
        case 'l':
          expenseType = ExpenseType.CLEANING;
          typeName = 'Lavagem';
          break;
        default:
          await this.sendMessage(
            session.phone,
            '❌ Código inválido.\n\nUse:\ng = Gasolina\nm = Manutenção\np = Pedágio\ne = Estacionamento\nl = Lavagem'
          );
          return;
      }

      // Montar mensagem de confirmação
      let confirmMessage = `✅ *Confirme a despesa:*\n\n`;
      confirmMessage += `📋 Tipo: ${typeName}\n`;
      confirmMessage += `💸 Valor: R$ ${amount.toFixed(2)}\n`;
      
      if (description) {
        confirmMessage += `📝 Descrição: ${description}\n`;
      }
      
      confirmMessage += `\n*Está correto?*\n\n`;
      confirmMessage += `Digite:\n`;
      confirmMessage += `✅ *sim* para salvar\n`;
      confirmMessage += `❌ *não* para cancelar`;

      // Salvar dados temporários na sessão
      session.data.quickExpenseConfirmation = {
        type: expenseType,
        typeName,
        amount,
        description,
      };

      session.state = ConversationState.REGISTER_CONFIRM;

      await this.sendMessage(session.phone, confirmMessage);

      logger.info('Quick expense pending confirmation', {
        userId: session.userId,
        type: expenseType,
        amount,
        description,
      });
    } catch (error) {
      logger.error('Error in quick expense', error);
      await this.sendMessage(
        session.phone,
        '❌ Erro ao processar.\n\nExemplos:\ng80 → Combustível\nm150 reparo → Manutenção'
      );
    }
  }

  private async startExpenseRegistration(session: ConversationSession): Promise<void> {
    const message = `⛽ *Registrar Despesa*

*Qual tipo de despesa?*

1. ⛽ Combustível
2. 🔧 Manutenção
3. 🅿️ Estacionamento
4. 🚧 Pedágio
5. 🧼 Lavagem
6. 🔄 Outro

Digite o número:`;

    await this.sendMessage(session.phone, message);
    session.state = ConversationState.REGISTER_FUEL; // Reutilizar estado
    session.data.registration = { selectingExpenseType: true };
  }

  private async startRegistration(session: ConversationSession): Promise<void> {
    const message = `🚗 *Registrar Corrida*

*Quanto você ganhou nesta corrida?*

Digite apenas o valor em reais (ex: 45):`;

    await this.sendMessage(session.phone, message);
    session.state = ConversationState.REGISTER_EARNINGS;
    session.data.registration = {};
  }

  private async showSummary(session: ConversationSession): Promise<void> {
    try {
      if (!session.userId) {
        await this.sendMessage(session.phone, '❌ Erro: usuário não encontrado.');
        return;
      }

      const getInsights = new GetInsights(
        this.driverConfigRepository,
        this.fixedCostRepository,
        this.tripRepository,
        this.expenseRepository
      );

      const result = await getInsights.execute({
        userId: session.userId,
        date: new Date(),
      });

      let message = `📊 *RESUMO DE HOJE*\n\n`;

      // Insights
      if (result.insights.length > 0) {
        message += `💡 *Insights:*\n`;
        result.insights.forEach((insight) => {
          message += `${insight}\n`;
        });
        message += '\n';
      }

      // Warnings
      if (result.warnings.length > 0) {
        message += `⚠️ *Atenção:*\n`;
        result.warnings.forEach((warning) => {
          message += `${warning}\n`;
        });
        message += '\n';
      }

      // Tips
      if (result.tips.length > 0) {
        message += `💰 *Dicas:*\n`;
        result.tips.forEach((tip) => {
          message += `${tip}\n`;
        });
      }

      if (result.insights.length === 0 && result.warnings.length === 0) {
        message += `Ainda não há dados suficientes para gerar insights.\n\nRegistre seu dia primeiro! Digite "1" ou "registrar dia".`;
      }

      await this.sendMessage(session.phone, message);
    } catch (error) {
      logger.error('Error showing summary', error);
      await this.sendMessage(
        session.phone,
        '❌ Erro ao buscar resumo. Tente novamente mais tarde.'
      );
    }
  }

  private async showWeeklyProgress(session: ConversationSession): Promise<void> {
    try {
      if (!session.userId) {
        await this.sendMessage(session.phone, '❌ Erro: usuário não encontrado.');
        return;
      }

      const calculateBreakeven = new CalculateBreakeven(
        this.driverConfigRepository,
        this.fixedCostRepository,
        this.dailySummaryRepository
      );

      const result = await calculateBreakeven.execute({
        userId: session.userId,
        referenceDate: new Date(),
      });

      const message = `🎯 *META SEMANAL*

💰 *Ganhos:* R$ ${result.weeklyEarnings.toFixed(2)}
💸 *Custos Fixos:* R$ ${result.weeklyFixedCosts.toFixed(2)}
⛽ *Custos Variáveis:* R$ ${result.weeklyVariableCosts.toFixed(2)}
━━━━━━━━━━━━━━━━
📊 *Total Custos:* R$ ${result.weeklyTotalCosts.toFixed(2)}
✅ *Lucro:* R$ ${result.weeklyProfit.toFixed(2)}

${result.message}`;

      await this.sendMessage(session.phone, message);
    } catch (error) {
      logger.error('Error showing weekly progress', error);
      await this.sendMessage(
        session.phone,
        '❌ Erro ao calcular meta. Certifique-se de ter registrado alguns dias.'
      );
    }
  }

  private async showInsights(session: ConversationSession): Promise<void> {
    // Mesmo que showSummary
    await this.showSummary(session);
  }

  /**
   * Mostra resumo de ontem
   */
  private async showYesterday(session: ConversationSession): Promise<void> {
    try {
      if (!session.userId) {
        await this.sendMessage(session.phone, '❌ Erro: usuário não encontrado.');
        return;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const summary = await this.dailySummaryRepository.findByUserAndDate(
        session.userId,
        yesterday
      );

      if (!summary) {
        await this.sendMessage(
          session.phone,
          '📅 *Ontem*\n\nNenhum registro encontrado para ontem.'
        );
        return;
      }

      const message = `📅 *RESUMO DE ONTEM*\n\n` +
        `💰 Ganhos: R$ ${summary.earnings.value.toFixed(2)}\n` +
        `💸 Despesas: R$ ${summary.expenses.value.toFixed(2)}\n` +
        `✅ Lucro: R$ ${summary.profit.value.toFixed(2)}\n` +
        `🚗 KM: ${summary.km.value} km\n` +
        `📊 Custo/KM: R$ ${summary.costPerKm?.value.toFixed(2) || '0.00'}`;

      await this.sendMessage(session.phone, message);
    } catch (error) {
      logger.error('Error showing yesterday', error);
      await this.sendMessage(
        session.phone,
        '❌ Erro ao buscar dados de ontem.'
      );
    }
  }

  /**
   * Mostra resumo da semana passada
   */
  private async showLastWeek(session: ConversationSession): Promise<void> {
    try {
      if (!session.userId) {
        await this.sendMessage(session.phone, '❌ Erro: usuário não encontrado.');
        return;
      }

      // Calcular início da semana passada
      const now = new Date();
      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - now.getDay() - 6);
      lastMonday.setHours(0, 0, 0, 0);

      const getWeeklyProgress = new GetWeeklyProgress(
        this.userRepository,
        this.dailySummaryRepository
      );

      const progress = await getWeeklyProgress.execute({
        userId: session.userId,
        referenceDate: lastMonday,
      });

      let message = `📅 *SEMANA PASSADA*\n\n`;
      message += `💰 Total: R$ ${progress.totalProfit.toFixed(2)}\n`;
      message += `🎯 Meta: R$ ${progress.weeklyGoal.toFixed(2)}\n`;
      message += `📊 Atingido: ${progress.percentageComplete.toFixed(0)}%\n`;
      message += `📅 Dias trabalhados: ${progress.daysWithData}/7\n\n`;

      if (progress.dailySummaries.length > 0) {
        message += `*Detalhes por dia:*\n`;
        progress.dailySummaries.forEach((day) => {
          const date = new Date(day.date);
          const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
          message += `${dayName}: R$ ${day.profit.toFixed(2)}\n`;
        });
      }

      await this.sendMessage(session.phone, message);
    } catch (error) {
      logger.error('Error showing last week', error);
      await this.sendMessage(
        session.phone,
        '❌ Erro ao buscar dados da semana passada.'
      );
    }
  }

  private async showMainMenu(session: ConversationSession, name?: string): Promise<void> {
    const greeting = name ? `Olá, ${name}!` : 'Olá!';
    
    const message = `👋 ${greeting}

📊 *O que deseja fazer?*`;

    const buttons = [
      { id: 'registrar', text: '🚗 Registrar corrida' },
      { id: 'despesa', text: '⛽ Registrar despesa' },
      { id: 'resumo', text: '📈 Ver resumo' },
      { id: 'meta', text: '🎯 Ver meta semanal' },
    ];

    await this.sendButtonMessage(session.phone, message, buttons);
  }

  private calculateFuelCost(session: ConversationSession): number {
    const fuelConsumption = session.data.fuelConsumption as number;
    const fuelPrice = session.data.fuelPrice as number;
    const avgKm = session.data.avgKm as number;

    const litersPerDay = avgKm / fuelConsumption;
    return litersPerDay * fuelPrice;
  }

  // Handlers de registro
  private async handleRegisterEarnings(
    session: ConversationSession,
    text: string
  ): Promise<void> {
    const earnings = this.parseNumber(text);

    if (!earnings || earnings < 0) {
      await this.sendMessage(
        session.phone,
        '❌ Valor inválido. Digite apenas o valor (ex: 45):'
      );
      return;
    }

    const currentReg = (session.data.registration as Record<string, any>) || {};
    session.data.registration = { ...currentReg, earnings };

    const message = `✅ R$ ${earnings.toFixed(2)}

*Quantos KM rodou nesta corrida?*

Digite apenas o número (ex: 12):`;

    await this.sendMessage(session.phone, message);
    session.state = ConversationState.REGISTER_KM;
  }

  private async handleRegisterKm(session: ConversationSession, text: string): Promise<void> {
    const km = this.parseNumber(text);

    if (!km || km < 0) {
      await this.sendMessage(
        session.phone,
        '❌ Valor inválido. Digite apenas o número de KM (ex: 12):'
      );
      return;
    }

    const currentReg = (session.data.registration as Record<string, any>) || {};
    session.data.registration = { ...currentReg, km };

    // Salvar corrida imediatamente
    await this.saveTripAndAskNext(session);
  }

  /**
   * Salva a corrida e pergunta se quer registrar outra ou despesa
   */
  private async saveTripAndAskNext(session: ConversationSession): Promise<void> {
    try {
      if (!session.userId) {
        throw new Error('User ID not found');
      }

      const reg = session.data.registration as Record<string, any>;

      // 1. Registrar viagem
      const registerTrip = new RegisterTrip(this.tripRepository);
      await registerTrip.execute({
        userId: session.userId,
        earnings: reg.earnings, // já é number
        km: reg.km,
        date: new Date(),
        timeOnlineMinutes: 0,
      });

      logger.info('Trip registered successfully', {
        userId: session.userId,
        earnings: reg.earnings,
        km: reg.km,
      });

      // 2. Mensagem de sucesso e próximas opções
      const message = `✅ *Corrida registrada!*

💰 Ganho: R$ ${reg.earnings.toFixed(2)}
🚗 KM: ${reg.km} km

*O que deseja fazer agora?*

1. 🚗 Registrar outra corrida
2. ⛽ Registrar despesa (combustível, etc)
3. 📊 Ver resumo do dia

Digite o número (1, 2 ou 3):`;

      await this.sendMessage(session.phone, message);

      // Resetar dados de registro
      session.data.registration = {};
      session.state = ConversationState.IDLE;
    } catch (error) {
      logger.error('Error saving trip', error);
      await this.sendMessage(
        session.phone,
        '❌ Erro ao salvar corrida. Tente novamente.'
      );
      session.state = ConversationState.IDLE;
    }
  }

  private async handleRegisterFuel(session: ConversationSession, text: string): Promise<void> {
    const fuel = this.parseNumber(text);

    if (!fuel || fuel < 0) {
      await this.sendMessage(
        session.phone,
        '❌ Valor inválido. Digite apenas o valor (ex: 70):'
      );
      return;
    }

    const currentReg = (session.data.registration as Record<string, any>) || {};
    session.data.registration = { ...currentReg, fuel };

    const message = `✅ R$ ${fuel.toFixed(2)} de combustível

*Teve outras despesas?*
(pedágio, estacionamento, lavagem)

Digite o valor total ou "0" se não teve:`;

    await this.sendMessage(session.phone, message);
    session.state = ConversationState.REGISTER_OTHER_EXPENSES;
  }

  private async handleRegisterOtherExpenses(
    session: ConversationSession,
    text: string
  ): Promise<void> {
    const otherExpenses = this.parseNumber(text);

    if (otherExpenses === null || otherExpenses < 0) {
      await this.sendMessage(
        session.phone,
        '❌ Valor inválido. Digite o valor ou "0":'
      );
      return;
    }

    const currentReg = (session.data.registration as Record<string, any>) || {};
    session.data.registration = { ...currentReg, otherExpenses };

    // Calcular lucro
    const reg = session.data.registration as any;
    const profit = reg.earnings - reg.fuel - otherExpenses;

    const message = `📊 *RESUMO DO DIA:*

💰 Ganhos: R$ ${reg.earnings.toFixed(2)}
⛽ Combustível: R$ ${reg.fuel.toFixed(2)}
${otherExpenses > 0 ? `💸 Outras despesas: R$ ${otherExpenses.toFixed(2)}\n` : ''}━━━━━━━━━━━━━━━━
✅ Lucro: R$ ${profit.toFixed(2)}

*Confirmar?*

1 - Sim, salvar
2 - Não, cancelar`;

    await this.sendMessage(session.phone, message);
    session.state = ConversationState.REGISTER_CONFIRM;
  }

  private async handleRegisterConfirm(
    session: ConversationSession,
    text: string
  ): Promise<void> {
    const option = text.trim().toLowerCase();

    // Cancelar
    if (option === '2' || option.includes('não') || option.includes('nao') || option === 'n') {
      await this.sendMessage(session.phone, '❌ Registro cancelado.');
      session.state = ConversationState.IDLE;
      session.data.registration = {};
      session.data.quickRegisterConfirmation = undefined;
      return;
    }

    // Validar confirmação
    if (option !== '1' && !option.includes('sim') && option !== 's') {
      await this.sendMessage(
        session.phone,
        '❌ Opção inválida. Digite *sim* ou *não*:'
      );
      return;
    }

    // Verificar se é confirmação de registro rápido
    const quickReg = session.data.quickRegisterConfirmation as any;
    
    if (quickReg) {
      await this.saveQuickRegister(session, quickReg);
      return;
    }

    // Verificar se é confirmação de despesa rápida
    const quickExpense = session.data.quickExpenseConfirmation as any;
    
    if (quickExpense) {
      await this.saveQuickExpense(session, quickExpense);
      return;
    }

    // Caso contrário, fluxo normal (registro passo a passo)
    await this.saveNormalRegister(session);
  }

  /**
   * Salva registro rápido confirmado
   */
  private async saveQuickRegister(session: ConversationSession, data: any): Promise<void> {
    try {
      if (!session.userId) {
        throw new Error('User ID not found');
      }

      const { earnings, km, fuel } = data;

      // 1. Registrar viagem
      const registerTrip = new RegisterTrip(this.tripRepository);
      await registerTrip.execute({
        userId: session.userId,
        earnings, // já é number
        km,
        date: new Date(),
        timeOnlineMinutes: 0,
      });

      let message = `✅ *Corrida salva!*\n\n💰 R$ ${earnings.toFixed(2)}\n🚗 ${km} km`;

      // 2. Registrar combustível se informado
      if (fuel && fuel > 0) {
        const registerExpense = new RegisterExpense(this.expenseRepository);
        await registerExpense.execute({
          userId: session.userId,
          amount: fuel, // já é number
          type: ExpenseType.FUEL,
          date: new Date(),
        });

        message += `\n⛽ R$ ${fuel.toFixed(2)} combustível`;
      }

      message += `\n\n💡 *Dica:* Digite só os números para registrar rápido!\nExemplo: 45 12`;

      await this.sendMessage(session.phone, message);

      // Limpar sessão
      session.state = ConversationState.IDLE;
      session.data.quickRegisterConfirmation = undefined;

      logger.info('Quick trip saved', { userId: session.userId, earnings, km, fuel });
    } catch (error) {
      logger.error('Error saving quick register', error);
      await this.sendMessage(
        session.phone,
        '❌ Erro ao salvar. Tente novamente.'
      );
      session.state = ConversationState.IDLE;
    }
  }

  /**
   * Salva despesa rápida confirmada
   */
  private async saveQuickExpense(session: ConversationSession, data: any): Promise<void> {
    try {
      if (!session.userId) {
        throw new Error('User ID not found');
      }

      const { type, typeName, amount, description } = data;

      // Registrar despesa
      const registerExpense = new RegisterExpense(this.expenseRepository);
      await registerExpense.execute({
        userId: session.userId,
        amount, // já é number
        type,
        note: description,
        date: new Date(),
      });

      let message = `✅ *Despesa salva!*\n\n`;
      message += `📋 ${typeName}\n`;
      message += `💸 R$ ${amount.toFixed(2)}`;
      
      if (description) {
        message += `\n📝 ${description}`;
      }

      message += `\n\n💡 *Atalhos:*\n`;
      message += `g80 = Gasolina\n`;
      message += `m150 reparo = Manutenção\n`;
      message += `p12 = Pedágio`;

      await this.sendMessage(session.phone, message);

      // Limpar sessão
      session.state = ConversationState.IDLE;
      session.data.quickExpenseConfirmation = undefined;

      logger.info('Quick expense saved', { userId: session.userId, type, amount, description });
    } catch (error) {
      logger.error('Error saving quick expense', error);
      await this.sendMessage(
        session.phone,
        '❌ Erro ao salvar despesa. Tente novamente.'
      );
      session.state = ConversationState.IDLE;
    }
  }

  /**
   * Salva registro normal (passo a passo)
   */
  private async saveNormalRegister(session: ConversationSession): Promise<void> {
    // Salvar dados
    try {
      if (!session.userId) {
        throw new Error('User ID not found');
      }

      const reg = session.data.registration as any;
      const today = new Date();

      // 1. Registrar Trip
      const registerTrip = new RegisterTrip(this.tripRepository);
      await registerTrip.execute({
        userId: session.userId,
        date: today,
        earnings: reg.earnings,
        km: reg.km,
        timeOnlineMinutes: 0, // Pode adicionar pergunta depois
      });

      // 2. Registrar Combustível
      const registerFuelExpense = new RegisterExpense(this.expenseRepository);
      await registerFuelExpense.execute({
        userId: session.userId,
        date: today,
        type: ExpenseType.FUEL,
        amount: reg.fuel,
      });

      // 3. Registrar outras despesas (se tiver)
      if (reg.otherExpenses > 0) {
        await registerFuelExpense.execute({
          userId: session.userId,
          date: today,
          type: ExpenseType.OTHER,
          amount: reg.otherExpenses,
        });
      }

      // 4. Calcular resumo diário
      const calculateSummary = new CalculateDailySummary(
        this.tripRepository,
        this.expenseRepository,
        this.dailySummaryRepository
      );

      const summary = await calculateSummary.execute({
        userId: session.userId,
        date: today,
      });

      logger.info('Day registered successfully', { userId: session.userId });

      // 5. Buscar insights
      const getInsights = new GetInsights(
        this.driverConfigRepository,
        this.fixedCostRepository,
        this.tripRepository,
        this.expenseRepository
      );

      const insights = await getInsights.execute({
        userId: session.userId,
        date: today,
      });

      // 6. Mensagem de sucesso com insights
      let message = `✅ *Dia registrado com sucesso!*\n\n`;

      message += `📊 *Lucro líquido:* R$ ${summary.profit.toFixed(2)}\n`;
      message += `📈 *Custo por KM:* R$ ${summary.costPerKm?.toFixed(2) || '0.00'}\n\n`;

      if (insights.insights.length > 0) {
        message += `💡 *Insight do dia:*\n${insights.insights[0]}\n\n`;
      }

      message += `Digite "meta" para ver seu progresso semanal!`;

      await this.sendMessage(session.phone, message);

      session.state = ConversationState.IDLE;
      session.data.registration = {};
    } catch (error) {
      logger.error('Error saving registration', error);
      await this.sendMessage(
        session.phone,
        '❌ Erro ao salvar. Tente novamente mais tarde.'
      );
      session.state = ConversationState.IDLE;
    }
  }

  // Métodos auxiliares
  private parseNumber(text: string): number | null {
    const cleaned = text.replace(/[^\d.,]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  private async sendMessage(to: string, message: string): Promise<void> {
    await this.messagingProvider.sendTextMessage({ to, message });
  }

  private async sendButtonMessage(
    to: string,
    message: string,
    buttons: Array<{ id: string; text: string }>
  ): Promise<void> {
    // Tentar enviar com botões, se falhar, usar fallback
    try {
      if ('sendButtonMessage' in this.messagingProvider) {
        await (this.messagingProvider as any).sendButtonMessage(to, message, buttons);
        return;
      }
    } catch (error) {
      logger.warn('Button message failed, using text fallback', error);
    }

    // Fallback: enviar como texto com opções numeradas
    const options = buttons.map((btn, idx) => `${idx + 1}. ${btn.text}`).join('\n');
    await this.sendMessage(to, `${message}\n\n${options}\n\nDigite o número da opção:`);
  }

  private getSession(phone: string): ConversationSession | undefined {
    return this.sessions.get(phone);
  }

  private createSession(phone: string): ConversationSession {
    const session: ConversationSession = {
      phone,
      state: ConversationState.IDLE,
      data: {},
      lastInteraction: new Date(),
    };
    this.sessions.set(phone, session);
    return session;
  }

  private saveSession(session: ConversationSession): void {
    this.sessions.set(session.phone, session);
  }

  private resetSession(phone: string): void {
    this.sessions.delete(phone);
  }
}

