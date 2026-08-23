import type { ImageInput, VisionProvider, VisionRequest, VisionResult } from './types';
import { ImageProcessor } from './imageProcessor';

export class VisionEngine {
  constructor(private readonly provider: VisionProvider, private readonly processor = new ImageProcessor()) {}
  async analyze(image: ImageInput, request: VisionRequest): Promise<VisionResult> {
    if (request.signal?.aborted) return { success: false, error: { code: 'CANCELLED', message: 'Vision analysis was cancelled.' } };
    const validation = this.processor.validate(image);
    if (!validation.valid) return { success: false, error: { code: 'INVALID_IMAGE', message: validation.message } };
    try { return await this.provider.analyzeImage(image, request); } catch (error) { return { success: false, error: { code: 'PROVIDER_ERROR', message: error instanceof Error ? error.message : 'Vision provider failed.' } }; }
  }
}
