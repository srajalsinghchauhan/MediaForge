export interface PageInfo {
  page: number;
  perPage: number;
  totalResults?: number;
  nextPage?: number | null;
  prevPage?: number | null;
}

export interface PageResult<T> {
  items: T[];
  pageInfo: PageInfo;
}
