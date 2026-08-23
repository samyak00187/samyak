import type { VisionEngine } from './visionEngine';
import type { ImageInput, VisionMode, VisionRequest, VisionResult } from './types';

export class VisionManager {
  private mode: VisionMode = 'on_demand';
  private active = false;
  constructor(private readonly engine: VisionEngine) {}
  getMode() { return this.mode; }
  isActive() { return this.active; }
  setMode(mode: VisionMode) { this.mode = mode; if (mode === 'off') this.active = false; }
  async analyze(image: ImageInput, request: VisionRequest): Promise<VisionResult> { if (this.mode === 'off') return { success: false, error: { code: 'VISION_OFF', message: 'Vision is disabled.' } }; this.active = true; try { return await this.engine.analyze(image, request); } finally { this.active = false; } }
}
