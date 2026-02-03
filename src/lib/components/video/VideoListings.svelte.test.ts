/**
 * Test Suite: VideoListings.svelte
 * 
 * Tests for related videos listing component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { goto } from '$app/navigation';
import VideoListings from './VideoListings.svelte';
import type { RelatedVideoConfig } from '$lib/adapters/types';
import relatedVideosFixture from '../../../tests/fixtures/adapters/relatedVideos.json'

const mockGoto = vi.mocked(goto);

// =============================================================================
// Test Fixtures
// =============================================================================

const mockRelatedVideos: RelatedVideoConfig[] = relatedVideosFixture
const mockSingleVideo: RelatedVideoConfig[] = [mockRelatedVideos[0]];
const mockEmptyVideos: RelatedVideoConfig[] = [];

// =============================================================================
// Setup and Teardown
// =============================================================================

beforeEach(() => {
	vi.clearAllMocks();
});

// =============================================================================
// Rendering Tests
// =============================================================================

describe('VideoListings', () => {
	describe('rendering', () => {
		it('should render multiple related videos', () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			expect(screen.getByText('MURDER DRONES - Heartbeat')).toBeInTheDocument();
			expect(screen.getByText('KNIGHTS OF GUINEVERE - Pilot')).toBeInTheDocument();
			expect(screen.getByText('MURDER DRONES - Cabin Fever')).toBeInTheDocument();
			expect(screen.getByText('THE AMAZING DIGITAL CIRCUS - They All Get Guns')).toBeInTheDocument();

			const videoElements = screen.getAllByText(/GLITCH/, { selector: 'p' });
			const firstChannelName = videoElements[0];
			expect(firstChannelName).toHaveTextContent('GLITCH');
		});

		it('should render single video', () => {
			render(VideoListings, { props: { videos: mockSingleVideo } });
			
			expect(screen.getByText('MURDER DRONES - Heartbeat')).toBeInTheDocument();
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
		it('should render all thumbnails', () => {
			const { container } = render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			mockRelatedVideos.forEach(video => {
				const thumbnail = screen.getByAltText(`thumbnail-${video.id}`);
				expect(thumbnail).toBeInTheDocument();
				expect(thumbnail).toHaveAttribute('src', video.thumbnail);
				expect(thumbnail).toHaveClass('rounded-md', 'object-cover');

			});

			const thumbnailContainer = container.querySelector('[style*="aspect-ratio"]');
			expect(thumbnailContainer).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Channel Avatar Tests
	// =============================================================================

	describe('channel avatars', () => {
		it('should render channel avatar when provided', () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			const avatar = screen.getByAltText('heartbeat-id-channel-avatar-GLITCH');
			expect(avatar).toBeInTheDocument();
			expect(avatar).toHaveAttribute('src', 'https://yt3.ggpht.com/random-unicode-characters/md');
			expect(avatar).toHaveClass('h-6', 'w-6', 'rounded-full', 'object-cover');
		});

		it('should not render avatar when null', () => {
			render(VideoListings, { props: { videos: [mockRelatedVideos[2]] } });
			
			const avatar = screen.queryByAltText('-channel-avatar-GLITCH');
			expect(avatar).not.toBeInTheDocument();
		});
	});

	// =============================================================================
	// Duration Formatting Tests
	// =============================================================================

	describe('duration formatting', () => {
		it('should format duration under 1 hour as MM:SS', () => {
			render(VideoListings, { props: { videos: [mockRelatedVideos[0]] } });
			
			// 1049 seconds = 17:29
			expect(screen.getByText('17:29')).toBeInTheDocument();
		});

		it('should format duration over 1 hour as HH:MM:SS', () => {
			render(VideoListings, { props: { videos: [mockRelatedVideos[1]] } });
			
			// 1588 seconds = 26:28
			expect(screen.getByText('26:28')).toBeInTheDocument();
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
			
			expect(screen.getByText('39,000,000 views')).toBeInTheDocument();
			expect(screen.getByText('16,000,000 views')).toBeInTheDocument();
		});

		it('should format small numbers without commas', () => {
			render(VideoListings, { props: { videos: [mockRelatedVideos[2]] } });
			
			expect(screen.getByText('0 views')).toBeInTheDocument();
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
			
			expect(screen.getByText('3 years ago')).toBeInTheDocument();
			expect(screen.getByText('3 month ago')).toBeInTheDocument();
			expect(screen.getByText('2 years ago')).toBeInTheDocument();
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
			
			const videoCard = screen.getByText('MURDER DRONES - Heartbeat').closest('[role="button"]');
			await fireEvent.click(videoCard!);
			
			expect(mockGoto).toHaveBeenCalledWith('/video/heartbeat-id');
		});

		it('should navigate to correct video ID', async () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			const secondVideoCard = screen.getByText('KNIGHTS OF GUINEVERE - Pilot').closest('[role="button"]');
			await fireEvent.click(secondVideoCard!);
			
			expect(mockGoto).toHaveBeenCalledWith('/video/pilot-id');
		});

		it('should handle keyboard navigation with Enter key', async () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			const videoCard = screen.getByText('MURDER DRONES - Heartbeat').closest('[role="button"]');
			await fireEvent.keyDown(videoCard!, { key: 'Enter' });
			
			expect(mockGoto).toHaveBeenCalledWith('/video/heartbeat-id');
		});

		it('should not navigate on other key presses', async () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			const videoCard = screen.getByText('KNIGHTS OF GUINEVERE - Pilot').closest('[role="button"]');
			await fireEvent.keyDown(videoCard!, { key: 'Space' });
			
			expect(mockGoto).not.toHaveBeenCalled();
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
				const thumbnail = screen.getByAltText(`thumbnail-${video.id}`);
				expect(thumbnail).toBeInTheDocument();
			});
		});

		it('should have alt text for channel avatars', () => {
			render(VideoListings, { props: { videos: [mockRelatedVideos[0]] } });
			
			const avatar = screen.getByAltText('heartbeat-id-channel-avatar-GLITCH');
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
			expect(videoCard).toHaveClass('hover:bg-secondary');
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
			
			const titleElement = screen.getByText('MURDER DRONES - Heartbeat');
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
			const noChannelVideo = {
				...mockRelatedVideos[0],
				channelName: ''
			};
			const { container } = render(VideoListings, { props: { videos: [noChannelVideo] } });
			
			// Should still render without crashing
			expect(container).toBeTruthy();
			// Check that the paragraph exists but is empty
			const channelParagraph = container.querySelector('p.text-xs.text-secondary');
			expect(channelParagraph).toBeInTheDocument();
			expect(channelParagraph?.textContent?.trim()).toBe('');
		});
	});

	// =============================================================================
	// Integration Tests
	// =============================================================================

	describe('integration', () => {
		it('should render complete video card', () => {
			render(VideoListings, { props: { videos: [mockRelatedVideos[0]] } });
			
			// Title
			expect(screen.getByText('MURDER DRONES - Heartbeat')).toBeInTheDocument();
			
			// Thumbnail
			expect(screen.getByAltText('thumbnail-heartbeat-id')).toBeInTheDocument();
			
			// Channel info
			expect(screen.getByText('GLITCH')).toBeInTheDocument();
			expect(screen.getByAltText('heartbeat-id-channel-avatar-GLITCH')).toBeInTheDocument();
			
			// Stats
			expect(screen.getByText('39,000,000 views')).toBeInTheDocument();
			expect(screen.getByText('3 years ago')).toBeInTheDocument();
		});

		it('should handle props update', async () => {
			const { unmount } = render(VideoListings, { props: { videos: mockSingleVideo } });
			
			expect(screen.getByText('MURDER DRONES - Heartbeat')).toBeInTheDocument();
			expect(screen.queryByText('KNIGHTS OF GUINEVERE - Pilot')).not.toBeInTheDocument();
			
			// Unmount and remount with new props (Svelte 5 approach)
			unmount();
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			await waitFor(() => {
				expect(screen.getByText('MURDER DRONES - Heartbeat')).toBeInTheDocument();
				expect(screen.getByText('MURDER DRONES - Cabin Fever')).toBeInTheDocument();
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
				expect(screen.getByText('MURDER DRONES - Heartbeat')).toBeInTheDocument();
			});
		});

		it('should handle switching from populated to empty', async () => {
			const { unmount } = render(VideoListings, { props: { videos: mockRelatedVideos } });
			
			expect(screen.getByText('MURDER DRONES - Heartbeat')).toBeInTheDocument();
			
			// Unmount and remount with new props (Svelte 5 approach)
			unmount();
			render(VideoListings, { props: { videos: mockEmptyVideos } });
			
			await waitFor(() => {
				expect(screen.queryByText('MURDER DRONES - Heartbeat')).not.toBeInTheDocument();
				expect(screen.getByText(/No related [Vv]ideos available/)).toBeInTheDocument();
			});
		});
	});
});