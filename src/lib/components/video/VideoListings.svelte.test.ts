/**
 * Test Suite: VideoListings.svelte
 *
 * Tests for related videos listing component
 */

import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import VideoListings from './VideoListings.svelte';
import type { RelatedVideoConfig } from '$lib/adapters/types';
import relatedVideosFixture from '../../../tests/fixtures/adapters/relatedVideos.json';

const mockRelatedVideos: RelatedVideoConfig[] = relatedVideosFixture;
const [heartbeat] = mockRelatedVideos;

describe('VideoListings', () => {
	it('renders a card for every video', () => {
		render(VideoListings, { props: { videos: mockRelatedVideos } });
		mockRelatedVideos.forEach((v) => expect(screen.getByText(v.title)).toBeInTheDocument());
	});

	it('renders the empty state when there are no videos', () => {
		render(VideoListings, { props: { videos: [] } });

		expect(screen.getByText(/No related [Vv]ideos available/)).toBeInTheDocument();
		expect(screen.getByText('📹')).toBeInTheDocument();
		expect(screen.queryAllByRole('link')).toHaveLength(0);
	});

	it('defaults to an empty list when no videos prop is given', () => {
		render(VideoListings);
		expect(screen.getByText(/No related [Vv]ideos available/)).toBeInTheDocument();
	});

	it('renders all thumbnails with alt text and source', () => {
		render(VideoListings, { props: { videos: mockRelatedVideos } });

		mockRelatedVideos.forEach((video) => {
			expect(screen.getByAltText(`${video.title} thumbnail`)).toHaveAttribute('src', video.thumbnail);
		});
	});

	describe('channel avatars', () => {
		it('renders the avatar when provided', () => {
			render(VideoListings, { props: { videos: [heartbeat] } });

			expect(
				screen.getByAltText(`${heartbeat.id}-channel-avatar-${heartbeat.channelName}`)
			).toHaveAttribute('src', heartbeat.thumbnail && heartbeat.channelAvatar);
		});

		it('does not render an avatar when channelAvatar is empty', () => {
			render(VideoListings, {
				props: { videos: [{ ...heartbeat, channelAvatar: '' }] }
			});

			expect(
				screen.queryByAltText(`${heartbeat.id}-channel-avatar-${heartbeat.channelName}`)
			).not.toBeInTheDocument();
		});

		it('falls back to the logo placeholder when the avatar image fails to load', async () => {
			render(VideoListings, { props: { videos: [heartbeat] } });
			const avatar = screen.getByAltText(`${heartbeat.id}-channel-avatar-${heartbeat.channelName}`);

			await fireEvent.error(avatar);

			expect(avatar).toHaveAttribute('src', '/src/lib/assets/logo-placeholder.svg');
		});
	});

	describe('duration badge', () => {
		it.each([
			['under an hour', 1049, '17:29'],
			['over an hour', 36000, '10:00:00']
		])('renders %s durations (%is → %s)', (_label, duration, expected) => {
			render(VideoListings, { props: { videos: [{ ...heartbeat, duration }] } });
			expect(screen.getByText(expected)).toBeInTheDocument();
		});

		it('renders no badge for zero duration', () => {
			render(VideoListings, { props: { videos: [{ ...heartbeat, duration: 0 }] } });
			expect(screen.queryByText('0:00')).not.toBeInTheDocument();
		});
	});

	describe('stats', () => {
		it('renders locale-formatted view counts', () => {
			render(VideoListings, { props: { videos: mockRelatedVideos } });
			expect(screen.getByText('39,000,000 views')).toBeInTheDocument();
			expect(screen.getByText('16,000,000 views')).toBeInTheDocument();
		});

		it('renders the upload date with a separator', () => {
			render(VideoListings, { props: { videos: [heartbeat] } });
			expect(screen.getByText('3 years ago')).toBeInTheDocument();
			expect(screen.getByText('•')).toBeInTheDocument();
		});

		it('hides the separator and date when uploadDate is empty', () => {
			render(VideoListings, { props: { videos: [{ ...heartbeat, uploadDate: '' }] } });
			expect(screen.queryByText('•')).not.toBeInTheDocument();
			expect(screen.queryByText('3 years ago')).not.toBeInTheDocument();
		});
	});

	describe('navigation', () => {
		it('renders one overlay link per card, pointing at the video route', () => {
			const { container } = render(VideoListings, { props: { videos: mockRelatedVideos } });

			const overlayLinks = container.querySelectorAll('a[href^="/video/"]');
			expect(overlayLinks).toHaveLength(mockRelatedVideos.length * 2);
			expect(screen.getByRole('link', { name: heartbeat.title })).toHaveAttribute(
				'href',
				`/video/${heartbeat.id}`
			);
		});

		it('links the channel row to the channel page with tap preloading', () => {
			const { container } = render(VideoListings, { props: { videos: [heartbeat] } });

			const channelLink = container.querySelector('a[href^="/channel/"]');
			expect(channelLink).toHaveAttribute('href', `/channel/${heartbeat.channelId}`);
			expect(channelLink).toHaveAttribute('data-sveltekit-preload-data', 'tap');
		});

		it('keeps channel links above the card overlay link', () => {
			// the channel link must sit on a higher stacking layer than the
			// full-card overlay so it remains clickable
			const { container } = render(VideoListings, { props: { videos: [heartbeat] } });
			expect(container.querySelector('a[href^="/channel/"]')).toHaveClass('z-20');
		});
	});

	describe('accessibility', () => {
		it('gives overlay links accessible names via aria-label', () => {
			render(VideoListings, { props: { videos: [heartbeat] } });
			expect(screen.getByRole('link', { name: heartbeat.title })).toHaveAttribute(
				'aria-label',
				heartbeat.title
			);
		});

		it('stretches overlay links across the whole card', () => {
			const { container } = render(VideoListings, { props: { videos: mockRelatedVideos } });
			container.querySelectorAll('a[href^="/video/"]').forEach((link) => {
				expect(link).toHaveClass('absolute', 'inset-0');
			});
		});
	});
});
