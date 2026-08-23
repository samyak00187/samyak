import type { AppError } from '../shared/types';

export function toAppError(error: unknown, fallbackMessage = 'Something went wrong.'): AppError {
  if (error instanceof Error) return { code: 'UNEXPECTED_ERROR', message: error.message, cause: error };
  return { code: 'UNEXPECTED_ERROR', message: fallbackMessage, cause: error };
}