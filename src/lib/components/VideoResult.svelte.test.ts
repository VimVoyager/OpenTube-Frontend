import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import VideoResult from './VideoResult.svelte';
import type { SearchResultConfig } from '$lib/adapters/types';

// Mock the formatters module
vi.mock('$lib/utils/formatters', () => ({
	formatCount: (count: number) => new Intl.NumberFormat('en-US').format(count),
	formatDate: (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
}));

// Mock asset imports
vi.mock('$lib/assets/thumbnail-placeholder.jpg', () => ({
	default: '/placeholder-thumbnail.jpg'
}));

vi.mock('$lib/assets/logo-placeholder.svg', () => ({
	default: '/placeholder-avatar.svg'
}));

describe('VideoResult', () => {
	const mockSearchResult: SearchResultConfig = {
		id: 'test-video-id',
		url: '/watch?v=test-video-id',
		title: 'Test Video Title',
		thumbnail: 'https://example.com/thumbnail.jpg',
		channelName: 'Test Channel',
		channelUrl: '/channel/test-channel',
		channelAvatar: 'https://example.com/avatar.jpg',
		verified: true,
		viewCount: 1234567,
		duration: 300,
		uploadDate: '2023-05-15',
		description: 'This is a test video description that should be displayed.',
		type: 'stream'
	};

	describe('Rendering with real data', () => {
		it('should render video title from result prop', () => {
			render(VideoResult, { props: { result: mockSearchResult } });

			const title = screen.getByText('Test Video Title');
			expect(title).toBeTruthy();
		});

		it('should render video thumbnail from result prop', () => {
			render(VideoResult, { props: { result: mockSearchResult } });

			const thumbnail = screen.getByAltText('Thumbnail for Test Video Title');
			expect(thumbnail).toBeTruthy();
			expect(thumbnail.getAttribute('src')).toBe('https://example.com/thumbnail.jpg');
		});

		it('should render channel name from result prop', () => {
			render(VideoResult, { props: { result: mockSearchResult } });

			const channelName = screen.getByText('Test Channel', { exact: false });
			expect(channelName).toBeTruthy();
		});

		it('should render channel avatar from result prop', () => {
			render(VideoResult, { props: { result: mockSearchResult } });

			const avatar = screen.getByAltText('Test Channel');
			expect(avatar).toBeTruthy();
			expect(avatar.getAttribute('src')).toBe('https://example.com/avatar.jpg');
		});

		it('should render description from result prop', () => {
			render(VideoResult, { props: { result: mockSearchResult } });

			const description = screen.getByText(
				'This is a test video description that should be displayed.'
			);
			expect(description).toBeTruthy();
		});

		it('should render formatted view count using formatCount', () => {
			render(VideoResult, { props: { result: mockSearchResult } });

			const viewCount = screen.getByText('1,234,567 views', { exact: false });
			expect(viewCount).toBeTruthy();
		});

		it('should render formatted upload date using formatDate', () => {
			render(VideoResult, { props: { result: mockSearchResult } });

			const uploadDate = screen.getByText('May 15, 2023', { exact: false });
			expect(uploadDate).toBeTruthy();
		});

		it('should display verification checkmark for verified channels', () => {
			render(VideoResult, { props: { result: mockSearchResult } });

			const checkmark = screen.getByTitle('Verified');
			expect(checkmark).toBeTruthy();
			expect(checkmark.textContent).toBe('✓');
		});

		it('should not display verification checkmark for unverified channels', () => {
			const unverifiedResult = { ...mockSearchResult, verified: false };

			render(VideoResult, { props: { result: unverifiedResult } });

			const checkmark = screen.queryByTitle('Verified');
			expect(checkmark).toBeNull();
		});
	});

	describe('Fallback to placeholders', () => {
		it('should use placeholder thumbnail when thumbnail is empty', () => {
			const resultWithoutThumbnail = { ...mockSearchResult, thumbnail: '' };

			render(VideoResult, { props: { result: resultWithoutThumbnail } });

			const thumbnail = screen.getByAltText('Thumbnail for Test Video Title');
			expect(thumbnail.getAttribute('src')).toBe('/placeholder-thumbnail.jpg');
		});

		it('should use placeholder avatar when channelAvatar is empty', () => {
			const resultWithoutAvatar = { ...mockSearchResult, channelAvatar: '' };

			render(VideoResult, { props: { result: resultWithoutAvatar } });

			const avatar = screen.getByAltText('Test Channel');
			expect(avatar.getAttribute('src')).toBe('/placeholder-avatar.svg');
		});
	});

	describe('Edge cases', () => {
		it('should handle zero view count', () => {
			const resultWithZeroViews = { ...mockSearchResult, viewCount: 0 };

			render(VideoResult, { props: { result: resultWithZeroViews } });

			const viewCount = screen.getByText('0 views', { exact: false });
			expect(viewCount).toBeTruthy();
		});

		it('should handle empty description', () => {
			const resultWithEmptyDescription = { ...mockSearchResult, description: '' };

			const { container } = render(VideoResult, { props: { result: resultWithEmptyDescription } });

			const descriptionElement = container.querySelector('p.line-clamp-3');
			expect(descriptionElement).toBeTruthy();
			expect(descriptionElement?.textContent).toBe('');
		});

		it('should handle missing upload date gracefully', () => {
			const resultWithoutDate = { ...mockSearchResult, uploadDate: '' };

			render(VideoResult, { props: { result: resultWithoutDate } });

			// Should still render the component without crashing
			const title = screen.getByText('Test Video Title');
			expect(title).toBeTruthy();
		});
	});

	describe('Styling and layout', () => {
		it('should apply hover effect class to main container', () => {
			const { container } = render(VideoResult, { props: { result: mockSearchResult } });

			const mainDiv = container.querySelector('.hover\\:bg-gray-900');
			expect(mainDiv).toBeTruthy();
		});

		it('should apply line-clamp-3 to description for truncation', () => {
			const { container } = render(VideoResult, { props: { result: mockSearchResult } });

			const description = container.querySelector('.line-clamp-3');
			expect(description).toBeTruthy();
			expect(description?.textContent).toBe(
				'This is a test video description that should be displayed.'
			);
		});

		it('should use grid layout with 1/3 and 2/3 columns', () => {
			const { container } = render(VideoResult, { props: { result: mockSearchResult } });

			const gridContainer = container.querySelector('.grid.grid-cols-3');
			expect(gridContainer).toBeTruthy();

			const leftColumn = container.querySelector('.col-span-1');
			const rightColumn = container.querySelector('.col-span-2');
			expect(leftColumn).toBeTruthy();
			expect(rightColumn).toBeTruthy();
		});
	});
});