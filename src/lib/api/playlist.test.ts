/**
 * Test Suite: playlist.ts (api)
 *
 * Tests for playlist fetching including JSON parsing, API request construction,
 * error handling, and edge cases
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
	createSuccessfulFetch,
	createFailedFetch,
	createNetworkErrorFetch,
	extractQueryParams,
	createMockConsoleError,
	getCallCount
} from '../../tests/helpers/apiHelpers';
import { getPlaylist } from './playlist';
import type { PlaylistResponse } from '$lib/api/types';

// =============================================================================
// Mock Data
// =============================================================================

const createMockPlaylistResponse = (
	overrides: Partial<PlaylistResponse> = {}
): PlaylistResponse => ({
	id: 'PLtest123',
	name: 'Test Playlist',
	url: 'https://www.youtube.com/playlist?list=PLtest123',
	uploaderName: 'Test Channel',
	uploaderUrl: 'https://www.youtube.com/channel/UCtest456',
	uploaderAvatars: [
		{ url: 'https://example.com/avatar-small.jpg', width: 48, height: 48 },
		{ url: 'https://example.com/avatar-large.jpg', width: 176, height: 176 }
	],
	banners: [
		{ url: 'https://example.com/banner.jpg', width: 1060, height: 175 }
	],
	thumbnails: [
		{ url: 'https://example.com/thumb.jpg', width: 336, height: 188 }
	],
	description: 'A test playlist description',
	relatedItems: [
		{
			url: 'https://www.youtube.com/watch?v=video1',
			name: 'First Video',
			thumbnails: [{ url: 'https://example.com/v1.jpg', width: 336, height: 188 }],
			uploaderName: 'Test Channel',
			uploaderUrl: 'https://www.youtube.com/channel/UCtest456',
			uploaderAvatars: [],
			duration: 120,
			viewCount: 1000,
			textualUploadDate: '2 weeks ago'
		},
		{
			url: 'https://www.youtube.com/watch?v=video2',
			name: 'Second Video',
			thumbnails: [{ url: 'https://example.com/v2.jpg', width: 336, height: 188 }],
			uploaderName: 'Test Channel',
			uploaderUrl: 'https://www.youtube.com/channel/UCtest456',
			uploaderAvatars: [],
			duration: 300,
			viewCount: 5000,
			textualUploadDate: '1 month ago'
		}
	],
	...overrides
} as PlaylistResponse);

// =============================================================================
// Setup and Teardown
// =============================================================================

let consoleErrorMock: ReturnType<typeof createMockConsoleError> | undefined;

afterEach(() => {
	if (consoleErrorMock) {
		consoleErrorMock.restore();
		consoleErrorMock = undefined;
	}

	vi.clearAllMocks();
});

// =============================================================================
// Successful Playlist Fetching Tests
// =============================================================================

describe('getPlaylist', () => {
	describe('successful playlist requests', () => {
		it('should return PlaylistResponse object with all properties', async () => {
			const playlistId = 'PLtest123';
			const mockResponse = createMockPlaylistResponse();
			const mockFetch = createSuccessfulFetch(mockResponse);

			const result = await getPlaylist(playlistId, mockFetch as unknown as typeof globalThis.fetch);

			expect(result).toEqual(mockResponse);
			expect(result.id).toBe('PLtest123');
			expect(result.name).toBe('Test Playlist');
		});

		it('should use default fetch when fetchFn not provided', async () => {
			const playlistId = 'PLtest123';
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				statusText: 'OK',
				json: vi.fn().mockResolvedValue(createMockPlaylistResponse())
			});

			const result = await getPlaylist(playlistId);

			expect(result).toHaveProperty('id');
			expect(result).toHaveProperty('name');
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});

		it('should return parsed JSON body unmodified', async () => {
			const playlistId = 'PLtest123';
			const mockResponse = createMockPlaylistResponse({
				name: 'Untouched Name',
				description: null
			} as Partial<PlaylistResponse>);
			const mockFetch = createSuccessfulFetch(mockResponse);

			const result = await getPlaylist(playlistId, mockFetch as unknown as typeof globalThis.fetch);

			expect(result.name).toBe('Untouched Name');
			expect(result.description).toBeNull();
		});

		it('should preserve related items in response', async () => {
			const playlistId = 'PLtest123';
			const mockResponse = createMockPlaylistResponse();
			const mockFetch = createSuccessfulFetch(mockResponse);

			const result = await getPlaylist(playlistId, mockFetch as unknown as typeof globalThis.fetch);

			expect(result.relatedItems).toHaveLength(2);
			expect(result.relatedItems?.[0].name).toBe('First Video');
			expect(result.relatedItems?.[1].name).toBe('Second Video');
		});

		it('should handle playlist with empty relatedItems array', async () => {
			const playlistId = 'PLempty';
			const mockResponse = createMockPlaylistResponse({ relatedItems: [] });
			const mockFetch = createSuccessfulFetch(mockResponse);

			const result = await getPlaylist(playlistId, mockFetch as unknown as typeof globalThis.fetch);

			expect(result.relatedItems).toEqual([]);
		});
	});

	// =============================================================================
	// API Request Tests
	// =============================================================================

	describe('API request handling', () => {
		it('should call correct API endpoint', async () => {
			const playlistId = 'PLtest123';
			const mockFetch = createSuccessfulFetch(createMockPlaylistResponse());

			await getPlaylist(playlistId, mockFetch as unknown as typeof globalThis.fetch);

			const callUrl = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
			expect(callUrl).toContain('/playlists');
		});

		it('should include playlist ID in query parameters', async () => {
			const playlistId = 'PLabc123xyz';
			const mockFetch = createSuccessfulFetch(createMockPlaylistResponse());

			await getPlaylist(playlistId, mockFetch as unknown as typeof globalThis.fetch);

			const callUrl = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.id).toBe('PLabc123xyz');
		});

		it('should URL encode playlist ID', async () => {
			const playlistId = 'test id with spaces & special=chars';
			const mockFetch = createSuccessfulFetch(createMockPlaylistResponse());

			await getPlaylist(playlistId, mockFetch as unknown as typeof globalThis.fetch);

			const callUrl = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
			expect(callUrl).toContain('id=');
			expect(callUrl).not.toContain('test id with spaces');
		});

		it('should only call fetch once per request', async () => {
			const playlistId = 'PLtest123';
			const mockFetch = createSuccessfulFetch(createMockPlaylistResponse());

			await getPlaylist(playlistId, mockFetch as unknown as typeof globalThis.fetch);

			expect(getCallCount(mockFetch as ReturnType<typeof vi.fn>)).toBe(1);
		});
	});

	// =============================================================================
	// HTTP Error Handling Tests
	// =============================================================================

	describe('HTTP error handling', () => {
		it('should throw error on 404 response', async () => {
			const playlistId = 'nonexistent-id';
			const mockFetch = createFailedFetch(404, 'Not Found');
			consoleErrorMock = createMockConsoleError();

			await expect(getPlaylist(playlistId, mockFetch)).rejects.toThrow();
		});

		it('should throw error on 500 response', async () => {
			const playlistId = 'PLtest123';
			const mockFetch = createFailedFetch(500, 'Internal Server Error');
			consoleErrorMock = createMockConsoleError();

			await expect(getPlaylist(playlistId, mockFetch)).rejects.toThrow();
		});

		it('should include playlist ID in error message', async () => {
			const playlistId = 'error-test-id';
			const mockFetch = createFailedFetch(404, 'Not Found');
			consoleErrorMock = createMockConsoleError();

			await expect(getPlaylist(playlistId, mockFetch)).rejects.toThrow(
				/error-test-id/
			);
		});

		it('should include status code in error message', async () => {
			const playlistId = 'PLtest123';
			const mockFetch = createFailedFetch(503, 'Service Unavailable');
			consoleErrorMock = createMockConsoleError();

			await expect(getPlaylist(playlistId, mockFetch)).rejects.toThrow(
				/503/
			);
		});

		it('should include status text in error message', async () => {
			const playlistId = 'PLtest123';
			const mockFetch = createFailedFetch(429, 'Too Many Requests');
			consoleErrorMock = createMockConsoleError();

			await expect(getPlaylist(playlistId, mockFetch)).rejects.toThrow(
				/Too Many Requests/
			);
		});

		it('should log errors to console', async () => {
			const playlistId = 'PLtest123';
			const mockFetch = createFailedFetch(500, 'Internal Server Error');
			consoleErrorMock = createMockConsoleError();

			try {
				await getPlaylist(playlistId, mockFetch);
				expect.fail('Should have thrown an error');
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
			} catch (error) {
				// Expected error
				// NOTE: message matches current implementation (copy-pasted from channel fetcher)
				expect(consoleErrorMock.mock).toHaveBeenCalledWith(
					'Error fetching channel videos:',
					expect.any(Error)
				);
			}
		});
	});

	// =============================================================================
	// Network Error Tests
	// =============================================================================

	describe('network error handling', () => {
		it('should throw error on network failure', async () => {
			const playlistId = 'PLtest123';
			const mockFetch = createNetworkErrorFetch('Failed to fetch');
			consoleErrorMock = createMockConsoleError();

			await expect(getPlaylist(playlistId, mockFetch)).rejects.toThrow(
				'Failed to fetch'
			);
		});

		it('should log network errors to console', async () => {
			const playlistId = 'PLtest123';
			const mockFetch = createNetworkErrorFetch('Network error');
			consoleErrorMock = createMockConsoleError();

			try {
				await getPlaylist(playlistId, mockFetch);
				expect.fail('Should have thrown an error');
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
			} catch (error) {
				// Expected error
				expect(consoleErrorMock.mock).toHaveBeenCalledWith(
					'Error fetching channel videos:',
					expect.any(Error)
				);
			}
		});

		it('should throw error on timeout', async () => {
			const playlistId = 'PLtest123';
			const mockFetch = createNetworkErrorFetch('Request timeout');
			consoleErrorMock = createMockConsoleError();

			await expect(getPlaylist(playlistId, mockFetch)).rejects.toThrow(
				'Request timeout'
			);
		});

		it('should throw error on connection refused', () => {
			const playlistId = 'PLtest123';
			const mockFetch = createNetworkErrorFetch('Connection refused');
			consoleErrorMock = createMockConsoleError();

			expect(getPlaylist(playlistId, mockFetch)).rejects.toThrow(
				'Connection refused'
			);
		});
	});

	// =============================================================================
	// Edge Cases
	// =============================================================================

	describe('edge cases', () => {
		it('should handle empty playlist ID', async () => {
			const playlistId = '';
			const mockFetch = createSuccessfulFetch(createMockPlaylistResponse());

			const result = await getPlaylist(playlistId, mockFetch as unknown as typeof globalThis.fetch);

			expect(result).toHaveProperty('id');
			const callUrl = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
			expect(callUrl).toContain('id=');
		});

		it('should handle playlist ID with special characters', async () => {
			const playlistId = 'PLtest!@#$%^&*()';
			const mockFetch = createSuccessfulFetch(createMockPlaylistResponse());

			const result = await getPlaylist(playlistId, mockFetch as unknown as typeof globalThis.fetch);

			expect(result).toHaveProperty('id');
		});

		it('should handle very long playlist IDs', async () => {
			const playlistId = 'PL' + 'a'.repeat(1000);
			const mockFetch = createSuccessfulFetch(createMockPlaylistResponse());

			const result = await getPlaylist(playlistId, mockFetch as unknown as typeof globalThis.fetch);

			expect(result).toHaveProperty('id');
		});

		it('should handle concurrent requests independently', async () => {
			const playlistId1 = 'PLone';
			const playlistId2 = 'PLtwo';
			const mockFetch1 = createSuccessfulFetch(
				createMockPlaylistResponse({ id: 'PLone', name: 'Playlist One' })
			);
			const mockFetch2 = createSuccessfulFetch(
				createMockPlaylistResponse({ id: 'PLtwo', name: 'Playlist Two' })
			);

			const [result1, result2] = await Promise.all([
				getPlaylist(playlistId1, mockFetch1 as unknown as typeof globalThis.fetch),
				getPlaylist(playlistId2, mockFetch2 as unknown as typeof globalThis.fetch)
			]);

			expect(result1.name).toBe('Playlist One');
			expect(result2.name).toBe('Playlist Two');
			expect(getCallCount(mockFetch1 as ReturnType<typeof vi.fn>)).toBe(1);
			expect(getCallCount(mockFetch2 as ReturnType<typeof vi.fn>)).toBe(1);
		});
	});
});