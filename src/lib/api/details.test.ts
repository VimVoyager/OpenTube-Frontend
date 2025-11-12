/**
 * Test Suite: details.ts
 * 
 * Tests for video details fetching including metadata parsing,
 * error handling, and data validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getVideoDetails } from './details';
import {
	createSuccessfulFetch,
	createFailedFetch,
	createNetworkErrorFetch,
	extractQueryParams,
	createMockConsoleError,
	getCallCount
} from '../../tests/helpers/apiHelpers';
import {
    mockVideoDetails,
    mockVideoDetailsMinimal
} from '../../tests/fixtures/apiFixtures';

// =============================================================================
// Successful Details Fetching Tests
// =============================================================================

describe('getVideoDetails', () => {
	describe('successful video details requests', () => {
		it('should fetch video details with valid ID', async () => {
			// Arrange
			const videoId = 'test-video-id';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual(mockVideoDetails);
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it('should return complete Details object', async () => {
			// Arrange
			const videoId = 'abc123';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toHaveProperty('videoTitle');
			expect(result).toHaveProperty('description');
			expect(result).toHaveProperty('uploadDate');
			expect(result).toHaveProperty('channelName');
			expect(result).toHaveProperty('viewCount');
			expect(result).toHaveProperty('likeCount');
			expect(result).toHaveProperty('dislikeCount');
			expect(result).toHaveProperty('channelSubscriberCount');
			expect(result).toHaveProperty('uploaderAvatars');
		});

		it('should use default fetch when fetchFn not provided', async () => {
			// Arrange
			const videoId = 'test-id';
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				statusText: 'OK',
				json: vi.fn().mockResolvedValue(mockVideoDetails)
			});

			// Act
			const result = await getVideoDetails(videoId);

			// Assert
			expect(result).toEqual(mockVideoDetails);
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});
	});

    // =============================================================================
	// Video Metadata Tests
	// =============================================================================

	describe('video metadata parsing', () => {
		it('should correctly parse video title', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result.videoTitle).toBe('Test Video Title');
			expect(typeof result.videoTitle).toBe('string');
		});

		it('should correctly parse description', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result.description).toHaveProperty('content');
			expect(result.description.content).toBe(
				'This is a test video description with details about the content.'
			);
		});

		it('should correctly parse upload date', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result.uploadDate).toBe('2024-01-15');
			expect(typeof result.uploadDate).toBe('string');
		});

		it('should correctly parse channel name', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result.channelName).toBe('Test Channel');
			expect(typeof result.channelName).toBe('string');
		});

		it('should correctly parse uploader avatars', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(Array.isArray(result.uploaderAvatars)).toBe(true);
			expect(result.uploaderAvatars).toHaveLength(1);
			expect(result.uploaderAvatars[0]).toHaveProperty('url');
			expect(result.uploaderAvatars[0]).toHaveProperty('height');
			expect(result.uploaderAvatars[0]).toHaveProperty('width');
		});
	});
});