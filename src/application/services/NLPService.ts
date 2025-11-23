import axios from 'axios';
import { logger } from '../../shared/utils/logger';
import { AppError } from '../../shared/errors/AppError';
import { ExpenseType } from '../../domain/enums';

/**
 * Dados extraídos do texto/áudio
 */
export interface ExtractedData {
  intent: 'trip' | 'expense' | 'summary' | 'unknown';
  earnings?: number;
  km?: number;
  expenseAmount?: number;
  expenseType?: ExpenseType;
  confidence: number; // 0-1
  rawText: string;
}

/**
 * NLPService
 * Serviço para processar linguagem natural usando DeepSeek
 */
export class NLPService {
  private readonly deepseekApiKey: string;
  private readonly deepseekApiUrl = 'https://api.deepseek.com/v1/chat/completions';

  constructor(deepseekApiKey: string) {
    this.deepseekApiKey = deepseekApiKey;
  }

  /**
   * Extrai dados estruturados de um texto em linguagem natural
   */
  async extractData(text: string): Promise<ExtractedData> {
    try {
      logger.info('Extracting data from text', { text });

      const prompt = this.buildPrompt(text);

      const response = await axios.post(
        this.deepseekApiUrl,
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `Você é um assistente especializado em extrair informações financeiras de motoristas de aplicativo.
              
Seu trabalho é identificar:
1. **Intenção**: trip (viagem/corrida), expense (despesa), summary (resumo/consulta), unknown (não identificado)
2. **Dados numéricos**: valores em reais (R$) e quilômetros (km)
3. **Tipo de despesa**: fuel (combustível), maintenance (manutenção), toll (pedágio), parking (estacionamento), cleaning (lavagem), other (outro)

SEMPRE responda APENAS com um JSON válido, sem markdown ou explicações.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 200,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${this.deepseekApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      const content = response.data.choices[0]?.message?.content;

      if (!content) {
        throw new AppError('Empty response from DeepSeek', 500);
      }

      const extracted = JSON.parse(content);

      logger.info('Data extracted successfully', { extracted });

      return {
        intent: extracted.intent || 'unknown',
        earnings: extracted.earnings,
        km: extracted.km,
        expenseAmount: extracted.expenseAmount,
        expenseType: this.mapExpenseType(extracted.expenseType),
        confidence: extracted.confidence || 0.5,
        rawText: text,
      };
    } catch (error) {
      logger.error('Failed to extract data', error);

      if (axios.isAxiosError(error)) {
        throw new AppError(
          `NLP extraction failed: ${error.message}`,
          500,
          'NLP_ERROR'
        );
      }

      throw new AppError('Unexpected error during NLP extraction', 500);
    }
  }

  /**
   * Constrói o prompt para o DeepSeek
   */
  private buildPrompt(text: string): string {
    return `Extraia as informações do seguinte texto de um motorista de aplicativo:

"${text}"

Retorne um JSON com:
{
  "intent": "trip | expense | summary | unknown",
  "earnings": number ou null,
  "km": number ou null,
  "expenseAmount": number ou null,
  "expenseType": "fuel | maintenance | toll | parking | cleaning | other" ou null,
  "confidence": number entre 0 e 1
}

Exemplos:
- "Fiz uma corrida de 45 reais e rodei 12 km" → {"intent": "trip", "earnings": 45, "km": 12, "confidence": 0.95}
- "Abasteci 80 reais" → {"intent": "expense", "expenseAmount": 80, "expenseType": "fuel", "confidence": 0.9}
- "Quanto eu lucrei hoje?" → {"intent": "summary", "confidence": 0.85}
- "Gastei 150 em manutenção" → {"intent": "expense", "expenseAmount": 150, "expenseType": "maintenance", "confidence": 0.9}`;
  }

  /**
   * Mapeia o tipo de despesa para o enum
   */
  private mapExpenseType(type: string | undefined): ExpenseType | undefined {
    if (!type) return undefined;

    const mapping: Record<string, ExpenseType> = {
      fuel: ExpenseType.FUEL,
      maintenance: ExpenseType.MAINTENANCE,
      toll: ExpenseType.TOLL,
      parking: ExpenseType.PARKING,
      cleaning: ExpenseType.CLEANING,
      other: ExpenseType.OTHER,
    };

    return mapping[type.toLowerCase()];
  }
}

