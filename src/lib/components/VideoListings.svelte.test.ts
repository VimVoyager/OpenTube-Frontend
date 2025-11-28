/**
 * Test Suite: VideoListings.svelte
 * 
 * Tests for related videos listing component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writable } from 'svelte/store';
import { goto } from '$app/navigation';
import VideoListings from './VideoListings.svelte';
import type { RelatedVideoConfig } from '$lib/adapters/types';

const mockGoto = vi.mocked(goto);

// =============================================================================
// Test Fixtures
// =============================================================================

const mockRelatedVideos: RelatedVideoConfig[] = [
	{
		id: 'video-1',
		url: 'https://www.youtube.com/watch?v=video-1',
		title: 'First Related Video',
		thumbnail: 'https://example.com/thumb1.jpg',
		channelName: 'Channel One',
		channelAvatar: 'https://example.com/avatar1.jpg',
		viewCount: 1234567,
		duration: 600,
		uploadDate: '2 days ago'
	},
	{
		id: 'video-2',
		url: 'https://www.youtube.com/watch?v=video-2',
		title: 'Second Related Video',
		thumbnail: 'https://example.com/thumb2.jpg',
		channelName: 'Channel Two',
		channelAvatar: 'https://example.com/avatar2.jpg',
		viewCount: 987654,
		duration: 450,
		uploadDate: '1 week ago'
	},
	{
		id: 'video-3',
		url: 'https://www.youtube.com/watch?v=video-3',
		title: 'Third Related Video',
		thumbnail: 'https://example.com/thumb3.jpg',
		channelName: 'Channel Three',
		channelAvatar: null,
		viewCount: 500,
		duration: 3665,
		uploadDate: '3 weeks ago'
	}
];

const mockSingleVideo: RelatedVideoConfig[] = [mockRelatedVideos[0]];

const mockEmptyVideos: RelatedVideoConfig[] = [];

const mockLoadingStore = writable(false);

// =============================================================================
// Setup and Teardown
// =============================================================================

beforeEach(() => {
	vi.clearAllMocks();
	mockLoadingStore.set(false);
});

// =============================================================================
// Rendering Tests
// =============================================================================

describe('VideoListings', () => {
	describe('rendering', () => {
		it('should render multiple related videos', () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			expect(screen.getByText('First Related Video')).toBeInTheDocument();
			expect(screen.getByText('Second Related Video')).toBeInTheDocument();
			expect(screen.getByText('Third Related Video')).toBeInTheDocument();
		});

		it('should render video titles', () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			mockRelatedVideos.forEach(video => {
				expect(screen.getByText(video.title)).toBeInTheDocument();
			});
		});

		it('should render channel names', () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			expect(screen.getByText('Channel One')).toBeInTheDocument();
			expect(screen.getByText('Channel Two')).toBeInTheDocument();
			expect(screen.getByText('Channel Three')).toBeInTheDocument();
		});

		it('should render single video', () => {
			render(VideoListings, { props: { videos: mockSingleVideo } });
			
			expect(screen.getByText('First Related Video')).toBeInTheDocument();
		});

		it('should render with loading store prop', () => {
			const { container } = render(VideoListings, { 
				props: { videos: mockRelatedVideos, isLoadingStore: mockLoadingStore } 
			});
			
			expect(container).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Empty State Tests
	// =============================================================================

	describe('empty state', () => {
		it('should render empty state when no videos', () => {
			render(VideoListings, { props: { videos: mockEmptyVideos } });
			
			expect(screen.getByText(/No related [Vv]ideos available/)).toBeInTheDocument();
		});

		it('should display emoji in empty state', () => {
			render(VideoListings, { props: { videos: mockEmptyVideos } });
			
			expect(screen.getByText('📹')).toBeInTheDocument();
		});

		it('should not render video cards in empty state', () => {
			render(VideoListings, { props: { videos: mockEmptyVideos } });
			
			expect(screen.queryByText('Channel One')).not.toBeInTheDocument();
		});

		it('should render empty state with default empty array', () => {
			render(VideoListings, { props: { videos: [] } });
			
			expect(screen.getByText(/No related [Vv]ideos available/)).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Thumbnail Tests
	// =============================================================================

	describe('thumbnails', () => {
		it('should render video thumbnails', () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			const thumbnail = screen.getByAltText('First Related Video');
			expect(thumbnail).toBeInTheDocument();
			expect(thumbnail).toHaveAttribute('src', 'https://example.com/thumb1.jpg');
		});

		it('should render all thumbnails', () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			mockRelatedVideos.forEach(video => {
				const thumbnail = screen.getByAltText(video.title);
				expect(thumbnail).toBeInTheDocument();
				expect(thumbnail).toHaveAttribute('src', video.thumbnail);
			});
		});

		it('should apply correct aspect ratio to thumbnails', () => {
			const { container } = render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			const thumbnailContainer = container.querySelector('[style*="aspect-ratio"]');
			expect(thumbnailContainer).toBeInTheDocument();
		});

		it('should apply image styling classes', () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			const thumbnail = screen.getByAltText('First Related Video');
			expect(thumbnail).toHaveClass('rounded-md', 'object-cover');
		});
	});

	// =============================================================================
	// Channel Avatar Tests
	// =============================================================================

	describe('channel avatars', () => {
		it('should render channel avatar when provided', () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			const avatar = screen.getByAltText('Channel One');
			expect(avatar).toBeInTheDocument();
			expect(avatar).toHaveAttribute('src', 'https://example.com/avatar1.jpg');
		});

		it('should not render avatar when null', () => {
			render(VideoListings, { props: { videos: [mockRelatedVideos[2]] } });
			
			const avatar = screen.queryByAltText('Channel Three');
			expect(avatar).not.toBeInTheDocument();
		});

		it('should apply avatar styling', () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			const avatar = screen.getByAltText('Channel One');
			expect(avatar).toHaveClass('h-6', 'w-6', 'rounded-full', 'object-cover');
		});
	});

	// =============================================================================
	// Duration Formatting Tests
	// =============================================================================

	describe('duration formatting', () => {
		it('should format duration under 1 hour as MM:SS', () => {
			render(VideoListings, { props: { videos: [mockRelatedVideos[0]] } });
			
			// 600 seconds = 10:00
			expect(screen.getByText('10:00')).toBeInTheDocument();
		});

		it('should format duration over 1 hour as HH:MM:SS', () => {
			render(VideoListings, { props: { videos: [mockRelatedVideos[2]] } });
			
			// 3665 seconds = 1:01:05
			expect(screen.getByText('1:01:05')).toBeInTheDocument();
		});

		it('should pad single digit seconds', () => {
			const videoWithPadding = [{
				...mockRelatedVideos[0],
				duration: 65 // 1:05
			}];
			render(VideoListings, { props: { videos: videoWithPadding } });
			
			expect(screen.getByText('1:05')).toBeInTheDocument();
		});

		it('should handle zero duration', () => {
			const videoWithZeroDuration = [{
				...mockRelatedVideos[0],
				duration: 0
			}];
			render(VideoListings, { props: { videos: videoWithZeroDuration } });
			
			// Should not render duration badge for zero duration
			expect(screen.queryByText('0:00')).not.toBeInTheDocument();
		});

		it('should display duration badge on thumbnail', () => {
			const { container } = render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			const durationBadge = container.querySelector('.absolute.bottom-1.right-1');
			expect(durationBadge).toBeInTheDocument();
		});
	});

	// =============================================================================
	// View Count Formatting Tests
	// =============================================================================

	describe('view count formatting', () => {
		it('should format view count with commas', () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			expect(screen.getByText('1,234,567 views')).toBeInTheDocument();
			expect(screen.getByText('987,654 views')).toBeInTheDocument();
		});

		it('should format small numbers without commas', () => {
			render(VideoListings, { props: { videos: [mockRelatedVideos[2]] } });
			
			expect(screen.getByText('500 views')).toBeInTheDocument();
		});

		it('should include "views" text', () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			const viewsElements = screen.getAllByText(/views$/);
			expect(viewsElements.length).toBeGreaterThan(0);
		});

		it('should handle zero views', () => {
			const videoWithZeroViews = [{
				...mockRelatedVideos[0],
				viewCount: 0
			}];
			render(VideoListings, { props: { videos: videoWithZeroViews } });
			
			expect(screen.getByText('0 views')).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Upload Date Tests
	// =============================================================================

	describe('upload dates', () => {
		it('should render upload date', () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			expect(screen.getByText('2 days ago')).toBeInTheDocument();
			expect(screen.getByText('1 week ago')).toBeInTheDocument();
			expect(screen.getByText('3 weeks ago')).toBeInTheDocument();
		});

		it('should handle empty upload date', () => {
			const videoWithoutDate = [{
				...mockRelatedVideos[0],
				uploadDate: ''
			}];
			const { container } = render(VideoListings, { props: { videos: videoWithoutDate } });
			
			// Should still render without date
			expect(container).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Navigation Tests
	// =============================================================================

	describe('navigation', () => {
		it('should call goto when video is clicked', async () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			const videoCard = screen.getByText('First Related Video').closest('[role="button"]');
			await fireEvent.click(videoCard!);
			
			expect(mockGoto).toHaveBeenCalledWith('/video/video-1');
		});

		it('should navigate to correct video ID', async () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			const secondVideoCard = screen.getByText('Second Related Video').closest('[role="button"]');
			await fireEvent.click(secondVideoCard!);
			
			expect(mockGoto).toHaveBeenCalledWith('/video/video-2');
		});

		it('should handle keyboard navigation with Enter key', async () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			const videoCard = screen.getByText('First Related Video').closest('[role="button"]');
			await fireEvent.keyDown(videoCard!, { key: 'Enter' });
			
			expect(mockGoto).toHaveBeenCalledWith('/video/video-1');
		});

		it('should not navigate on other key presses', async () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			const videoCard = screen.getByText('First Related Video').closest('[role="button"]');
			await fireEvent.keyDown(videoCard!, { key: 'Space' });
			
			expect(mockGoto).not.toHaveBeenCalled();
		});

		it('should handle navigation without loading store', async () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			const videoCard = screen.getByText('First Related Video').closest('[role="button"]');
			await fireEvent.click(videoCard!);
			
			// Should not crash when isLoadingStore is undefined
			expect(mockGoto).toHaveBeenCalledWith('/video/video-1');
		});
	});

	// =============================================================================
	// Accessibility Tests
	// =============================================================================

	describe('accessibility', () => {
		it('should have role="button" on video cards', () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			const buttons = screen.getAllByRole('button');
			expect(buttons.length).toBe(mockRelatedVideos.length);
		});

		it('should have tabindex="0" on video cards', () => {
			const { container } = render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			const videoCards = container.querySelectorAll('[role="button"]');
			videoCards.forEach(card => {
				expect(card).toHaveAttribute('tabindex', '0');
			});
		});

		it('should have alt text for thumbnails', () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			mockRelatedVideos.forEach(video => {
				const thumbnail = screen.getByAltText(video.title);
				expect(thumbnail).toBeInTheDocument();
			});
		});

		it('should have alt text for channel avatars', () => {
			render(VideoListings, { props: { videos: [mockRelatedVideos[0]] } });
			
			const avatar = screen.getByAltText('Channel One');
			expect(avatar).toBeInTheDocument();
		});

		it('should have cursor pointer on video cards', () => {
			const { container } = render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			const videoCards = container.querySelectorAll('[role="button"]');
			videoCards.forEach(card => {
				expect(card).toHaveClass('cursor-pointer');
			});
		});
	});

	// =============================================================================
	// Styling Tests
	// =============================================================================

	describe('styling', () => {
		it('should apply hover styles', () => {
			const { container } = render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			const videoCard = container.querySelector('[role="button"]');
			expect(videoCard).toHaveClass('hover:bg-gray-100', 'dark:hover:bg-gray-800');
		});

		it('should apply transition classes', () => {
			const { container } = render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			const videoCard = container.querySelector('[role="button"]');
			expect(videoCard).toHaveClass('transition-colors');
		});

		it('should apply rounded corners', () => {
			const { container } = render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			const videoCard = container.querySelector('[role="button"]');
			expect(videoCard).toHaveClass('rounded-lg');
		});

		it('should have proper text truncation for titles', () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			const titleElement = screen.getByText('First Related Video');
			expect(titleElement).toHaveClass('line-clamp-2');
		});
	});

	// =============================================================================
	// Edge Cases Tests
	// =============================================================================

	describe('edge cases', () => {
		it('should handle very long titles', () => {
			const longTitleVideo = [{
				...mockRelatedVideos[0],
				title: 'A'.repeat(200)
			}];
			render(VideoListings, { props: { videos: longTitleVideo } });
			
			expect(screen.getByText('A'.repeat(200))).toBeInTheDocument();
		});

		it('should handle special characters in titles', () => {
			const specialCharVideo = [{
				...mockRelatedVideos[0],
				title: 'Video with "quotes" & <special> chars'
			}];
			render(VideoListings, { props: { videos: specialCharVideo } });
			
			expect(screen.getByText('Video with "quotes" & <special> chars')).toBeInTheDocument();
		});

		it('should handle very large view counts', () => {
			const largeViewsVideo = [{
				...mockRelatedVideos[0],
				viewCount: 999999999999
			}];
			render(VideoListings, { props: { videos: largeViewsVideo } });
			
			expect(screen.getByText(/999,999,999,999 views/)).toBeInTheDocument();
		});

		it('should handle very long durations', () => {
			const longDurationVideo = [{
				...mockRelatedVideos[0],
				duration: 36000 // 10 hours
			}];
			render(VideoListings, { props: { videos: longDurationVideo } });
			
			expect(screen.getByText('10:00:00')).toBeInTheDocument();
		});

		it('should handle missing thumbnail', () => {
			const noThumbnailVideo = [{
				...mockRelatedVideos[0],
				thumbnail: ''
			}];
			const { container } = render(VideoListings, { props: { videos: noThumbnailVideo } });
			
			expect(container).toBeInTheDocument();
		});

		it('should handle missing channel name', () => {
			const noChannelVideo = [{
				...mockRelatedVideos[0],
				channelName: ''
			}];
			const { container } = render(VideoListings, { props: { videos: noChannelVideo } });
			
			// Should still render without crashing
			expect(container).toBeTruthy();
			// Check that the paragraph exists but is empty
			const channelParagraph = container.querySelector('p.text-xs.text-gray-600');
			expect(channelParagraph).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Integration Tests
	// =============================================================================

	describe('integration', () => {
		it('should render complete video card', () => {
			render(VideoListings, { props: { videos: [mockRelatedVideos[0]] } });
			
			// Title
			expect(screen.getByText('First Related Video')).toBeInTheDocument();
			
			// Thumbnail
			expect(screen.getByAltText('First Related Video')).toBeInTheDocument();
			
			// Channel info
			expect(screen.getByText('Channel One')).toBeInTheDocument();
			expect(screen.getByAltText('Channel One')).toBeInTheDocument();
			
			// Stats
			expect(screen.getByText('1,234,567 views')).toBeInTheDocument();
			expect(screen.getByText('2 days ago')).toBeInTheDocument();
			
			// Duration
			expect(screen.getByText('10:00')).toBeInTheDocument();
		});

		it('should handle props update', async () => {
			const { unmount } = render(VideoListings, { props: { videos: mockSingleVideo } });
			
			expect(screen.getByText('First Related Video')).toBeInTheDocument();
			expect(screen.queryByText('Second Related Video')).not.toBeInTheDocument();
			
			// Unmount and remount with new props (Svelte 5 approach)
			unmount();
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			await waitFor(() => {
				expect(screen.getByText('Second Related Video')).toBeInTheDocument();
				expect(screen.getByText('Third Related Video')).toBeInTheDocument();
			});
		});

		it('should handle switching from empty to populated', async () => {
			const { unmount } = render(VideoListings, { props: { videos: mockEmptyVideos } });
			
			expect(screen.getByText(/No related [Vv]ideos available/)).toBeInTheDocument();
			
			// Unmount and remount with new props (Svelte 5 approach)
			unmount();
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			await waitFor(() => {
				expect(screen.queryByText(/No related [Vv]ideos available/)).not.toBeInTheDocument();
				expect(screen.getByText('First Related Video')).toBeInTheDocument();
			});
		});

		it('should handle switching from populated to empty', async () => {
			const { unmount } = render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			expect(screen.getByText('First Related Video')).toBeInTheDocument();
			
			// Unmount and remount with new props (Svelte 5 approach)
			unmount();
			render(VideoListings, { props: { videos: mockEmptyVideos } });
			
			await waitFor(() => {
				expect(screen.queryByText('First Related Video')).not.toBeInTheDocument();
				expect(screen.getByText(/No related [Vv]ideos available/)).toBeInTheDocument();
			});
		});
	});
});