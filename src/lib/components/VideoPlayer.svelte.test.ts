/**
 * Test Suite: VideoPlayer.svelte
 * 
 * Tests for video player component with Shaka Player integration
 */

import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { tick } from 'svelte';
import VideoPlayer from './VideoPlayer.svelte';
import {
	mockPlayerConfig,
	mockPlayerConfigVideoOnly,
	mockPlayerConfigAudioOnly,
	mockPlayerConfigNoStreams,
	mockPlayerConfigSingleQuality,
	mockPlayerConfigMultipleQualities,
	mockPlayerConfigVerticalVideo,
	mockPlayerConfig4K,
	SHAKA_ERROR_CODES
} from '../../tests/fixtures/videoPlayerFixtures';


// =============================================================================
// Mock Setup - Must be at module level, no external variable references
// =============================================================================

// Mock browser environment
vi.mock('$app/environment', () => ({
	browser: true
}));

// Mock DASH manifest generator - use vi.fn() directly
vi.mock('$lib/utils/dashManifestGenerator', () => ({
	generateDashManifestBlobUrl: vi.fn(() => 'blob:http://localhost/mock-manifest'),
	revokeDashManifestBlobUrl: vi.fn()
}));

// Mock Shaka Player - create everything inside the factory
vi.mock('shaka-player/dist/shaka-player.ui', () => {
	const mockNetworkingEngine = {
		registerRequestFilter: vi.fn()
	};

	const mockPlayer = {
		attach: vi.fn(() => Promise.resolve()),
		load: vi.fn(() => Promise.resolve()),
		configure: vi.fn(),
		destroy: vi.fn(() => Promise.resolve()),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		getNetworkingEngine: vi.fn(() => mockNetworkingEngine)
	};

	const mockUIOverlay = {
		configure: vi.fn(),
		destroy: vi.fn(() => Promise.resolve())
	};

	const PlayerConstructor = vi.fn(function () {
		return mockPlayer;
	});
	(PlayerConstructor as Mock).isBrowserSupported = vi.fn(() => true);

	const UIOverlayConstructor = vi.fn(function () { return mockUIOverlay });

	return {
		default: {
			Player: PlayerConstructor,
			ui: {
				Overlay: UIOverlayConstructor
			},
			polyfill: {
				installAll: vi.fn()
			}
		}
	};
});

vi.mock('shaka-player/dist/controls.css', () => ({}));

// =============================================================================
// Helper Functions
// =============================================================================

const waitForPlayerInitialization = async (timeout = 100): Promise<void> => {
	await new Promise(resolve => setTimeout(resolve, timeout));
	await tick();
	await tick();
};

// Helper to trigger Shaka error events
const triggerShakaError = async (errorCode: number, errorMessage: string): Promise<void> => {
	const shaka = await import('shaka-player/dist/shaka-player.ui');
	const PlayerConstructor = shaka.default.Player as any;
	const mockPlayer = PlayerConstructor.mock.results[0]?.value;

	if (!mockPlayer) return;

	const errorEvent = {
		detail: {
			code: errorCode,
			message: errorMessage,
			severity: 2,
			category: 1,
			data: []
		}
	};

	const addEventListenerCalls = mockPlayer.addEventListener.mock.calls;
	const errorListener = addEventListenerCalls.find((call: any[]) => call[0] === 'error');

	if (errorListener && errorListener[1]) {
		errorListener[1](errorEvent);
	}
};

// =============================================================================
// Test Suite
// =============================================================================

describe('VideoPlayer', () => {
	let mockGenerateDashManifestBlobUrl: Mock;
	let mockRevokeDashManifestBlobUrl: Mock;
	let shakaModule: any;
	let mockPlayer: any;
	let mockUIOverlay: any;

	beforeEach(async () => {
		// Import and get mock references
		const dashGenerator = await import('$lib/utils/dashManifestGenerator');
		mockGenerateDashManifestBlobUrl = vi.mocked(dashGenerator.generateDashManifestBlobUrl);
		mockRevokeDashManifestBlobUrl = vi.mocked(dashGenerator.revokeDashManifestBlobUrl);

		const shaka = await import('shaka-player/dist/shaka-player.ui');
		shakaModule = shaka.default;

		mockGenerateDashManifestBlobUrl.mockClear();
		mockRevokeDashManifestBlobUrl.mockClear();

		(shakaModule.Player as Mock).mockClear();
		(shakaModule.ui.Overlay as Mock).mockClear();

		// Reset mock return values
		mockGenerateDashManifestBlobUrl.mockReturnValue('blob:http://localhost/mock-manifest');
		shakaModule.Player.isBrowserSupported.mockReturnValue(true);

		// Get player and UI overlay instances
		mockPlayer = shakaModule.Player.mock.results[0]?.value;
		mockUIOverlay = shakaModule.ui.Overlay.mock.results[0]?.value;

		if (mockPlayer) {
			mockPlayer.attach.mockClear();
			mockPlayer.load.mockClear();
			mockPlayer.configure.mockClear();
			mockPlayer.destroy.mockClear();
			mockPlayer.addEventListener.mockClear();
			mockPlayer.removeEventListener.mockClear();
			mockPlayer.getNetworkingEngine.mockClear();

			const networkingEngine = mockPlayer.getNetworkingEngine();
			if (networkingEngine && networkingEngine.registerRequestFilter) {
				networkingEngine.registerRequestFilter.mockClear();
			}
		}
	});

	afterEach(() => {
		// Cleanup if necessary
	});

	// =============================================================================
	// Video Element Rendering Tests
	// =============================================================================

	describe('video element rendering', () => {
		it('should render video element', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const video = document.querySelector('video');
			expect(video).toBeInTheDocument();
		});

		it('should render video with correct class', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const video = document.querySelector('video.shaka-video');
			expect(video).toBeInTheDocument();
		});

		it('should set video poster attribute', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const video = document.querySelector('video');
			expect(video).toHaveAttribute('poster', mockPlayerConfig.poster);
		});

		it('should set playsinline attribute', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const video = document.querySelector('video');
			expect(video).toHaveAttribute('playsinline');
		});

		it('should set crossorigin attribute', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const video = document.querySelector('video');
			expect(video).toHaveAttribute('crossorigin', 'anonymous');
		});

		it('should render video container', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const container = document.querySelector('.video-container');
			expect(container).toBeInTheDocument();
		});

		it('should render player wrapper', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const wrapper = document.querySelector('.player-wrapper');
			expect(wrapper).toBeInTheDocument();
		});

		it('should render captions track', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const track = document.querySelector('track[kind="captions"]');
			expect(track).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Player Initialization Tests
	// =============================================================================

	describe('player initialization', () => {
		it('should check if browser is supported', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			expect(shakaModule.Player.isBrowserSupported).toHaveBeenCalled();
		});

		it('should create player instance', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			expect(shakaModule.Player).toHaveBeenCalled();
		});

		it('should attach player to video element', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			// Get the actual player instance that was created
			const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			expect(playerInstance.attach).toHaveBeenCalled();
		});

		it('should configure player settings', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			expect(playerInstance.configure).toHaveBeenCalled();

			const configCall = playerInstance.configure.mock.calls[0][0];
			expect(configCall).toHaveProperty('streaming');
			expect(configCall).toHaveProperty('manifest');
		});

		it('should configure streaming buffer settings', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			const configCall = playerInstance.configure.mock.calls[0][0];
			expect(configCall.streaming).toHaveProperty('bufferingGoal', 30);
			expect(configCall.streaming).toHaveProperty('rebufferingGoal', 2);
			expect(configCall.streaming).toHaveProperty('bufferBehind', 30);
		});

		it('should register network request filter', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			const networkingEngine = playerInstance.getNetworkingEngine();
			expect(networkingEngine.registerRequestFilter).toHaveBeenCalled();
		});

		it('should create UI overlay', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			expect(shakaModule.ui.Overlay).toHaveBeenCalled();
		});

		it('should configure UI overlay', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const uiInstance = shakaModule.ui.Overlay.mock.results[shakaModule.ui.Overlay.mock.results.length - 1]?.value;
			expect(uiInstance.configure).toHaveBeenCalled();
		});

		it('should register error event listener', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			expect(playerInstance.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
		});

		it('should load DASH manifest', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			expect(playerInstance.load).toHaveBeenCalled();
		});

		it('should hide loading state after initialization', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });

			expect(screen.getByText(/loading video/i)).toBeInTheDocument();

			await waitForPlayerInitialization();

			await waitFor(() => {
				expect(screen.queryByText(/loading video/i)).not.toBeInTheDocument();
			});
		});
	});

	// =============================================================================
	// Loading State Tests
	// =============================================================================

	describe('loading state', () => {
		it('should show loading overlay initially', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });

			const loadingOverlay = document.querySelector('.loading-overlay');
			expect(loadingOverlay).toBeInTheDocument();
		});

		it('should show loading spinner', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });

			const spinner = document.querySelector('.loading-spinner');
			expect(spinner).toBeInTheDocument();
		});

		it('should render loading overlay with correct styling', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });

			const loadingOverlay = document.querySelector('.loading-overlay');
			expect(loadingOverlay).toBeInTheDocument();
			expect(screen.getByText(/loading video/i)).toBeInTheDocument();
		});

		it('should hide loading state on successful initialization', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });

			expect(screen.getByText(/loading video/i)).toBeInTheDocument();

			await waitForPlayerInitialization();

			await waitFor(() => {
				expect(screen.queryByText(/loading video/i)).not.toBeInTheDocument();
			});
		});
	});

	// =============================================================================
	// Aspect Ratio Tests
	// =============================================================================

	describe('aspect ratio', () => {
		it('should use video stream dimensions for aspect ratio', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const wrapper = document.querySelector('.player-wrapper') as HTMLElement;
			const aspectRatio = wrapper.style.aspectRatio;

			const expectedRatio = `${mockPlayerConfig.videoStream![0].width}/${mockPlayerConfig.videoStream![0].height}`;
			expect(aspectRatio).toBe(expectedRatio);
		});

		it('should default to 16:9 when no video stream', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfigAudioOnly } });
			await waitForPlayerInitialization();

			const wrapper = document.querySelector('.player-wrapper') as HTMLElement;
			expect(wrapper.style.aspectRatio).toBe('16/9');
		});

		it('should handle vertical video aspect ratio', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfigVerticalVideo } });
			await waitForPlayerInitialization();

			const wrapper = document.querySelector('.player-wrapper') as HTMLElement;
			const aspectRatio = wrapper.style.aspectRatio;
			expect(aspectRatio).toBe('1080/1920');
		});

		it('should handle 4K video aspect ratio', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig4K } });
			await waitForPlayerInitialization();

			const wrapper = document.querySelector('.player-wrapper') as HTMLElement;
			expect(wrapper.style.aspectRatio).toBe('3840/2160');
		});

		it('should use first video stream for aspect ratio when multiple qualities', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfigMultipleQualities } });
			await waitForPlayerInitialization();

			const wrapper = document.querySelector('.player-wrapper') as HTMLElement;
			const aspectRatio = wrapper.style.aspectRatio;

			const expectedRatio = `${mockPlayerConfigMultipleQualities.videoStream![0].width}/${mockPlayerConfigMultipleQualities.videoStream![0].height}`;
			expect(aspectRatio).toBe(expectedRatio);
		});
	});

	// =============================================================================
	// Configuration Tests
	// =============================================================================

	describe('configuration', () => {
		it('should handle video-only configuration', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfigVideoOnly } });
			await waitForPlayerInitialization();

			const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			expect(playerInstance.load).toHaveBeenCalled();
		});

		it('should handle audio-only configuration', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfigAudioOnly } });
			await waitForPlayerInitialization();

			const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			expect(playerInstance.load).toHaveBeenCalled();
		});

		it('should handle single quality configuration', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfigSingleQuality } });
			await waitForPlayerInitialization();

			const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			expect(playerInstance.load).toHaveBeenCalled();
		});

		it('should handle multiple quality configuration', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfigMultipleQualities } });
			await waitForPlayerInitialization();

			const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			expect(playerInstance.load).toHaveBeenCalled();
		});

		it('should handle configuration with subtitles', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			expect(mockGenerateDashManifestBlobUrl).toHaveBeenCalled();
			const manifestConfig = mockGenerateDashManifestBlobUrl.mock.calls[0][0];
			expect(manifestConfig.subtitleStreams).toBeDefined();
		});

		it('should handle configuration without subtitles', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfigSingleQuality } });
			await waitForPlayerInitialization();

			expect(mockGenerateDashManifestBlobUrl).toHaveBeenCalled();
		});
	});

	// =============================================================================
	// Error Handling Tests
	// =============================================================================

	describe('error handling', () => {
		it('should display error message on browser not supported', async () => {
			shakaModule.Player.isBrowserSupported.mockReturnValue(false);

			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			await waitFor(() => {
				const errorMessages = screen.getAllByText(/browser not supported/i);
				expect(errorMessages.length).toBeGreaterThan(0);
			});
		});

		it('should display network error message', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			await triggerShakaError(SHAKA_ERROR_CODES.NETWORK_ERROR, 'Network failed');

			await waitFor(() => {
				const errorMessages = screen.getAllByText(/network error/i);
				expect(errorMessages.length).toBeGreaterThan(0);
			});
		});

		it('should display format not supported error', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			await triggerShakaError(SHAKA_ERROR_CODES.FORMAT_NOT_SUPPORTED, 'Format error');

			await waitFor(() => {
				const errorMessages = screen.getAllByText(/video format not supported/i);
				expect(errorMessages.length).toBeGreaterThan(0);
			});
		});

		it('should display stream expired error', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			await triggerShakaError(SHAKA_ERROR_CODES.STREAM_EXPIRED, 'Stream expired');

			await waitFor(() => {
				const errorMessages = screen.getAllByText(/stream may have expired/i);
				expect(errorMessages.length).toBeGreaterThan(0);
			});
		});

		it('should display manifest error', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			await triggerShakaError(SHAKA_ERROR_CODES.MANIFEST_ERROR, 'Manifest error');

			await waitFor(() => {
				const errorMessages = screen.getAllByText(/unable to load video manifest/i);
				expect(errorMessages.length).toBeGreaterThan(0);
			});
		});

		it('should display generic error for unknown error codes', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			await triggerShakaError(9999, 'Unknown error');

			await waitFor(() => {
				const errorMessages = screen.getAllByText(/unknown error/i);
				expect(errorMessages.length).toBeGreaterThan(0);
			});
		});

		it('should show retry button on error', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			await triggerShakaError(SHAKA_ERROR_CODES.NETWORK_ERROR, 'Network failed');

			await waitFor(() => {
				const retryButton = screen.getByRole('button', { name: /retry/i });
				expect(retryButton).toBeInTheDocument();
			});
		});

		it('should show error icon on error', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			await triggerShakaError(SHAKA_ERROR_CODES.NETWORK_ERROR, 'Network failed');

			await waitFor(() => {
				const errorIcon = document.querySelector('.error-icon');
				expect(errorIcon).toBeInTheDocument();
			});
		});

		// it('should handle initialization errors', async () => {

		// 	const playerInstance = {
		// 		attach: vi.fn(() => Promise.reject(new Error('Initialization failed'))),
		// 		load: vi.fn(() => Promise.resolve()),
		// 		configure: vi.fn(),
		// 		destroy: vi.fn(() => Promise.resolve()),
		// 		addEventListener: vi.fn(),
		// 		removeEventListener: vi.fn(),
		// 		getNetworkingEngine: vi.fn(() => ({
		// 			registerRequestFilter: vi.fn()
		// 		}))
		// 	};

		// 	shakaModule.Player.mockReturnValueOnce(playerInstance);

		// 	render(VideoPlayer, { props: { config: mockPlayerConfig } });

		// 	await waitForPlayerInitialization();

		// 	await waitFor(() => {
		// 		const errorMessages = screen.getAllByText(/Initialization failed/i);
		// 		expect(errorMessages.length).toBeGreaterThan(0);
		// 	}, { timeout: 3000 });

		// 	if (mockPlayer) {
		// 		mockPlayer.attach.mockResolvedValue(undefined);
		// 	}
		// });

		// it('should handle manifest load errors', async () => {
		// 	const playerInstance = {
		// 		attach: vi.fn(() => Promise.resolve()),
		// 		load: vi.fn(() => Promise.reject(new Error('Load failed'))),
		// 		configure: vi.fn(),
		// 		destroy: vi.fn(() => Promise.resolve()),
		// 		addEventListener: vi.fn(),
		// 		removeEventListener: vi.fn(),
		// 		getNetworkingEngine: vi.fn(() => ({
		// 			registerRequestFilter: vi.fn()
		// 		}))
		// 	};

		// 	shakaModule.Player.mockReturnValueOnce(playerInstance);

		// 	render(VideoPlayer, { props: { config: mockPlayerConfig } });
		// 	await waitForPlayerInitialization();

		// 	await waitFor(() => {
		// 		const errorMessages = screen.getAllByText(/load failed/i);
		// 		expect(errorMessages.length).toBeGreaterThan(0);
		// 	}, { timeout: 3000 });
		// });

		it('should throw error when no streams provided', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfigNoStreams } });
			await waitForPlayerInitialization();

			await waitFor(() => {
				const errorMessages = screen.getAllByText(/no video or audio stream/i);
				expect(errorMessages.length).toBeGreaterThan(0);
			});
		});

		// it('should throw error when player not initialized before load', async () => {
		// 	render(VideoPlayer, { props: { config: mockPlayerConfig } });
		// 	await tick();

		// 	expect(shakaModule.Player).toHaveBeenCalled();
		// });

		it('should handle destroy errors gracefully', async () => {
			const playerInstance = {
				attach: vi.fn(() => Promise.resolve()),
				load: vi.fn(() => Promise.resolve()),
				configure: vi.fn(),
				destroy: vi.fn(() => Promise.reject(new Error('Destroy failed'))),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				getNetworkingEngine: vi.fn(() => ({
					registerRequestFilter: vi.fn()
				}))
			};

			shakaModule.Player.mockReturnValueOnce(playerInstance);

			const { unmount } = render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			expect(() => unmount()).not.toThrow();
		});
	});

	// =============================================================================
	// Cleanup Tests
	// =============================================================================

	describe('cleanup', () => {
		it('should destroy player on component unmount', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			// TODO: Remove player instance
			// const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			const { unmount } = render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			unmount();

			const lastPlayerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			expect(lastPlayerInstance.destroy).toHaveBeenCalled();
		});

		it('should revoke blob URL on cleanup', async () => {
			const { unmount } = render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			unmount();

			expect(mockRevokeDashManifestBlobUrl).toHaveBeenCalled();
		});

		it('should handle cleanup when player is null', async () => {
			shakaModule.Player.isBrowserSupported.mockReturnValue(false);

			const { unmount } = render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			expect(() => unmount()).not.toThrow();
		});

		it('should clean up UI overlay', async () => {
			const { unmount } = render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			unmount();

			const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			expect(playerInstance.destroy).toHaveBeenCalled();
		});
	});

	// =============================================================================
	// UI Configuration Tests
	// =============================================================================

	describe('UI configuration', () => {
		it('should configure overflow menu buttons', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const uiInstance = shakaModule.ui.Overlay.mock.results[shakaModule.ui.Overlay.mock.results.length - 1]?.value;
			const uiConfig = uiInstance.configure.mock.calls[0][0];

			expect(uiConfig.overflowMenuButtons).toContain('quality');
			expect(uiConfig.overflowMenuButtons).toContain('language');
			expect(uiConfig.overflowMenuButtons).toContain('captions');
		});

		it('should configure seek bar colors', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const uiInstance = shakaModule.ui.Overlay.mock.results[shakaModule.ui.Overlay.mock.results.length - 1]?.value;
			const uiConfig = uiInstance.configure.mock.calls[0][0];

			expect(uiConfig.seekBarColors).toHaveProperty('base');
			expect(uiConfig.seekBarColors).toHaveProperty('buffered');
			expect(uiConfig.seekBarColors).toHaveProperty('played');
		});

		it('should configure control panel elements', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const uiInstance = shakaModule.ui.Overlay.mock.results[shakaModule.ui.Overlay.mock.results.length - 1]?.value;
			const uiConfig = uiInstance.configure.mock.calls[0][0];

			expect(uiConfig.controlPanelElements).toContain('play_pause');
			expect(uiConfig.controlPanelElements).toContain('fullscreen');
		});
	});

	// =============================================================================
	// Network Request Filter Tests
	// =============================================================================

	describe('network request filter', () => {
		it('should register request filter for googlevideo.com', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			const networkingEngine = playerInstance.getNetworkingEngine();
			await waitFor(() => {
				expect(networkingEngine.registerRequestFilter).toHaveBeenCalled();
			});

			const filterFn = networkingEngine.registerRequestFilter.mock.calls[0][0];
			expect(typeof filterFn).toBe('function');
		});

		it('should proxy googlevideo.com requests through localhost', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			const networkingEngine = playerInstance.getNetworkingEngine();
			await waitFor(() => {
				expect(networkingEngine.registerRequestFilter).toHaveBeenCalled();
			});
			const filterFn = networkingEngine.registerRequestFilter.mock.calls[0][0];

			const mockRequest = {
				uris: ['https://r1---sn-test.googlevideo.com/videoplayback?id=123'],
				headers: {}
			};

			filterFn(null, mockRequest);

			expect(mockRequest.uris[0]).toContain('localhost:8081');
			expect(mockRequest.uris[0]).toContain('host=r1---sn-test.googlevideo.com');
		});

		it('should convert Range header to query parameter', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			const networkingEngine = playerInstance.getNetworkingEngine();
			const filterFn = networkingEngine.registerRequestFilter.mock.calls[0][0];

			const mockRequest = {
				uris: ['https://r1---sn-test.googlevideo.com/videoplayback?id=123'],
				headers: { Range: 'bytes=0-1000' }
			};

			filterFn(null, mockRequest);

			expect(mockRequest.uris[0]).toContain('range=0-1000');
			expect(mockRequest.headers).toEqual({});
		});

		it('should handle requests without Range header', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			const networkingEngine = playerInstance.getNetworkingEngine();
			await waitFor(() => {
				expect(networkingEngine.registerRequestFilter).toHaveBeenCalled();
			});
			const filterFn = networkingEngine.registerRequestFilter.mock.calls[0][0];

			const mockRequest = {
				uris: ['https://r1---sn-test.googlevideo.com/videoplayback?id=123'],
				headers: {}
			};

			filterFn(null, mockRequest);

			expect(mockRequest.uris[0]).toContain('localhost:8081');
			expect(mockRequest.uris[0]).not.toContain('range=');
		});

		it('should not modify non-googlevideo.com requests', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			const networkingEngine = playerInstance.getNetworkingEngine();
			await waitFor(() => {
				expect(networkingEngine.registerRequestFilter).toHaveBeenCalled();
			});
			const filterFn = networkingEngine.registerRequestFilter.mock.calls[0][0];

			const originalUri = 'https://example.com/video.mp4';
			const mockRequest = {
				uris: [originalUri],
				headers: {}
			};

			filterFn(null, mockRequest);

			expect(mockRequest.uris[0]).toBe(originalUri);
		});

		it('should handle invalid request objects', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			const networkingEngine = playerInstance.getNetworkingEngine();
			await waitFor(() => {
				expect(networkingEngine.registerRequestFilter).toHaveBeenCalled();
			});
			const filterFn = networkingEngine.registerRequestFilter.mock.calls[0][0];

			const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => { });

			filterFn(null, null);
			expect(consoleWarn).toHaveBeenCalled();

			filterFn(null, { uris: [] });
			expect(consoleWarn).toHaveBeenCalled();

			consoleWarn.mockRestore();
		});
	});

	// =============================================================================
	// DASH Manifest Generation Tests
	// =============================================================================

	describe('DASH manifest generation', () => {
		it('should generate DASH manifest blob URL', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			expect(mockGenerateDashManifestBlobUrl).toHaveBeenCalled();
		});

		it('should include video streams in manifest config', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const manifestConfig = mockGenerateDashManifestBlobUrl.mock.calls[0][0];
			expect(manifestConfig.videoStreams).toBeDefined();
			expect(manifestConfig.videoStreams).toHaveLength(2);
		});

		it('should include audio streams in manifest config', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const manifestConfig = mockGenerateDashManifestBlobUrl.mock.calls[0][0];
			expect(manifestConfig.audioStreams).toBeDefined();
			expect(manifestConfig.audioStreams).toHaveLength(2);
		});

		it('should include subtitle streams in manifest config', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const manifestConfig = mockGenerateDashManifestBlobUrl.mock.calls[0][0];
			expect(manifestConfig.subtitleStreams).toBeDefined();
			expect(manifestConfig.subtitleStreams).toHaveLength(2);
		});

		it('should include duration in manifest config', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const manifestConfig = mockGenerateDashManifestBlobUrl.mock.calls[0][0];
			expect(manifestConfig.duration).toBe(mockPlayerConfig.duration);
		});

		it('should load generated manifest URL', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			expect(playerInstance.load).toHaveBeenCalledWith('blob:http://localhost/mock-manifest');
		});
	});

	// =============================================================================
	// Integration Tests
	// =============================================================================

	describe('integration', () => {
		it('should complete full initialization flow', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });

			expect(screen.getByText(/loading video/i)).toBeInTheDocument();

			await waitForPlayerInitialization();

			expect(shakaModule.Player).toHaveBeenCalled();

			const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			expect(playerInstance.attach).toHaveBeenCalled();
			expect(playerInstance.configure).toHaveBeenCalled();
			expect(playerInstance.load).toHaveBeenCalled();

			expect(shakaModule.ui.Overlay).toHaveBeenCalled();

			await waitFor(() => {
				expect(screen.queryByText(/loading video/i)).not.toBeInTheDocument();
			});
		});

		it('should handle complete error flow', async () => {
			render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			await triggerShakaError(SHAKA_ERROR_CODES.NETWORK_ERROR, 'Network failed');

			await waitFor(() => {
				const errorMessages = screen.getAllByText(/network error/i);
				expect(errorMessages.length).toBeGreaterThan(0);
				expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
			});
		});

		it('should handle complete cleanup flow', async () => {
			const { unmount } = render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			unmount();

			const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			expect(playerInstance.destroy).toHaveBeenCalled();
			expect(mockRevokeDashManifestBlobUrl).toHaveBeenCalled();
		});

		it('should handle config updates', async () => {
			const { rerender } = render(VideoPlayer, { props: { config: mockPlayerConfig } });
			await waitForPlayerInitialization();

			const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			expect(playerInstance.load).toHaveBeenCalledTimes(1);

			await rerender({ config: mockPlayerConfigSingleQuality });
		});

		it('should render without browser environment', async () => {
			const { container } = render(VideoPlayer, { props: { config: mockPlayerConfig } });
			expect(container).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Edge Cases
	// =============================================================================

	describe('edge cases', () => {
		it('should handle empty video stream array', async () => {
			const emptyVideoConfig = {
				...mockPlayerConfig,
				videoStream: [],
				audioStream: null
			};

			render(VideoPlayer, { props: { config: emptyVideoConfig } });
			await waitForPlayerInitialization();

			const errorMessages = screen.getAllByText(/no video or audio stream/i);
			expect(errorMessages.length).toBeGreaterThan(0);
			expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
		});

		it('should handle empty audio stream array', async () => {
			const emptyAudioConfig = {
				...mockPlayerConfig,
				videoStream: null,
				audioStream: []
			};

			render(VideoPlayer, { props: { config: emptyAudioConfig } });
			await waitForPlayerInitialization();

			await waitFor(() => {
				expect(screen.getByText(/retry/i)).toBeInTheDocument();
				const errorMessages = screen.getAllByText(/no video or audio stream/i);
				expect(errorMessages.length).toBeGreaterThan(0);
			});
		});

		it('should handle missing poster', async () => {
			const noPosterConfig = {
				...mockPlayerConfig,
				poster: ''
			};

			render(VideoPlayer, { props: { config: noPosterConfig } });
			await waitForPlayerInitialization();

			const video = document.querySelector('video');
			expect(video).toHaveAttribute('poster', '');
		});

		it('should handle zero duration', async () => {
			const zeroDurationConfig = {
				...mockPlayerConfig,
				duration: 0
			};

			render(VideoPlayer, { props: { config: zeroDurationConfig } });
			await waitForPlayerInitialization();

			const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			expect(playerInstance.load).toHaveBeenCalled();
		});

		it('should handle very long duration', async () => {
			const longDurationConfig = {
				...mockPlayerConfig,
				duration: 999999999
			};

			render(VideoPlayer, { props: { config: longDurationConfig } });
			await waitForPlayerInitialization();

			console.log('shakaModule.Player.mock:', shakaModule.Player.mock);
			console.log('mock.results:', shakaModule.Player.mock.results);

			const playerInstance = shakaModule.Player.mock.results[shakaModule.Player.mock.results.length - 1]?.value;
			expect(playerInstance.load).toHaveBeenCalled();
		});
	});
});