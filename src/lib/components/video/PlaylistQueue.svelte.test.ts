/**
 * Test Suite: PlaylistQueue.svelte
 *
 * Tests for playlist queue sidebar component including header rendering,
 * active item highlighting, navigation links, and scroll-into-view behaviour
 */

import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlaylistQueue from './PlaylistQueue.svelte';
import type { RelatedVideoConfig } from '$lib/adapters/types';

// =============================================================================
// Test Fixtures
// =============================================================================

const mockQueueVideos: RelatedVideoConfig[] = [
	{
		id: 'video-one-id',
		url: 'https://www.youtube.com/watch?v=video-one-id',
		title: 'First Queue Video',
		thumbnail: 'https://example.com/thumb-one.jpg',
		channelName: 'Channel One',
		channelId: 'UCchannel1',
		channelAvatar: 'https://example.com/avatar-one.jpg',
		duration: 120, // 2:00
		viewCount: 1000,
		uploadDate: '1 week ago'
	},
	{
		id: 'video-two-id',
		url: 'https://www.youtube.com/watch?v=video-two-id',
		title: 'Second Queue Video',
		thumbnail: 'https://example.com/thumb-two.jpg',
		channelName: 'Channel Two',
		channelId: 'UCchannel2',
		channelAvatar: 'https://example.com/avatar-two.jpg',
		duration: 65, // 1:05
		viewCount: 5000,
		uploadDate: '2 weeks ago'
	},
	{
		id: 'video-three-id',
		url: 'https://www.youtube.com/watch?v=video-three-id',
		title: 'Third Queue Video',
		thumbnail: 'https://example.com/thumb-three.jpg',
		channelName: 'Channel Three',
		channelId: 'UCchannel3',
		channelAvatar: 'https://example.com/avatar-three.jpg',
		duration: 3661, // 1:01:01
		viewCount: 250,
		uploadDate: '1 month ago'
	},
	{
		id: 'video-four-id',
		url: 'https://www.youtube.com/watch?v=video-four-id',
		title: 'Fourth Queue Video',
		thumbnail: 'https://example.com/thumb-four.jpg',
		channelName: 'Channel Four',
		channelId: 'UCchannel4',
		channelAvatar: 'https://example.com/avatar-four.jpg',
		duration: 0, // Live / unknown duration
		viewCount: 0,
		uploadDate: '2 months ago'
	}
];

const mockSingleVideo: RelatedVideoConfig[] = [mockQueueVideos[0]];
const mockEmptyVideos: RelatedVideoConfig[] = [];

const defaultProps = {
	videos: mockQueueVideos,
	playlistId: 'PLtest123',
	currentIndex: 0,
	playlistName: 'Test Playlist'
};

// =============================================================================
// Setup and Teardown
// =============================================================================

let scrollIntoViewMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	vi.clearAllMocks();

	// jsdom does not implement scrollIntoView; the scrollActiveIntoView action
	// calls it on the active item, so it must be stubbed for every render
	scrollIntoViewMock = vi.fn();
	Element.prototype.scrollIntoView = scrollIntoViewMock;
});

// =============================================================================
// Rendering Tests
// =============================================================================

describe('PlaylistQueue', () => {
	describe('rendering', () => {
		it('should render all queue videos', () => {
			render(PlaylistQueue, { props: defaultProps });

			expect(screen.getByText('First Queue Video')).toBeInTheDocument();
			expect(screen.getByText('Second Queue Video')).toBeInTheDocument();
			expect(screen.getByText('Third Queue Video')).toBeInTheDocument();
			expect(screen.getByText('Fourth Queue Video')).toBeInTheDocument();
		});

		it('should render channel names', () => {
			render(PlaylistQueue, { props: defaultProps });

			expect(screen.getByText('Channel One')).toBeInTheDocument();
			expect(screen.getByText('Channel Two')).toBeInTheDocument();
		});

		it('should render single video queue', () => {
			render(PlaylistQueue, {
				props: { ...defaultProps, videos: mockSingleVideo }
			});

			expect(screen.getByText('First Queue Video')).toBeInTheDocument();
		});

		it('should render one link per video', () => {
			render(PlaylistQueue, { props: defaultProps });

			const links = screen.getAllByRole('link');
			expect(links.length).toBe(mockQueueVideos.length);
		});
	});

	// =============================================================================
	// Header Tests
	// =============================================================================

	describe('header', () => {
		it('should render the playlist name', () => {
			render(PlaylistQueue, { props: defaultProps });

			expect(screen.getByText('Test Playlist')).toBeInTheDocument();
		});

		it('should fall back to default playlist name when not provided', () => {
			render(PlaylistQueue, {
				props: {
					videos: mockQueueVideos,
					playlistId: 'PLtest123',
					currentIndex: 0
				}
			});

			expect(screen.getByText('Playlist')).toBeInTheDocument();
		});

		it('should display current position as 1-indexed counter', () => {
			render(PlaylistQueue, { props: { ...defaultProps, currentIndex: 0 } });

			expect(screen.getByText('1 / 4')).toBeInTheDocument();
		});

		it('should update position counter for later index', () => {
			render(PlaylistQueue, { props: { ...defaultProps, currentIndex: 2 } });

			expect(screen.getByText('3 / 4')).toBeInTheDocument();
		});

		it('should show total video count in counter', () => {
			render(PlaylistQueue, {
				props: { ...defaultProps, videos: mockSingleVideo }
			});

			expect(screen.getByText('1 / 1')).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Active Item Tests
	// =============================================================================

	describe('active item highlighting', () => {
		it('should mark the current video with aria-current', () => {
			render(PlaylistQueue, { props: { ...defaultProps, currentIndex: 1 } });

			const activeLink = screen.getByText('Second Queue Video').closest('a');
			expect(activeLink).toHaveAttribute('aria-current', 'true');
		});

		it('should mark only one item as active', () => {
			const { container } = render(PlaylistQueue, {
				props: { ...defaultProps, currentIndex: 1 }
			});

			const activeLinks = container.querySelectorAll('[aria-current="true"]');
			expect(activeLinks.length).toBe(1);
		});

		it('should not set aria-current on inactive items', () => {
			render(PlaylistQueue, { props: { ...defaultProps, currentIndex: 1 } });

			const inactiveLink = screen.getByText('First Queue Video').closest('a');
			expect(inactiveLink).not.toHaveAttribute('aria-current');
		});

		it('should apply active background class to current item', () => {
			render(PlaylistQueue, { props: { ...defaultProps, currentIndex: 0 } });

			const activeLink = screen.getByText('First Queue Video').closest('a');
			expect(activeLink).toHaveClass('bg-accent/10');
		});

		it('should render active indicator bar on current item', () => {
			const { container } = render(PlaylistQueue, {
				props: { ...defaultProps, currentIndex: 0 }
			});

			const activeBar = container.querySelector('.absolute.left-0.top-0.bottom-0');
			expect(activeBar).toBeInTheDocument();
			expect(activeBar).toHaveClass('bg-accent');
		});

		it('should render animated playing bars for active item', () => {
			render(PlaylistQueue, { props: { ...defaultProps, currentIndex: 0 } });

			const activeLink = screen.getByText('First Queue Video').closest('a');
			const playingBars = activeLink?.querySelectorAll('span.bg-accent.rounded-sm');
			expect(playingBars?.length).toBe(3);
		});

		it('should highlight active item title with accent colour', () => {
			render(PlaylistQueue, { props: { ...defaultProps, currentIndex: 2 } });

			const activeTitle = screen.getByText('Third Queue Video');
			expect(activeTitle).toHaveClass('text-accent');
		});

		it('should apply ring styling to active item thumbnail', () => {
			render(PlaylistQueue, { props: { ...defaultProps, currentIndex: 0 } });

			const activeThumbnail = screen.getByAltText('Thumbnail for First Queue Video');
			expect(activeThumbnail).toHaveClass('ring-1', 'ring-accent');
		});
	});

	// =============================================================================
	// Index Number Tests
	// =============================================================================

	describe('index numbers', () => {
		it('should display 1-indexed numbers for inactive items', () => {
			render(PlaylistQueue, { props: { ...defaultProps, currentIndex: 0 } });

			// Items 2, 3, and 4 are inactive and show their position numbers
			expect(screen.getByText('2')).toBeInTheDocument();
			expect(screen.getByText('3')).toBeInTheDocument();
			expect(screen.getByText('4')).toBeInTheDocument();
		});

		it('should not display an index number for the active item', () => {
			render(PlaylistQueue, { props: { ...defaultProps, currentIndex: 0 } });

			// Active item shows playing bars instead of "1"
			const activeLink = screen.getByText('First Queue Video').closest('a');
			expect(activeLink?.textContent).not.toContain('1');
		});

		it('should display index number when item becomes inactive', () => {
			render(PlaylistQueue, { props: { ...defaultProps, currentIndex: 1 } });

			// First item is now inactive, so "1" is shown
			const firstLink = screen.getByText('First Queue Video').closest('a');
			expect(firstLink?.textContent).toContain('1');
		});
	});

	// =============================================================================
	// Navigation Link Tests
	// =============================================================================

	describe('navigation links', () => {
		it('should link to the video with playlist and index params', () => {
			render(PlaylistQueue, { props: defaultProps });

			const firstLink = screen.getByText('First Queue Video').closest('a');
			expect(firstLink).toHaveAttribute(
				'href',
				'/video/video-one-id?playlist=PLtest123&index=0'
			);
		});

		it('should include correct index for each item', () => {
			render(PlaylistQueue, { props: defaultProps });

			const thirdLink = screen.getByText('Third Queue Video').closest('a');
			expect(thirdLink).toHaveAttribute(
				'href',
				'/video/video-three-id?playlist=PLtest123&index=2'
			);
		});

		it('should URL encode the video ID', () => {
			const specialIdVideo = [{
				...mockQueueVideos[0],
				id: 'id with spaces&chars'
			}];
			render(PlaylistQueue, {
				props: { ...defaultProps, videos: specialIdVideo }
			});

			const link = screen.getByText('First Queue Video').closest('a');
			expect(link?.getAttribute('href')).toContain(
				encodeURIComponent('id with spaces&chars')
			);
			expect(link?.getAttribute('href')).not.toContain('id with spaces');
		});

		it('should URL encode the playlist ID', () => {
			render(PlaylistQueue, {
				props: { ...defaultProps, playlistId: 'PL test&id' }
			});

			const link = screen.getByText('First Queue Video').closest('a');
			expect(link?.getAttribute('href')).toContain(
				`playlist=${encodeURIComponent('PL test&id')}`
			);
		});
	});

	// =============================================================================
	// Thumbnail Tests
	// =============================================================================

	describe('thumbnails', () => {
		it('should render all thumbnails with alt text and source', () => {
			const { container } = render(PlaylistQueue, { props: defaultProps });

			mockQueueVideos.forEach((video: RelatedVideoConfig) => {
				const thumbnail = screen.getByAltText(`Thumbnail for ${video.title}`);
				expect(thumbnail).toBeInTheDocument();
				expect(thumbnail).toHaveAttribute('src', video.thumbnail);
				expect(thumbnail).toHaveClass('rounded', 'object-cover');
			});

			const thumbnailContainer = container.querySelector('[style*="aspect-ratio"]');
			expect(thumbnailContainer).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Duration Formatting Tests
	// =============================================================================

	describe('duration formatting', () => {
		it('should format duration under 1 hour as M:SS', () => {
			render(PlaylistQueue, { props: defaultProps });

			// 120 seconds = 2:00
			expect(screen.getByText('2:00')).toBeInTheDocument();
		});

		it('should pad single digit seconds', () => {
			render(PlaylistQueue, { props: defaultProps });

			// 65 seconds = 1:05
			expect(screen.getByText('1:05')).toBeInTheDocument();
		});

		it('should format duration over 1 hour as H:MM:SS', () => {
			render(PlaylistQueue, { props: defaultProps });

			// 3661 seconds = 1:01:01
			expect(screen.getByText('1:01:01')).toBeInTheDocument();
		});

		it('should not render duration badge for zero duration', () => {
			render(PlaylistQueue, { props: defaultProps });

			// Fourth video has duration 0 — no badge rendered
			expect(screen.queryByText('0:00')).not.toBeInTheDocument();
		});

		it('should display duration badge on thumbnail', () => {
			const { container } = render(PlaylistQueue, { props: defaultProps });

			const durationBadge = container.querySelector('.absolute.bottom-1.right-1');
			expect(durationBadge).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Scroll Behaviour Tests
	// =============================================================================

	describe('scroll behaviour', () => {
		it('should scroll the active item into view on mount', async () => {
			render(PlaylistQueue, { props: { ...defaultProps, currentIndex: 2 } });

			await waitFor(() => {
				expect(scrollIntoViewMock).toHaveBeenCalledWith({ block: 'nearest' });
			});
		});

		it('should only scroll once for a single active item', async () => {
			render(PlaylistQueue, { props: { ...defaultProps, currentIndex: 1 } });

			await waitFor(() => {
				expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
			});
		});

		it('should not scroll when no item is active', async () => {
			render(PlaylistQueue, { props: { ...defaultProps, currentIndex: 99 } });

			// Give the tick().then() microtask a chance to run
			await Promise.resolve();
			await Promise.resolve();

			expect(scrollIntoViewMock).not.toHaveBeenCalled();
		});
	});

	// =============================================================================
	// Accessibility Tests
	// =============================================================================

	describe('accessibility', () => {
		it('should render items as links', () => {
			render(PlaylistQueue, { props: defaultProps });

			const links = screen.getAllByRole('link');
			expect(links.length).toBe(mockQueueVideos.length);
		});

		it('should have alt text for all thumbnails', () => {
			render(PlaylistQueue, { props: defaultProps });

			mockQueueVideos.forEach((video: RelatedVideoConfig) => {
				expect(screen.getByAltText(`Thumbnail for ${video.title}`)).toBeInTheDocument();
			});
		});

		it('should hide decorative header icon from screen readers', () => {
			const { container } = render(PlaylistQueue, { props: defaultProps });

			const headerIcon = container.querySelector('svg');
			expect(headerIcon).toHaveAttribute('aria-hidden', 'true');
		});

		it('should expose current item via aria-current', () => {
			render(PlaylistQueue, { props: { ...defaultProps, currentIndex: 0 } });

			const activeLink = screen.getByText('First Queue Video').closest('a');
			expect(activeLink).toHaveAttribute('aria-current', 'true');
		});
	});

	// =============================================================================
	// Styling Tests
	// =============================================================================

	describe('styling', () => {
		it('should apply hover styles to queue items', () => {
			render(PlaylistQueue, { props: defaultProps });

			const link = screen.getByText('First Queue Video').closest('a');
			expect(link).toHaveClass('hover:bg-secondary');
		});

		it('should apply transition classes to queue items', () => {
			render(PlaylistQueue, { props: defaultProps });

			const link = screen.getByText('First Queue Video').closest('a');
			expect(link).toHaveClass('transition-colors');
		});

		it('should have proper text truncation for titles', () => {
			render(PlaylistQueue, { props: defaultProps });

			const titleElement = screen.getByText('First Queue Video');
			expect(titleElement).toHaveClass('line-clamp-2');
		});

		it('should truncate channel names', () => {
			render(PlaylistQueue, { props: defaultProps });

			const channelElement = screen.getByText('Channel One');
			expect(channelElement).toHaveClass('truncate');
		});
	});

	// =============================================================================
	// Edge Cases Tests
	// =============================================================================

	describe('edge cases', () => {
		it('should render header with empty video list', () => {
			render(PlaylistQueue, {
				props: { ...defaultProps, videos: mockEmptyVideos }
			});

			expect(screen.getByText('Test Playlist')).toBeInTheDocument();
			expect(screen.getByText('1 / 0')).toBeInTheDocument();
			expect(screen.queryAllByRole('link').length).toBe(0);
		});

		it('should handle currentIndex out of range', () => {
			const { container } = render(PlaylistQueue, {
				props: { ...defaultProps, currentIndex: 99 }
			});

			// No item is active
			const activeLinks = container.querySelectorAll('[aria-current="true"]');
			expect(activeLinks.length).toBe(0);
			expect(screen.getByText('100 / 4')).toBeInTheDocument();
		});

		it('should handle last item as active', () => {
			render(PlaylistQueue, { props: { ...defaultProps, currentIndex: 3 } });

			const lastLink = screen.getByText('Fourth Queue Video').closest('a');
			expect(lastLink).toHaveAttribute('aria-current', 'true');
			expect(screen.getByText('4 / 4')).toBeInTheDocument();
		});

		it('should handle very long titles', () => {
			const longTitleVideo = [{
				...mockQueueVideos[0],
				title: 'A'.repeat(200)
			}];
			render(PlaylistQueue, {
				props: { ...defaultProps, videos: longTitleVideo }
			});

			expect(screen.getByText('A'.repeat(200))).toBeInTheDocument();
		});

		it('should handle special characters in titles', () => {
			const specialCharVideo = [{
				...mockQueueVideos[0],
				title: 'Video with "quotes" & <special> chars'
			}];
			render(PlaylistQueue, {
				props: { ...defaultProps, videos: specialCharVideo }
			});

			expect(screen.getByText('Video with "quotes" & <special> chars')).toBeInTheDocument();
		});

		it('should handle missing thumbnail', () => {
			const noThumbnailVideo = [{
				...mockQueueVideos[0],
				thumbnail: ''
			}];
			const { container } = render(PlaylistQueue, {
				props: { ...defaultProps, videos: noThumbnailVideo }
			});

			expect(container).toBeInTheDocument();
		});

		it('should handle missing channel name', () => {
			const noChannelVideo = [{
				...mockQueueVideos[0],
				channelName: ''
			}];
			const { container } = render(PlaylistQueue, {
				props: { ...defaultProps, videos: [noChannelVideo[0]] }
			});

			// Should still render without crashing
			expect(container).toBeTruthy();
			const channelParagraph = container.querySelector('p.text-xs.text-muted.mt-1');
			expect(channelParagraph).toBeInTheDocument();
			expect(channelParagraph?.textContent?.trim()).toBe('');
		});
	});

	// =============================================================================
	// Integration Tests
	// =============================================================================

	describe('integration', () => {
		it('should render complete queue item', () => {
			render(PlaylistQueue, {
				props: { ...defaultProps, videos: mockSingleVideo, currentIndex: 0 }
			});

			// Title
			expect(screen.getByText('First Queue Video')).toBeInTheDocument();

			// Thumbnail
			expect(screen.getByAltText('Thumbnail for First Queue Video')).toBeInTheDocument();

			// Channel info
			expect(screen.getByText('Channel One')).toBeInTheDocument();

			// Duration badge
			expect(screen.getByText('2:00')).toBeInTheDocument();

			// Header
			expect(screen.getByText('Test Playlist')).toBeInTheDocument();
			expect(screen.getByText('1 / 1')).toBeInTheDocument();
		});

		it('should move active highlight when currentIndex changes', async () => {
			const { unmount } = render(PlaylistQueue, {
				props: { ...defaultProps, currentIndex: 0 }
			});

			expect(screen.getByText('First Queue Video').closest('a'))
				.toHaveAttribute('aria-current', 'true');

			// Unmount and remount with new props (Svelte 5 approach)
			unmount();
			render(PlaylistQueue, { props: { ...defaultProps, currentIndex: 2 } });

			await waitFor(() => {
				expect(screen.getByText('Third Queue Video').closest('a'))
					.toHaveAttribute('aria-current', 'true');
				expect(screen.getByText('First Queue Video').closest('a'))
					.not.toHaveAttribute('aria-current');
			});
		});

		it('should handle switching from empty to populated', async () => {
			const { unmount } = render(PlaylistQueue, {
				props: { ...defaultProps, videos: mockEmptyVideos }
			});

			expect(screen.getByText('1 / 0')).toBeInTheDocument();

			// Unmount and remount with new props (Svelte 5 approach)
			unmount();
			render(PlaylistQueue, { props: defaultProps });

			await waitFor(() => {
				expect(screen.queryByText('1 / 0')).not.toBeInTheDocument();
				expect(screen.getByText('First Queue Video')).toBeInTheDocument();
			});
		});

		it('should handle switching from populated to empty', async () => {
			const { unmount } = render(PlaylistQueue, { props: defaultProps });

			expect(screen.getByText('First Queue Video')).toBeInTheDocument();

			// Unmount and remount with new props (Svelte 5 approach)
			unmount();
			render(PlaylistQueue, {
				props: { ...defaultProps, videos: mockEmptyVideos }
			});

			await waitFor(() => {
				expect(screen.queryByText('First Queue Video')).not.toBeInTheDocument();
				expect(screen.getByText('1 / 0')).toBeInTheDocument();
			});
		});
	});
});