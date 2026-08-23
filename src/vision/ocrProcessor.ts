import type { ImageInput, VisionRegion } from './types';

export interface OCRProcessor { extractText(image: ImageInput, language?: string): Promise<{ text: string; confidence?: number }>; extractRegions(image: ImageInput, language?: string): Promise<VisionRegion[]>; detectTextBlocks(image: ImageInput, language?: string): Promise<VisionRegion[]>; }
export class UnconfiguredOCRProcessor implements OCRProcessor {
  async extractText(_image: ImageInput, language = 'eng') { void language; return { text: '', confidence: 0 }; }
  async extractRegions(_image: ImageInput, language = 'eng') { void language; return []; }
  async detectTextBlocks(_image: ImageInput, language = 'eng') { void language; return []; }
}
