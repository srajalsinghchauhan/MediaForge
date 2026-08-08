export type MediaErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'BAD_REQUEST'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'PARSE'
  | 'UNKNOWN';

export interface MediaErrorShape extends Error {
  name: 'MediaError';
  code: MediaErrorCode;
  status?: number;
  details?: unknown;
  retriable?: boolean;
}
