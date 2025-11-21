/**
 * Test Suite: metadata.ts
 * 
 * Tests for video metadata adaptation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adaptVideoMetadata } from './metadata';
import type { Details } from '$lib/types';

// Mock the mediaUtils module
vi.mock('$lib/utils/mediaUtils', () => ({
	selectBestAvatar: vi.fn((avatars, fallback) => {
		if (!avatars || avatars.length === 0) return fallback;
		return avatars[2]?.url || avatars[0]?.url || fallback;
	})
}));

import { selectBestAvatar } from '$lib/utils/mediaUtils';

// =============================================================================
// Test Fixtures
// =============================================================================

const mockAvatars = [
	{
		url: 'https://example.com/avatar-low.jpg',
		height: 48,
		width: 48,
		estimatedResolutionLevel: 'LOW'
	},
	{
		url: 'https://example.com/avatar-medium.jpg',
		height: 88,
		width: 88,
		estimatedResolutionLevel: 'MEDIUM'
	},
	{
		url: 'https://example.com/avatar-high.jpg',
		height: 176,
		width: 176,
		estimatedResolutionLevel: 'HIGH'
	}
];

const mockDetailsComplete: Details = {
	videoTitle: 'Test Video Title',
	description: {
		content: 'This is a detailed description of the video content.'
	},
	channelName: 'Test Channel',
	uploaderAvatars: mockAvatars,
	viewCount: 1000000,
	uploadDate: '2024-01-15',
	likeCount: 50000,
	dislikeCount: 1000,
	channelSubscriberCount: 500000
};

const mockDetailsMinimal: Details = {
	videoTitle: 'Minimal Video',
	description: {
		content: 'Short description'
	},
	channelName: 'Minimal Channel',
	uploaderAvatars: [],
	viewCount: 100,
	uploadDate: '2024-01-01',
	likeCount: 10,
	dislikeCount: 0,
	channelSubscriberCount: 50
};

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
			// Arrange
			const expected = {
				title: 'Test Video Title',
				description: 'This is a detailed description of the video content.',
				channelName: 'Test Channel',
				channelAvatar: mockAvatars[2].url,
				viewCount: 1000000,
				uploadDate: '2024-01-15',
				likeCount: 50000,
				dislikeCount: 1000,
				subscriberCount: 500000
			};

			// Act
			const result = adaptVideoMetadata(mockDetailsComplete, defaultAvatar);

			// Assert
			expect(result).toEqual(expected);
			expect(selectBestAvatar).toHaveBeenCalledWith(mockAvatars, defaultAvatar);
			expect(selectBestAvatar).toHaveBeenCalledTimes(1);
		});

		it('should adapt minimal video details correctly', () => {
			// Arrange
			const expected = {
				title: 'Minimal Video',
				description: 'Short description',
				channelName: 'Minimal Channel',
				channelAvatar: defaultAvatar,
				viewCount: 100,
				uploadDate: '2024-01-01',
				likeCount: 10,
				dislikeCount: 0,
				subscriberCount: 50
			};

			// Act
			const result = adaptVideoMetadata(mockDetailsMinimal, defaultAvatar);

			// Assert
			expect(result).toEqual(expected);
			expect(selectBestAvatar).toHaveBeenCalledWith([], defaultAvatar);
		});

		it('should return all required metadata fields', () => {
			// Arrange & Act
			const result = adaptVideoMetadata(mockDetailsComplete, defaultAvatar);

			// Assert
			expect(result).toHaveProperty('title');
			expect(result).toHaveProperty('description');
			expect(result).toHaveProperty('channelName');
			expect(result).toHaveProperty('channelAvatar');
			expect(result).toHaveProperty('viewCount');
			expect(result).toHaveProperty('uploadDate');
			expect(result).toHaveProperty('likeCount');
			expect(result).toHaveProperty('dislikeCount');
			expect(result).toHaveProperty('subscriberCount');
		});
	});

	// =============================================================================
	// Default Values Tests
	// =============================================================================

	describe('default values handling', () => {
		it('should use default title when videoTitle is missing', () => {
			// Arrange
			const details = { ...mockDetailsComplete, videoTitle: '' };

			// Act
			const result = adaptVideoMetadata(details, defaultAvatar);

			// Assert
			expect(result.title).toBe('Untitled Video');
		});

		it('should use default description when content is missing', () => {
			// Arrange
			const details = { 
				...mockDetailsComplete, 
				description: { content: '' }
			};

			// Act
			const result = adaptVideoMetadata(details, defaultAvatar);

			// Assert
			expect(result.description).toBe('No description available');
		});

		it('should use default channel name when channelName is missing', () => {
			// Arrange
			const details = { ...mockDetailsComplete, channelName: '' };

			// Act
			const result = adaptVideoMetadata(details, defaultAvatar);

			// Assert
			expect(result.channelName).toBe('Unknown Channel');
		});

		it('should use default avatar when uploaderAvatars is empty', () => {
			// Arrange
			const details = { ...mockDetailsComplete, uploaderAvatars: [] };

			// Act
			const result = adaptVideoMetadata(details, defaultAvatar);

			// Assert
			expect(result.channelAvatar).toBe(defaultAvatar);
			expect(selectBestAvatar).toHaveBeenCalledWith([], defaultAvatar);
		});

		it('should default viewCount to 0 when missing', () => {
			// Arrange
			const details = { ...mockDetailsComplete, viewCount: 0 };

			// Act
			const result = adaptVideoMetadata(details, defaultAvatar);

			// Assert
			expect(result.viewCount).toBe(0);
		});

		it('should default likeCount to 0 when missing', () => {
			// Arrange
			const details = { ...mockDetailsComplete, likeCount: 0 };

			// Act
			const result = adaptVideoMetadata(details, defaultAvatar);

			// Assert
			expect(result.likeCount).toBe(0);
		});

		it('should default dislikeCount to 0 when missing', () => {
			// Arrange
			const details = { ...mockDetailsComplete, dislikeCount: 0 };

			// Act
			const result = adaptVideoMetadata(details, defaultAvatar);

			// Assert
			expect(result.dislikeCount).toBe(0);
		});

		it('should default subscriberCount to 0 when missing', () => {
			// Arrange
			const details = { ...mockDetailsComplete, channelSubscriberCount: 0 };

			// Act
			const result = adaptVideoMetadata(details, defaultAvatar);

			// Assert
			expect(result.subscriberCount).toBe(0);
		});

		it('should use empty string for uploadDate when missing', () => {
			// Arrange
			const details = { ...mockDetailsComplete, uploadDate: '' };

			// Act
			const result = adaptVideoMetadata(details, defaultAvatar);

			// Assert
			expect(result.uploadDate).toBe('');
		});
	});

	// =============================================================================
	// Edge Cases Tests
	// =============================================================================

	describe('edge cases', () => {
		it('should handle undefined description object', () => {
			// Arrange
			const details = { 
				...mockDetailsComplete, 
				description: undefined as unknown as { content: string }
			};

			// Act
			const result = adaptVideoMetadata(details, defaultAvatar);

			// Assert
			expect(result.description).toBe('No description available');
		});

		it('should handle null values in numeric fields', () => {
			// Arrange
			const details = {
				...mockDetailsComplete,
				viewCount: null as unknown as number,
				likeCount: null as unknown as number,
				dislikeCount: null as unknown as number,
				channelSubscriberCount: null as unknown as number
			};

			// Act
			const result = adaptVideoMetadata(details, defaultAvatar);

			// Assert
			expect(result.viewCount).toBe(0);
			expect(result.likeCount).toBe(0);
			expect(result.dislikeCount).toBe(0);
			expect(result.subscriberCount).toBe(0);
		});

		it('should handle very large view counts', () => {
			// Arrange
			const details = { 
				...mockDetailsComplete, 
				viewCount: 999999999999 
			};

			// Act
			const result = adaptVideoMetadata(details, defaultAvatar);

			// Assert
			expect(result.viewCount).toBe(999999999999);
		});

		it('should handle very large like counts', () => {
			// Arrange
			const details = { 
				...mockDetailsComplete, 
				likeCount: 10000000 
			};

			// Act
			const result = adaptVideoMetadata(details, defaultAvatar);

			// Assert
			expect(result.likeCount).toBe(10000000);
		});

		it('should handle negative counts gracefully', () => {
			// Arrange
			const details = {
				...mockDetailsComplete,
				viewCount: -1,
				likeCount: -1,
				dislikeCount: -1,
				channelSubscriberCount: -1
			};

			// Act
			const result = adaptVideoMetadata(details, defaultAvatar);

			// Assert
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
		it('should call selectBestAvatar with correct arguments', () => {
			// Arrange & Act
			adaptVideoMetadata(mockDetailsComplete, defaultAvatar);

			// Assert
			expect(selectBestAvatar).toHaveBeenCalledWith(
				mockDetailsComplete.uploaderAvatars,
				defaultAvatar
			);
		});

		it('should use avatar returned by selectBestAvatar', () => {
			// Arrange
			const customAvatar = 'https://example.com/custom-avatar.jpg';
			vi.mocked(selectBestAvatar).mockReturnValueOnce(customAvatar);

			// Act
			const result = adaptVideoMetadata(mockDetailsComplete, defaultAvatar);

			// Assert
			expect(result.channelAvatar).toBe(customAvatar);
		});

		it('should handle undefined uploaderAvatars', () => {
			// Arrange
			const details = {
				...mockDetailsComplete,
				uploaderAvatars: undefined as unknown as typeof mockAvatars
			};

			// Act
			adaptVideoMetadata(details, defaultAvatar);

			// Assert
			expect(selectBestAvatar).toHaveBeenCalledWith(undefined, defaultAvatar);
		});
	});

	// =============================================================================
	// Data Type Preservation Tests
	// =============================================================================

	describe('data type preservation', () => {
		it('should preserve string types', () => {
			// Arrange & Act
			const result = adaptVideoMetadata(mockDetailsComplete, defaultAvatar);

			// Assert
			expect(typeof result.title).toBe('string');
			expect(typeof result.description).toBe('string');
			expect(typeof result.channelName).toBe('string');
			expect(typeof result.uploadDate).toBe('string');
		});

		it('should preserve number types', () => {
			// Arrange & Act
			const result = adaptVideoMetadata(mockDetailsComplete, defaultAvatar);

			// Assert
			expect(typeof result.viewCount).toBe('number');
			expect(typeof result.likeCount).toBe('number');
			expect(typeof result.dislikeCount).toBe('number');
			expect(typeof result.subscriberCount).toBe('number');
		});

		it('should not modify input details object', () => {
			// Arrange
			const detailsCopy = JSON.parse(JSON.stringify(mockDetailsComplete));

			// Act
			adaptVideoMetadata(mockDetailsComplete, defaultAvatar);

			// Assert
			expect(mockDetailsComplete).toEqual(detailsCopy);
		});
	});

	// =============================================================================
	// Integration Tests
	// =============================================================================

	describe('integration with selectBestAvatar', () => {
		it('should work with selectBestAvatar returning fallback', () => {
			// Arrange
			vi.mocked(selectBestAvatar).mockReturnValueOnce(defaultAvatar);

			// Act
			const result = adaptVideoMetadata(mockDetailsComplete, defaultAvatar);

			// Assert
			expect(result.channelAvatar).toBe(defaultAvatar);
		});

		it('should work with selectBestAvatar returning high quality avatar', () => {
			// Arrange
			const highQualityUrl = mockAvatars[2].url;
			vi.mocked(selectBestAvatar).mockReturnValueOnce(highQualityUrl);

			// Act
			const result = adaptVideoMetadata(mockDetailsComplete, defaultAvatar);

			// Assert
			expect(result.channelAvatar).toBe(highQualityUrl);
		});
	});
});