import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import type { VideoPlayerConfig } from '$lib/adapters/types';

let mockRegisterRequestFilter = vi.fn();

const mockNetworkingEngine = {
	registerRequestFilter: mockRegisterRequestFilter
};

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

// Create a proper constructor function
class MockShakaPlayer {
	constructor() {
		// console.log('MockShakaPlayer constructor called');
	}

	attach(videoEl: HTMLVideoElement) {
		// console.log('Instance attach called with:', videoEl);
		capturedVideoElement = videoEl;
		mockPlayerInstance.attach(videoEl);
		return Promise.resolve();
	}

	load(manifestUrl: string) {
		return mockPlayerInstance.load(manifestUrl);
	}

	getNetworkingEngine() {
		return mockPlayerInstance.getNetworkingEngine();
	}

	addEventListener = vi.fn((event: string, listener: (event: ShakaErrorEvent) => void) => {
		return mockPlayerInstance.addEventListener(event, listener);
	});

	removeEventListener = vi.fn((event: string, listener: (event: ShakaErrorEvent) => void) => {
		return mockPlayerInstance.removeEventListener(event, listener);
	});

	destroy = vi.fn(() => {
		return mockPlayerInstance.destroy();
	});

	static isBrowserSupported = vi.fn(() => true);
}

class MockShakaUIOverlay {
	constructor() {
		// console.log('MockShakaUIOverlay constructor called');
	}

	configure(config: ShakaUIConfiguration) {
		// console.log('UI configure called with:', config);
		mockUIInstance.configure(config);
	}

	destroy() {
		return mockUIInstance.destroy();
	}

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
import type { ShakaErrorEvent, ShakaUIConfiguration } from '$lib/types';

describe('VideoPlayer.svelte', () => {
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
	let consoleLogSpy: ReturnType<typeof vi.spyOn>;

	const mockConfig: VideoPlayerConfig = {
		manifestUrl: 'blob:http://localhost:5173/test-manifest',
		duration: 180,
		poster: 'https://example.com/poster.jpg'
	};

	// ===== Helper Functions =====
	const renderAndWaitForInit = async (config = mockConfig) => {
		const result = render(VideoPlayer, { config });
		await waitFor(
			() => {
				expect(mockPlayerInstance.attach).toHaveBeenCalled();
			},
			{ timeout: 2000 }
		);
		return result;
	};

	const getRegisteredFilter = () => {
		expect(mockRegisterRequestFilter).toHaveBeenCalled();
		return mockRegisterRequestFilter.mock.calls[0][0];
	};

	const createMockRequest = (url: string, headers = {}) => ({
		uris: [url],
		headers
	});

	const waitForConsoleError = () =>
		waitFor(
			() => {
				expect(consoleErrorSpy).toHaveBeenCalled();
			},
			{ timeout: 2000 }
		);

	const SEGMENT_TYPE = 1;
	const MANIFEST_TYPE = 0;

	// ===== Test Setup =====
	beforeEach(() => {
		vi.clearAllMocks();
		capturedVideoElement = null;

		mockRegisterRequestFilter = vi.fn();
		mockNetworkingEngine.registerRequestFilter = mockRegisterRequestFilter;

		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		// Reset to success state
		MockShakaPlayer.isBrowserSupported = vi.fn(() => true);
		mockPlayerInstance.attach.mockResolvedValue(undefined);
		mockPlayerInstance.load.mockResolvedValue(undefined);
		mockPlayerInstance.destroy.mockImplementation(() => Promise.resolve());
		mockPlayerInstance.getNetworkingEngine.mockReturnValue(mockNetworkingEngine);
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
		consoleLogSpy.mockRestore();
	});

	// ===== Tests =====
	describe('Component rendering', () => {
		it('should render video element with poster and required attributes', () => {
			const { container } = render(VideoPlayer, { config: mockConfig });
			const video = container.querySelector('video');
			expect(video).toBeInTheDocument();
			expect(video).toHaveAttribute('poster', mockConfig.poster);
			expect(video).toHaveAttribute('playsinline');
		});
	});

	describe('Player initialization', () => {
		it('should initialize test environment', async () => {
			const { container } = render(VideoPlayer, { config: mockConfig });
			await new Promise((resolve) => setTimeout(resolve, 100));
			expect(container).toBeTruthy();
		});

		it('should fully initialize player with all components and configurations', async () => {
			render(VideoPlayer, { config: mockConfig });

			await waitFor(
				() => {
					// Browser support and attachment
					expect(MockShakaPlayer.isBrowserSupported).toHaveBeenCalled();
					expect(mockPlayerInstance.attach).toHaveBeenCalled();
					expect(capturedVideoElement).not.toBeNull();
					expect(capturedVideoElement).toBeInstanceOf(HTMLVideoElement);
					expect(capturedVideoElement?.dataset.testid).toBe('video-player');

					// UI overlay configuration
					expect(mockUIInstance.configure).toHaveBeenCalled();
					const uiConfig = mockUIInstance.configure.mock.calls[0][0];

					expect(uiConfig.addSeekBar).toBe(true);
					expect(uiConfig.addBigPlayButton).toBe(true);

					// Control panel elements
					const expectedControls = [
						'play_pause',
						'time_and_duration',
						'mute',
						'volume',
						'spacer',
						'quality',
						'captions',
						'overflow_menu',
						'fullscreen'
					];
					expectedControls.forEach((control) => {
						expect(uiConfig.controlPanelElements).toContain(control);
					});

					// Manifest and event listener
					expect(mockPlayerInstance.load).toHaveBeenCalledWith(mockConfig.manifestUrl);
					expect(mockPlayerInstance.addEventListener).toHaveBeenCalledWith(
						'error',
						expect.any(Function)
					);

					// Verify initialization order
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
			await renderAndWaitForInit();
			expect(mockPlayerInstance.load).toHaveBeenCalledWith(mockConfig.manifestUrl);
		});

		it('should handle empty manifest URL', async () => {
			const invalidConfig = { ...mockConfig, manifestUrl: '' };
			render(VideoPlayer, { config: invalidConfig });
			await waitForConsoleError();
		});

		it('should handle manifest load errors', async () => {
			mockPlayerInstance.load.mockRejectedValueOnce(new Error('Load failed'));
			render(VideoPlayer, { config: mockConfig });
			await waitForConsoleError();
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

		// it('should handle player attach errors', async () => {
		// 	// mockPlayerInstance.attach.mockRejectedValueOnce(new Error('Attach failed'));
		// 	render(VideoPlayer, { config: mockConfig });
		// 	await waitForConsoleError();
		// });
	});

	describe('Component cleanup', () => {
		it('should destroy player on unmount', async () => {
			const { unmount } = await renderAndWaitForInit();
			unmount();

			// Give it time to cleanup
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(mockPlayerInstance.destroy).toHaveBeenCalled();
		});
	});

	describe('Configuration variations', () => {
		it('should handle different manifest URLs', async () => {
			const config = { ...mockConfig, manifestUrl: 'blob:http://localhost:5173/other' };
			await renderAndWaitForInit(config);
			expect(mockPlayerInstance.load).toHaveBeenCalledWith('blob:http://localhost:5173/other');
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

	describe('Network request filtering', () => {
		it('should register request filter with networking engine', async () => {
			await renderAndWaitForInit();
			expect(mockPlayerInstance.getNetworkingEngine).toHaveBeenCalled();
			expect(mockRegisterRequestFilter).toHaveBeenCalledWith(expect.any(Function));
		});

		it('should proxy googlevideo.com segment requests through PROXY_URL', async () => {
			await renderAndWaitForInit();
			const filterFunction = getRegisteredFilter();

			const mockRequest = createMockRequest(
				'https://rr3---sn-25ge7nsk.googlevideo.com/videoplayback?id=123&key=value'
			);
			filterFunction(SEGMENT_TYPE, mockRequest);

			expect(mockRequest.uris[0]).toContain('http://localhost:8888');
			expect(mockRequest.uris[0]).toContain('host=rr3---sn-25ge7nsk.googlevideo.com');
			expect(mockRequest.uris[0]).toContain('id=123');
			expect(mockRequest.uris[0]).toContain('key=value');
		});

		it('should preserve original path and query parameters when proxying', async () => {
			await renderAndWaitForInit();
			const filterFunction = getRegisteredFilter();

			const mockRequest = createMockRequest(
				'https://rr3---sn-25ge7nsk.googlevideo.com/videoplayback?expire=1234&ei=abcd&ip=1.2.3.4'
			);
			filterFunction(SEGMENT_TYPE, mockRequest);

			const proxiedUrl = new URL(mockRequest.uris[0]);

			expect(proxiedUrl.pathname).toContain('/videoplayback');
			expect(proxiedUrl.searchParams.get('expire')).toBe('1234');
			expect(proxiedUrl.searchParams.get('ei')).toBe('abcd');
			expect(proxiedUrl.searchParams.get('ip')).toBe('1.2.3.4');
			expect(proxiedUrl.searchParams.get('host')).toBe('rr3---sn-25ge7nsk.googlevideo.com');
		});

		it('should convert Range header to query parameter', async () => {
			await renderAndWaitForInit();
			const filterFunction = getRegisteredFilter();

			const mockRequest = createMockRequest(
				'https://rr3---sn-25ge7nsk.googlevideo.com/videoplayback?id=123',
				{ Range: 'bytes=0-999999' }
			);
			filterFunction(SEGMENT_TYPE, mockRequest);

			const proxiedUrl = new URL(mockRequest.uris[0]);
			expect(proxiedUrl.searchParams.get('range')).toBe('0-999999');
			expect(mockRequest.headers).toEqual({});
		});

		it('should not modify non-googlevideo.com URLs', async () => {
			await renderAndWaitForInit();
			const filterFunction = getRegisteredFilter();

			const originalUrl = 'https://example.com/video.mp4?param=value';
			const mockRequest = createMockRequest(originalUrl);
			filterFunction(SEGMENT_TYPE, mockRequest);

			expect(mockRequest.uris[0]).toBe(originalUrl);
		});

		it('should only filter segment requests (type 1)', async () => {
			await renderAndWaitForInit();
			const filterFunction = getRegisteredFilter();

			const originalUrl = 'https://rr3---sn-25ge7nsk.googlevideo.com/videoplayback?id=123';
			const mockRequest = createMockRequest(originalUrl);
			filterFunction(MANIFEST_TYPE, mockRequest);

			expect(mockRequest.uris[0]).toBe(originalUrl);
		});

		it('should handle networking engine being null', async () => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			mockPlayerInstance.getNetworkingEngine.mockReturnValue(null);

			expect(() => {
				render(VideoPlayer, { config: mockConfig });
			}).not.toThrow();

			await waitFor(
				() => {
					expect(mockPlayerInstance.getNetworkingEngine).toHaveBeenCalled();
					expect(mockRegisterRequestFilter).not.toHaveBeenCalled();
				},
				{ timeout: 2000 }
			);
		});
	});
});
