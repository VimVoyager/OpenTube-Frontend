/**
 * Test Suite: SearchResultsLoading.svelte
 * 
 * Tests for search results page loading skeleton with configurable count
 */

import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import SearchResultsLoading from './SearchResultsLoading.svelte';

const getItems = () => screen.queryAllByRole('status', { name: 'Loading search result'});

describe('SearchResultsLoading', () => {
	it('announces the results container to screen readers', () => {
		render(SearchResultsLoading);
		expect(screen.getByRole('status', { name: 'Loading search results' })).toBeInTheDocument();
	});

	it('renders 10 skeleton items by default', () => {
		render(SearchResultsLoading);
		expect(getItems()).toHaveLength(10);
	});

	it.each([1, 5, 15])('renders %d skeleton items when count is %d', (count) => {
		render(SearchResultsLoading, { props: { count } });
		expect(getItems()).toHaveLength(count);
	});

	it('renders header and footer skeletons even when count is 0', () => {
		const { container } = render(SearchResultsLoading, { props: { count: 0 } });
		expect(getItems()).toHaveLength(0);
		// header and footer bars sit outside the {#each}
		expect(container.querySelector('.mb-6 .h-8')).toBeInTheDocument();
		expect(container.querySelector('.mt-8 .h-4')).toBeInTheDocument();
	});

});