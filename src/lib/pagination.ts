// Every list endpoint returns the same envelope (FRONTEND_API §2.4): a total count, the
// adjacent-page URLs, and the current page of rows in `results`. This is the one place that
// shape is defined; list hooks read `results`/`count` through it.

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Limit/offset query params for a list request. Omit for the first default-size page. */
export interface PageParams {
  limit?: number;
  offset?: number;
}
