/**
 * Test Suite: manifest.ts
 * 
 * Tests for DASH manifest fetching including XML parsing, duration extraction,
 * blob URL generation, error handling, and backward compatibility
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

// Mock SvelteKit environment module
vi.mock('$env/static/public', () => ({
    PUBLIC_API_URL: 'http://localhost:8080'
}));

import { getManifest, getManifestUrl } from './manifest';
import {
    createFailedFetch,
    createNetworkErrorFetch,
    extractQueryParams,
    createMockConsoleError,
    getCallCount
} from '../../tests/helpers/apiHelpers';

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
    duration: string = 'PT2M56S',
    videoId: string = 'test-video-id'
): string => `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" 
     id="${videoId}"
     mediaPresentationDuration="${duration}"
     type="static"
     minBufferTime="PT1.5S">
    <Period>
        <AdaptationSet mimeType="video/mp4">
            <Representation id="1" bandwidth="1000000">
                <BaseURL>video.mp4</BaseURL>
            </Representation>
        </AdaptationSet>
    </Period>
</MPD>`;

const mockManifestXmlMinimal = `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011">
    <Period>
        <AdaptationSet mimeType="video/mp4">
            <Representation id="1" bandwidth="1000000">
                <BaseURL>video.mp4</BaseURL>
            </Representation>
        </AdaptationSet>
    </Period>
</MPD>`;

const mockManifestXmlNoId = `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" 
     mediaPresentationDuration="PT5M30S"
     type="static">
    <Period>
        <AdaptationSet mimeType="video/mp4">
            <Representation id="1" bandwidth="1000000">
                <BaseURL>video.mp4</BaseURL>
            </Representation>
        </AdaptationSet>
    </Period>
</MPD>`;

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
// Helper Functions
// =============================================================================

function createManifestFetch(manifestXml: string) {
    return vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: vi.fn().mockResolvedValue(manifestXml)
    });
}

// =============================================================================
// Successful Manifest Fetching Tests
// =============================================================================

describe('getManifest', () => {
    describe('successful manifest requests', () => {
        it('should fetch manifest with valid ID', async () => {
            // Arrange
            const videoId = 'test-video-id';
            const mockFetch = createManifestFetch(createMockManifestXml());

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result).toHaveProperty('url');
            expect(result).toHaveProperty('duration');
            expect(result).toHaveProperty('videoId');
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should return ManifestResponse object with all properties', async () => {
            // Arrange
            const videoId = 'abc123';
            const mockFetch = createManifestFetch(
                createMockManifestXml('PT10M30S', 'video-abc123')
            );

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result.url).toMatch(/^blob:http:\/\/localhost\//);
            expect(result.duration).toBe(630); // 10*60 + 30
            expect(result.videoId).toBe('video-abc123');
        });

        it('should use default fetch when fetchFn not provided', async () => {
            // Arrange
            const videoId = 'test-id';
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: vi.fn().mockResolvedValue(createMockManifestXml())
            });

            // Act
            const result = await getManifest(videoId);

            // Assert
            expect(result).toHaveProperty('url');
            expect(result).toHaveProperty('duration');
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('should create blob URL from manifest XML', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createManifestFetch(createMockManifestXml());
            const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
            expect(result.url).toMatch(/^blob:/);
        });

        it('should log manifest load information', async () => {
            // Arrange
            const videoId = 'test-video-id';
            const mockFetch = createManifestFetch(
                createMockManifestXml('PT5M0S', 'video-123')
            );
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            // Act
            await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Manifest loaded for test-video-id')
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('duration=300s')
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('videoId=video-123')
            );
            
            consoleLogSpy.mockRestore();
        });
    });

    // =============================================================================
    // Duration Parsing Tests
    // =============================================================================

    describe('duration parsing', () => {
        it('should parse duration with minutes and seconds', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createManifestFetch(
                createMockManifestXml('PT2M56S', 'test-id')
            );

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result.duration).toBe(176); // 2*60 + 56
        });

        it('should parse duration with only seconds', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createManifestFetch(
                createMockManifestXml('PT45S', 'test-id')
            );

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result.duration).toBe(45);
        });

        it('should parse duration with only minutes', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createManifestFetch(
                createMockManifestXml('PT5M', 'test-id')
            );

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result.duration).toBe(300); // 5*60
        });

        it('should parse duration with hours, minutes, and seconds', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createManifestFetch(
                createMockManifestXml('PT1H30M45S', 'test-id')
            );

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result.duration).toBe(5445); // 1*3600 + 30*60 + 45
        });

        it('should parse duration with only hours', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createManifestFetch(
                createMockManifestXml('PT2H', 'test-id')
            );

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result.duration).toBe(7200); // 2*3600
        });

        it('should parse duration with hours and seconds (no minutes)', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createManifestFetch(
                createMockManifestXml('PT1H30S', 'test-id')
            );

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result.duration).toBe(3630); // 1*3600 + 30
        });

        it('should parse duration with decimal seconds', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createManifestFetch(
                createMockManifestXml('PT1M30.5S', 'test-id')
            );

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result.duration).toBe(90.5); // 1*60 + 30.5
        });

        it('should return 0 duration when mediaPresentationDuration missing', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createManifestFetch(mockManifestXmlMinimal);

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result.duration).toBe(0);
        });

        it('should return 0 duration when duration format is invalid', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createManifestFetch(
                createMockManifestXml('INVALID', 'test-id')
            );

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result.duration).toBe(0);
        });

        it('should handle zero duration', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createManifestFetch(
                createMockManifestXml('PT0S', 'test-id')
            );

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result.duration).toBe(0);
        });

        it('should handle very long durations', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createManifestFetch(
                createMockManifestXml('PT10H30M45S', 'test-id')
            );

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result.duration).toBe(37845); // 10*3600 + 30*60 + 45
        });
    });

    // =============================================================================
    // Video ID Extraction Tests
    // =============================================================================

    describe('video ID extraction', () => {
        it('should extract videoId from MPD element', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createManifestFetch(
                createMockManifestXml('PT5M0S', 'extracted-video-id')
            );

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result.videoId).toBe('extracted-video-id');
        });

        it('should return undefined when videoId not present in MPD', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createManifestFetch(mockManifestXmlNoId);

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result.videoId).toBeUndefined();
        });

        it('should handle empty videoId attribute', async () => {
            // Arrange
            const videoId = 'test-id';
            const manifestWithEmptyId = createMockManifestXml('PT5M0S', '');
            const mockFetch = createManifestFetch(manifestWithEmptyId);

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result.videoId).toBeUndefined();
        });

        it('should handle videoId with special characters', async () => {
            // Arrange
            const videoId = 'test-id';
            const specialId = 'video-123_ABC-xyz';
            const mockFetch = createManifestFetch(
                createMockManifestXml('PT5M0S', specialId)
            );

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result.videoId).toBe(specialId);
        });
    });

    // =============================================================================
    // API Request Tests
    // =============================================================================

    describe('API request handling', () => {
        it('should call correct API endpoint', async () => {
            // Arrange
            const videoId = 'test-video-id';
            const mockFetch = createManifestFetch(createMockManifestXml());

            // Act
            await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            const callUrl = mockFetch.mock.calls[0][0] as string;
            expect(callUrl).toContain('/streams/dash');
        });

        it('should include video ID in query parameters', async () => {
            // Arrange
            const videoId = 'abc123xyz';
            const mockFetch = createManifestFetch(createMockManifestXml());

            // Act
            await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            const callUrl = mockFetch.mock.calls[0][0] as string;
            const params = extractQueryParams(callUrl);
            expect(params.id).toBe('abc123xyz');
        });

        it('should URL encode video ID', async () => {
            // Arrange
            const videoId = 'test id with spaces & special=chars';
            const mockFetch = createManifestFetch(createMockManifestXml());

            // Act
            await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            const callUrl = mockFetch.mock.calls[0][0] as string;
            expect(callUrl).toContain('id=');
            expect(callUrl).not.toContain('test id with spaces');
        });

        it('should only call fetch once per request', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createManifestFetch(createMockManifestXml());

            // Act
            await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(getCallCount(mockFetch)).toBe(1);
        });
    });

    // =============================================================================
    // HTTP Error Handling Tests
    // =============================================================================

    describe('HTTP error handling', () => {
        it('should throw error on 404 response', async () => {
            // Arrange
            const videoId = 'nonexistent-id';
            const mockFetch = createFailedFetch(404, 'Not Found');
            consoleErrorMock = createMockConsoleError();

            // Act & Assert
            await expect(getManifest(videoId, mockFetch)).rejects.toThrow();
        });

        it('should throw error on 500 response', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createFailedFetch(500, 'Internal Server Error');
            consoleErrorMock = createMockConsoleError();

            // Act & Assert
            await expect(getManifest(videoId, mockFetch)).rejects.toThrow();
        });

        it('should include video ID in error message', async () => {
            // Arrange
            const videoId = 'error-test-id';
            const mockFetch = createFailedFetch(404, 'Not Found');
            consoleErrorMock = createMockConsoleError();

            // Act & Assert
            await expect(getManifest(videoId, mockFetch)).rejects.toThrow(
                /error-test-id/
            );
        });

        it('should include status code in error message', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createFailedFetch(503, 'Service Unavailable');
            consoleErrorMock = createMockConsoleError();

            // Act & Assert
            await expect(getManifest(videoId, mockFetch)).rejects.toThrow(
                /503/
            );
        });

        it('should include status text in error message', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createFailedFetch(429, 'Too Many Requests');
            consoleErrorMock = createMockConsoleError();

            // Act & Assert
            await expect(getManifest(videoId, mockFetch)).rejects.toThrow(
                /Too Many Requests/
            );
        });

        it('should log errors to console', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createFailedFetch(500, 'Internal Server Error');
            consoleErrorMock = createMockConsoleError();

            // Act & Assert
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
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createNetworkErrorFetch('Failed to fetch');
            consoleErrorMock = createMockConsoleError();

            // Act & Assert
            await expect(getManifest(videoId, mockFetch)).rejects.toThrow(
                'Failed to fetch'
            );
        });

        it('should log network errors to console', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createNetworkErrorFetch('Network error');
            consoleErrorMock = createMockConsoleError();

            // Act & Assert
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
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createNetworkErrorFetch('Request timeout');
            consoleErrorMock = createMockConsoleError();

            // Act & Assert
            await expect(getManifest(videoId, mockFetch)).rejects.toThrow(
                'Request timeout'
            );
        });

        it('should throw error on connection refused', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createNetworkErrorFetch('Connection refused');
            consoleErrorMock = createMockConsoleError();

            // Act & Assert
            await expect(getManifest(videoId, mockFetch)).rejects.toThrow(
                'Connection refused'
            );
        });
    });

    // =============================================================================
    // XML Parsing Tests
    // =============================================================================

    describe('XML parsing', () => {
        it('should parse valid DASH manifest XML', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createManifestFetch(createMockManifestXml());

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result.url).toBeTruthy();
            expect(typeof result.url).toBe('string');
        });

        it('should handle manifest with complex structure', async () => {
            // Arrange
            const videoId = 'test-id';
            const complexManifest = `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" 
     id="complex-video-id"
     mediaPresentationDuration="PT15M30S"
     type="static">
    <Period>
        <AdaptationSet mimeType="video/mp4">
            <Representation id="1" bandwidth="500000" width="640" height="360">
                <BaseURL>video_360p.mp4</BaseURL>
            </Representation>
            <Representation id="2" bandwidth="1000000" width="1280" height="720">
                <BaseURL>video_720p.mp4</BaseURL>
            </Representation>
        </AdaptationSet>
        <AdaptationSet mimeType="audio/mp4">
            <Representation id="audio" bandwidth="128000">
                <BaseURL>audio.mp4</BaseURL>
            </Representation>
        </AdaptationSet>
    </Period>
</MPD>`;
            const mockFetch = createManifestFetch(complexManifest);

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result.duration).toBe(930); // 15*60 + 30
            expect(result.videoId).toBe('complex-video-id');
        });

        it('should handle manifest with namespace prefixes', async () => {
            // Arrange
            const videoId = 'test-id';
            const namespacedManifest = `<?xml version="1.0" encoding="UTF-8"?>
<mpd:MPD xmlns:mpd="urn:mpeg:dash:schema:mpd:2011" 
         id="ns-video-id"
         mediaPresentationDuration="PT3M0S">
    <mpd:Period>
        <mpd:AdaptationSet mimeType="video/mp4">
            <mpd:Representation id="1" bandwidth="1000000">
                <mpd:BaseURL>video.mp4</mpd:BaseURL>
            </mpd:Representation>
        </mpd:AdaptationSet>
    </mpd:Period>
</mpd:MPD>`;
            const mockFetch = createManifestFetch(namespacedManifest);

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result.url).toBeTruthy();
        });
    });

    // =============================================================================
    // Blob URL Creation Tests
    // =============================================================================

    describe('blob URL creation', () => {
        it('should create blob with correct MIME type', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createManifestFetch(createMockManifestXml());
            const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');

            // Act
            await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
            const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
            expect(blobArg).toBeInstanceOf(Blob);
            expect(blobArg.type).toBe('application/dash+xml');
        });

        it('should preserve original manifest content in blob', async () => {
            // Arrange
            const videoId = 'test-id';
            const originalXml = createMockManifestXml('PT5M0S', 'preserve-test');
            const mockFetch = createManifestFetch(originalXml);
            const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');

            // Act
            await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
            const blobArg = createObjectURLSpy.mock.calls[0][0];
            expect(blobArg).toBeInstanceOf(Blob);
        });

        it('should return unique blob URL for each call', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createManifestFetch(createMockManifestXml());

            // Act
            const result1 = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);
            const result2 = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result1.url).not.toBe(result2.url);
        });
    });

    // =============================================================================
    // Edge Cases
    // =============================================================================

    describe('edge cases', () => {
        it('should handle empty video ID', async () => {
            // Arrange
            const videoId = '';
            const mockFetch = createManifestFetch(createMockManifestXml());

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result).toHaveProperty('url');
            const callUrl = mockFetch.mock.calls[0][0] as string;
            expect(callUrl).toContain('id=');
        });

        it('should handle video ID with special characters', async () => {
            // Arrange
            const videoId = 'test-id!@#$%^&*()';
            const mockFetch = createManifestFetch(createMockManifestXml());

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result).toHaveProperty('url');
        });

        it('should handle concurrent requests independently', async () => {
            // Arrange
            const videoId1 = 'video-1';
            const videoId2 = 'video-2';
            const mockFetch1 = createManifestFetch(
                createMockManifestXml('PT1M0S', 'id-1')
            );
            const mockFetch2 = createManifestFetch(
                createMockManifestXml('PT2M0S', 'id-2')
            );

            // Act
            const [result1, result2] = await Promise.all([
                getManifest(videoId1, mockFetch1 as unknown as typeof globalThis.fetch),
                getManifest(videoId2, mockFetch2 as unknown as typeof globalThis.fetch)
            ]);

            // Assert
            expect(result1.duration).toBe(60);
            expect(result1.videoId).toBe('id-1');
            expect(result2.duration).toBe(120);
            expect(result2.videoId).toBe('id-2');
            expect(getCallCount(mockFetch1)).toBe(1);
            expect(getCallCount(mockFetch2)).toBe(1);
        });

        it('should handle very long video IDs', async () => {
            // Arrange
            const videoId = 'a'.repeat(1000);
            const mockFetch = createManifestFetch(createMockManifestXml());

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result).toHaveProperty('url');
        });

        it('should handle manifest with whitespace and newlines', async () => {
            // Arrange
            const videoId = 'test-id';
            const manifestWithWhitespace = `<?xml version="1.0" encoding="UTF-8"?>

<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" 
     id="whitespace-test"
     mediaPresentationDuration="PT5M0S"
     
     type="static">
     
    <Period>
        <AdaptationSet mimeType="video/mp4">
            <Representation id="1" bandwidth="1000000">
                <BaseURL>video.mp4</BaseURL>
            </Representation>
        </AdaptationSet>
    </Period>
    
</MPD>`;
            const mockFetch = createManifestFetch(manifestWithWhitespace);

            // Act
            const result = await getManifest(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result.duration).toBe(300);
            expect(result.videoId).toBe('whitespace-test');
        });
    });
});

// =============================================================================
// Legacy Function Tests (getManifestUrl)
// =============================================================================

describe('getManifestUrl', () => {
    describe('backward compatibility', () => {
        it('should return just the URL string', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createManifestFetch(createMockManifestXml());

            // Act
            const result = await getManifestUrl(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(typeof result).toBe('string');
            expect(result).toMatch(/^blob:/);
        });

        it('should return same URL as getManifest().url', async () => {
            // Arrange
            const videoId = 'test-id';
            const manifestXml = createMockManifestXml();
            const mockFetch1 = createManifestFetch(manifestXml);
            const mockFetch2 = createManifestFetch(manifestXml);

            // Act
            const urlResult = await getManifestUrl(videoId, mockFetch1 as unknown as typeof globalThis.fetch);
            const manifestResult = await getManifest(videoId, mockFetch2 as unknown as typeof globalThis.fetch);

            // Assert
            expect(urlResult).toMatch(/^blob:/);
            expect(manifestResult.url).toMatch(/^blob:/);
        });

        it('should use default fetch when fetchFn not provided', async () => {
            // Arrange
            const videoId = 'test-id';
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: vi.fn().mockResolvedValue(createMockManifestXml())
            });

            // Act
            const result = await getManifestUrl(videoId);

            // Assert
            expect(typeof result).toBe('string');
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('should throw same errors as getManifest', async () => {
            // Arrange
            const videoId = 'error-id';
            const mockFetch = createFailedFetch(404, 'Not Found');
            consoleErrorMock = createMockConsoleError();

            // Act & Assert
            await expect(getManifestUrl(videoId, mockFetch)).rejects.toThrow();
        });

        it('should handle network errors', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createNetworkErrorFetch('Network error');
            consoleErrorMock = createMockConsoleError();

            // Act & Assert
            await expect(getManifestUrl(videoId, mockFetch)).rejects.toThrow(
                'Network error'
            );
        });
    });

    describe('legacy function usage', () => {
        it('should work with empty video ID', async () => {
            // Arrange
            const videoId = '';
            const mockFetch = createManifestFetch(createMockManifestXml());

            // Act
            const result = await getManifestUrl(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(typeof result).toBe('string');
        });

        it('should work with special characters in ID', async () => {
            // Arrange
            const videoId = 'test-id!@#$%';
            const mockFetch = createManifestFetch(createMockManifestXml());

            // Act
            const result = await getManifestUrl(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(typeof result).toBe('string');
        });

        it('should only call fetch once', async () => {
            // Arrange
            const videoId = 'test-id';
            const mockFetch = createManifestFetch(createMockManifestXml());

            // Act
            await getManifestUrl(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(getCallCount(mockFetch)).toBe(1);
        });
    });
});