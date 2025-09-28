import type { SearchResult } from "$lib/types";

export async function getSearchResults(
	query: string,
	fetchFn?: typeof globalThis.fetch
): Promise<SearchResult> {
	const fetcher = fetchFn ?? globalThis.fetch;

	const res = await fetcher(`http://localhost:8000/api/v1/search?serviceId=0&searchString=${encodeURIComponent(query)}&sortFilter=asc`);

	if (!res.ok) {
		throw new Error(`Could not load search results: ${res.status} ${res.statusText}`);
	}

	return res.json() as Promise<SearchResult>;
}
