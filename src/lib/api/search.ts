import type { SearchResult } from "$lib/types";
import { PUBLIC_API_URL } from '$env/static/public';

const API_BASE_URL = PUBLIC_API_URL;

/**
 * Fetch search results for a given search query
 */
export async function getSearchResults(
	query: string,
	sortFilter:string,
	fetchFn?: typeof globalThis.fetch
): Promise<SearchResult> {
	const fetcher = fetchFn ?? globalThis.fetch;

	try {
		const res = await fetcher(`${API_BASE_URL}/search?searchString=${encodeURIComponent(query)}&sortFilter=${encodeURIComponent(sortFilter)}`);

		if (!res.ok) {
			throw new Error(`Could not load search results for ${query}: ${res.status} ${res.statusText}`);
		}

		const data = await res.json();
		return data;

	} catch (error) {
		console.error('Error fetching search results:', error);
		throw error;
	}
}
