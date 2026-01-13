import { getSearchResults } from '$lib/api/search';
import { adaptSearchResults } from '$lib/adapters/search';
import thumbnailPlaceholder from '$lib/assets/thumbnail-placeholder.jpg'
import avatarPlaceholder from '$lib/assets/logo-placeholder.svg';
import type { PageLoad } from './$types';
import type { SearchResultConfig } from '$lib/adapters/types';
import type { LoadResponse } from '../types';



export const load: PageLoad = async ({ url, fetch }): Promise<LoadResponse> => {
	try {
		// Extract search parameter
		const query = url.searchParams.get('query') ?? '';
		const sortFilter = url.searchParams.get('sort') ?? 'asc';

		// Validate query
		if (!query.trim()) {
			return {
				results: [],
				query: '',
				error: null
			};
		}

		// Fetch raw search data from API
		const searchData = await getSearchResults(query, sortFilter, fetch);

		// Transform data using adapter
		const results: SearchResultConfig[] = adaptSearchResults(
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
			results: [],
			query: url.searchParams.get('query') ?? '',
			sortFilter: url.searchParams.get('sort') ?? 'asc',
			error: error instanceof Error ? error.message : 'Failed to load search results'
		};
	}
};
