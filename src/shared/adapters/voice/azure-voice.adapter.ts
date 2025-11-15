import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { LoggerService } from '../../../core/services/logger.service';
import { BaseVoiceAdapter, VoiceTranscribeOptions } from './base-voice.adapter';

/**
 * Azure Speech Services Adapter
 *
 * Integrates with Azure Cognitive Services Speech API
 */
@Injectable()
export class AzureVoiceAdapter implements BaseVoiceAdapter {
  private readonly httpClient: AxiosInstance;
  private readonly subscriptionKey: string;
  private readonly region: string;
  private readonly apiUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.subscriptionKey = this.configService.get<string>('VAR_AZURE_SPEECH_SUBSCRIPTION_KEY', '');
    this.region = this.configService.get<string>('VAR_AZURE_SPEECH_REGION', 'eastus');
    this.apiUrl = `https://${this.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`;

    this.httpClient = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000,
      headers: {
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        'Content-Type': 'audio/wav',
      },
    });
  }

  getProviderName(): string {
    return 'azure';
  }

  async transcribe(audioData: Buffer, options?: VoiceTranscribeOptions): Promise<string> {
    if (!this.subscriptionKey) {
      throw new Error('Azure Speech subscription key is not configured');
    }

    const language = options?.language || 'ar-YE';
    const format = this.mapFormat(options?.encoding || 'LINEAR16');

    try {
      const params = new URLSearchParams({
        language: language,
        format: format,
      });

      const response = await this.httpClient.post(`?${params.toString()}`, audioData, {
        headers: {
          'Content-Type': 'audio/wav',
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        },
      });

      if (response.data.RecognitionStatus === 'Success' && response.data.DisplayText) {
        const transcript = response.data.DisplayText;

        this.logger.log('Azure Speech transcription successful', {
          language,
          transcriptLength: transcript.length,
        });

        return transcript;
      }

      this.logger.warn('Azure Speech returned no results', {
        status: response.data.RecognitionStatus,
      });
      return '';
    } catch (error) {
      this.logger.error(
        'Azure Speech transcription failed',
        error instanceof Error ? error.stack : String(error),
        {
          language,
          audioLength: audioData.length,
        },
      );
      throw new Error(`Azure Speech transcription failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private mapFormat(encoding: string): string {
    const formatMap: Record<string, string> = {
      LINEAR16: 'detailed',
      MP3: 'audio-16khz-128kbitrate-mono-mp3',
      FLAC: 'audio-16khz-16bit-mono-flac',
      'OGG_OPUS': 'audio-16khz-16bit-mono-opus',
    };
    return formatMap[encoding] || 'detailed';
  }
}

