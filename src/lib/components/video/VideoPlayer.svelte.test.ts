import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import type { VideoPlayerConfig } from '$lib/adapters/types';

let mockRegisterRequestFilter = vi.fn();

const mockNetworkingEngine = {
	registerRequestFilter: mockRegisterRequestFilter
}

// Create mocks for Shaka Player
const mockPlayerInstance = {
	attach: vi.fn().mockResolvedValue(undefined),
	load: vi.fn().mockResolvedValue(undefined),
	getNetworkingEngine: vi.fn(() => mockNetworkingEngine),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	destroy: vi.fn().mockImplementation(() => Promise.resolve())
};

const mockUIInstance = {
	configure: vi.fn(),
	destroy: vi.fn(),
	getControls: vi.fn(() => ({}))
};

let capturedVideoElement: HTMLVideoElement | null = null;
let lastUIInstance: MockShakaUIOverlay | null = null;

// Create a proper constructor function
class MockShakaPlayer {
	constructor() {
		console.log('MockShakaPlayer constructor called');
	}

	attach(videoEl: HTMLVideoElement) {
		console.log('Instance attach called with:', videoEl);
		capturedVideoElement = videoEl;
		mockPlayerInstance.attach(videoEl);
		return Promise.resolve();
	}

	load(manifestUrl: string) {
		// console.log('Instance load called with:', manifestUrl);
		return mockPlayerInstance.load(manifestUrl);
	};
	getNetworkingEngine() {
		return mockPlayerInstance.getNetworkingEngine();
	};

	addEventListener = vi.fn((event: string, callback: any) => {
		return mockPlayerInstance.addEventListener(event, callback);
	});
	removeEventListener = vi.fn((event: string, callback: any) => {
		return mockPlayerInstance.removeEventListener(event, callback);
	});
	destroy = vi.fn(() => {
		return mockPlayerInstance.destroy();
	});

	static isBrowserSupported = vi.fn(() => true);
}

class MockShakaUIOverlay {
	constructor(player: any, container: any, video: any) {
		console.log('MockShakaUIOverlay constructor called');
		lastUIInstance = this;
	}

	configure(config: any) {
		console.log('UI configure called with:', config);
		mockUIInstance.configure(config);
	}

	destroy() {
		return mockUIInstance.destroy();
	};

	getControls = vi.fn(() => {
		return mockUIInstance.getControls();
	});
}

// Mock Shaka Player module
vi.mock('shaka-player/dist/shaka-player.ui', () => ({
	default: {
		Player: MockShakaPlayer,
		ui: {
			Overlay: MockShakaUIOverlay
		},
		polyfill: {
			installAll: vi.fn()
		}
	}
}));

vi.mock('shaka-player/dist/controls.css', () => ({}));

import VideoPlayer from './VideoPlayer.svelte';

describe('VideoPlayer.svelte', () => {
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
	// let consoleLogSpy: ReturnType<typeof vi.spyOn>;

	const mockConfig: VideoPlayerConfig = {
		manifestUrl: 'blob:http://localhost:5173/test-manifest',
		duration: 180,
		poster: 'https://example.com/poster.jpg'
	};

	beforeEach(() => {
		vi.clearAllMocks();
		capturedVideoElement = null;

		mockRegisterRequestFilter = vi.fn();
		mockNetworkingEngine.registerRequestFilter = mockRegisterRequestFilter;

		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
		// consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

		// Reset to success state
		MockShakaPlayer.isBrowserSupported = vi.fn(() => true);
		mockPlayerInstance.attach.mockResolvedValue(undefined);
		mockPlayerInstance.load.mockResolvedValue(undefined);
		mockPlayerInstance.destroy.mockImplementation(() => Promise.resolve());
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
		// consoleLogSpy.mockRestore();
	});

	describe('Component rendering', () => {
		it('should render video element, set poster on element, and set required attributes', () => {
			const { container } = render(VideoPlayer, { config: mockConfig })
			const video = container.querySelector('video');
			expect(video).toBeInTheDocument();
			expect(video).toHaveAttribute('poster', mockConfig.poster);
			expect(video).toHaveAttribute('playsinline');
		});
	});

	describe('Player initialization', () => {
		it('should warm up test environment and bindings', async () => {
			render(VideoPlayer, { config: mockConfig });
			await new Promise((resolve) => setTimeout(resolve, 100));
		});

		it('should initialise and configure player properly', async () => {
			render(VideoPlayer, { config: mockConfig });

			await waitFor(
				() => {
					// Just verify player methods are called, constructor is implicit
					expect(mockPlayerInstance.attach).toHaveBeenCalled();

					// Check the captured video element
					expect(capturedVideoElement).not.toBeNull();
					expect(capturedVideoElement).toBeInstanceOf(HTMLVideoElement);
					expect(capturedVideoElement?.dataset.testid).toBe('video-player');

					// UI overlay configured with all controls
					expect(mockUIInstance.configure).toHaveBeenCalled();
					const uiConfig = mockUIInstance.configure.mock.calls[0][0];

					// Check UI configuration
					expect(uiConfig.addSeekBar).toBe(true);
					expect(uiConfig.addBigPlayButton).toBe(true);

					// Control panel elements
					expect(uiConfig.controlPanelElements).toContain('play_pause');
					expect(uiConfig.controlPanelElements).toContain('time_and_duration');
					expect(uiConfig.controlPanelElements).toContain('mute');
					expect(uiConfig.controlPanelElements).toContain('volume');
					expect(uiConfig.controlPanelElements).toContain('spacer');
					expect(uiConfig.controlPanelElements).toContain('quality');
					expect(uiConfig.controlPanelElements).toContain('captions');
					expect(uiConfig.controlPanelElements).toContain('overflow_menu');
					expect(uiConfig.controlPanelElements).toContain('fullscreen');

					// Manifest loaded
					expect(mockPlayerInstance.load).toHaveBeenCalledWith(mockConfig.manifestUrl);

					// Error event listener registered
					expect(mockPlayerInstance.addEventListener).toHaveBeenCalledWith(
						'error',
						expect.any(Function)
					);

					// Verify initialization sequence order
					const browserSupportOrder =
						MockShakaPlayer.isBrowserSupported.mock.invocationCallOrder[0];
					const attachOrder = mockPlayerInstance.attach.mock.invocationCallOrder[0];
					const uiConfigureOrder = mockUIInstance.configure.mock.invocationCallOrder[0];
					const loadOrder = mockPlayerInstance.load.mock.invocationCallOrder[0];

					expect(browserSupportOrder).toBeLessThan(attachOrder);
					expect(attachOrder).toBeLessThan(uiConfigureOrder);
					expect(uiConfigureOrder).toBeLessThan(loadOrder);
				},
				{ timeout: 2000 }
			);
		});
	});

	describe('Manifest loading', () => {
		it('should load manifest URL', async () => {
			render(VideoPlayer, { config: mockConfig });

			await waitFor(
				() => {
					expect(mockPlayerInstance.load).toHaveBeenCalledWith(mockConfig.manifestUrl);
				},
				{ timeout: 2000 }
			);
		});

		it('should handle empty manifest URL', async () => {
			const invalidConfig = { ...mockConfig, manifestUrl: '' };
			render(VideoPlayer, { config: invalidConfig });

			await waitFor(
				() => {
					expect(consoleErrorSpy).toHaveBeenCalled();
				},
				{ timeout: 2000 }
			);
		});

		it('should handle manifest load errors', async () => {
			mockPlayerInstance.load.mockRejectedValueOnce(new Error('Load failed'));
			render(VideoPlayer, { config: mockConfig });

			await waitFor(
				() => {
					expect(consoleErrorSpy).toHaveBeenCalled();
				},
				{ timeout: 2000 }
			);
		});
	});

	describe('Error handling', () => {
		it('should handle unsupported browser', async () => {
			MockShakaPlayer.isBrowserSupported = vi.fn(() => false);
			render(VideoPlayer, { config: mockConfig });

			await waitFor(
				() => {
					expect(consoleErrorSpy).toHaveBeenCalledWith(
						expect.stringContaining('Browser not supported')
					);
				},
				{ timeout: 2000 }
			);
		});

		it('should handle player attach errors', async () => {
			const attachError = new Error('Attach failed');

			const originalAttach = MockShakaPlayer.prototype.attach;
			MockShakaPlayer.prototype.attach = vi.fn(() => {
				return Promise.reject(attachError);
			});
			// mockPlayerInstance.attach.mockRejectedValueOnce(new Error('Attach failed'));
			render(VideoPlayer, { config: mockConfig });

			await waitFor(
				() => {
					expect(consoleErrorSpy).toHaveBeenCalled();
				},
				{ timeout: 2000 }
			);

			MockShakaPlayer.prototype.attach = originalAttach;
		});
	});

	describe('Network request filtering', () => {
		it('should register request filter with networking engine', async () => {
			render(VideoPlayer, { config: mockConfig });

			await waitFor(
				() => {
					expect(mockPlayerInstance.getNetworkingEngine).toHaveBeenCalled();
					const networkingEngine = mockPlayerInstance.getNetworkingEngine();
					expect(networkingEngine.registerRequestFilter).toHaveBeenCalled();
					expect(networkingEngine.registerRequestFilter).toHaveBeenCalledWith(expect.any(Function));
				},
				{ timeout: 2000 }
			);
		});

		it('should proxy googlevideo.com requests through proxy and maintain query data', async () => {
			let capturedFilter: Function | null = null;

			const mockNetworkingEngine = { registerRequestFilter: vi.fn((filterFn) => { capturedFilter = filterFn })};

			mockPlayerInstance.getNetworkingEngine.mockReturnValue(mockNetworkingEngine);
			render(VideoPlayer, { config: mockConfig });

			await waitFor(() => {expect(capturedFilter).not.toBeNull()}, { timeout: 2000 } );

			// Test the filter with a googlevideo.com URL
			const mockRequest = {
				uris: ['https://test.googlevideo.com/videoplayback?id=123&expire=1234&ei=abcd&ip=1.2.3.4'],
				headers: {}
			};

			const SEGMENT_TYPE = 1;
			capturedFilter!(SEGMENT_TYPE, mockRequest);
			const proxiedUrl = new URL(mockRequest.uris[0]);

			// Verify URL was proxied
			expect(mockRequest.uris[0]).toContain('http://localhost:8888');
			expect(mockRequest.uris[0]).toContain('host=test.googlevideo.com');
			expect(mockRequest.uris[0]).toContain('id=123');

			// Check path is preserved
			expect(proxiedUrl.pathname).toContain('/videoplayback');

			// Check original query params are preserved
			expect(proxiedUrl.searchParams.get('expire')).toBe('1234');
			expect(proxiedUrl.searchParams.get('ei')).toBe('abcd');
			expect(proxiedUrl.searchParams.get('ip')).toBe('1.2.3.4');

			// Check host parameter was added
			expect(proxiedUrl.searchParams.get('host')).toBe('test.googlevideo.com');
		});

		it('should convert Range header to query parameter', async () => {
			let capturedFilter: Function | null = null;

			const mockNetworkingEngine = {registerRequestFilter: vi.fn((filterFn) => {capturedFilter = filterFn})};

			mockPlayerInstance.getNetworkingEngine.mockReturnValue(mockNetworkingEngine);
			render(VideoPlayer, { config: mockConfig });
			await waitFor(() => expect(capturedFilter).not.toBeNull(), { timeout: 2000 });

			const mockRequest = {
				uris: ['https://test.googlevideo.com/videoplayback?id=123'],
				headers: { Range: 'bytes=0-999999' }
			};

			const SEGMENT_TYPE = 1;
			capturedFilter!(SEGMENT_TYPE, mockRequest);
			const proxiedUrl = new URL(mockRequest.uris[0]);

			expect(proxiedUrl.searchParams.get('range')).toBe('0-999999');
			expect(mockRequest.headers).toEqual({});
		});

		it('should not modify non-googlevideo.com URLs', async () => {
			let capturedFilter: Function | null = null;

			const mockNetworkingEngine = { registerRequestFilter: vi.fn((filterFn) => { capturedFilter = filterFn }) };

			mockPlayerInstance.getNetworkingEngine.mockReturnValue(mockNetworkingEngine);
			render(VideoPlayer, { config: mockConfig });
			await waitFor(() => expect(capturedFilter).not.toBeNull(), { timeout: 2000 });

			const originalUrl = 'https://example.com/video.mp4?param=value';
			const mockRequest = {
				uris: [originalUrl],
				headers: {}
			};

			const SEGMENT_TYPE = 1;
			capturedFilter!(SEGMENT_TYPE, mockRequest);

			expect(mockRequest.uris[0]).toBe(originalUrl);
		});

		it('should only filter segment requests (type 1)', async () => {
			let capturedFilter: Function | null = null;

			const mockNetworkingEngine = { registerRequestFilter: vi.fn((filterFn) => { capturedFilter = filterFn })};

			mockPlayerInstance.getNetworkingEngine.mockReturnValue(mockNetworkingEngine);
			render(VideoPlayer, { config: mockConfig });
			await waitFor(() => expect(capturedFilter).not.toBeNull(), { timeout: 2000 });

			const originalUrl = 'https://rr3---sn-25ge7nsk.googlevideo.com/videoplayback?id=123';
			const mockRequest = {
				uris: [originalUrl],
				headers: {}
			};

			const MANIFEST_TYPE = 0; // Not a segment request
			capturedFilter!(MANIFEST_TYPE, mockRequest);

			expect(mockRequest.uris[0]).toBe(originalUrl);
		});

		it('should handle relative PROXY_URL by prepending window.location.origin', async () => {
			let capturedFilter: Function | null = null;

			const mockNetworkingEngine = { registerRequestFilter: vi.fn((filterFn) => {capturedFilter = filterFn}) };
			mockPlayerInstance.getNetworkingEngine.mockReturnValue(mockNetworkingEngine);

			// Mock window.location.origin
			const originalLocation = window.location;
			delete (window as any).location;
			window.location = { origin: 'http://localhost:5173' } as Location;

			render(VideoPlayer, { config: mockConfig });
			await waitFor(() => expect(capturedFilter).not.toBeNull(), { timeout: 2000 });

			const mockRequest = {
				uris: ['https://rr3---sn-25ge7nsk.googlevideo.com/videoplayback'],
				headers: {}
			};

			const SEGMENT_TYPE = 1;
			capturedFilter!(SEGMENT_TYPE, mockRequest);

			expect(mockRequest.uris[0]).toContain('http://localhost:8888');

			window.location = originalLocation;
		});

		it('should handle networking engine being null', async () => {
			mockPlayerInstance.getNetworkingEngine.mockReturnValue(null);

			// Should not throw error
			expect(() => {
				render(VideoPlayer, { config: mockConfig });
			}).not.toThrow();

			await waitFor(() => {expect(mockPlayerInstance.getNetworkingEngine).toHaveBeenCalled()}, { timeout: 2000 });
		});
	})

	describe('Component cleanup', () => {
		it('should destroy player on unmount', async () => {
			const { unmount } = render(VideoPlayer, { config: mockConfig });

			await waitFor(
				() => {
					expect(mockPlayerInstance.attach).toHaveBeenCalled();
				},
				{ timeout: 2000 }
			);

			unmount();

			// Give it time to cleanup
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(mockPlayerInstance.destroy).toHaveBeenCalled();
		});
	});

	describe('Configuration variations', () => {
		it('should handle different manifest URLs', async () => {
			const config = { ...mockConfig, manifestUrl: 'blob:http://localhost:5173/other' };
			render(VideoPlayer, { config });

			await waitFor(
				() => {
					expect(mockPlayerInstance.load).toHaveBeenCalledWith(
						'blob:http://localhost:5173/other'
					);
				},
				{ timeout: 2000 }
			);
		});

		it('should handle empty poster', () => {
			const config = { ...mockConfig, poster: '' };
			const { container } = render(VideoPlayer, { config });
			const video = container.querySelector('video');
			expect(video).toHaveAttribute('poster', '');
		});

		it('should handle zero duration', () => {
			const config = { ...mockConfig, duration: 0 };
			const { container } = render(VideoPlayer, { config });
			expect(container.querySelector('video')).toBeInTheDocument();
		});
	});
});