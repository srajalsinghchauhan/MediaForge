export interface SearchParams {
  query: string;
  page?: number;
  perPage?: number;
  orientation?: 'landscape' | 'portrait' | 'square';
  size?: 'large' | 'medium' | 'small';
  locale?: string;
  color?: string;
}

export interface CuratedParams {
  page?: number;
  perPage?: number;
}

export interface MediaItemParams {
  id: number | string;
}
