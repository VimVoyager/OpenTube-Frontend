import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ChannelVideos from './ChannelVideos.svelte';
import type { ChannelVideoConfig } from '$lib/adapters/types';
import channelVideosFixture from '../../../tests/fixtures/adapters/channelVideos.json';

// Mock the formatters module
vi.mock('$lib/utils/formatters', () => ({
	formatCount: (count: number) => new Intl.NumberFormat('en-US').format(count),
	formatDuration: (seconds: number) => {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${String(s).padStart(2, '0')}`;
	}
}));

const videos = channelVideosFixture as ChannelVideoConfig[];

// [0] Fitting In at School       — 210s (3:30), 3,984,544 views, 2 weeks ago
// [1] Digital Circus Ep 9 Finale — 70s  (1:10), 28,449,488 views, 4 weeks ago
// [2] Caine's Requiem             — 159s (2:39), 15,866,216 views, 1 month ago
const [fittingIn, digitalCircus, cainesRequiem] = videos;

describe('ChannelVideos', () => {
	describe('Empty state', () => {
		it('should render the empty state when videos array is empty', () => {
			render(ChannelVideos, { props: { videos: [] } });

			expect(screen.getByText('No videos available')).toBeTruthy();
		});

		it('should not render the video grid when videos array is empty', () => {
			const { container } = render(ChannelVideos, { props: { videos: [] } });

			const grid = container.querySelector('.grid');
			expect(grid).toBeNull();
		});
	});

	describe('Rendering with real data', () => {
		it('should render a card for every video in the list', () => {
			render(ChannelVideos, { props: { videos } });

			// Each card is an <a> linking to /video/:id
			const cards = screen.getAllByRole('link');
			expect(cards).toHaveLength(videos.length);
		});

		it('should render each video title', () => {
			render(ChannelVideos, { props: { videos } });

			expect(screen.getByText('Fitting In at School')).toBeTruthy();
			expect(screen.getByText('Digital Circus Ep 9 Finale [TRAILER]')).toBeTruthy();
			expect(screen.getByText("Caine's Requiem")).toBeTruthy();
		});

		it('should render each video thumbnail with correct src and alt', () => {
			render(ChannelVideos, { props: { videos } });

			const thumbnail = screen.getByAltText('Fitting In at School');
			expect(thumbnail.getAttribute('src')).toBe(
				'https://i.ytimg.com/vi/Qsmfc2BI9z8/hqdefault.jpg'
			);
		});

		it('should link each card to the correct video route', () => {
			render(ChannelVideos, { props: { videos } });

			const links = screen.getAllByRole('link');
			expect(links[0].getAttribute('href')).toBe('/video/glitch-video-1');
			expect(links[1].getAttribute('href')).toBe('/video/glitch-video-2');
			expect(links[2].getAttribute('href')).toBe('/video/glitch-video-3');
		});

		it('should render formatted view counts for all videos', () => {
			render(ChannelVideos, { props: { videos } });

			expect(screen.getByText('3,984,544 views')).toBeTruthy();
			expect(screen.getByText('28,449,488 views')).toBeTruthy();
			expect(screen.getByText('15,866,216 views')).toBeTruthy();
		});

		it('should render upload dates for all videos', () => {
			render(ChannelVideos, { props: { videos } });

			expect(screen.getByText('2 weeks ago')).toBeTruthy();
			expect(screen.getByText('4 weeks ago')).toBeTruthy();
			expect(screen.getByText('1 month ago')).toBeTruthy();
		});

		it('should render formatted duration overlays for all videos', () => {
			render(ChannelVideos, { props: { videos } });

			// 210s → 3:30, 70s → 1:10, 159s → 2:39
			expect(screen.getByText('3:30')).toBeTruthy();
			expect(screen.getByText('1:10')).toBeTruthy();
			expect(screen.getByText('2:39')).toBeTruthy();
		});
	});

	describe('Edge cases', () => {
		it('should not render duration overlay when duration is 0', () => {
			const noDuration: ChannelVideoConfig = { ...fittingIn, id: 'no-dur', duration: 0 };
			const { container } = render(ChannelVideos, { props: { videos: [noDuration] } });

			// Duration badge sits inside .absolute.bottom-1.right-1
			const badge = container.querySelector('.absolute.bottom-1.right-1');
			expect(badge).toBeNull();
		});

		it('should not render view count when viewCount is 0', () => {
			const noViews: ChannelVideoConfig = { ...fittingIn, id: 'no-views', viewCount: 0 };
			render(ChannelVideos, { props: { videos: [noViews] } });

			const viewCount = screen.queryByText(/views/);
			expect(viewCount).toBeNull();
		});

		it('should not render separator dot when viewCount is 0 but uploadedDate is present', () => {
			const noViews: ChannelVideoConfig = { ...fittingIn, id: 'no-views-dot', viewCount: 0 };
			const { container } = render(ChannelVideos, { props: { videos: [noViews] } });

			// The separator dot is only rendered when viewCount > 0 AND uploadedDate is present
			const dots = container.querySelectorAll('.text-muted');
			expect(dots).toHaveLength(0);
		});

		it('should not render uploadedDate when it is an empty string', () => {
			const noDate: ChannelVideoConfig = { ...fittingIn, id: 'no-date', uploadedDate: '' };
			render(ChannelVideos, { props: { videos: [noDate] } });

			const date = screen.queryByText('2 weeks ago');
			expect(date).toBeNull();
		});

		it('should render a single video correctly', () => {
			render(ChannelVideos, { props: { videos: [cainesRequiem] } });

			expect(screen.getByText("Caine's Requiem")).toBeTruthy();
			expect(screen.getAllByRole('link')).toHaveLength(1);
		});
	});

	describe('Styling and layout', () => {
		it('should render the responsive grid container', () => {
			const { container } = render(ChannelVideos, { props: { videos } });

			const grid = container.querySelector(
				'.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3.xl\\:grid-cols-4'
			);
			expect(grid).toBeTruthy();
		});

		it('should apply group-hover class to each card link', () => {
			const { container } = render(ChannelVideos, { props: { videos } });

			const cards = container.querySelectorAll('a.group');
			expect(cards).toHaveLength(videos.length);
		});

		it('should apply line-clamp-2 to video titles', () => {
			const { container } = render(ChannelVideos, { props: { videos } });

			const titles = container.querySelectorAll('h3.line-clamp-2');
			expect(titles).toHaveLength(videos.length);
		});

		it('should apply 16/9 aspect ratio to thumbnail container', () => {
			const { container } = render(ChannelVideos, { props: { videos } });

			const thumbnailWrappers = container.querySelectorAll('[style*="aspect-ratio: 16/9"]');
			expect(thumbnailWrappers).toHaveLength(videos.length);
		});
	});
});
