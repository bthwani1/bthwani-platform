/**
 * Base Voice Adapter Interface
 *
 * All voice-to-text providers must implement this interface
 */
export interface BaseVoiceAdapter {
  /**
   * Convert audio buffer to text
   */
  transcribe(audioData: Buffer, options?: VoiceTranscribeOptions): Promise<string>;

  /**
   * Get provider name
   */
  getProviderName(): string;
}

export interface VoiceTranscribeOptions {
  language?: string; // e.g., 'ar-YE', 'en-US'
  sampleRateHertz?: number;
  encoding?: 'LINEAR16' | 'MP3' | 'FLAC' | 'OGG_OPUS';
  autoDetectLanguage?: boolean;
}

