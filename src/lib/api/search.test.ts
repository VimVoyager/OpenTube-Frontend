/**
 * Test Suite: search.ts
 *
 * Tests for video search functionality including query handling,
 * response parsing, and error scenarios
 */

import { describeJsonFetcher } from '../../tests/helpers/describeJsonFetcher';
import searchResultsFixture from '../../tests/fixtures/api/searchResponseFixture.json';
import { getSearchResults } from '$lib/api/search';
import { describe, it, expect, vi } from 'vitest';
import { createSuccessfulFetch, extractQueryParams } from '../../tests/helpers/apiHelpers';

describeJsonFetcher({
	name: 'getSearchResults',
	call: (id, fetchFn) => getSearchResults(id, 'relevance', fetchFn),
	endpoint: '/search',
	idParam: 'searchString',
	fixture: searchResultsFixture,
});

describe('getSearchResults sort filter', () => {
	it('URL-encodes the sort filter into the request', async () => {
		const fetchFn = createSuccessfulFetch(searchResultsFixture);
		await getSearchResults('cats', 'upload date', fetchFn as never);
		const url = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
		expect(extractQueryParams(url).sortFilter).toBe('upload date');
	});
});