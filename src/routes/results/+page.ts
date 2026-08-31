import { getSearchResults } from '$lib/api/search';
import { adaptSearchResults, type SearchResultsPage } from '$lib/adapters/search';
import thumbnailPlaceholder from '$lib/assets/thumbnail-placeholder.jpg';
import avatarPlaceholder from '$lib/assets/logo-placeholder.svg';
import type { PageLoad } from './$types';
import type { LoadSearchResponse } from '../types';
import type { SearchApiResponse } from '$lib/api/types';

const emptyResults: SearchResultsPage = { items: [], nextPage: null, hasNextPage: false };

export const load: PageLoad = async ({ url, fetch }): Promise<LoadSearchResponse> => {
	try {
		const query: string = url.searchParams.get('query') ?? '';
		const sortFilter: string = url.searchParams.get('sort') ?? 'asc';

		if (!query.trim()) {
			return {
				results: emptyResults,
				query: '',
				error: null
			};
		}

		// Fetch raw search data from API
		const searchData: SearchApiResponse = await getSearchResults(query, sortFilter, fetch);

		// Transform data using adapter
		const results: SearchResultsPage = adaptSearchResults(
			searchData,
			thumbnailPlaceholder,
			avatarPlaceholder
		);

		return {
			results,
			query,
			sortFilter,
			error: null
		};
	} catch (error) {
		console.error('Error loading search results:', error);
		return {
			results: emptyResults,
			query: url.searchParams.get('query') ?? '',
			sortFilter: url.searchParams.get('sort') ?? 'asc',
			error: error instanceof Error ? error.message : 'Failed to load search results'
		};
	}
};
