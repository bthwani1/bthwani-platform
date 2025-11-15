import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { LoggerService } from '../../../core/services/logger.service';
import { BaseImageAdapter, ImageExtractOptions } from './base-image.adapter';

/**
 * Azure Computer Vision Adapter
 *
 * Integrates with Azure Cognitive Services Computer Vision API
 */
@Injectable()
export class AzureImageAdapter implements BaseImageAdapter {
  private readonly httpClient: AxiosInstance;
  private readonly subscriptionKey: string;
  private readonly endpoint: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.subscriptionKey = this.configService.get<string>('VAR_AZURE_VISION_SUBSCRIPTION_KEY', '');
    this.endpoint =
      this.configService.get<string>(
        'VAR_AZURE_VISION_ENDPOINT',
        'https://eastus.api.cognitive.microsoft.com',
      ) || 'https://eastus.api.cognitive.microsoft.com';

    this.httpClient = axios.create({
      baseURL: this.endpoint,
      timeout: 30000,
      headers: {
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        'Content-Type': 'application/octet-stream',
      },
    });
  }

  getProviderName(): string {
    return 'azure';
  }

  async extractTags(imageData: Buffer, options?: ImageExtractOptions): Promise<string[]> {
    if (!this.subscriptionKey) {
      throw new Error('Azure Vision subscription key is not configured');
    }

    const maxResults = options?.maxResults || 10;
    const minConfidence = options?.minConfidence || 0.5;

    try {
      const response = await this.httpClient.post('/vision/v3.2/analyze', imageData, {
        params: {
          visualFeatures: 'Tags,Objects',
          language: options?.language || 'ar',
        },
        headers: {
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Content-Type': 'application/octet-stream',
        },
      });

      const tags: string[] = [];

      // Extract tags
      if (response.data.tags) {
        for (const tag of response.data.tags) {
          if (tag.confidence >= minConfidence && tag.name) {
            tags.push(tag.name);
          }
        }
      }

      // Extract objects
      if (response.data.objects) {
        for (const obj of response.data.objects) {
          if (obj.confidence >= minConfidence && obj.objectProperty) {
            tags.push(obj.objectProperty);
          }
        }
      }

      // Limit results
      const limitedTags = tags.slice(0, maxResults);

      this.logger.log('Azure Vision tag extraction successful', {
        tagCount: limitedTags.length,
        language: options?.language || 'ar',
      });

      return limitedTags;
    } catch (error) {
      this.logger.error(
        'Azure Vision tag extraction failed',
        error instanceof Error ? error.stack : String(error),
        {
          imageLength: imageData.length,
        },
      );
      throw new Error(`Azure Vision tag extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

