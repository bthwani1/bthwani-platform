import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { LoggerService } from '../../../core/services/logger.service';
import { BaseImageAdapter, ImageExtractOptions } from './base-image.adapter';

/**
 * Google Vision API Adapter
 *
 * Integrates with Google Cloud Vision API
 */
@Injectable()
export class GoogleImageAdapter implements BaseImageAdapter {
  private readonly httpClient: AxiosInstance;
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.apiKey = this.configService.get<string>('VAR_GOOGLE_VISION_API_KEY', '');
    this.apiUrl =
      this.configService.get<string>(
        'VAR_GOOGLE_VISION_API_URL',
        'https://vision.googleapis.com/v1',
      ) || 'https://vision.googleapis.com/v1';

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

  async extractTags(imageData: Buffer, options?: ImageExtractOptions): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error('Google Vision API key is not configured');
    }

    const maxResults = options?.maxResults || 10;
    const minConfidence = options?.minConfidence || 0.5;

    try {
      // Convert image buffer to base64
      const imageContent = imageData.toString('base64');

      const requestBody = {
        requests: [
          {
            image: {
              content: imageContent,
            },
            features: [
              {
                type: 'LABEL_DETECTION',
                maxResults,
              },
              {
                type: 'OBJECT_LOCALIZATION',
                maxResults,
              },
            ],
          },
        ],
      };

      const response = await this.httpClient.post(
        `/images:annotate?key=${this.apiKey}`,
        requestBody,
      );

      const tags: string[] = [];

      if (response.data.responses && response.data.responses.length > 0) {
        const annotations = response.data.responses[0];

        // Extract labels
        if (annotations.labelAnnotations) {
          for (const label of annotations.labelAnnotations) {
            if (label.score >= minConfidence && label.description) {
              tags.push(label.description);
            }
          }
        }

        // Extract localized objects
        if (annotations.localizedObjectAnnotations) {
          for (const obj of annotations.localizedObjectAnnotations) {
            if (obj.score >= minConfidence && obj.name) {
              tags.push(obj.name);
            }
          }
        }
      }

      // Translate to Arabic if needed
      const language = options?.language || 'ar';
      if (language === 'ar' && tags.length > 0) {
        // TODO: Implement translation service or use Google Translate API
        // For now, return English tags
        this.logger.log('Tags extracted (translation to Arabic not yet implemented)', {
          tagCount: tags.length,
        });
      }

      this.logger.log('Google Vision tag extraction successful', {
        tagCount: tags.length,
        language,
      });

      return tags;
    } catch (error) {
      this.logger.error(
        'Google Vision tag extraction failed',
        error instanceof Error ? error.stack : String(error),
        {
          imageLength: imageData.length,
        },
      );
      throw new Error(`Google Vision tag extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

