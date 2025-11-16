import { getSearchResults } from '$lib/api/search';
import type { PageLoad } from './$types';
import type { SearchResult } from '$lib/types';

export const load: PageLoad = async ({ url }) => {
	try {
		const query = url.searchParams.get('query') ?? '';
		const result: SearchResult = await getSearchResults(query);

		return { result };
	} catch (error) {
		return { error: error instanceof Error ? error.message : 'Unknown error' };
	};
};
