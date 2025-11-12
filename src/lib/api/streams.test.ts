/**
 * Test Suite: details.ts
 * 
 * Tests for video details fetching including metadata parsing,
 * error handling, and data validation
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
	getVideoStreams,
	getAudioStreams,
	getAllStreams
} from './streams';
import {
	createSuccessfulFetch,
	createFailedFetch,
	createNetworkErrorFetch,
	extractQueryParams,
	createMockConsoleError,
} from '../../tests/helpers/apiHelpers';
import {
    mockAudioStream,
    mockAudioStreamsArrayResponse,
	mockAudioStreamsObjectResponse,
    mockVideoStream,
    mockVideoStreamsArrayResponse,
    mockVideoStreamsObjectResponse
} from '../../tests/fixtures/apiFixtures';

// Mock environment variable
vi.mock('$env/dynamic/public', () => ({
	env: {
		PUBLIC_API_URL: 'http://localhost:8000'
	}
}));

// =============================================================================
// Setup and Teardown
// =============================================================================

let consoleErrorMock: ReturnType<typeof createMockConsoleError> | undefined;

afterEach(() => {
	if (consoleErrorMock) {
		consoleErrorMock.restore();
		consoleErrorMock = undefined;
	}
});

// =============================================================================
// getVideoStreams Tests
// =============================================================================

describe('getVideoStreams', () => {
	describe('successful video stream requests', () => {
		it('should fetch video streams with valid ID', async () => {
			// Arrange
			const videoId = 'test-video-id';
			const mockFetch = createSuccessfulFetch(mockVideoStreamsArrayResponse);

			// Act
			const result = await getVideoStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual(mockVideoStreamsArrayResponse);
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it('should return array of video streams', async () => {
			// Arrange
			const videoId = 'abc123';
			const mockFetch = createSuccessfulFetch(mockVideoStreamsArrayResponse);

			// Act
			const result = await getVideoStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(mockVideoStreamsArrayResponse.length);
			expect(result[0]).toHaveProperty('id');
			expect(result[0]).toHaveProperty('resolution');
			expect(result[0]).toHaveProperty('url');
		});

		it('should use default fetch when fetchFn not provided', async () => {
			// Arrange
			const videoId = 'test-id';
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				statusText: 'OK',
				json: vi.fn().mockResolvedValue(mockVideoStreamsArrayResponse)
			});

			// Act
			const result = await getVideoStreams(videoId);

			// Assert
			expect(result).toEqual(mockVideoStreamsArrayResponse);
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});
	});

	// =============================================================================
	// Response Format Handling Tests
	// =============================================================================

	describe('response format handling', () => {
		it('should handle array response format', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoStreamsArrayResponse);

			// Act
			const result = await getVideoStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(Array.isArray(result)).toBe(true);
			expect(result).toEqual(mockVideoStreamsArrayResponse);
		});

		it('should handle object response format with streams property', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoStreamsObjectResponse);

			// Act
			const result = await getVideoStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(Array.isArray(result)).toBe(true);
			expect(result).toEqual(mockVideoStreamsObjectResponse.streams);
		});

		it('should throw error for unexpected response format', async () => {
			// Arrange
			const videoId = 'test-id';
			const invalidResponse = { data: 'invalid' };
			const mockFetch = createSuccessfulFetch(invalidResponse);
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getVideoStreams(videoId, mockFetch as unknown as typeof globalThis.fetch)).rejects.toThrow(
				'Unexpected response format for video streams'
			);
		});

		it('should throw error for null response', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch({ok: true, json: async () => null }); 
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getVideoStreams(videoId, mockFetch as unknown as typeof globalThis.fetch)).rejects.toThrow(
				'Unexpected response format for video streams'
			);
		});

		it('should throw error for string response', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch('invalid string');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getVideoStreams(videoId, mockFetch as unknown as typeof globalThis.fetch)).rejects.toThrow(
				'Unexpected response format for video streams'
			);
		});
	});

	// =============================================================================
	// Multiple Qualities Tests
	// =============================================================================

	describe('multiple quality handling', () => {
		it('should return streams with different resolutions', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoStreamsArrayResponse);

			// Act
			const result = await getVideoStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toHaveLength(3);
			expect(result[0].resolution).toBe('1920x1080');
			expect(result[1].resolution).toBe('1280x720');
			expect(result[2].resolution).toBe('854x480');
		});

		it('should return streams with different quality labels', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoStreamsArrayResponse);

			// Act
			const result = await getVideoStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result[0].quality).toBe('1080p');
			expect(result[1].quality).toBe('720p');
			expect(result[2].quality).toBe('480p');
		});

		it('should return streams with different bitrates', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoStreamsArrayResponse);

			// Act
			const result = await getVideoStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result[0].bitrate).toBe(5000000);
			expect(result[1].bitrate).toBe(2500000);
			expect(result[2].bitrate).toBe(1000000);
		});

		it('should return streams with unique itag values', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoStreamsArrayResponse);

			// Act
			const result = await getVideoStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const itags = result.map((stream) => stream.itag);
			const uniqueItags = new Set(itags);
			expect(uniqueItags.size).toBe(result.length);
		});
	});

	// =============================================================================
	// Stream Format Parsing Tests
	// =============================================================================

	describe('stream format parsing', () => {
		it('should correctly parse stream format', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch([mockVideoStream]);

			// Act
			const result = await getVideoStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result[0].format).toBe('MPEG_4');
		});

		it('should correctly parse stream codec', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch([mockVideoStream]);

			// Act
			const result = await getVideoStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result[0].codec).toBe('avc1.640028');
		});

		it('should correctly parse stream dimensions', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch([mockVideoStream]);

			// Act
			const result = await getVideoStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result[0].width).toBe(1920);
			expect(result[0].height).toBe(1080);
		});

		it('should correctly parse stream fps', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch([mockVideoStream]);

			// Act
			const result = await getVideoStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result[0].fps).toBe(30);
		});

		it('should correctly identify video-only streams', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch([mockVideoStream]);

			// Act
			const result = await getVideoStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result[0].videoOnly).toBe(true);
		});
	});

	// =============================================================================
	// URL Construction Tests
	// =============================================================================

	describe('API URL construction', () => {
		it('should construct correct API URL', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoStreamsArrayResponse);

			// Act
			await getVideoStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const callUrl = mockFetch.mock.calls[0][0] as string;
			expect(callUrl).toContain('http://localhost:8000/api/v1/streams/video');
			expect(callUrl).toContain(`id=${videoId}`);
		});

		it('should URL encode video ID', async () => {
			// Arrange
			const videoId = 'test-id&special=chars';
			const mockFetch = createSuccessfulFetch(mockVideoStreamsArrayResponse);

			// Act
			await getVideoStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const callUrl = mockFetch.mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.id).toBe(videoId);
		});
	});

	// =============================================================================
	// HTTP Error Tests
	// =============================================================================

	describe('HTTP error handling', () => {
		it('should throw error on 404 response', async () => {
			// Arrange
			const videoId = 'non-existent-id';
			const mockFetch = createFailedFetch(404, 'Not Found');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getVideoStreams(videoId, mockFetch)).rejects.toThrow(
				`Failed to fetch video streams for ${videoId}: 404 Not Found`
			);
		});

		it('should throw error on 500 response', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createFailedFetch(500, 'Internal Server Error');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getVideoStreams(videoId, mockFetch)).rejects.toThrow(
				/500 Internal Server Error/
			);
		});

		it('should log errors to console', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createFailedFetch(404, 'Not Found');
			consoleErrorMock = createMockConsoleError();

			// Act
			try {
				await getVideoStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);
			} catch (error) {
				console.error(error);
			}

			// Assert
			expect(consoleErrorMock.mock).toHaveBeenCalled();
		});
	});

	// =============================================================================
	// Network Error Tests
	// =============================================================================

	describe('network error handling', () => {
		it('should throw error on network failure', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createNetworkErrorFetch('Network error');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getVideoStreams(videoId, mockFetch)).rejects.toThrow(
				'Network error'
			);
		});

		it('should log network errors to console', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createNetworkErrorFetch('Connection failed');
			consoleErrorMock = createMockConsoleError();

			// Act
			try {
				await getVideoStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);
			} catch (error) {
				console.error(error);
			}

			// Assert
			expect(consoleErrorMock.mock).toHaveBeenCalledWith(
				'Error fetching video streams:',
				expect.any(Error)
			);
		});
	});
});

// =============================================================================
// getAudioStreams Tests
// =============================================================================

describe('getAudioStreams', () => {
	describe('successful audio stream requests', () => {
		it('should fetch audio streams with valid ID', async () => {
			// Arrange
			const videoId = 'test-video-id';
			const mockFetch = createSuccessfulFetch(mockAudioStreamsArrayResponse);

			// Act
			const result = await getAudioStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual(mockAudioStreamsArrayResponse);
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it('should return array of audio streams', async () => {
			// Arrange
			const videoId = 'abc123';
			const mockFetch = createSuccessfulFetch(mockAudioStreamsArrayResponse);

			// Act
			const result = await getAudioStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(mockAudioStreamsArrayResponse.length);
			expect(result[0]).toHaveProperty('id');
			expect(result[0]).toHaveProperty('codec');
			expect(result[0]).toHaveProperty('url');
		});

		it('should use default fetch when fetchFn not provided', async () => {
			// Arrange
			const videoId = 'test-id';
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				statusText: 'OK',
				json: vi.fn().mockResolvedValue(mockAudioStreamsArrayResponse)
			});

			// Act
			const result = await getAudioStreams(videoId);

			// Assert
			expect(result).toEqual(mockAudioStreamsArrayResponse);
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});
	});

	// =============================================================================
	// Response Format Handling Tests
	// =============================================================================

	describe('response format handling', () => {
		it('should handle array response format', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockAudioStreamsArrayResponse);

			// Act
			const result = await getAudioStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(Array.isArray(result)).toBe(true);
			expect(result).toEqual(mockAudioStreamsArrayResponse);
		});

		it('should handle object response format with streams property', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockAudioStreamsObjectResponse);

			// Act
			const result = await getAudioStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(Array.isArray(result)).toBe(true);
			expect(result).toEqual(mockAudioStreamsObjectResponse.streams);
		});

		it('should throw error for unexpected response format', async () => {
			// Arrange
			const videoId = 'test-id';
			const invalidResponse = { data: 'invalid' };
			const mockFetch = createSuccessfulFetch(invalidResponse);
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getAudioStreams(videoId, mockFetch as unknown as typeof globalThis.fetch)).rejects.toThrow(
				'Unexpected response format for audio streams'
			);
		});
	});

	// =============================================================================
	// Audio Stream Format Parsing Tests
	// =============================================================================

	describe('audio stream format parsing', () => {
		it('should correctly parse audio codec', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch([mockAudioStream]);

			// Act
			const result = await getAudioStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result[0].codec).toBe('mp4a.40.2');
		});

		it('should correctly parse audio format', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch([mockAudioStream]);

			// Act
			const result = await getAudioStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result[0].format).toBe('M4A');
		});

		it('should correctly parse audio bitrate', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch([mockAudioStream]);

			// Act
			const result = await getAudioStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result[0].bitrate).toBe(128000);
		});

		it('should correctly identify non-video streams', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch([mockAudioStream]);

			// Act
			const result = await getAudioStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result[0].videoOnly).toBe(false);
		});

		it('should parse audio language information when present', async () => {
			// Arrange
			const videoId = 'test-id';
			const audioStreamWithLang = {
				...mockAudioStream,
				itagItem: {
					...mockAudioStream.itagItem,
					audioTrackId: 'audio.en',
					audioTrackName: 'English',
					audioLocale: 'en'
				}
			};
			const mockFetch = createSuccessfulFetch([audioStreamWithLang]);

			// Act
			const result = await getAudioStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result[0].itagItem.audioTrackId).toBe('audio.en');
			expect(result[0].itagItem.audioTrackName).toBe('English');
			expect(result[0].itagItem.audioLocale).toBe('en');
		});
	});

	// =============================================================================
	// URL Construction Tests
	// =============================================================================

	describe('API URL construction', () => {
		it('should construct correct API URL', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockAudioStreamsArrayResponse);

			// Act
			await getAudioStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const callUrl = mockFetch.mock.calls[0][0] as string;
			expect(callUrl).toContain('http://localhost:8000/api/v1/streams/audio');
			expect(callUrl).toContain(`id=${videoId}`);
		});

		it('should URL encode video ID', async () => {
			// Arrange
			const videoId = 'test-id&special=chars';
			const mockFetch = createSuccessfulFetch(mockAudioStreamsArrayResponse);

			// Act
			await getAudioStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const callUrl = mockFetch.mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.id).toBe(videoId);
		});
	});

	// =============================================================================
	// HTTP Error Tests
	// =============================================================================

	describe('HTTP error handling', () => {
		it('should throw error on 404 response', async () => {
			// Arrange
			const videoId = 'non-existent-id';
			const mockFetch = createFailedFetch(404, 'Not Found');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getAudioStreams(videoId, mockFetch)).rejects.toThrow(
				`Failed to fetch audio streams for ${videoId}: 404 Not Found`
			);
		});

		it('should log errors to console', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createFailedFetch(500, 'Internal Server Error');
			consoleErrorMock = createMockConsoleError();

			// Act
			try {
				await getAudioStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);
			} catch (error) {
				console.error(error);
			}

			// Assert
			expect(consoleErrorMock.mock).toHaveBeenCalled();
		});
	});
});

// =============================================================================
// getAllStreams Tests
// =============================================================================

describe('getAllStreams', () => {
	describe('successful parallel fetching', () => {
		it('should fetch both video and audio streams', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = vi.fn()
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: vi.fn().mockResolvedValue(mockVideoStreamsArrayResponse)
				})
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: vi.fn().mockResolvedValue(mockAudioStreamsArrayResponse)
				});

			// Act
			const result = await getAllStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result.videoStreams).toEqual(mockVideoStreamsArrayResponse);
			expect(result.audioStreams).toEqual(mockAudioStreamsArrayResponse);
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});

		it('should return object with videoStreams and audioStreams', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = vi.fn()
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: vi.fn().mockResolvedValue(mockVideoStreamsArrayResponse)
				})
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: vi.fn().mockResolvedValue(mockAudioStreamsArrayResponse)
				});

			// Act
			const result = await getAllStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toHaveProperty('videoStreams');
			expect(result).toHaveProperty('audioStreams');
			expect(Array.isArray(result.videoStreams)).toBe(true);
			expect(Array.isArray(result.audioStreams)).toBe(true);
		});

		it('should call both video and audio endpoints', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = vi.fn()
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: vi.fn().mockResolvedValue(mockVideoStreamsArrayResponse)
				})
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: vi.fn().mockResolvedValue(mockAudioStreamsArrayResponse)
				});

			// Act
			await getAllStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const videoUrl = mockFetch.mock.calls[0][0] as string;
			const audioUrl = mockFetch.mock.calls[1][0] as string;
			expect(videoUrl).toContain('/streams/video');
			expect(audioUrl).toContain('/streams/audio');
		});

		it('should fetch streams in parallel', async () => {
			// Arrange
			const videoId = 'test-id';
			let videoResolved = false;
			let audioResolved = false;

			const mockFetch = vi.fn()
				.mockImplementationOnce(() =>
					new Promise((resolve) =>
						setTimeout(() => {
							videoResolved = true;
							resolve({
								ok: true,
								status: 200,
								json: vi.fn().mockResolvedValue(mockVideoStreamsArrayResponse)
							});
						}, 10)
					)
				)
				.mockImplementationOnce(() =>
					new Promise((resolve) =>
						setTimeout(() => {
							audioResolved = true;
							resolve({
								ok: true,
								status: 200,
								json: vi.fn().mockResolvedValue(mockAudioStreamsArrayResponse)
							});
						}, 10)
					)
				);

			// Act
			await getAllStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(videoResolved).toBe(true);
			expect(audioResolved).toBe(true);
		});
	});

	// =============================================================================
	// Error Handling Tests
	// =============================================================================

	describe('error handling', () => {
		it('should throw error if video streams fail', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = vi.fn()
				.mockResolvedValueOnce({
					ok: false,
					status: 404,
					statusText: 'Not Found',
					json: vi.fn().mockRejectedValue(new Error('Failed'))
				})
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: vi.fn().mockResolvedValue(mockAudioStreamsArrayResponse)
				});
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getAllStreams(videoId, mockFetch)).rejects.toThrow();
		});

		it('should throw error if audio streams fail', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = vi.fn()
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: vi.fn().mockResolvedValue(mockVideoStreamsArrayResponse)
				})
				.mockResolvedValueOnce({
					ok: false,
					status: 404,
					statusText: 'Not Found',
					json: vi.fn().mockRejectedValue(new Error('Failed'))
				});
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getAllStreams(videoId, mockFetch)).rejects.toThrow();
		});

		it('should throw error if both streams fail', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = vi.fn()
				.mockResolvedValue({
					ok: false,
					status: 500,
					statusText: 'Internal Server Error',
					json: vi.fn().mockRejectedValue(new Error('Failed'))
				});
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getAllStreams(videoId, mockFetch)).rejects.toThrow();
		});
	});

	// =============================================================================
	// Edge Cases
	// =============================================================================

	describe('edge cases', () => {
		it('should handle empty video streams array', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = vi.fn()
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: vi.fn().mockResolvedValue([])
				})
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: vi.fn().mockResolvedValue(mockAudioStreamsArrayResponse)
				});

			// Act
			const result = await getAllStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result.videoStreams).toEqual([]);
			expect(result.audioStreams).toEqual(mockAudioStreamsArrayResponse);
		});

		it('should handle empty audio streams array', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = vi.fn()
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: vi.fn().mockResolvedValue(mockVideoStreamsArrayResponse)
				})
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: vi.fn().mockResolvedValue([])
				});

			// Act
			const result = await getAllStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result.videoStreams).toEqual(mockVideoStreamsArrayResponse);
			expect(result.audioStreams).toEqual([]);
		});

		it('should handle both empty arrays', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = vi.fn()
				.mockResolvedValue({
					ok: true,
					status: 200,
					json: vi.fn().mockResolvedValue([])
				});

			// Act
			const result = await getAllStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result.videoStreams).toEqual([]);
			expect(result.audioStreams).toEqual([]);
		});
	});
});
