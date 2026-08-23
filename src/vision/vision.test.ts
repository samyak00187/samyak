import { describe, expect, it, vi } from 'vitest';
import { ImageProcessor } from './imageProcessor';
import { VisionEngine } from './visionEngine';
import { VisionManager } from './visionManager';
import type { VisionProvider } from './types';

const image = { type: 'image' as const, data: 'data', mimeType: 'image/png', width: 100, height: 100 };
describe('VisionEngine', () => {
  it('rejects unsupported and oversized images before provider access', async () => {
    const provider: VisionProvider = { analyzeImage: vi.fn() };
    const engine = new VisionEngine(provider, new ImageProcessor({ maxBytes: 1, maxWidth: 100, maxHeight: 100 }));
    expect((await engine.analyze({ ...image, mimeType: 'image/gif' }, { task: 'general' })).error?.code).toBe('INVALID_IMAGE');
    expect((await engine.analyze({ ...image, data: 'x'.repeat(20) }, { task: 'general' })).error?.code).toBe('INVALID_IMAGE');
    expect(provider.analyzeImage).not.toHaveBeenCalled();
  });
  it('returns cancellation without calling the provider', async () => {
    const provider: VisionProvider = { analyzeImage: vi.fn() };
    const controller = new AbortController(); controller.abort();
    const result = await new VisionEngine(provider).analyze(image, { task: 'ocr', signal: controller.signal });
    expect(result.error?.code).toBe('CANCELLED'); expect(provider.analyzeImage).not.toHaveBeenCalled();
  });
  it('keeps vision off until explicitly enabled', async () => {
    const provider: VisionProvider = { analyzeImage: vi.fn(async () => ({ success: true, summary: 'ok' })) };
    const manager = new VisionManager(new VisionEngine(provider)); manager.setMode('off');
    expect((await manager.analyze(image, { task: 'general' })).error?.code).toBe('VISION_OFF');
    manager.setMode('on_demand'); expect((await manager.analyze(image, { task: 'general' })).success).toBe(true);
  });
});
