import type { ImageInput, VisionProvider, VisionRequest, VisionResult } from '../types';

export class LocalMetadataProvider implements VisionProvider {
  async analyzeImage(image: ImageInput, _request: VisionRequest): Promise<VisionResult> {
    void _request;
    return { success: true, summary: 'Image received. No local vision model is configured.', metadata: { width: image.width, height: image.height, source: image.reference || image.type } };
  }
}
