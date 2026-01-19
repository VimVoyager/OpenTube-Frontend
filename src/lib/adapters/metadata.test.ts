/**
 * Test Suite: metadata.ts
 * 
 * Tests for video metadata adaptation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adaptVideoMetadata } from './metadata';
import detailsResponseFixture from '../../tests/fixtures/api/detailsResponseFixture.json';
import detailsResultFixture from '../../tests/fixtures/adapters/detailsResult.json';
import type { Avatar, Details } from '$lib/types';

// Mock the mediaUtils module
vi.mock('$lib/utils/mediaUtils', () => ({
	selectBestAvatar: vi.fn((avatars, fallback) => {
		if (!avatars || avatars.length === 0) return fallback;
		return avatars[2]?.url || avatars[0]?.url || fallback;
	})
}));

import { selectBestAvatar } from '$lib/utils/mediaUtils';
import type { VideoMetadata } from '$lib/adapters/types';

// =============================================================================
// Test Fixtures
// =============================================================================

const mockDetailsResponse: Details = detailsResponseFixture[0];
const mockEmptyDetailsResponse: Details = detailsResponseFixture[1];
const mockDetailsResult: VideoMetadata = detailsResultFixture;

const defaultAvatar = 'https://example.com/default-avatar.jpg';

// =============================================================================
// Setup and Teardown
// =============================================================================

beforeEach(() => {
	vi.clearAllMocks();
});

// =============================================================================
// adaptVideoMetadata Tests
// =============================================================================

describe('adaptVideoMetadata', () => {
	// =============================================================================
	// Successful Adaptation Tests
	// =============================================================================

	describe('successful metadata adaptation', () => {
		it('should adapt complete video details correctly', () => {
			const result = adaptVideoMetadata(mockDetailsResponse, defaultAvatar);

			expect(result).toEqual(mockDetailsResult);

			expect(result).toHaveProperty('title');
			expect(result).toHaveProperty('description');
			expect(result).toHaveProperty('channelName');
			expect(result).toHaveProperty('channelAvatar');
			expect(result).toHaveProperty('viewCount');
			expect(result).toHaveProperty('uploadDate');
			expect(result).toHaveProperty('likeCount');
			expect(result).toHaveProperty('dislikeCount');
			expect(result).toHaveProperty('subscriberCount');

			expect(selectBestAvatar).toHaveBeenCalledWith(mockDetailsResponse.uploaderAvatars, defaultAvatar);
			expect(selectBestAvatar).toHaveBeenCalledTimes(1);
		});
	});

	// =============================================================================
	// Default Values Tests
	// =============================================================================

	describe('default values handling', () => {
		it('should use default values when videoTitle, description, channel, avatar, and count values are missing', () => {
			const details = { ...mockEmptyDetailsResponse, videoTitle: '' };
			const result = adaptVideoMetadata(details, defaultAvatar);

			expect(result.title).toBe('Untitled Video');
			expect(result.description).toBe('No description available');
			expect(result.channelName).toBe('Unknown Channel');
			expect(result.channelAvatar).toBe(defaultAvatar);
			expect(selectBestAvatar).toHaveBeenCalledWith([], defaultAvatar);
			expect(result.viewCount).toBe(0);
			expect(result.likeCount).toBe(0);
			expect(result.dislikeCount).toBe(0);
			expect(result.subscriberCount).toBe(0);
			expect(result.uploadDate).toBe('');
		});
	});

	// =============================================================================
	// Edge Cases Tests
	// =============================================================================

	describe('edge cases', () => {
		it('should handle undefined description object', () => {
			const details = {
				...mockDetailsResponse,
				description: undefined as unknown as { content: string, type: number },
			};

			const result = adaptVideoMetadata(details, defaultAvatar);

			expect(result.description).toBe('No description available');
		});

		it('should handle null values in numeric fields', () => {
			const details = {
				...mockDetailsResponse,
				viewCount: null as unknown as number,
				likeCount: null as unknown as number,
				dislikeCount: null as unknown as number,
				channelSubscriberCount: null as unknown as number
			};

			const result = adaptVideoMetadata(details, defaultAvatar);

			expect(result.viewCount).toBe(0);
			expect(result.likeCount).toBe(0);
			expect(result.dislikeCount).toBe(0);
			expect(result.subscriberCount).toBe(0);
		});

		it('should handle very large view counts', () => {
			const details = {
				...mockDetailsResponse,
				viewCount: 999999999999 
			};

			const result = adaptVideoMetadata(details, defaultAvatar);

			expect(result.viewCount).toBe(999999999999);
		});

		it('should handle very large like counts', () => {
			const details = {
				...mockDetailsResponse,
				likeCount: 10000000 
			};

			const result = adaptVideoMetadata(details, defaultAvatar);

			expect(result.likeCount).toBe(10000000);
		});

		it('should handle negative counts gracefully', () => {
			const details = {
				...mockDetailsResponse,
				viewCount: -1,
				likeCount: -1,
				dislikeCount: -1,
				channelSubscriberCount: -1
			};

			const result = adaptVideoMetadata(details, defaultAvatar);

			expect(result.viewCount).toBe(0);
			expect(result.likeCount).toBe(0);
			expect(result.dislikeCount).toBe(0);
			expect(result.subscriberCount).toBe(0);
		});
	});

	// =============================================================================
	// Avatar Selection Tests
	// =============================================================================

	describe('avatar selection', () => {
		it('should handle undefined uploaderAvatars', () => {
			const details = {
				...mockDetailsResponse,
				uploaderAvatars: undefined as unknown as Avatar[]
			};

			adaptVideoMetadata(details, defaultAvatar);

			expect(selectBestAvatar).toHaveBeenCalledWith(undefined, defaultAvatar);
		});
	});

	// =============================================================================
	// Integration Tests
	// =============================================================================

	describe('integration with selectBestAvatar', () => {
		it('should work with selectBestAvatar returning fallback', () => {
			vi.mocked(selectBestAvatar).mockReturnValueOnce(defaultAvatar);

			const result = adaptVideoMetadata(mockDetailsResponse, defaultAvatar);

			expect(result.channelAvatar).toBe(defaultAvatar);
		});

		it('should work with selectBestAvatar returning high quality avatar', () => {
			const highQualityUrl = mockDetailsResponse.uploaderAvatars[2].url;
			vi.mocked(selectBestAvatar).mockReturnValueOnce(highQualityUrl);

			const result = adaptVideoMetadata(mockDetailsResponse, defaultAvatar);

			expect(result.channelAvatar).toBe(highQualityUrl);
		});
	});
});