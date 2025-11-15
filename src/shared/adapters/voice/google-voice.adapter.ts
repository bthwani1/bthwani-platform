import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { LoggerService } from '../../../core/services/logger.service';
import { BaseVoiceAdapter, VoiceTranscribeOptions } from './base-voice.adapter';

/**
 * Google Speech-to-Text Adapter
 *
 * Integrates with Google Cloud Speech-to-Text API
 */
@Injectable()
export class GoogleVoiceAdapter implements BaseVoiceAdapter {
  private readonly httpClient: AxiosInstance;
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.apiKey = this.configService.get<string>('VAR_GOOGLE_SPEECH_API_KEY', '');
    this.apiUrl =
      this.configService.get<string>(
        'VAR_GOOGLE_SPEECH_API_URL',
        'https://speech.googleapis.com/v1',
      ) || 'https://speech.googleapis.com/v1';

    this.httpClient = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  getProviderName(): string {
    return 'google';
  }

  async transcribe(audioData: Buffer, options?: VoiceTranscribeOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Google Speech API key is not configured');
    }

    const language = options?.language || 'ar-YE';
    const encoding = this.mapEncoding(options?.encoding || 'LINEAR16');
    const sampleRateHertz = options?.sampleRateHertz || 16000;

    try {
      // Convert audio buffer to base64
      const audioContent = audioData.toString('base64');

      const requestBody = {
        config: {
          encoding,
          sampleRateHertz,
          languageCode: language,
          alternativeLanguageCodes: language.startsWith('ar') ? ['en-US'] : ['ar-YE'],
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: false,
        },
        audio: {
          content: audioContent,
        },
      };

      const response = await this.httpClient.post(
        `/speech:recognize?key=${this.apiKey}`,
        requestBody,
      );

      if (response.data.results && response.data.results.length > 0) {
        const transcript = response.data.results
          .map((result: { alternatives: Array<{ transcript: string }> }) =>
            result.alternatives[0]?.transcript,
          )
          .filter(Boolean)
          .join(' ');

        this.logger.log('Google Speech transcription successful', {
          language,
          transcriptLength: transcript.length,
        });

        return transcript;
      }

      this.logger.warn('Google Speech returned no results');
      return '';
    } catch (error) {
      this.logger.error(
        'Google Speech transcription failed',
        error instanceof Error ? error.stack : String(error),
        {
          language,
          audioLength: audioData.length,
        },
      );
      throw new Error(`Google Speech transcription failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private mapEncoding(encoding: string): string {
    const encodingMap: Record<string, string> = {
      LINEAR16: 'LINEAR16',
      MP3: 'MP3',
      FLAC: 'FLAC',
      'OGG_OPUS': 'OGG_OPUS',
    };
    return encodingMap[encoding] || 'LINEAR16';
  }
}

