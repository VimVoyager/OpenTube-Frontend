import { getSearchResults } from '$lib/api/search';
import { adaptSearchResults } from '$lib/adapters/search';
import thumbnailPlaceholder from '$lib/assets/thumbnail-placeholder.jpg';
import avatarPlaceholder from '$lib/assets/logo-placeholder.svg';
import type { PageLoad } from './$types';
import type { SearchResultConfig } from '$lib/adapters/types';
import type { LoadResponse } from '../types';
import type { NextPage, SearchResponse } from '$lib/api/types';
import type { SearchResultResponseConfig } from '$lib/types';

export const load: PageLoad = async ({ url, fetch }): Promise<LoadResponse> => {
	try {
		const query: string = url.searchParams.get('query') ?? '';
		const sortFilter: string = url.searchParams.get('sort') ?? 'asc';

		if (!query.trim()) {
			return {
				results: { items: [], nextPage: null, hasNextPage: undefined },
				query: '',
				error: null
			};
		}

		// Fetch raw search data from API
		const searchData: SearchResponse = await getSearchResults(query, sortFilter, fetch);

		// Transform data using adapter
		const results: SearchResultResponseConfig = adaptSearchResults(searchData, thumbnailPlaceholder, avatarPlaceholder);

		return {
			results,
			query,
			sortFilter,
			error: null
		};
	} catch (error) {
		console.error('Error loading search results:', error);
		return {
			results: [],
			query: url.searchParams.get('query') ?? '',
			sortFilter: url.searchParams.get('sort') ?? 'asc',
			error: error instanceof Error ? error.message : 'Failed to load search results'
		};
	}
};
