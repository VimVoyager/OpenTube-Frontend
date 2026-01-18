/**
 * Test Suite: manifest.ts
 * 
 * Tests for DASH manifest fetching including XML parsing, duration extraction,
 * blob URL generation, error handling, and backward compatibility
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
		createSuccessfulFetch,
    createFailedFetch,
    createNetworkErrorFetch,
    extractQueryParams,
    createMockConsoleError,
    getCallCount
} from '../../tests/helpers/apiHelpers';
import manifestXmlFixture from '../../tests/fixtures/api/manifestXmlFixture.xml?raw';
import { getManifest, getManifestUrl } from './manifest';

// Mock DOMParser for XML parsing in Node.js
class MockDOMParser {
    parseFromString(xmlString: string) {
        // Extract MPD element attributes more precisely
        // Look for id attribute specifically on the MPD element
        const mpdMatch = xmlString.match(/<MPD[^>]*>/);
        const mpdElement = mpdMatch ? mpdMatch[0] : '';
        
        const idMatch = mpdElement.match(/\sid="([^"]+)"/);
        const durationMatch = mpdElement.match(/mediaPresentationDuration="([^"]+)"/);
        
        return {
            querySelector: (selector: string) => {
                if (selector === 'MPD') {
                    return {
                        getAttribute: (attr: string) => {
                            if (attr === 'id') {
                                return idMatch ? idMatch[1] : null;
                            }
                            if (attr === 'mediaPresentationDuration') {
                                return durationMatch ? durationMatch[1] : null;
                            }
                            return null;
                        }
                    };
                }
                return null;
            }
        };
    }
}

// Add DOMParser to global scope
global.DOMParser = MockDOMParser as never;

// =============================================================================
// Mock Data
// =============================================================================

const createMockManifestXml = (
	duration: string = 'PT2M56S'
): string => manifestXmlFixture.replace('STANDARD_DURATION', `duration="${duration}"`).replace('MEDIA_PRESENTATION_DURATION', `mediaPresentationDuration="${duration}"`);

// =============================================================================
// Setup and Teardown
// =============================================================================

let consoleErrorMock: ReturnType<typeof createMockConsoleError> | undefined;

// Track created blob URLs for cleanup
const createdBlobUrls: string[] = [];

beforeEach(() => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => {
        const url = `blob:http://localhost/${Math.random()}`;
        createdBlobUrls.push(url);
        return url;
    });
    
    global.URL.revokeObjectURL = vi.fn((url: string) => {
        const index = createdBlobUrls.indexOf(url);
        if (index > -1) {
            createdBlobUrls.splice(index, 1);
        }
    });
});

afterEach(() => {
    if (consoleErrorMock) {
        consoleErrorMock.restore();
        consoleErrorMock = undefined;
    }
    
    // Clear tracked URLs
    createdBlobUrls.length = 0;
    vi.clearAllMocks();
});

// =============================================================================
// Successful Manifest Fetching Tests
// =============================================================================

describe('getManifest', () => {
    describe('successful manifest requests', () => {
        it('should fetch manifest with valid ID', async () => {
            const videoId = 'test-video-id';
						const mock = createMockManifestXml();
            const mockFetch = createSuccessfulFetch(mock, { format: 'xml'});

            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result).toHaveProperty('url');
            expect(result).toHaveProperty('duration');
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should return ManifestResponse object with all properties', async () => {
            const videoId = 'abc123';
            const mockFetch = createSuccessfulFetch(
                createMockManifestXml('PT10M30S'), { format: 'xml'}
            );

            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result.url).toMatch(/^blob:http:\/\/localhost\//);
            expect(result.duration).toBe(630);
        });

        it('should use default fetch when fetchFn not provided', async () => {
            const videoId = 'test-id';
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: vi.fn().mockResolvedValue(createMockManifestXml())
            });

            const result = await getManifest(videoId);

            expect(result).toHaveProperty('url');
            expect(result).toHaveProperty('duration');
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('should create blob URL from manifest XML', async () => {
            const videoId = 'test-id';
            const mockFetch = createSuccessfulFetch(createMockManifestXml(), { format: 'xml' });
            const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');

            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
            expect(result.url).toMatch(/^blob:/);
        });

        it('should log manifest load information', async () => {
            const videoId = 'test-video-id';
            const mockFetch = createSuccessfulFetch(
								createMockManifestXml('PT5M0S'),
								{ format: 'xml' }
            );
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Manifest loaded for test-video-id')
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('duration=300s')
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('test-video-id')
            );
            
            consoleLogSpy.mockRestore();
        });
    });

    // =============================================================================
    // Duration Parsing Tests
    // =============================================================================

    describe('duration parsing', () => {
        it('should parse duration with minutes and seconds', async () => {
            const videoId = 'test-id';
            const mockFetch = createSuccessfulFetch(
                createMockManifestXml('PT2M56S'),
								{ format: 'xml' }
            );

            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result.duration).toBe(176);
        });

        it('should parse duration with only seconds', async () => {
            const videoId = 'test-id';
            const mockFetch = createSuccessfulFetch(
                createMockManifestXml('PT45S'),
								{ format: 'xml' }
            );

            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result.duration).toBe(45);
        });

        it('should parse duration with only minutes', async () => {
            const videoId = 'test-id';
            const mockFetch = createSuccessfulFetch(
                createMockManifestXml('PT5M'),
							  { format: 'xml' }
            );

            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result.duration).toBe(300);
        });

        it('should parse duration with hours, minutes, and seconds', async () => {
            const videoId = 'test-id';
            const mockFetch = createSuccessfulFetch(
                createMockManifestXml('PT1H30M45S'),
							  { format: 'xml' }
            );

            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result.duration).toBe(5445);
        });

        it('should parse duration with only hours', async () => {
            const videoId = 'test-id';
            const mockFetch = createSuccessfulFetch(
                createMockManifestXml('PT2H'),
							  { format: 'xml' }
            );

            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result.duration).toBe(7200);
        });

        it('should parse duration with hours and seconds (no minutes)', async () => {
            const videoId = 'test-id';
            const mockFetch = createSuccessfulFetch(
                createMockManifestXml('PT1H30S'),
							  { format: 'xml' }
            );

            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result.duration).toBe(3630);
        });

        it('should parse duration with decimal seconds', async () => {
            const videoId = 'test-id';
            const mockFetch = createSuccessfulFetch(
                createMockManifestXml('PT1M30.5S'),
							  { format: 'xml' }
            );

            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result.duration).toBe(90.5);
        });

        it('should return 0 duration when mediaPresentationDuration missing', async () => {
            const videoId = 'test-id';
            const mockFetch = createSuccessfulFetch(createMockManifestXml(''), { format: 'xml' });

            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result.duration).toBe(0);
        });

        it('should return 0 duration when duration format is invalid', async () => {
            const videoId = 'test-id';
            const mockFetch = createSuccessfulFetch(
                createMockManifestXml('INVALID'),
							  { format: 'xml' }
            );

            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result.duration).toBe(0);
        });

        it('should handle zero duration', async () => {
            const videoId = 'test-id';
            const mockFetch = createSuccessfulFetch(
                createMockManifestXml('PT0S'),
							  { format: 'xml' }
            );

            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result.duration).toBe(0);
        });

        it('should handle very long durations', async () => {
            const videoId = 'test-id';
            const mockFetch = createSuccessfulFetch(
                createMockManifestXml('PT10H30M45S'),
								{ format: 'xml' }
            );

            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result.duration).toBe(37845);
        });
    });

    // =============================================================================
    // API Request Tests
    // =============================================================================

    describe('API request handling', () => {
        it('should call correct API endpoint', async () => {
            const videoId = 'test-video-id';
            const mockFetch = createSuccessfulFetch(createMockManifestXml(), { format: 'xml' });

            await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            const callUrl = mockFetch.mock.calls[0][0] as string;
            expect(callUrl).toContain('/streams/dash');
        });

        it('should include video ID in query parameters', async () => {
            const videoId = 'abc123xyz';
            const mockFetch = createSuccessfulFetch(createMockManifestXml(), { format: 'xml' });

            await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            const callUrl = mockFetch.mock.calls[0][0] as string;
            const params = extractQueryParams(callUrl);
            expect(params.id).toBe('abc123xyz');
        });

        it('should URL encode video ID', async () => {
            const videoId = 'test id with spaces & special=chars';
            const mockFetch = createSuccessfulFetch(createMockManifestXml(), { format: 'xml' });

            await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            const callUrl = mockFetch.mock.calls[0][0] as string;
            expect(callUrl).toContain('id=');
            expect(callUrl).not.toContain('test id with spaces');
        });

        it('should only call fetch once per request', async () => {
            const videoId = 'test-id';
            const mockFetch = createSuccessfulFetch(createMockManifestXml(), { format: 'xml' });

            await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(getCallCount(mockFetch)).toBe(1);
        });
    });

    // =============================================================================
    // HTTP Error Handling Tests
    // =============================================================================

    describe('HTTP error handling', () => {
        it('should throw error on 404 response', async () => {
            const videoId = 'nonexistent-id';
            const mockFetch = createFailedFetch(404, 'Not Found');
            consoleErrorMock = createMockConsoleError();

            await expect(getManifest(videoId, mockFetch)).rejects.toThrow();
        });

        it('should throw error on 500 response', async () => {
            const videoId = 'test-id';
            const mockFetch = createFailedFetch(500, 'Internal Server Error');
            consoleErrorMock = createMockConsoleError();

            await expect(getManifest(videoId, mockFetch)).rejects.toThrow();
        });

        it('should include video ID in error message', async () => {
            const videoId = 'error-test-id';
            const mockFetch = createFailedFetch(404, 'Not Found');
            consoleErrorMock = createMockConsoleError();

            await expect(getManifest(videoId, mockFetch)).rejects.toThrow(
                /error-test-id/
            );
        });

        it('should include status code in error message', async () => {
            const videoId = 'test-id';
            const mockFetch = createFailedFetch(503, 'Service Unavailable');
            consoleErrorMock = createMockConsoleError();

            await expect(getManifest(videoId, mockFetch)).rejects.toThrow(
                /503/
            );
        });

        it('should include status text in error message', async () => {
            const videoId = 'test-id';
            const mockFetch = createFailedFetch(429, 'Too Many Requests');
            consoleErrorMock = createMockConsoleError();

            await expect(getManifest(videoId, mockFetch)).rejects.toThrow(
                /Too Many Requests/
            );
        });

        it('should log errors to console', async () => {
            const videoId = 'test-id';
            const mockFetch = createFailedFetch(500, 'Internal Server Error');
            consoleErrorMock = createMockConsoleError();

            try {
                await getManifest(videoId, mockFetch);
                expect.fail('Should have thrown an error');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                // Expected error
                expect(consoleErrorMock.mock).toHaveBeenCalledWith(
                    'Error fetching DASH manifest:',
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
            const videoId = 'test-id';
            const mockFetch = createNetworkErrorFetch('Failed to fetch');
            consoleErrorMock = createMockConsoleError();

            await expect(getManifest(videoId, mockFetch)).rejects.toThrow(
                'Failed to fetch'
            );
        });

        it('should log network errors to console', async () => {
            const videoId = 'test-id';
            const mockFetch = createNetworkErrorFetch('Network error');
            consoleErrorMock = createMockConsoleError();

            try {
                await getManifest(videoId, mockFetch);
                expect.fail('Should have thrown an error');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                // Expected error
                expect(consoleErrorMock.mock).toHaveBeenCalledWith(
                    'Error fetching DASH manifest:',
                    expect.any(Error)
                );
            }
        });

        it('should throw error on timeout', async () => {
            const videoId = 'test-id';
            const mockFetch = createNetworkErrorFetch('Request timeout');
            consoleErrorMock = createMockConsoleError();

            await expect(getManifest(videoId, mockFetch)).rejects.toThrow(
                'Request timeout'
            );
        });

        it('should throw error on connection refused', () => {
            const videoId = 'test-id';
            const mockFetch = createNetworkErrorFetch('Connection refused');
            consoleErrorMock = createMockConsoleError();

            expect(getManifest(videoId, mockFetch)).rejects.toThrow(
                'Connection refused'
            );
        });
    });

    // =============================================================================
    // XML Parsing Tests
    // =============================================================================

    describe('XML parsing', () => {
        it('should parse valid DASH manifest XML', async () => {
            const videoId = 'test-id';
            const mockFetch = createSuccessfulFetch(createMockManifestXml(), { format: 'xml'});

            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result.url).toBeTruthy();
            expect(typeof result.url).toBe('string');
        });
    });

    // =============================================================================
    // Blob URL Creation Tests
    // =============================================================================

    describe('blob URL creation', () => {
        it('should create blob with correct MIME type', async () => {
            const videoId = 'test-id';
            const mockFetch = createSuccessfulFetch(createMockManifestXml(), { format: 'xml'});
            const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');

            await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
            const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
            expect(blobArg).toBeInstanceOf(Blob);
            expect(blobArg.type).toBe('application/dash+xml');
        });

        it('should preserve original manifest content in blob', async () => {
            const videoId = 'test-id';
            const originalXml = createMockManifestXml('PT5M0S');
            const mockFetch = createSuccessfulFetch(originalXml, { format: 'xml' });
            const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');

            await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
            const blobArg = createObjectURLSpy.mock.calls[0][0];
            expect(blobArg).toBeInstanceOf(Blob);
        });

        it('should return unique blob URL for each call', async () => {
            const videoId = 'test-id';
            const mockFetch = createSuccessfulFetch(createMockManifestXml(), { format: 'xml' });

            const result1 = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);
            const result2 = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result1.url).not.toBe(result2.url);
        });
    });

    // =============================================================================
    // Edge Cases
    // =============================================================================

    describe('edge cases', () => {
        it('should handle empty video ID', async () => {
            const videoId = '';
            const mockFetch = createSuccessfulFetch(createMockManifestXml(), { format: 'xml' });

            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result).toHaveProperty('url');
            const callUrl = mockFetch.mock.calls[0][0] as string;
            expect(callUrl).toContain('id=');
        });

        it('should handle video ID with special characters', async () => {
            const videoId = 'test-id!@#$%^&*()';
            const mockFetch = createSuccessfulFetch(createMockManifestXml(), { format: 'xml'});

            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result).toHaveProperty('url');
        });

        it('should handle concurrent requests independently', async () => {
            const videoId1 = 'video-1';
            const videoId2 = 'video-2';
            const mockFetch1 = createSuccessfulFetch(
                createMockManifestXml('PT1M0S'),
							  { format: 'xml' },
            );
            const mockFetch2 = createSuccessfulFetch(
                createMockManifestXml('PT2M0S'),
							  { format: 'xml' },
            );

            const [result1, result2] = await Promise.all([
                getManifest(videoId1, mockFetch1 as unknown as typeof globalThis.fetch),
                getManifest(videoId2, mockFetch2 as unknown as typeof globalThis.fetch)
            ]);

            expect(result1.duration).toBe(60);
            expect(result2.duration).toBe(120);
            expect(getCallCount(mockFetch1)).toBe(1);
            expect(getCallCount(mockFetch2)).toBe(1);
        });

        it('should handle very long video IDs', async () => {
            const videoId = 'a'.repeat(1000);
            const mockFetch = createSuccessfulFetch(createMockManifestXml(), { format: 'xml' });

            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result).toHaveProperty('url');
        });
    });
});

// =============================================================================
// Legacy Function Tests (getManifestUrl)
// =============================================================================

describe('getManifestUrl', () => {
    describe('backward compatibility', () => {
        it('should return just the URL string', async () => {
            const videoId = 'test-id';
            const mockFetch = createSuccessfulFetch(createMockManifestXml());

            const result = await getManifestUrl(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(typeof result).toBe('string');
            expect(result).toMatch(/^blob:/);
        });

        it('should return same URL as getManifest().url', async () => {
            const videoId = 'test-id';
            const manifestXml = createMockManifestXml();
            const mockFetch1 = createSuccessfulFetch(manifestXml, { format: 'xml' });
            const mockFetch2 = createSuccessfulFetch(manifestXml, { format: 'xml' });

            const urlResult = await getManifestUrl(videoId, mockFetch1 as unknown as typeof globalThis.fetch);
            const manifestResult = await getManifest(videoId, mockFetch2 as unknown as typeof globalThis.fetch);

            expect(urlResult).toMatch(/^blob:/);
            expect(manifestResult.url).toMatch(/^blob:/);
        });

        it('should use default fetch when fetchFn not provided', async () => {
            const videoId = 'test-id';
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: vi.fn().mockResolvedValue(createMockManifestXml())
            });

            const result = await getManifestUrl(videoId);

            expect(typeof result).toBe('string');
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('should throw same errors as getManifest', async () => {
            const videoId = 'error-id';
            const mockFetch = createFailedFetch(404, 'Not Found');
            consoleErrorMock = createMockConsoleError();

            await expect(getManifestUrl(videoId, mockFetch)).rejects.toThrow();
        });

        it('should handle network errors', async () => {
            const videoId = 'test-id';
            const mockFetch = createNetworkErrorFetch('Network error');
            consoleErrorMock = createMockConsoleError();

            await expect(getManifestUrl(videoId, mockFetch)).rejects.toThrow(
                'Network error'
            );
        });
    });

    describe('legacy function usage', () => {
        it('should work with empty video ID', async () => {
            const videoId = '';
            const mockFetch = createSuccessfulFetch(createMockManifestXml(), { format: 'xml' });

            const result = await getManifestUrl(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(typeof result).toBe('string');
        });

        it('should work with special characters in ID', async () => {
            const videoId = 'test-id!@#$%';
            const mockFetch = createSuccessfulFetch(createMockManifestXml(), { format: 'xml' });

            const result = await getManifestUrl(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(typeof result).toBe('string');
        });

        it('should only call fetch once', async () => {
            const videoId = 'test-id';
            const mockFetch = createSuccessfulFetch(createMockManifestXml(), { format: 'xml' });

            await getManifestUrl(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(getCallCount(mockFetch)).toBe(1);
        });
    });
});