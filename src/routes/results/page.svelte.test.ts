import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';
import type { PageData } from './$types';
import type { SearchResultConfig } from '$lib/adapters/types';

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

	const mockChannelResult: SearchResultConfig = {
		type: 'channel',
		id: 'channel-1',
		name: 'Test Channel',
		avatar: 'https://example.com/avatar.jpg',
		description: 'A test channel',
		subscriberCount: 1000000,
		verified: true
	};

	const mockPlaylistResult: SearchResultConfig = {
		type: 'playlist',
		id: 'playlist-1',
		url: 'https://www.youtube.com/playlist?list=playlist-1',
		title: 'Test Playlist',
		thumbnail: 'https://example.com/thumb.jpg',
		uploaderName: 'Test Uploader',
		uploaderUrl: 'https://www.youtube.com/channel/test',
		videoCount: 12
	};

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

	describe('Search query header', () => {
		it('should render a semantic H1 with correct classes when a query is present', () => {
			const data = createMockPageData({ query: 'test search' });
			render(Page, { props: { data } });

			const header = screen.getByText(/Search Results for "test search"/);
			expect(header.tagName).toBe('H1');
		});

		it('should not render a header when query is empty', () => {
			const data = createMockPageData({ query: '' });
			render(Page, { props: { data } });

			expect(screen.queryByText(/Search Results for/)).toBeNull();
		});

		it.each([
			{ name: 'special characters', query: 'test & special <chars>' },
			{ name: 'a very long string', query: 'a'.repeat(200) }
		])('should render header text correctly for a query containing $name', ({ query }) => {
			const data = createMockPageData({ query });
			render(Page, { props: { data } });

			expect(screen.getByText(new RegExp(`Search Results for "${query}"`))).toBeTruthy();
		});
	});

	it('should show the error card, hide results, and still show the query header on error', () => {
		const data = createMockPageData({
			error: 'Network error occurred',
			query: 'test query',
			results: mockSearchResults
		});
		const { container } = render(Page, { props: { data } });

		expect(screen.getByText('Search Error')).toBeTruthy();
		expect(screen.getByText('Network error occurred')).toBeTruthy();
		expect(screen.getByText('Please try again later.')).toBeTruthy();
		expect(screen.getByText(/Search Results for "test query"/)).toBeTruthy();

		const errorContainer = container.querySelector('div.bg-accent\\/10');
		expect(errorContainer).toHaveClass(
			'rounded-lg',
			'border',
			'border-accent/20',
			'p-8',
			'text-center'
		);
		expect(screen.getByText('Network error occurred')).toHaveClass('text-sm', 'text-secondary');

		expect(container.querySelector('.space-y-4')).toBeNull();
	});

	it('should show the empty-query prompt and hide results when query is empty', () => {
		const data = createMockPageData({ query: '', results: [] });
		const { container } = render(Page, { props: { data } });

		const message = screen.getByText('Enter a search query to find videos');
		expect(message).toHaveClass('text-sm', 'text-secondary');
		expect(screen.queryByText(/No results found/)).toBeNull();
		expect(container.querySelector('.space-y-4')).toBeNull();
	});

	it('should show the no-results message and hide the results list when a query has no matches', () => {
		const data = createMockPageData({ query: 'nonexistent query', results: [] });
		const { container } = render(Page, { props: { data } });

		expect(screen.getByText(/No results found for "nonexistent query"/)).toBeTruthy();
		expect(screen.getByText('Try different keywords or check your spelling')).toBeTruthy();
		expect(screen.queryByText('Enter a search query')).toBeNull();

		const noResultsContainer = container.querySelector('div.rounded-lg.border.text-center');
		expect(noResultsContainer?.className).toContain('bg-secondary');
		expect(container.querySelector('.space-y-4')).toBeNull();
	});

	it.each([
		{ name: 'multiple results exist', results: mockSearchResults, expectPresent: true },
		{ name: 'results array is empty', results: [], expectPresent: false },
		{
			name: 'results is null',
			results: null as unknown as SearchResultConfig[],
			expectPresent: false
		},
		{
			name: 'results is undefined',
			results: undefined as unknown as SearchResultConfig[],
			expectPresent: false
		}
	])('should show/hide the results list correctly when $name', ({ results, expectPresent }) => {
		const data = createMockPageData({ results });
		const { container } = render(Page, { props: { data } });

		const resultsContainer = container.querySelector('div.space-y-4');
		if (expectPresent) {
			expect(resultsContainer).toBeTruthy();
		} else {
			expect(resultsContainer).toBeNull();
		}
	});

	it.each([
		{
			name: 'a single stream result',
			results: [mockSearchResults[0]],
			expectedText: 'Showing 1 result'
		},
		{ name: 'three stream results', results: mockSearchResults, expectedText: 'Showing 3 results' },
		{
			name: 'a mixed-type result list',
			results: [mockSearchResults[0], mockChannelResult, mockPlaylistResult],
			expectedText: 'Showing 3 results'
		},
		{
			name: 'a single playlist result',
			results: [mockPlaylistResult],
			expectedText: 'Showing 1 result'
		},
		{
			name: 'a large results array',
			results: Array.from({ length: 50 }, (_, i) => ({
				...mockSearchResults[0],
				id: `video-${i}`,
				title: `Video ${i}`
			})),
			expectedText: 'Showing 50 results'
		}
	])('should display the correct pluralised count for $name', ({ results, expectedText }) => {
		const data = createMockPageData({ results });
		const { container } = render(Page, { props: { data } });

		const countEl = screen.getByText(expectedText);
		expect(countEl).toHaveClass('text-sm', 'text-secondary');
		expect(container.querySelector('div.mt-8.text-center')).toBeTruthy();
	});

	it.each([
		{
			name: 'error over results',
			data: { error: 'Test error', results: mockSearchResults },
			expectText: 'Test error',
			notText: 'Showing 3 results'
		},
		{
			name: 'empty-query prompt over no-results message',
			data: { query: '', results: [] },
			expectText: 'Enter a search query to find videos',
			notText: 'No results found'
		},
		{
			name: 'no-results message over empty-query prompt',
			data: { query: 'test', results: [] },
			expectText: 'No results found for "test"',
			notText: 'Enter a search query'
		}
	])('should prioritise $name', ({ data: overrides, expectText, notText }) => {
		const data = createMockPageData(overrides);
		render(Page, { props: { data } });

		expect(screen.getByText(new RegExp(expectText))).toBeTruthy();
		expect(screen.queryByText(new RegExp(notText))).toBeNull();
	});

	describe('Result type routing', () => {
		it.each([
			{ name: 'stream', results: [mockSearchResults[0]], expectedText: 'First Video Title' },
			{ name: 'channel', results: [mockChannelResult], expectedText: 'Test Channel' },
			{ name: 'playlist', results: [mockPlaylistResult], expectedText: 'Test Playlist' }
		])('should route $name results to the correct child component', ({ results, expectedText }) => {
			const data = createMockPageData({ results });
			render(Page, { props: { data } });

			expect(screen.getAllByText(expectedText).length).toBeGreaterThan(0);
		});

		it('should render playlist-specific label and video count badge', () => {
			const data = createMockPageData({ results: [mockPlaylistResult] });
			render(Page, { props: { data } });

			expect(screen.getAllByText('Playlist').length).toBeGreaterThanOrEqual(1);
			expect(screen.getAllByText('12 videos').length).toBeGreaterThanOrEqual(1);
		});

		it('should render one child component per result in a mixed-type list, in order', () => {
			const data = createMockPageData({
				results: [mockSearchResults[0], mockChannelResult, mockPlaylistResult]
			});
			const { container } = render(Page, { props: { data } });

			const resultsContainer = container.querySelector('.space-y-4');
			expect(resultsContainer?.children.length).toBe(3);
			expect(screen.getAllByText('First Video Title').length).toBeGreaterThan(0);
			expect(screen.getAllByText('Test Channel').length).toBeGreaterThan(0);
			expect(screen.getAllByText('Test Playlist').length).toBeGreaterThan(0);
		});
	});
});
