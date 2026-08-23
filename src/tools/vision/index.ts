import { execFile } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { z } from 'zod';
import { tool, resultError } from '../toolHelpers';
import type { Tool } from '../../brain/types';

function powershell(script: string): Promise<{ code: number; stdout: string }> { return new Promise((resolve) => { if (process.platform !== 'win32') { resolve({ code: 1, stdout: '' }); return; } execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true, maxBuffer: 10_000 }, (error, stdout) => resolve({ code: error ? 1 : 0, stdout })); }); }
function imagePath() { return path.join(os.tmpdir(), `jarvis-vision-${crypto.randomUUID()}.png`); }
async function capture(region?: { x: number; y: number; width: number; height: number }) {
  const output = imagePath();
  const rectangle = region ? `$x=${region.x}; $y=${region.y}; $width=${region.width}; $height=${region.height}` : '$x=0; $y=0; $width=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width; $height=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height';
  const script = `Add-Type -AssemblyName System.Drawing; Add-Type -AssemblyName System.Windows.Forms; ${rectangle}; if ($width -lt 1 -or $height -lt 1 -or ($width * $height) -gt 25000000) { exit 2 }; $bitmap = New-Object System.Drawing.Bitmap($width, $height); $graphics = [System.Drawing.Graphics]::FromImage($bitmap); $graphics.CopyFromScreen($x, $y, 0, 0, $bitmap.Size); $bitmap.Save('${output.replace(/'/g, "''")}', [System.Drawing.Imaging.ImageFormat]::Png); $graphics.Dispose(); $bitmap.Dispose(); Write-Output ('{"width":' + $width + ',"height":' + $height + '}')`;
  const result = await powershell(script);
  if (result.code !== 0) return resultError('CAPTURE_FAILED', 'Screen capture is unavailable or the requested region is invalid.');
  try { return { success: true, data: { reference: output, ...JSON.parse(result.stdout.trim()) } }; } catch { return resultError('CAPTURE_FAILED', 'Screen capture returned invalid metadata.'); }
}

const regionSchema = z.object({ x: z.number().int().min(0).max(20_000), y: z.number().int().min(0).max(20_000), width: z.number().int().min(1).max(5_000), height: z.number().int().min(1).max(5_000) }).strict();
export const visionTools: Tool[] = [
  tool({ name: 'capture_screen', displayName: 'Capture Screen', description: 'Captures the primary screen after explicit screen permission.', category: 'vision', permissions: ['screen.capture'], riskLevel: 'medium', schema: z.object({}).strict(), execute: async () => capture() }),
  tool({ name: 'capture_screen_region', displayName: 'Capture Screen Region', description: 'Captures a bounded screen region after explicit screen permission.', category: 'vision', permissions: ['screen.capture'], riskLevel: 'medium', schema: regionSchema, execute: async (input) => { const parsed = regionSchema.safeParse(input); return parsed.success ? capture(parsed.data) : resultError('INVALID_INPUT', 'A bounded x, y, width, and height are required.'); } }),
  tool({ name: 'analyze_image', displayName: 'Analyze Image', description: 'Sends an explicitly supplied image to the configured vision provider.', category: 'vision', permissions: ['network.access'], riskLevel: 'medium', schema: z.object({ reference: z.string().min(1).max(500), task: z.string().min(1).max(40) }).strict(), execute: async () => resultError('NOT_CONFIGURED', 'No vision provider is configured.') }),
  tool({ name: 'ocr_image', displayName: 'OCR Image', description: 'Extracts text only through a configured OCR provider.', category: 'vision', permissions: ['network.access'], riskLevel: 'medium', schema: z.object({ reference: z.string().min(1).max(500) }).strict(), execute: async () => resultError('NOT_CONFIGURED', 'No OCR provider is configured.') }),
];
