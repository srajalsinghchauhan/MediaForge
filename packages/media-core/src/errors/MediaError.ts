import type { MediaErrorCode, MediaErrorShape } from '../types/errors.js';

export class MediaError extends Error implements MediaErrorShape {
  override readonly name = 'MediaError' as const;
  readonly code: MediaErrorCode;
  readonly status?: number;
  readonly details?: unknown;
  readonly retriable?: boolean;

  constructor(options: {
    code: MediaErrorCode;
    message: string;
    status?: number;
    details?: unknown;
    retriable?: boolean;
    cause?: unknown;
  }) {
    super(options.message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.code = options.code;
    if (options.status !== undefined) {
      this.status = options.status;
    }
    if (options.details !== undefined) {
      this.details = options.details;
    }
    if (options.retriable !== undefined) {
      this.retriable = options.retriable;
    }
  }
}

export function isMediaError(value: unknown): value is MediaError {
  return value instanceof MediaError;
}

export function isRetriableCode(code: MediaErrorCode): boolean {
  return code === 'RATE_LIMITED' || code === 'NETWORK' || code === 'TIMEOUT';
}

export function mapStatusToCode(status: number): MediaErrorCode {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 429:
      return 'RATE_LIMITED';
    default:
      return 'UNKNOWN';
  }
}
