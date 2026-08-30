import { PUBLIC_API_URL } from '$env/static/public';
import type { NextPageSearchApiResponse, SearchResponse } from '$lib/api/types';

const API_BASE_URL = PUBLIC_API_URL;

/**
 * Fetch search results for a given search query
 */
export async function getSearchResults(
	query: string,
	sortFilter: string,
	fetchFn?: typeof globalThis.fetch
): Promise<SearchResponse> {
	const fetcher: {
		(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
		(input: string | URL | Request, init?: RequestInit): Promise<Response>;
	} = fetchFn ?? globalThis.fetch;

	try {
		const res: Response = await fetcher(
			`${API_BASE_URL}/search?searchString=${encodeURIComponent(query)}&sortFilter=${encodeURIComponent(sortFilter)}`
		);

		if (!res.ok) {
			throw new Error(
				`Could not load search results for ${query}: ${res.status} ${res.statusText}`
			);
		}

		return await res.json();
	} catch (error) {
		console.error('Error fetching search results:', error);
		throw error;
	}
}

export async function getSearchResultsNextPage(
	query: string,
	pageUrl: string,
	pageId: string,
	sortFilter: string,
	fetchFn?: typeof globalThis.fetch
): Promise<NextPageSearchApiResponse> {
	const fetcher: {
		(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
		(input: string | URL | Request, init?: RequestInit): Promise<Response>;
	} = fetchFn ?? globalThis.fetch;

	try {
		const res: Response = await fetcher(
			`${API_BASE_URL}/search/page?searchString=${encodeURIComponent(query)}&pageUrl=${encodeURIComponent(pageUrl)}&pageId=${encodeURIComponent(pageId)}&sortFilter=${encodeURIComponent(sortFilter)}`
		);

		if (!res.ok) {
			throw new Error(
				`Could not load search results for ${query}: ${res.status} ${res.statusText}`
			);
		}

		return await res.json();
	} catch (error) {
		console.error('Error fetching next page search results:', error);
		throw error;
	}
}
