import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page';
import type { SearchResult } from '$lib/types';
import type { SearchResultConfig } from '$lib/adapters/types';

// Mock the search API
vi.mock('$lib/api/search', () => ({
    getSearchResults: vi.fn()
}));

// Mock the search adapter
vi.mock('$lib/adapters/search', () => ({
    adaptSearchResults: vi.fn()
}));

// Mock asset imports
vi.mock('$lib/assets/thumbnail-placeholder.jpg', () => ({
    default: '/placeholder-thumbnail.jpg'
}));

vi.mock('$lib/assets/logo-placeholder.svg', () => ({
    default: '/placeholder-avatar.svg'
}));

import { getSearchResults } from '$lib/api/search';
import { adaptSearchResults } from '$lib/adapters/search';

describe('+page.ts load function', () => {
    const mockFetch = vi.fn() as unknown as typeof globalThis.fetch;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Successful data loading', () => {
        it('should fetch and adapt search results with query parameter', async () => {
            // Arrange
            const mockSearchData: SearchResult = {
                searchString: 'test query',
                items: [
                    {
                        type: 'stream',
                        name: 'Test Video',
                        url: '/watch?v=test123',
                        thumbnailUrl: 'https://example.com/thumb.jpg',
                        uploaderName: 'Test Channel',
                        uploaderUrl: '/channel/test',
                        uploaderAvatarUrl: 'https://example.com/avatar.jpg',
                        uploaderVerified: true,
                        viewCount: 1000,
                        duration: 300,
                        uploadDate: '2023-05-15',
                        description: 'Test description'
                    }
                ]
            };

            const mockAdaptedResults: SearchResultConfig[] = [
                {
                    id: 'test123',
                    url: '/watch?v=test123',
                    title: 'Test Video',
                    thumbnail: 'https://example.com/thumb.jpg',
                    channelName: 'Test Channel',
                    channelUrl: '/channel/test',
                    channelAvatar: 'https://example.com/avatar.jpg',
                    verified: true,
                    viewCount: 1000,
                    duration: 300,
                    uploadDate: '2023-05-15',
                    description: 'Test description',
                    type: 'stream'
                }
            ];

            vi.mocked(getSearchResults).mockResolvedValue(mockSearchData);
            vi.mocked(adaptSearchResults).mockReturnValue(mockAdaptedResults);

            const url = new URL('http://localhost/results?query=test+query&sort=asc');

            // Act
            const result = await load({ url, fetch: mockFetch } as any);

            // Assert
            expect(getSearchResults).toHaveBeenCalledWith('test query', 'asc', mockFetch);
            expect(adaptSearchResults).toHaveBeenCalledWith(
                mockSearchData,
                '/placeholder-thumbnail.jpg',
                '/placeholder-avatar.svg'
            );
            expect(result).toEqual({
                results: mockAdaptedResults,
                query: 'test query',
                sortFilter: 'asc',
                error: null
            });
        });

        it('should use default sort filter when not provided', async () => {
            // Arrange
            const mockSearchData: SearchResult = {
                searchString: 'test',
                items: []
            };

            vi.mocked(getSearchResults).mockResolvedValue(mockSearchData);
            vi.mocked(adaptSearchResults).mockReturnValue([]);

            const url = new URL('http://localhost/results?query=test');

            // Act
            const result = await load({ url, fetch: mockFetch } as any);

            // Assert
            expect(getSearchResults).toHaveBeenCalledWith('test', 'asc', mockFetch);
            expect(result.sortFilter).toBe('asc');
        });

        it('should handle custom sort filter parameter', async () => {
            // Arrange
            const mockSearchData: SearchResult = {
                searchString: 'test',
                items: []
            };

            vi.mocked(getSearchResults).mockResolvedValue(mockSearchData);
            vi.mocked(adaptSearchResults).mockReturnValue([]);

            const url = new URL('http://localhost/results?query=test&sort=date');

            // Act
            const result = await load({ url, fetch: mockFetch } as any);

            // Assert
            expect(getSearchResults).toHaveBeenCalledWith('test', 'date', mockFetch);
            expect(result.sortFilter).toBe('date');
        });
    });

    describe('Empty query handling', () => {
        it('should return empty results when query is missing', async () => {
            // Arrange
            const url = new URL('http://localhost/results');

            // Act
            const result = await load({ url, fetch: mockFetch } as any);

            // Assert
            expect(getSearchResults).not.toHaveBeenCalled();
            expect(result).toEqual({
                results: [],
                query: '',
                error: null
            });
        });

        it('should return empty results when query is empty string', async () => {
            // Arrange
            const url = new URL('http://localhost/results?query=');

            // Act
            const result = await load({ url, fetch: mockFetch } as any);

            // Assert
            expect(getSearchResults).not.toHaveBeenCalled();
            expect(result).toEqual({
                results: [],
                query: '',
                error: null
            });
        });

        it('should return empty results when query is only whitespace', async () => {
            // Arrange
            const url = new URL('http://localhost/results?query=   ');

            // Act
            const result = await load({ url, fetch: mockFetch } as any);

            // Assert
            expect(getSearchResults).not.toHaveBeenCalled();
            expect(result).toEqual({
                results: [],
                query: '',
                error: null
            });
        });
    });

    describe('Error handling', () => {
        it('should handle API errors gracefully', async () => {
            // Arrange
            const errorMessage = 'Network error';
            vi.mocked(getSearchResults).mockRejectedValue(new Error(errorMessage));

            const url = new URL('http://localhost/results?query=test');

            // Act
            const result = await load({ url, fetch: mockFetch } as any);

            // Assert
            expect(result).toEqual({
                results: [],
                query: 'test',
                sortFilter: 'asc',
                error: errorMessage
            });
        });

        it('should handle non-Error exceptions', async () => {
            // Arrange
            vi.mocked(getSearchResults).mockRejectedValue('Something went wrong');

            const url = new URL('http://localhost/results?query=test');

            // Act
            const result = await load({ url, fetch: mockFetch } as any);

            // Assert
            expect(result).toEqual({
                results: [],
                query: 'test',
                sortFilter: 'asc',
                error: 'Failed to load search results'
            });
        });

        it('should handle adapter errors', async () => {
            // Arrange
            const mockSearchData: SearchResult = {
                searchString: 'test',
                items: []
            };

            vi.mocked(getSearchResults).mockResolvedValue(mockSearchData);
            vi.mocked(adaptSearchResults).mockImplementation(() => {
                throw new Error('Adapter error');
            });

            const url = new URL('http://localhost/results?query=test');

            // Act
            const result = await load({ url, fetch: mockFetch } as any);

            // Assert
            expect(result).toEqual({
                results: [],
                query: 'test',
                sortFilter: 'asc',
                error: 'Adapter error'
            });
        });
    });

    describe('Data transformation', () => {
        it('should pass placeholder images to adapter', async () => {
            // Arrange
            const mockSearchData: SearchResult = {
                searchString: 'test',
                items: []
            };

            vi.mocked(getSearchResults).mockResolvedValue(mockSearchData);
            vi.mocked(adaptSearchResults).mockReturnValue([]);

            const url = new URL('http://localhost/results?query=test');

            // Act
            await load({ url, fetch: mockFetch } as any);

            // Assert
            expect(adaptSearchResults).toHaveBeenCalledWith(
                mockSearchData,
                '/placeholder-thumbnail.jpg',
                '/placeholder-avatar.svg'
            );
        });

        it('should handle empty search results', async () => {
            // Arrange
            const mockSearchData: SearchResult = {
                searchString: 'test',
                items: []
            };

            vi.mocked(getSearchResults).mockResolvedValue(mockSearchData);
            vi.mocked(adaptSearchResults).mockReturnValue([]);

            const url = new URL('http://localhost/results?query=test');

            // Act
            const result = await load({ url, fetch: mockFetch } as any);

            // Assert
            expect(result.results).toEqual([]);
            expect(result.error).toBeNull();
        });

        it('should preserve query in response', async () => {
            // Arrange
            const mockSearchData: SearchResult = {
                searchString: 'complex search query',
                items: []
            };

            vi.mocked(getSearchResults).mockResolvedValue(mockSearchData);
            vi.mocked(adaptSearchResults).mockReturnValue([]);

            const url = new URL('http://localhost/results?query=complex+search+query');

            // Act
            const result = await load({ url, fetch: mockFetch } as any);

            // Assert
            expect(result.query).toBe('complex search query');
        });
    });

    describe('Type safety', () => {
        it('should return correctly typed SearchResultConfig array', async () => {
            // Arrange
            const mockSearchData: SearchResult = {
                searchString: 'test',
                items: []
            };

            const mockAdaptedResults: SearchResultConfig[] = [
                {
                    id: 'test123',
                    url: '/watch?v=test123',
                    title: 'Test Video',
                    thumbnail: 'https://example.com/thumb.jpg',
                    channelName: 'Test Channel',
                    channelUrl: '/channel/test',
                    channelAvatar: 'https://example.com/avatar.jpg',
                    verified: true,
                    viewCount: 1000,
                    duration: 300,
                    uploadDate: '2023-05-15',
                    description: 'Test description',
                    type: 'stream'
                }
            ];

            vi.mocked(getSearchResults).mockResolvedValue(mockSearchData);
            vi.mocked(adaptSearchResults).mockReturnValue(mockAdaptedResults);

            const url = new URL('http://localhost/results?query=test');

            // Act
            const result = await load({ url, fetch: mockFetch } as any);

            // Assert
            expect(result.results).toBe(mockAdaptedResults);
            expect(Array.isArray(result.results)).toBe(true);
            if (result.results.length > 0) {
                expect(result.results[0]).toHaveProperty('id');
                expect(result.results[0]).toHaveProperty('title');
                expect(result.results[0]).toHaveProperty('channelName');
            }
        });
    });
});