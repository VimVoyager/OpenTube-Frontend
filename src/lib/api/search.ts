import { PUBLIC_API_URL } from '$env/static/public';
import type { SearchResponse } from '$lib/api/types';

const API_BASE_URL = PUBLIC_API_URL;

/**
 * Fetch search results for a given search query
 */
export async function getSearchResults(
	query: string,
	sortFilter:string,
	fetchFn?: typeof globalThis.fetch
): Promise<SearchResponse> {
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
