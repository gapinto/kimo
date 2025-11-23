import axios from 'axios';
import FormData from 'form-data';
import { logger } from '../../shared/utils/logger';
import { AppError } from '../../shared/errors/AppError';

/**
 * AudioTranscriptionService
 * Serviço para transcrever áudios usando Groq Whisper API
 */
export class AudioTranscriptionService {
  private readonly groqApiKey: string;
  private readonly groqApiUrl = 'https://api.groq.com/openai/v1/audio/transcriptions';

  constructor(groqApiKey: string) {
    this.groqApiKey = groqApiKey;
  }

  /**
   * Transcreve um áudio para texto
   * @param audioUrl URL do áudio no WhatsApp
   * @returns Texto transcrito
   */
  async transcribe(audioUrl: string): Promise<string> {
    try {
      logger.info('Transcribing audio', { audioUrl });

      // 1. Baixar o áudio do WhatsApp
      const audioBuffer = await this.downloadAudio(audioUrl);

      // 2. Enviar para Groq Whisper
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: 'audio.ogg',
        contentType: 'audio/ogg',
      });
      formData.append('model', 'whisper-large-v3');
      formData.append('language', 'pt'); // Português
      formData.append('response_format', 'json');

      const response = await axios.post(this.groqApiUrl, formData, {
        headers: {
          Authorization: `Bearer ${this.groqApiKey}`,
          ...formData.getHeaders(),
        },
        timeout: 30000, // 30s timeout
      });

      const transcription = response.data.text;

      logger.info('Audio transcribed successfully', {
        transcription,
        length: transcription.length,
      });

      return transcription;
    } catch (error) {
      logger.error('Failed to transcribe audio', error);

      if (axios.isAxiosError(error)) {
        throw new AppError(
          `Audio transcription failed: ${error.message}`,
          500,
          'TRANSCRIPTION_ERROR'
        );
      }

      throw new AppError('Unexpected error during audio transcription', 500);
    }
  }

  /**
   * Baixa o áudio do WhatsApp
   */
  private async downloadAudio(audioUrl: string): Promise<Buffer> {
    try {
      const response = await axios.get(audioUrl, {
        responseType: 'arraybuffer',
        timeout: 20000,
      });

      return Buffer.from(response.data);
    } catch (error) {
      logger.error('Failed to download audio', error);
      throw new AppError('Failed to download audio from WhatsApp', 500);
    }
  }
}

