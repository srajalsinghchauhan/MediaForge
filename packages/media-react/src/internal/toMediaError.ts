import { isMediaError, MediaError, type MediaError as MediaErrorType } from '@mediaforge/core';

export function toMediaError(error: unknown): MediaErrorType {
  if (isMediaError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new MediaError({
      code: 'UNKNOWN',
      message: error.message,
      retriable: false,
      cause: error,
    });
  }

  return new MediaError({
    code: 'UNKNOWN',
    message: 'Unknown error',
    retriable: false,
    details: error,
  });
}
