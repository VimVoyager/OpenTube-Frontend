import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page';
import type { ChannelInfoResponse, ChannelVideosResponse } from '$lib/types';
import type { ChannelConfig, ChannelVideoConfig } from '$lib/adapters/types';
import channelDetailsResponseFixture from '../../../tests/fixtures/api/channelDetailsResponse.json';
import channelVideosResponseFixture from '../../../tests/fixtures/api/channelVideosResponse.json';
import channelDetailsFixture from '../../../tests/fixtures/adapters/channelDetails.json';
import channelVideosFixture from '../../../tests/fixtures/adapters/channelVideos.json';

// Mock the channel API
vi.mock('$lib/api/channel', () => ({
	getChannelInfo: vi.fn(),
	getChannelVideos: vi.fn()
}));

// Mock the channel adapter
vi.mock('$lib/adapters/channel', () => ({
	adaptChannelInfo: vi.fn(),
	adaptChannelVideos: vi.fn()
}));

// Mock asset imports
vi.mock('$lib/assets/thumbnail-placeholder.jpg', () => ({
	default: '/placeholder-thumbnail.jpg'
}));

vi.mock('$lib/assets/logo-placeholder.svg', () => ({
	default: '/placeholder-avatar.svg'
}));

import { getChannelInfo, getChannelVideos } from '$lib/api/channel';
import { adaptChannelInfo, adaptChannelVideos } from '$lib/adapters/channel';

// =============================================================================
// Fixtures
// =============================================================================

const mockChannelId = 'glitch-channel-id';

// API-shape inputs — what getChannelInfo / getChannelVideos return from the wire
const mockInfoResponse = channelDetailsResponseFixture as unknown as ChannelInfoResponse;
const mockVideosResponse = channelVideosResponseFixture as unknown as ChannelVideosResponse;

// Adapter-shape outputs — what the mocked adapters return to the load function
const mockChannelConfig = channelDetailsFixture as ChannelConfig;
const mockVideoConfig = (channelVideosFixture as ChannelVideoConfig[])[0];

// =============================================================================
// Setup
// =============================================================================

const mockFetch = vi.fn() as unknown as typeof globalThis.fetch;

beforeEach(() => {
	vi.clearAllMocks();
});

// =============================================================================
// load() tests
// =============================================================================

describe('+page.ts load function', () => {
	describe('Successful data loading', () => {
		it('should fetch channel info and videos in parallel', async () => {
			vi.mocked(getChannelInfo).mockResolvedValue(mockInfoResponse as ChannelInfoResponse);
			vi.mocked(getChannelVideos).mockResolvedValue(mockVideosResponse as ChannelVideosResponse);
			vi.mocked(adaptChannelInfo).mockReturnValue(mockChannelConfig);
			vi.mocked(adaptChannelVideos).mockReturnValue([mockVideoConfig]);

			await load({ params: { channelId: mockChannelId }, fetch: mockFetch } as any);

			// Both API calls should fire — Promise.all means they run concurrently
			expect(getChannelInfo).toHaveBeenCalledWith(mockChannelId, mockFetch);
			expect(getChannelVideos).toHaveBeenCalledWith(mockChannelId, mockFetch);
			expect(getChannelInfo).toHaveBeenCalledTimes(1);
			expect(getChannelVideos).toHaveBeenCalledTimes(1);
		});

		it('should pass API responses through the adapters with placeholder fallbacks', async () => {
			vi.mocked(getChannelInfo).mockResolvedValue(mockInfoResponse as ChannelInfoResponse);
			vi.mocked(getChannelVideos).mockResolvedValue(mockVideosResponse as ChannelVideosResponse);
			vi.mocked(adaptChannelInfo).mockReturnValue(mockChannelConfig);
			vi.mocked(adaptChannelVideos).mockReturnValue([]);

			await load({ params: { channelId: mockChannelId }, fetch: mockFetch } as any);

			expect(adaptChannelInfo).toHaveBeenCalledWith(mockInfoResponse);
			expect(adaptChannelVideos).toHaveBeenCalledWith(
				mockVideosResponse,
				'/placeholder-thumbnail.jpg',
				'/placeholder-avatar.svg'
			);
		});

		it('should return adapted channel and videos on success', async () => {
			vi.mocked(getChannelInfo).mockResolvedValue(mockInfoResponse as ChannelInfoResponse);
			vi.mocked(getChannelVideos).mockResolvedValue(mockVideosResponse as ChannelVideosResponse);
			vi.mocked(adaptChannelInfo).mockReturnValue(mockChannelConfig);
			vi.mocked(adaptChannelVideos).mockReturnValue([mockVideoConfig]);

			const result = await load({ params: { channelId: mockChannelId }, fetch: mockFetch } as any);

			expect(result).toEqual({
				channel: mockChannelConfig,
				videos: [mockVideoConfig]
			});
		});

		it('should not include an error field on successful load', async () => {
			vi.mocked(getChannelInfo).mockResolvedValue(mockInfoResponse as ChannelInfoResponse);
			vi.mocked(getChannelVideos).mockResolvedValue(mockVideosResponse as ChannelVideosResponse);
			vi.mocked(adaptChannelInfo).mockReturnValue(mockChannelConfig);
			vi.mocked(adaptChannelVideos).mockReturnValue([]);

			const result = (await load({
				params: { channelId: mockChannelId },
				fetch: mockFetch
			} as any)) as any;

			expect(result.error).toBeUndefined();
		});

		it('should return an empty videos array when the channel has no videos', async () => {
			vi.mocked(getChannelInfo).mockResolvedValue(mockInfoResponse as ChannelInfoResponse);
			vi.mocked(getChannelVideos).mockResolvedValue(mockVideosResponse as ChannelVideosResponse);
			vi.mocked(adaptChannelInfo).mockReturnValue(mockChannelConfig);
			vi.mocked(adaptChannelVideos).mockReturnValue([]);

			const result = await load({ params: { channelId: mockChannelId }, fetch: mockFetch } as any);

			expect(result.videos).toEqual([]);
		});
	});

	describe('Video fetch failure (partial degradation)', () => {
		it('should continue loading when getChannelVideos rejects', async () => {
			vi.mocked(getChannelInfo).mockResolvedValue(mockInfoResponse as ChannelInfoResponse);
			vi.mocked(getChannelVideos).mockRejectedValue(new Error('Videos unavailable'));
			vi.mocked(adaptChannelInfo).mockReturnValue(mockChannelConfig);
			// adaptChannelVideos receives null when videos fetch fails
			vi.mocked(adaptChannelVideos).mockReturnValue([]);

			const result = await load({ params: { channelId: mockChannelId }, fetch: mockFetch } as any);

			// Should not throw — channel still loads
			expect(result.channel).toEqual(mockChannelConfig);
		});

		it('should call adaptChannelVideos with null when video fetch fails', async () => {
			vi.mocked(getChannelInfo).mockResolvedValue(mockInfoResponse as ChannelInfoResponse);
			vi.mocked(getChannelVideos).mockRejectedValue(new Error('Videos unavailable'));
			vi.mocked(adaptChannelInfo).mockReturnValue(mockChannelConfig);
			vi.mocked(adaptChannelVideos).mockReturnValue([]);

			await load({ params: { channelId: mockChannelId }, fetch: mockFetch } as any);

			// The .catch(() => null) in the load function means adapter receives null
			expect(adaptChannelVideos).toHaveBeenCalledWith(
				null,
				'/placeholder-thumbnail.jpg',
				'/placeholder-avatar.svg'
			);
		});

		it('should not include an error field when only videos fail', async () => {
			vi.mocked(getChannelInfo).mockResolvedValue(mockInfoResponse as ChannelInfoResponse);
			vi.mocked(getChannelVideos).mockRejectedValue(new Error('Videos unavailable'));
			vi.mocked(adaptChannelInfo).mockReturnValue(mockChannelConfig);
			vi.mocked(adaptChannelVideos).mockReturnValue([]);

			const result = (await load({
				params: { channelId: mockChannelId },
				fetch: mockFetch
			} as any)) as any;

			expect(result.error).toBeUndefined();
		});
	});

	describe('Fatal error handling', () => {
		it('should return error page data when getChannelInfo rejects', async () => {
			vi.mocked(getChannelInfo).mockRejectedValue(new Error('Channel not found'));
			vi.mocked(getChannelVideos).mockResolvedValue(mockVideosResponse as ChannelVideosResponse);

			const result = await load({ params: { channelId: mockChannelId }, fetch: mockFetch } as any);

			expect(result.error).toBe('Channel not found');
		});

		it('should return safe default channel data on fatal error', async () => {
			vi.mocked(getChannelInfo).mockRejectedValue(new Error('Network failure'));
			vi.mocked(getChannelVideos).mockResolvedValue(mockVideosResponse as ChannelVideosResponse);

			const result = await load({ params: { channelId: mockChannelId }, fetch: mockFetch } as any);

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

		it('should handle non-Error exceptions with a fallback message', async () => {
			vi.mocked(getChannelInfo).mockRejectedValue('Something went wrong');
			vi.mocked(getChannelVideos).mockResolvedValue(mockVideosResponse as ChannelVideosResponse);

			const result = await load({ params: { channelId: mockChannelId }, fetch: mockFetch } as any);

			expect(result.error).toBe('Unknown error loading channel');
		});

		it('should return error page data when adaptChannelInfo throws', async () => {
			vi.mocked(getChannelInfo).mockResolvedValue(mockInfoResponse as ChannelInfoResponse);
			vi.mocked(getChannelVideos).mockResolvedValue(mockVideosResponse as ChannelVideosResponse);
			vi.mocked(adaptChannelInfo).mockImplementation(() => {
				throw new Error('Adapter failed');
			});

			const result = await load({ params: { channelId: mockChannelId }, fetch: mockFetch } as any);

			expect(result.error).toBe('Adapter failed');
			expect(result.videos).toEqual([]);
		});
	});

	describe('channelId param handling', () => {
		it('should pass channelId from route params to both API calls', async () => {
			const differentId = 'some-other-channel';
			vi.mocked(getChannelInfo).mockResolvedValue(mockInfoResponse as ChannelInfoResponse);
			vi.mocked(getChannelVideos).mockResolvedValue(mockVideosResponse as ChannelVideosResponse);
			vi.mocked(adaptChannelInfo).mockReturnValue(mockChannelConfig);
			vi.mocked(adaptChannelVideos).mockReturnValue([]);

			await load({ params: { channelId: differentId }, fetch: mockFetch } as any);

			expect(getChannelInfo).toHaveBeenCalledWith(differentId, mockFetch);
			expect(getChannelVideos).toHaveBeenCalledWith(differentId, mockFetch);
		});
	});
});
