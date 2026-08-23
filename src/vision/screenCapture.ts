export interface ScreenBounds { x: number; y: number; width: number; height: number; }
export interface ScreenCaptureResult { reference: string; bounds: ScreenBounds; }
export interface ScreenCapture { captureScreen(): Promise<ScreenCaptureResult>; captureRegion(bounds: ScreenBounds): Promise<ScreenCaptureResult>; }
