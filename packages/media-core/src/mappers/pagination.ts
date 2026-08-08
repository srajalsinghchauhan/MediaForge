import type { PageInfo, PageResult } from '../types/pagination.js';

export interface PexelsPageMeta {
  page?: number;
  per_page?: number;
  total_results?: number;
  next_page?: string;
  prev_page?: string;
}

export function mapPageInfo(
  meta: PexelsPageMeta,
  fallback: { page: number; perPage: number },
): PageInfo {
  const page = typeof meta.page === 'number' ? meta.page : fallback.page;
  const perPage = typeof meta.per_page === 'number' ? meta.per_page : fallback.perPage;
  const totalResults =
    typeof meta.total_results === 'number' ? meta.total_results : undefined;

  let nextPage: number | null | undefined;
  let prevPage: number | null | undefined;

  if (meta.next_page) {
    nextPage = page + 1;
  } else if (totalResults !== undefined) {
    nextPage = page * perPage < totalResults ? page + 1 : null;
  } else {
    nextPage = null;
  }

  if (meta.prev_page) {
    prevPage = Math.max(1, page - 1);
  } else {
    prevPage = page > 1 ? page - 1 : null;
  }

  const pageInfo: PageInfo = {
    page,
    perPage,
    nextPage,
    prevPage,
  };

  if (totalResults !== undefined) {
    pageInfo.totalResults = totalResults;
  }

  return pageInfo;
}

export function createPageResult<T>(
  items: T[],
  meta: PexelsPageMeta,
  fallback: { page: number; perPage: number },
): PageResult<T> {
  return {
    items,
    pageInfo: mapPageInfo(meta, fallback),
  };
}
