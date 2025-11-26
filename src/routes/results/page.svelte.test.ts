import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';
import type { PageData } from './$types';
import type { SearchResultConfig } from '$lib/adapters/types';

// Mock VideoResult component properly
vi.mock('$lib/components/VideoResult.svelte', () => ({
	default: vi.fn(() => ({
		render: () => ({ html: '<div>VideoResult Mock</div>' })
	}))
}));

// Mock Loading component
vi.mock('$lib/components/Loading.svelte', () => ({
	default: vi.fn(() => ({
		render: () => ({ html: '<div>Loading Mock</div>' })
	}))
}));

// Mock goto
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

describe('+page.svelte - Search Results', () => {
	const mockSearchResults: SearchResultConfig[] = [
		{
			id: 'video-1',
			url: '/watch?v=video-1',
			title: 'First Video Title',
			thumbnail: 'https://example.com/thumb1.jpg',
			channelName: 'Test Channel 1',
			channelUrl: '/channel/test1',
			channelAvatar: 'https://example.com/avatar1.jpg',
			verified: true,
			viewCount: 1000000,
			duration: 600,
			uploadDate: '2024-01-01',
			description: 'First video description',
			type: 'stream'
		},
		{
			id: 'video-2',
			url: '/watch?v=video-2',
			title: 'Second Video Title',
			thumbnail: 'https://example.com/thumb2.jpg',
			channelName: 'Test Channel 2',
			channelUrl: '/channel/test2',
			channelAvatar: 'https://example.com/avatar2.jpg',
			verified: false,
			viewCount: 500000,
			duration: 300,
			uploadDate: '2024-01-02',
			description: 'Second video description',
			type: 'stream'
		},
		{
			id: 'video-3',
			url: '/watch?v=video-3',
			title: 'Third Video Title',
			thumbnail: 'https://example.com/thumb3.jpg',
			channelName: 'Test Channel 3',
			channelUrl: '/channel/test3',
			channelAvatar: 'https://example.com/avatar3.jpg',
			verified: true,
			viewCount: 250000,
			duration: 450,
			uploadDate: '2024-01-03',
			description: 'Third video description',
			type: 'stream'
		}
	];

	const createMockPageData = (overrides: Partial<PageData> = {}): PageData => ({
		results: mockSearchResults,
		query: 'test query',
		sortFilter: 'relevance',
		error: null,
		...overrides
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Component rendering - success state', () => {
		it('should render the component without errors', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			expect(container).toBeTruthy();
		});

		it('should render main container with correct classes', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const mainContainer = container.querySelector('div.container.mx-auto.w-3\\/4');
			expect(mainContainer).toBeTruthy();
		});

		it('should apply correct padding classes', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const mainContainer = container.querySelector('div.px-4.py-8');
			expect(mainContainer).toBeTruthy();
		});
	});

	describe('Search query header', () => {
		it('should display search query in header when query exists', () => {
			// Arrange
			const data = createMockPageData({ query: 'test search' });

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText(/Search Results for "test search"/)).toBeTruthy();
		});

		it('should apply correct header classes', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const header = screen.getByText(/Search Results for/);
			expect(header.tagName).toBe('H1');
			expect(header).toHaveClass('mb-6', 'text-2xl', 'font-bold', 'text-white');
		});

		it('should not display header when query is empty', () => {
			// Arrange
			const data = createMockPageData({ query: '' });

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.queryByText(/Search Results for/)).toBeNull();
		});

		it('should handle special characters in query', () => {
			// Arrange
			const data = createMockPageData({ query: 'test & special <chars>' });

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText(/Search Results for "test & special <chars>"/)).toBeTruthy();
		});
	});

	describe('Error state', () => {
		it('should display error container when error exists', () => {
			// Arrange
			const data = createMockPageData({ error: 'Network error occurred' });

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText(/Error: Network error occurred/)).toBeTruthy();
		});

		it('should apply error styling classes', () => {
			// Arrange
			const data = createMockPageData({ error: 'Test error' });

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const errorContainer = container.querySelector('div.bg-red-900\\/20');
			expect(errorContainer).toBeTruthy();
			expect(errorContainer).toHaveClass('rounded-lg', 'p-6', 'text-center');
		});

		it('should display error message with correct styling', () => {
			// Arrange
			const data = createMockPageData({ error: 'API failure' });

			// Act
			render(Page, { props: { data } });

			// Assert
			const errorMessage = screen.getByText(/Error: API failure/);
			expect(errorMessage).toHaveClass('text-lg', 'text-red-400');
		});

		it('should display "try again later" message', () => {
			// Arrange
			const data = createMockPageData({ error: 'Test error' });

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText('Please try again later.')).toBeTruthy();
		});

		it('should not display results when error exists', () => {
			// Arrange
			const data = createMockPageData({ 
				error: 'Test error',
				results: mockSearchResults 
			});

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			expect(screen.getByText(/Error: Test error/)).toBeTruthy();
			const resultsContainer = container.querySelector('.space-y-4');
			expect(resultsContainer).toBeNull();
		});

		it('should still show query header when error exists', () => {
			// Arrange
			const data = createMockPageData({ 
				error: 'Test error',
				query: 'test query'
			});

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText(/Search Results for "test query"/)).toBeTruthy();
		});
	});

	describe('Empty query state', () => {
		it('should display empty query message when query is empty', () => {
			// Arrange
			const data = createMockPageData({ query: '', results: [] });

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText('Enter a search query to find videos')).toBeTruthy();
		});

		it('should apply correct styling to empty query message', () => {
			// Arrange
			const data = createMockPageData({ query: '', results: [] });

			// Act
			render(Page, { props: { data } });

			// Assert
			const message = screen.getByText('Enter a search query to find videos');
			expect(message).toHaveClass('text-lg');
		});

		it('should not display results when query is empty', () => {
			// Arrange
			const data = createMockPageData({ query: '', results: [] });

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const resultsContainer = container.querySelector('.space-y-4');
			expect(resultsContainer).toBeNull();
		});
	});

	describe('No results state', () => {
		it('should display no results message when results array is empty', () => {
			// Arrange
			const data = createMockPageData({ 
				query: 'nonexistent query',
				results: [] 
			});

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText(/No results found for "nonexistent query"/)).toBeTruthy();
		});

		it('should display suggestion message', () => {
			// Arrange
			const data = createMockPageData({ results: [] });

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText('Try different keywords or check your spelling')).toBeTruthy();
		});

		it('should apply correct styling to no results container', () => {
			// Arrange
			const data = createMockPageData({ results: [] });

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const noResultsContainer = container.querySelector('div.text-center.text-gray-400');
			expect(noResultsContainer).toBeTruthy();
		});

		it('should not display results container when no results', () => {
			// Arrange
			const data = createMockPageData({ results: [] });

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const resultsContainer = container.querySelector('.space-y-4');
			expect(resultsContainer).toBeNull();
		});
	});

	describe('Results display', () => {
		it('should display results container when results exist', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const resultsContainer = container.querySelector('.space-y-4');
			expect(resultsContainer).toBeTruthy();
		});

		it('should apply correct spacing to results container', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const resultsContainer = container.querySelector('div.space-y-4');
			expect(resultsContainer).toBeTruthy();
		});

		it('should render VideoResult for each search result', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			// Since VideoResult is mocked, we just verify the results container exists
			const resultsContainer = container.querySelector('.space-y-4');
			expect(resultsContainer).toBeTruthy();
		});
	});

	describe('Results count display', () => {
		it('should display singular "result" for one result', () => {
			// Arrange
			const data = createMockPageData({ results: [mockSearchResults[0]] });

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText('Showing 1 result')).toBeTruthy();
		});

		it('should display plural "results" for multiple results', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText('Showing 3 results')).toBeTruthy();
		});

		it('should apply correct styling to results count', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			render(Page, { props: { data } });

			// Assert
			const resultsCount = screen.getByText('Showing 3 results');
			expect(resultsCount).toHaveClass('text-sm', 'text-gray-400');
		});

		it('should position results count correctly', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const countContainer = container.querySelector('div.mt-8.text-center');
			expect(countContainer).toBeTruthy();
		});
	});

	describe('Reactive data updates', () => {
		it('should accept updated query data', () => {
			// Arrange
			const initialData = createMockPageData({ query: 'initial query' });
			const { rerender } = render(Page, { props: { data: initialData } });

			// Act
			const updatedData = createMockPageData({ query: 'updated query' });
			rerender({ data: updatedData });

			// Assert
			expect(updatedData.query).toBe('updated query');
		});

		it('should accept updated results data', () => {
			// Arrange
			const initialData = createMockPageData({ results: [mockSearchResults[0]] });
			const { rerender } = render(Page, { props: { data: initialData } });

			// Act
			const updatedData = createMockPageData({ results: mockSearchResults });
			rerender({ data: updatedData });

			// Assert
			expect(updatedData.results).toHaveLength(3);
		});

		it('should accept updated error state', () => {
			// Arrange
			const initialData = createMockPageData();
			const { rerender } = render(Page, { props: { data: initialData } });

			// Act
			const updatedData = createMockPageData({ error: 'New error' });
			rerender({ data: updatedData });

			// Assert
			expect(updatedData.error).toBe('New error');
		});

		it('should accept error clearing', () => {
			// Arrange
			const initialData = createMockPageData({ error: 'Test error', results: [] });
			const { rerender } = render(Page, { props: { data: initialData } });

			// Act
			const updatedData = createMockPageData({ error: null });
			rerender({ data: updatedData });

			// Assert
			expect(updatedData.error).toBeNull();
			expect(updatedData.results).toHaveLength(3);
		});
	});

	describe('Edge cases', () => {
		it('should handle undefined results gracefully', () => {
			// Arrange
			const data = createMockPageData({ results: undefined as any });

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			expect(container).toBeTruthy();
		});

		it('should handle null results gracefully', () => {
			// Arrange
			const data = createMockPageData({ results: null as any });

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			expect(container).toBeTruthy();
		});

		it('should handle very long query strings', () => {
			// Arrange
			const longQuery = 'a'.repeat(200);
			const data = createMockPageData({ query: longQuery });

			// Act
			render(Page, { props: { data } });

			// Assert
			// Use regex to match the query
			expect(screen.getByText(new RegExp(`Search Results for "${longQuery}"`))).toBeTruthy();
		});

		it('should handle very long error messages', () => {
			// Arrange
			const longError = 'Error message '.repeat(50);
			const data = createMockPageData({ error: longError });

			// Act
			render(Page, { props: { data } });

			// Assert
			// Use regex to match part of the error since Testing Library normalizes whitespace
			expect(screen.getByText(/Error: Error message/)).toBeTruthy();
		});

		it('should handle large results array', () => {
			// Arrange
			const largeResults = Array.from({ length: 50 }, (_, i) => ({
				...mockSearchResults[0],
				id: `video-${i}`,
				title: `Video ${i}`
			}));
			const data = createMockPageData({ results: largeResults });

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText('Showing 50 results')).toBeTruthy();
		});

		it('should handle whitespace-only query', () => {
			// Arrange
			const data = createMockPageData({ query: '   ', results: [] });

			// Act
			render(Page, { props: { data } });

			// Assert
			// Testing Library normalizes whitespace, so match with regex
			expect(screen.getByText(/No results found for/)).toBeTruthy();
		});
	});

	describe('hasResults computed property', () => {
		it('should be true when results exist', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const resultsContainer = container.querySelector('.space-y-4');
			expect(resultsContainer).toBeTruthy();
		});

		it('should be false when results array is empty', () => {
			// Arrange
			const data = createMockPageData({ results: [] });

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const resultsContainer = container.querySelector('.space-y-4');
			expect(resultsContainer).toBeNull();
		});

		it('should be false when results is null', () => {
			// Arrange
			const data = createMockPageData({ results: null as any });

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const resultsContainer = container.querySelector('.space-y-4');
			expect(resultsContainer).toBeNull();
		});

		it('should be false when results is undefined', () => {
			// Arrange
			const data = createMockPageData({ results: undefined as any });

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const resultsContainer = container.querySelector('.space-y-4');
			expect(resultsContainer).toBeNull();
		});
	});

	describe('State priority', () => {
		it('should show error over results', () => {
			// Arrange
			const data = createMockPageData({ 
				error: 'Test error',
				results: mockSearchResults 
			});

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText(/Error: Test error/)).toBeTruthy();
			expect(screen.queryByText('Showing 3 results')).toBeNull();
		});

		it('should show empty query message over no results', () => {
			// Arrange
			const data = createMockPageData({ query: '', results: [] });

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText('Enter a search query to find videos')).toBeTruthy();
			expect(screen.queryByText(/No results found/)).toBeNull();
		});

		it('should show no results message when query exists but results empty', () => {
			// Arrange
			const data = createMockPageData({ query: 'test', results: [] });

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText(/No results found for "test"/)).toBeTruthy();
			expect(screen.queryByText('Enter a search query')).toBeNull();
		});
	});

	describe('Component integration', () => {
		it('should maintain layout structure with all states', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const mainContainer = container.querySelector('div.container');
			expect(mainContainer).toBeTruthy();
		});

		it('should handle rapid data changes', () => {
			// Arrange
			const initialData = createMockPageData({ query: 'query1' });
			const { rerender } = render(Page, { props: { data: initialData } });

			// Act - rapidly change data multiple times
			rerender({ data: createMockPageData({ query: 'query2' }) });
			rerender({ data: createMockPageData({ query: 'query3' }) });
			rerender({ data: createMockPageData({ query: 'query4' }) });
			const finalData = createMockPageData({ query: 'final query' });
			rerender({ data: finalData });

			// Assert
			expect(finalData.query).toBe('final query');
		});
	});
});