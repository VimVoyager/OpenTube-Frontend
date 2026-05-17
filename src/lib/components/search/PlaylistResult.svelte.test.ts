import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import PlaylistResult from './PlaylistResult.svelte';
import type { PlaylistSearchResultConfig } from '$lib/adapters/types';
import searchResultFixture from '../../../tests/fixtures/adapters/searchResult.json';

// Mock asset imports
vi.mock('$lib/assets/thumbnail-placeholder.jpg', () => ({
	default: '/placeholder-thumbnail.jpg'
}));

// Mock SvelteKit navigation
const mockGoto = vi.fn();
vi.mock('$app/navigation', () => ({
	goto: (...args: unknown[]) => mockGoto(...args)
}));

// =============================================================================
// Fixtures
// =============================================================================

const playlistFixture = searchResultFixture[3] as PlaylistSearchResultConfig;

// Derived variant with no thumbnail — triggers placeholder fallback
const noThumbnailResult: PlaylistSearchResultConfig = {
	...playlistFixture,
	thumbnail: ''
};

// Derived variant with zero video count
const zeroVideosResult: PlaylistSearchResultConfig = {
	...playlistFixture,
	videoCount: 0
};

// =============================================================================
// Tests
// =============================================================================

describe('PlaylistResult', () => {
	describe('Rendering with real data', () => {
		it('should render the playlist title in both layouts', () => {
			render(PlaylistResult, { props: { result: playlistFixture } });

			const titles = screen.getAllByText('Murder Drones');
			// One in desktop layout, one in mobile layout
			expect(titles.length).toBeGreaterThanOrEqual(2);
		});

		it('should render the thumbnail with correct src and alt in both layouts', () => {
			render(PlaylistResult, { props: { result: playlistFixture } });

			const thumbnails = screen.getAllByAltText('Thumbnail for Murder Drones');
			expect(thumbnails).toHaveLength(2);
			thumbnails.forEach((thumbnail) => {
				expect(thumbnail.getAttribute('src')).toBe(
					'https://i.ytimg.com/vi/md-playlist-id/hq720.jpg'
				);
			});
		});

		it('should render the video count badge in both layouts', () => {
			render(PlaylistResult, { props: { result: playlistFixture } });

			const badges = screen.getAllByText('8 videos');
			expect(badges).toHaveLength(2);
		});

		it('should render the "Playlist" label in both layouts', () => {
			render(PlaylistResult, { props: { result: playlistFixture } });

			const labels = screen.getAllByText('Playlist');
			expect(labels).toHaveLength(2);
		});

		it('should render the uploader name in both layouts', () => {
			render(PlaylistResult, { props: { result: playlistFixture } });

			const uploaderNames = screen.getAllByText('GLITCH');
			expect(uploaderNames.length).toBeGreaterThanOrEqual(2);
		});

		it('should render the uploader as a link with the correct href in the desktop layout', () => {
			const { container } = render(PlaylistResult, { props: { result: playlistFixture } });

			const uploaderLink = container.querySelector(
				'a[href="https://www.youtube.com/channel/glitch-channel-id"]'
			);
			expect(uploaderLink).toBeTruthy();
			expect(uploaderLink?.textContent?.trim()).toBe('GLITCH');
		});
	});

	describe('Thumbnail fallback', () => {
		it('should use placeholder thumbnail when thumbnail is empty', () => {
			render(PlaylistResult, { props: { result: noThumbnailResult } });

			const thumbnails = screen.getAllByAltText('Thumbnail for Murder Drones');
			expect(thumbnails).toHaveLength(2);
			thumbnails.forEach((thumbnail) => {
				expect(thumbnail.getAttribute('src')).toBe('/placeholder-thumbnail.jpg');
			});
		});
	});

	describe('Edge cases', () => {
		it('should render zero video count correctly', () => {
			render(PlaylistResult, { props: { result: zeroVideosResult } });

			const badges = screen.getAllByText('0 videos');
			expect(badges).toHaveLength(2);
		});

		it('should render a playlist with a long title without crashing', () => {
			const longTitleResult: PlaylistSearchResultConfig = {
				...playlistFixture,
				title: 'A'.repeat(200)
			};
			render(PlaylistResult, { props: { result: longTitleResult } });

			const titles = screen.getAllByText('A'.repeat(200));
			expect(titles.length).toBeGreaterThanOrEqual(1);
		});
	});

	describe('Navigation', () => {
		it('should navigate to the correct playlist URL when the desktop thumbnail button is clicked', async () => {
			mockGoto.mockClear();
			const { container } = render(PlaylistResult, { props: { result: playlistFixture } });

			const buttons = container.querySelectorAll('[role="button"]');
			await fireEvent.click(buttons[0]);

			expect(mockGoto).toHaveBeenCalledWith(
				`/video/${encodeURIComponent(playlistFixture.id)}?playlist=${encodeURIComponent(playlistFixture.id)}&index=0`
			);
		});

		it('should navigate when the desktop title button is clicked', async () => {
			mockGoto.mockClear();
			const { container } = render(PlaylistResult, { props: { result: playlistFixture } });

			const buttons = container.querySelectorAll('[role="button"]');
			await fireEvent.click(buttons[1]);

			expect(mockGoto).toHaveBeenCalledWith(
				`/video/${encodeURIComponent(playlistFixture.id)}?playlist=${encodeURIComponent(playlistFixture.id)}&index=0`
			);
		});

		it('should navigate when the mobile layout button is clicked', async () => {
			mockGoto.mockClear();
			const { container } = render(PlaylistResult, { props: { result: playlistFixture } });

			// Mobile layout is the third role="button" (index 2)
			const buttons = container.querySelectorAll('[role="button"]');
			await fireEvent.click(buttons[2]);

			expect(mockGoto).toHaveBeenCalledWith(
				`/video/${encodeURIComponent(playlistFixture.id)}?playlist=${encodeURIComponent(playlistFixture.id)}&index=0`
			);
		});

		it('should navigate when Enter is pressed on a button', async () => {
			mockGoto.mockClear();
			const { container } = render(PlaylistResult, { props: { result: playlistFixture } });

			const buttons = container.querySelectorAll('[role="button"]');
			await fireEvent.keyDown(buttons[0], { key: 'Enter' });

			expect(mockGoto).toHaveBeenCalledWith(
				`/video/${encodeURIComponent(playlistFixture.id)}?playlist=${encodeURIComponent(playlistFixture.id)}&index=0`
			);
		});

		it('should not navigate when a non-Enter key is pressed', async () => {
			mockGoto.mockClear();
			const { container } = render(PlaylistResult, { props: { result: playlistFixture } });

			const buttons = container.querySelectorAll('[role="button"]');
			await fireEvent.keyDown(buttons[0], { key: 'Space' });

			expect(mockGoto).not.toHaveBeenCalled();
		});

		it('should not navigate when the uploader link is clicked', async () => {
			mockGoto.mockClear();
			const { container } = render(PlaylistResult, { props: { result: playlistFixture } });

			const uploaderLink = container.querySelector('a');
			await fireEvent.click(uploaderLink!);

			expect(mockGoto).not.toHaveBeenCalled();
		});
	});

	describe('Styling and layout', () => {
		it('should render the desktop layout with hidden sm:grid classes', () => {
			const { container } = render(PlaylistResult, { props: { result: playlistFixture } });

			const desktopLayout = container.querySelector('.hidden.sm\\:grid');
			expect(desktopLayout).toBeTruthy();
		});

		it('should render the mobile layout with sm:hidden class', () => {
			const { container } = render(PlaylistResult, { props: { result: playlistFixture } });

			const mobileLayout = container.querySelector('.sm\\:hidden');
			expect(mobileLayout).toBeTruthy();
		});

		it('should apply hover effect class to both layout containers', () => {
			const { container } = render(PlaylistResult, { props: { result: playlistFixture } });

			const hoverDivs = container.querySelectorAll('.hover\\:bg-secondary');
			expect(hoverDivs.length).toBeGreaterThanOrEqual(2);
		});

		it('should apply grid layout with 1/3 and 2/3 columns on desktop', () => {
			const { container } = render(PlaylistResult, { props: { result: playlistFixture } });

			const gridContainer = container.querySelector('.sm\\:grid.sm\\:grid-cols-3');
			expect(gridContainer).toBeTruthy();

			const leftColumn = container.querySelector('.col-span-1');
			const rightColumn = container.querySelector('.col-span-2');
			expect(leftColumn).toBeTruthy();
			expect(rightColumn).toBeTruthy();
		});

		it('should apply line-clamp-2 to the title in the mobile layout', () => {
			const { container } = render(PlaylistResult, { props: { result: playlistFixture } });

			const clampedTitle = container.querySelector('h3.line-clamp-2');
			expect(clampedTitle).toBeTruthy();
			expect(clampedTitle?.textContent).toBe('Murder Drones');
		});

		it('should render thumbnails as relative images inside a stacked container', () => {
			const { container } = render(PlaylistResult, { props: { result: playlistFixture } });

			// The stacked effect uses .relative wrappers with absolute offset divs inside
			const stackContainers = container.querySelectorAll('.relative.w-full');
			expect(stackContainers.length).toBeGreaterThanOrEqual(2);
		});
	});
});
