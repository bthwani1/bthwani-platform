/**
 * Base Image Adapter Interface
 *
 * All image-to-tags providers must implement this interface
 */
export interface BaseImageAdapter {
  /**
   * Extract tags from image
   */
  extractTags(imageData: Buffer, options?: ImageExtractOptions): Promise<string[]>;

  /**
   * Get provider name
   */
  getProviderName(): string;
}

export interface ImageExtractOptions {
  language?: string; // 'ar' or 'en'
  maxResults?: number;
  minConfidence?: number; // 0.0 to 1.0
}

