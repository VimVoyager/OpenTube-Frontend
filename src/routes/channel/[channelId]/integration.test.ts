import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page';
import type { ChannelConfig, ChannelVideoConfig } from '$lib/adapters/types';
import channelDetailsResponseFixture from '../../../tests/fixtures/api/channelDetailsResponse.json';
import channelVideosResponseFixture from '../../../tests/fixtures/api/channelVideosResponse.json';
import channelDetailsFixture from '../../../tests/fixtures/adapters/channelDetails.json';
import channelVideosFixture from '../../../tests/fixtures/adapters/channelVideos.json';

// The mocked-adapter load suite (page.test.ts) is gone: its orchestration
// cases are folded in here and run against the real adapters instead.
// Adapter behaviour (thumbnail/avatar/banner selection, subscriber count
// formatting, handle normalisation, negative-count clamping, empty-items
// handling) is owned by the channel adapter suite, not this file. This file
// owns the load function's orchestration only: parallel fetch wiring,
// placeholder pass-through, partial degradation, and fatal error mapping.

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
import type { ChannelInfoResponse, ChannelVideosResponse } from '$lib/api/types';

// =============================================================================
// Fixtures
// =============================================================================

const infoResponse = channelDetailsResponseFixture as unknown as ChannelInfoResponse;
const videosResponse = channelVideosResponseFixture as unknown as ChannelVideosResponse;
const expectedChannel = channelDetailsFixture as ChannelConfig;
const expectedVideos = channelVideosFixture as ChannelVideoConfig[];

const mockFetch = vi.fn() as unknown as typeof globalThis.fetch;

const loadChannel = (channelId = 'glitch-channel-id') =>
	load({ params: { channelId }, fetch: mockFetch } as any);

// =============================================================================
// Setup
// =============================================================================

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(getChannelInfo).mockResolvedValue(infoResponse);
	vi.mocked(getChannelVideos).mockResolvedValue(videosResponse);
});

// =============================================================================
// Integration tests
// =============================================================================

describe('Channel +page.ts — integration', () => {
	describe('Successful full pipeline', () => {
		it('should return adapted channel and videos matching the known-good fixtures', async () => {
			// Act
			const result = await loadChannel();

			// Assert — real adapters produce output matching the fixture files;
			// per-field adaptation detail is asserted in the adapter suite
			expect(result.channel).toEqual(expectedChannel);
			expect(result.videos).toEqual(expectedVideos);
			expect(result.error).toBeUndefined();
		});

		it('should pass the channelId from params to both API calls exactly once each', async () => {
			// Act
			await loadChannel('some-other-channel');

			// Assert — both calls fire concurrently via Promise.all
			expect(getChannelInfo).toHaveBeenCalledWith('some-other-channel', mockFetch);
			expect(getChannelVideos).toHaveBeenCalledWith('some-other-channel', mockFetch);
			expect(getChannelInfo).toHaveBeenCalledTimes(1);
			expect(getChannelVideos).toHaveBeenCalledTimes(1);
		});

		it('should pass the asset placeholder fallbacks through to the videos adapter', async () => {
			// Arrange — first item has no thumbnails, forcing the fallback path.
			// This pins the load function's wiring of the asset imports, which the
			// adapter suite can't see (it receives placeholders as plain arguments).
			const responseWithNoThumbnails: ChannelVideosResponse = {
				...videosResponse,
				items: [{ ...videosResponse.items[0], thumbnails: [] }]
			};
			vi.mocked(getChannelVideos).mockResolvedValue(responseWithNoThumbnails);

			// Act
			const result = await loadChannel();

			// Assert
			expect(result.videos[0].thumbnail).toBe('/placeholder-thumbnail.jpg');
		});
	});

	describe('Partial degradation (videos fetch fails)', () => {
		it('should still return adapted channel data with empty videos and no error', async () => {
			// Arrange
			vi.mocked(getChannelVideos).mockRejectedValue(new Error('Videos unavailable'));

			// Act
			const result = await loadChannel();

			// Assert — the .catch(() => null) hands null to the videos adapter,
			// which returns []; the channel pipeline is unaffected
			expect(result.channel).toEqual(expectedChannel);
			expect(result.videos).toEqual([]);
			expect(result.error).toBeUndefined();
		});
	});

	describe('Fatal error handling', () => {
		it('should return error page data with safe defaults when the channel fetch rejects', async () => {
			// Arrange
			vi.mocked(getChannelInfo).mockRejectedValue(new Error('Channel not found'));

			// Act
			const result = await loadChannel();

			// Assert — full createErrorPageData shape in one place
			expect(result.error).toBe('Channel not found');
			expect(result.channel).toEqual({
				id: '',
				name: 'Error Loading Channel',
				handle: '',
				avatarUrl: null,
				bannerUrl: null,
				description: null,
				subscriberCount: '0',
				videoCount: 0,
				verified: false
			});
			expect(result.videos).toEqual([]);
		});

		it('should use "Unknown error loading channel" for non-Error rejections', async () => {
			// Arrange
			vi.mocked(getChannelInfo).mockRejectedValue('a plain string error');

			// Act
			const result = await loadChannel();

			// Assert
			expect(result.error).toBe('Unknown error loading channel');
		});

		it('should return error page data instead of throwing when the adapter throws', async () => {
			// Arrange — null info response makes adaptChannelInfo throw on info.id,
			// exercising the outer catch around the adapter stage (not just the fetch)
			vi.mocked(getChannelInfo).mockResolvedValue(null as unknown as ChannelInfoResponse);

			// Act
			const result = await loadChannel();

			// Assert
			expect(result.channel.name).toBe('Error Loading Channel');
			expect(result.videos).toEqual([]);
		});
	});
});
