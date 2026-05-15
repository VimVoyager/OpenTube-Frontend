import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page';
import type { ChannelInfoResponse, ChannelVideosResponse } from '$lib/types';
import type { ChannelConfig, ChannelVideoConfig } from '$lib/adapters/types';
import channelDetailsResponseFixture from '../../../tests/fixtures/api/channelDetailsResponse.json';
import channelVideosResponseFixture from '../../../tests/fixtures/api/channelVideosResponse.json';
import channelDetailsFixture from '../../../tests/fixtures/adapters/channelDetails.json';
import channelVideosFixture from '../../../tests/fixtures/adapters/channelVideos.json';

// Mock only the HTTP boundary — real adapters run so the full pipeline
// (API response → adapter → page data) is exercised end-to-end.
vi.mock('$lib/api/channel', () => ({
	getChannelInfo: vi.fn(),
	getChannelVideos: vi.fn()
}));

// Mock asset imports (no real files available in test environment)
vi.mock('$lib/assets/thumbnail-placeholder.jpg', () => ({
	default: '/placeholder-thumbnail.jpg'
}));

vi.mock('$lib/assets/logo-placeholder.svg', () => ({
	default: '/placeholder-avatar.svg'
}));

// Mock extractIdFromUrl so URL parsing doesn't pull in unrelated deps
vi.mock('$lib/utils/streamSelection', () => ({
	extractIdFromUrl: vi.fn((url: string) => {
		const match = url.match(/[?&]v=([^&]+)/);
		return match ? match[1] : (url.split('/').at(-1) ?? '');
	})
}));

import { getChannelInfo, getChannelVideos } from '$lib/api/channel';

// =============================================================================
// Fixtures
// =============================================================================

const infoResponse = channelDetailsResponseFixture as unknown as ChannelInfoResponse;
const videosResponse = channelVideosResponseFixture as unknown as ChannelVideosResponse;
const expectedChannel = channelDetailsFixture as ChannelConfig;
const expectedVideos = channelVideosFixture as ChannelVideoConfig[];

const mockFetch = vi.fn() as unknown as typeof globalThis.fetch;

// =============================================================================
// Setup
// =============================================================================

beforeEach(() => {
	vi.clearAllMocks();
});

// =============================================================================
// Integration tests
// =============================================================================

describe('Channel +page.ts — integration', () => {
	describe('Successful full pipeline', () => {
		it('should return adapted channel and videos from real fixtures', async () => {
			// Arrange
			vi.mocked(getChannelInfo).mockResolvedValue(infoResponse);
			vi.mocked(getChannelVideos).mockResolvedValue(videosResponse);

			// Act
			const result = await load({
				params: { channelId: 'glitch-channel-id' },
				fetch: mockFetch
			} as any);

			// Assert — real adapters produce output matching the known-good fixture files
			expect(result.channel).toEqual(expectedChannel);
			expect(result.error).toBeUndefined();
		});

		it('should adapt all three videos from the fixture response', async () => {
			// Arrange
			vi.mocked(getChannelInfo).mockResolvedValue(infoResponse);
			vi.mocked(getChannelVideos).mockResolvedValue(videosResponse);

			// Act
			const result = await load({
				params: { channelId: 'glitch-channel-id' },
				fetch: mockFetch
			} as any);

			// Assert
			expect(result.videos).toHaveLength(3);
		});

		it('should correctly adapt video ids, titles and durations', async () => {
			// Arrange
			vi.mocked(getChannelInfo).mockResolvedValue(infoResponse);
			vi.mocked(getChannelVideos).mockResolvedValue(videosResponse);

			// Act
			const result = await load({
				params: { channelId: 'glitch-channel-id' },
				fetch: mockFetch
			} as any);

			// Assert
			expect(result.videos[0].id).toBe('glitch-video-1');
			expect(result.videos[0].title).toBe('Fitting In at School');
			expect(result.videos[0].duration).toBe(210);

			expect(result.videos[1].id).toBe('glitch-video-2');
			expect(result.videos[1].title).toBe('Digital Circus Ep 9 Finale [TRAILER]');
			expect(result.videos[1].duration).toBe(70);

			expect(result.videos[2].id).toBe('glitch-video-3');
			expect(result.videos[2].title).toBe("Caine's Requiem");
			expect(result.videos[2].duration).toBe(159);
		});

		it('should select the largest thumbnail for each video', async () => {
			// Arrange
			vi.mocked(getChannelInfo).mockResolvedValue(infoResponse);
			vi.mocked(getChannelVideos).mockResolvedValue(videosResponse);

			// Act
			const result = await load({
				params: { channelId: 'glitch-channel-id' },
				fetch: mockFetch
			} as any);

			// Assert — adapter picks last (largest) thumbnail from each array
			expect(result.videos[0].thumbnail).toBe(
				'https://i.ytimg.com/vi/glitch-video-1/hqdefault.jpg?sqp=lg'
			);
			expect(result.videos[1].thumbnail).toBe(
				'https://i.ytimg.com/vi/glitch-video-2/hqdefault.jpg?sqp=lg'
			);
			expect(result.videos[2].thumbnail).toBe(
				'https://i.ytimg.com/vi/glitch-video-3/hqdefault.jpg?sqp=lg'
			);
		});

		it('should select the tallest avatar and widest banner from the response arrays', async () => {
			// Arrange
			vi.mocked(getChannelInfo).mockResolvedValue(infoResponse);
			vi.mocked(getChannelVideos).mockResolvedValue(videosResponse);

			// Act
			const result = await load({
				params: { channelId: 'glitch-channel-id' },
				fetch: mockFetch
			} as any);

			// Assert — real selectBestAvatar / selectBestBanner logic runs here
			expect(result.channel.avatarUrl).toBe('https://yt.googleusercontent.com/lg/avatar.jpg');
			expect(result.channel.bannerUrl).toBe('https://yt.googleusercontent.com/lg/banner.jpg');
		});

		it('should format the subscriber count as a compact string', async () => {
			// Arrange
			vi.mocked(getChannelInfo).mockResolvedValue(infoResponse);
			vi.mocked(getChannelVideos).mockResolvedValue(videosResponse);

			// Act
			const result = await load({
				params: { channelId: 'glitch-channel-id' },
				fetch: mockFetch
			} as any);

			// Assert — real formatSubscriberCount runs: 20_600_000 → "20.6M"
			expect(result.channel.subscriberCount).toBe('20.6M');
		});

		it('should normalise the channel handle by prepending @', async () => {
			// Arrange — fixture handle is "GLITCH" (no @); adapter should produce "@GLITCH"
			vi.mocked(getChannelInfo).mockResolvedValue(infoResponse);
			vi.mocked(getChannelVideos).mockResolvedValue(videosResponse);

			// Act
			const result = await load({
				params: { channelId: 'glitch-channel-id' },
				fetch: mockFetch
			} as any);

			// Assert
			expect(result.channel.handle).toBe('@GLITCH');
		});

		it('should pass the channelId from params to both API calls', async () => {
			// Arrange
			vi.mocked(getChannelInfo).mockResolvedValue(infoResponse);
			vi.mocked(getChannelVideos).mockResolvedValue(videosResponse);

			// Act
			await load({ params: { channelId: 'glitch-channel-id' }, fetch: mockFetch } as any);

			// Assert
			expect(getChannelInfo).toHaveBeenCalledWith('glitch-channel-id', mockFetch);
			expect(getChannelVideos).toHaveBeenCalledWith('glitch-channel-id', mockFetch);
		});

		it('should pass placeholder fallbacks through to the videos adapter', async () => {
			// Arrange — response has no thumbnails on first item to trigger fallback
			const responseWithNoThumbnails: ChannelVideosResponse = {
				...videosResponse,
				items: [{ ...videosResponse.items[0], thumbnails: [] }]
			};
			vi.mocked(getChannelInfo).mockResolvedValue(infoResponse);
			vi.mocked(getChannelVideos).mockResolvedValue(responseWithNoThumbnails);

			// Act
			const result = await load({
				params: { channelId: 'glitch-channel-id' },
				fetch: mockFetch
			} as any);

			// Assert — adapter falls back to the asset placeholder
			expect(result.videos[0].thumbnail).toBe('/placeholder-thumbnail.jpg');
		});
	});

	describe('Partial degradation (videos fetch fails)', () => {
		it('should still return adapted channel data when videos fetch rejects', async () => {
			// Arrange
			vi.mocked(getChannelInfo).mockResolvedValue(infoResponse);
			vi.mocked(getChannelVideos).mockRejectedValue(new Error('Videos unavailable'));

			// Act
			const result = await load({
				params: { channelId: 'glitch-channel-id' },
				fetch: mockFetch
			} as any);

			// Assert — channel adapter still runs; videos adapter receives null and returns []
			expect(result.channel).toEqual(expectedChannel);
			expect(result.videos).toEqual([]);
			expect(result.error).toBeUndefined();
		});

		it('should return an empty videos array when the videos response has no items', async () => {
			// Arrange
			const emptyVideosResponse: ChannelVideosResponse = { ...videosResponse, items: [] };
			vi.mocked(getChannelInfo).mockResolvedValue(infoResponse);
			vi.mocked(getChannelVideos).mockResolvedValue(emptyVideosResponse);

			// Act
			const result = await load({
				params: { channelId: 'glitch-channel-id' },
				fetch: mockFetch
			} as any);

			// Assert
			expect(result.videos).toEqual([]);
		});
	});

	describe('Fatal error handling', () => {
		it('should return error page data with safe defaults when channel fetch rejects', async () => {
			// Arrange
			vi.mocked(getChannelInfo).mockRejectedValue(new Error('Channel not found'));
			vi.mocked(getChannelVideos).mockResolvedValue(videosResponse);

			// Act
			const result = await load({
				params: { channelId: 'glitch-channel-id' },
				fetch: mockFetch
			} as any);

			// Assert — createErrorPageData safe defaults
			expect(result.error).toBe('Channel not found');
			expect(result.channel.name).toBe('Error Loading Channel');
			expect(result.channel.id).toBe('');
			expect(result.channel.verified).toBe(false);
			expect(result.videos).toEqual([]);
		});

		it('should use "Unknown error loading channel" for non-Error rejections', async () => {
			// Arrange
			vi.mocked(getChannelInfo).mockRejectedValue('a plain string error');
			vi.mocked(getChannelVideos).mockResolvedValue(videosResponse);

			// Act
			const result = await load({
				params: { channelId: 'glitch-channel-id' },
				fetch: mockFetch
			} as any);

			// Assert
			expect(result.error).toBe('Unknown error loading channel');
		});

		it('should return error page data when the adapter throws', async () => {
			// Arrange — passing null as the info response causes adaptChannelInfo to
			// throw when it tries to access info.id, triggering the outer catch.
			vi.mocked(getChannelInfo).mockResolvedValue(null as unknown as ChannelInfoResponse);
			vi.mocked(getChannelVideos).mockResolvedValue(videosResponse);

			// Act
			const result = await load({
				params: { channelId: 'glitch-channel-id' },
				fetch: mockFetch
			} as any);

			// Assert — outer catch returns safe defaults, not an uncaught exception
			expect(result.channel.name).toBe('Error Loading Channel');
			expect(result.videos).toEqual([]);
		});
	});

	describe('Negative counts clamping (adapter behaviour under integration)', () => {
		it('should clamp negative viewCount to 0 in adapted video output', async () => {
			// Arrange — item with negative viewCount (common in API responses)
			const responseWithNegativeViews: ChannelVideosResponse = {
				...videosResponse,
				items: [{ ...videosResponse.items[0], viewCount: -1 }]
			};
			vi.mocked(getChannelInfo).mockResolvedValue(infoResponse);
			vi.mocked(getChannelVideos).mockResolvedValue(responseWithNegativeViews);

			// Act
			const result = await load({
				params: { channelId: 'glitch-channel-id' },
				fetch: mockFetch
			} as any);

			// Assert
			expect(result.videos[0].viewCount).toBe(0);
		});

		it('should clamp negative duration to 0 in adapted video output', async () => {
			// Arrange
			const responseWithNegativeDuration: ChannelVideosResponse = {
				...videosResponse,
				items: [{ ...videosResponse.items[0], duration: -1 }]
			};
			vi.mocked(getChannelInfo).mockResolvedValue(infoResponse);
			vi.mocked(getChannelVideos).mockResolvedValue(responseWithNegativeDuration);

			// Act
			const result = await load({
				params: { channelId: 'glitch-channel-id' },
				fetch: mockFetch
			} as any);

			// Assert
			expect(result.videos[0].duration).toBe(0);
		});
	});
});
