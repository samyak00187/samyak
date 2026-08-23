export type VisionInputType = 'image' | 'screenshot' | 'screen_region' | 'camera_frame';
export type VisionMode = 'off' | 'on_demand' | 'continuous';
export type VisionTask = 'describe' | 'ocr' | 'ui' | 'error' | 'code' | 'chart' | 'diagram' | 'object' | 'general';

export interface ImageInput { type: VisionInputType; data: string; mimeType?: string; width?: number; height?: number; reference?: string; }
export interface VisionRequest { task: VisionTask; query?: string; signal?: AbortSignal; }
export interface VisionBox { x: number; y: number; width: number; height: number; }
export interface VisionRegion { label?: string; text?: string; bounds: VisionBox; confidence?: number; }
export interface VisionObject { name: string; confidence: number; bounds?: VisionBox; }
export interface VisionError { code: string; message: string; }
export interface VisionResult { success: boolean; summary?: string; text?: string; objects?: VisionObject[]; regions?: VisionRegion[]; confidence?: number; metadata?: { width?: number; height?: number; source?: string }; error?: VisionError; }
export interface VisionProvider { analyzeImage(image: ImageInput, request: VisionRequest): Promise<VisionResult>; }
export interface VisionHistoryEntry { timestamp: string; source: VisionInputType; request: VisionTask; summary?: string; }
