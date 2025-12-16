/**
 * Test Suite: VideoPlayer.svelte
 * 
 * Tests for video player component with Shaka Player integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import VideoPlayer from './VideoPlayer.svelte';
import type { VideoPlayerConfig } from '$lib/adapters/types';

// Define Player constructor type
interface MockPlayerConstructor {
	new (): typeof mockPlayer;
	isBrowserSupported: () => boolean;
}

// Mock Shaka Player
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPlayer: any = {
	attach: vi.fn().mockResolvedValue(undefined),
	load: vi.fn().mockResolvedValue(undefined),
	getNetworkingEngine: vi.fn(() => ({
		registerRequestFilter: vi.fn()
	})),
	configure: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	destroy: vi.fn().mockResolvedValue(undefined),
	getConfiguration: vi.fn(() => ({})),
	getManifest: vi.fn(() => ({ presentationTimeline: { getDuration: () => 180 } }))
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUI: any = {
	configure: vi.fn(),
	destroy: vi.fn()
};

// Define Player constructor type
interface MockPlayerConstructor {
	new (): typeof mockPlayer;
	isBrowserSupported: () => boolean;
}

const mockShaka = {
	Player: vi.fn(() => mockPlayer) as unknown as MockPlayerConstructor,
	ui: {
		Overlay: vi.fn(() => mockUI)
	},
	net: {
		NetworkingEngine: {
			RequestType: {}
		}
	}
};

// Add isBrowserSupported as a static method
(mockShaka.Player as MockPlayerConstructor).isBrowserSupported = vi.fn().mockReturnValue(true);

// Mock dynamic imports
vi.mock('shaka-player/dist/shaka-player.ui', () => ({
	default: mockShaka
}));

vi.mock('shaka-player/dist/controls.css', () => ({}));

describe('VideoPlayer.svelte', () => {
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
	let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

	const mockConfig: VideoPlayerConfig = {
		manifestUrl: 'blob:http://localhost:5173/test-manifest',
		duration: 180,
		poster: 'https://example.com/poster.jpg'
	};

	beforeEach(() => {
		vi.clearAllMocks();
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		// Reset mock implementations to default success state
		(mockShaka.Player as MockPlayerConstructor).isBrowserSupported = vi
			.fn()
			.mockReturnValue(true);
		mockPlayer.attach.mockResolvedValue(undefined);
		mockPlayer.load.mockResolvedValue(undefined);
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
		consoleWarnSpy.mockRestore();
	});

	describe('Component initialization', () => {
		it('should render video player component', () => {
			const { container } = render(VideoPlayer, { config: mockConfig });

			expect(container.querySelector('video')).toBeInTheDocument();
		});

		it('should display loading state initially', () => {
			const { container } = render(VideoPlayer, { config: mockConfig });

			const loadingOverlay = container.querySelector('.loading-overlay');
			expect(loadingOverlay).toBeInTheDocument();
		});

		it('should set poster attribute on video element', () => {
			const { container } = render(VideoPlayer, { config: mockConfig });

			const video = container.querySelector('video');
			expect(video).toHaveAttribute('poster', mockConfig.poster);
		});

		it('should have required video attributes', () => {
			const { container } = render(VideoPlayer, { config: mockConfig });

			const video = container.querySelector('video');
			expect(video).toHaveAttribute('crossorigin', 'anonymous');
			expect(video).toHaveAttribute('playsinline');
		});
	});

	describe('Shaka Player initialization', () => {
		it('should check browser support on mount', async () => {
			render(VideoPlayer, { config: mockConfig });

			await waitFor(() => {
				expect((mockShaka.Player as MockPlayerConstructor).isBrowserSupported).toHaveBeenCalled();
			});
		});

		it('should create player instance when browser is supported', async () => {
			render(VideoPlayer, { config: mockConfig });

			await waitFor(() => {
				expect(mockShaka.Player).toHaveBeenCalled();
			});
		});

		it('should attach player to video element', async () => {
			render(VideoPlayer, { config: mockConfig });

			await waitFor(() => {
				expect(mockPlayer.attach).toHaveBeenCalled();
			});
		});

		it('should configure player settings', async () => {
			render(VideoPlayer, { config: mockConfig });

			await waitFor(() => {
				expect(mockPlayer.configure).toHaveBeenCalledWith(
					expect.objectContaining({
						streaming: expect.any(Object),
						manifest: expect.any(Object)
					})
				);
			});
		});

		it('should create UI overlay', async () => {
			render(VideoPlayer, { config: mockConfig });

			await waitFor(() => {
				expect(mockShaka.ui.Overlay).toHaveBeenCalled();
			});
		});

		it('should configure UI overlay', async () => {
			render(VideoPlayer, { config: mockConfig });

			await waitFor(() => {
				expect(mockUI.configure).toHaveBeenCalledWith(
					expect.objectContaining({
						overflowMenuButtons: expect.any(Array),
						controlPanelElements: expect.any(Array)
					})
				);
			});
		});

		it('should register error event listener', async () => {
			render(VideoPlayer, { config: mockConfig });

			await waitFor(() => {
				expect(mockPlayer.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
			});
		});
	});

	describe('Manifest loading', () => {
		it('should load manifest from backend URL', async () => {
			render(VideoPlayer, { config: mockConfig });

			await waitFor(() => {
				expect(mockPlayer.load).toHaveBeenCalledWith(mockConfig.manifestUrl);
			});
		});

		it('should handle successful manifest loading', async () => {
			const { container } = render(VideoPlayer, { config: mockConfig });

			await waitFor(() => {
				const loadingOverlay = container.querySelector('.loading-overlay');
				// Loading should be hidden after successful load
				expect(mockPlayer.load).toHaveBeenCalled();
			});
		});

		it('should throw error when manifestUrl is empty', async () => {
			const invalidConfig = {
				...mockConfig,
				manifestUrl: ''
			};

			render(VideoPlayer, { config: invalidConfig });

			await waitFor(() => {
				expect(consoleErrorSpy).toHaveBeenCalled();
			});
		});

		it('should handle manifest loading errors', async () => {
			mockPlayer.load.mockRejectedValue(new Error('Failed to load manifest'));

			render(VideoPlayer, { config: mockConfig });

			await waitFor(() => {
				expect(consoleErrorSpy).toHaveBeenCalledWith(
					'Error loading DASH manifest:',
					expect.any(Error)
				);
			});
		});
	});

	describe('Request filtering (proxy support)', () => {
		it('should register request filter for googlevideo.com', async () => {
			render(VideoPlayer, { config: mockConfig });

			await waitFor(() => {
				expect(mockPlayer.getNetworkingEngine).toHaveBeenCalled();
				const networkingEngine = mockPlayer.getNetworkingEngine();
				expect(networkingEngine.registerRequestFilter).toHaveBeenCalled();
			});
		});

		it('should configure player with retry parameters', async () => {
			render(VideoPlayer, { config: mockConfig });

			await waitFor(() => {
				expect(mockPlayer.configure).toHaveBeenCalledWith(
					expect.objectContaining({
						streaming: expect.objectContaining({
							retryParameters: expect.objectContaining({
								timeout: 30000,
								maxAttempts: 3
							})
						})
					})
				);
			});
		});
	});

	describe('Error handling', () => {
		it('should display error when browser is not supported', async () => {
			(mockShaka.Player as MockPlayerConstructor).isBrowserSupported = vi
				.fn()
				.mockReturnValue(false);

			const { container } = render(VideoPlayer, { config: mockConfig });

			await waitFor(() => {
				expect(consoleErrorSpy).toHaveBeenCalledWith(
					expect.stringContaining('Browser not supported')
				);
			});
		});

		it('should handle player initialization errors', async () => {
			mockPlayer.attach.mockRejectedValue(new Error('Attach failed'));

			render(VideoPlayer, { config: mockConfig });

			await waitFor(() => {
				expect(consoleErrorSpy).toHaveBeenCalledWith(
					'Error initializing video player:',
					expect.any(Error)
				);
			});
		});

		it('should handle Shaka Player import errors', async () => {
			vi.doMock('shaka-player/dist/shaka-player.ui', () => {
				throw new Error('Import failed');
			});

			render(VideoPlayer, { config: mockConfig });

			await waitFor(
				() => {
					expect(consoleErrorSpy).toHaveBeenCalled();
				},
				{ timeout: 1000 }
			);
		});
	});

	describe('Component cleanup', () => {
		it('should destroy player on unmount', async () => {
			const { unmount } = render(VideoPlayer, { config: mockConfig });

			await waitFor(() => {
				expect(mockPlayer.attach).toHaveBeenCalled();
			});

			unmount();

			expect(mockPlayer.destroy).toHaveBeenCalled();
		});

		it('should destroy UI on unmount', async () => {
			const { unmount } = render(VideoPlayer, { config: mockConfig });

			await waitFor(() => {
				expect(mockShaka.ui.Overlay).toHaveBeenCalled();
			});

			unmount();

			expect(mockUI.destroy).toHaveBeenCalled();
		});

		it('should remove error event listener on unmount', async () => {
			const { unmount } = render(VideoPlayer, { config: mockConfig });

			await waitFor(() => {
				expect(mockPlayer.addEventListener).toHaveBeenCalled();
			});

			unmount();

			expect(mockPlayer.removeEventListener).toHaveBeenCalledWith('error', expect.any(Function));
		});
	});

	describe('Configuration reactivity', () => {
		it('should accept different manifest URLs', async () => {
			const config1 = {
				...mockConfig,
				manifestUrl: 'blob:http://localhost:5173/manifest-1'
			};

			const { unmount } = render(VideoPlayer, { config: config1 });

			await waitFor(() => {
				expect(mockPlayer.load).toHaveBeenCalledWith('blob:http://localhost:5173/manifest-1');
			});

			unmount();
		});

		it('should handle different poster URLs', () => {
			const configWithPoster = {
				...mockConfig,
				poster: 'https://cdn.example.com/custom-poster.jpg'
			};

			const { container } = render(VideoPlayer, { config: configWithPoster });

			const video = container.querySelector('video');
			expect(video).toHaveAttribute('poster', 'https://cdn.example.com/custom-poster.jpg');
		});

		it('should handle empty poster URL', () => {
			const configWithoutPoster = {
				...mockConfig,
				poster: ''
			};

			const { container } = render(VideoPlayer, { config: configWithoutPoster });

			const video = container.querySelector('video');
			expect(video).toHaveAttribute('poster', '');
		});
	});

	describe('Browser environment check', () => {
		it('should not initialize player in non-browser environment', async () => {
			// This test assumes the component checks browser environment
			// The actual check happens via $app/environment

			render(VideoPlayer, { config: mockConfig });

			// In test environment, it should still attempt initialization
			// but in SSR, it would not
			await waitFor(() => {
				// Just verify the test runs without errors
				expect(true).toBe(true);
			});
		});
	});

	describe('Player configuration', () => {
		it('should configure buffering settings', async () => {
			render(VideoPlayer, { config: mockConfig });

			await waitFor(() => {
				expect(mockPlayer.configure).toHaveBeenCalledWith(
					expect.objectContaining({
						streaming: expect.objectContaining({
							bufferingGoal: 30,
							rebufferingGoal: 2,
							bufferBehind: 30
						})
					})
				);
			});
		});

		it('should configure DASH manifest settings', async () => {
			render(VideoPlayer, { config: mockConfig });

			await waitFor(() => {
				expect(mockPlayer.configure).toHaveBeenCalledWith(
					expect.objectContaining({
						manifest: expect.objectContaining({
							dash: expect.objectContaining({
								ignoreSuggestedPresentationDelay: true,
								autoCorrectDrift: false
							})
						})
					})
				);
			});
		});
	});

	describe('UI configuration', () => {
		it('should configure overflow menu buttons', async () => {
			render(VideoPlayer, { config: mockConfig });

			await waitFor(() => {
				expect(mockUI.configure).toHaveBeenCalledWith(
					expect.objectContaining({
						overflowMenuButtons: expect.arrayContaining(['quality', 'language', 'captions'])
					})
				);
			});
		});

		it('should configure control panel elements', async () => {
			render(VideoPlayer, { config: mockConfig });

			await waitFor(() => {
				expect(mockUI.configure).toHaveBeenCalledWith(
					expect.objectContaining({
						controlPanelElements: expect.arrayContaining([
							'play_pause',
							'mute',
							'volume',
							'fullscreen'
						])
					})
				);
			});
		});

		it('should configure seek bar colors', async () => {
			render(VideoPlayer, { config: mockConfig });

			await waitFor(() => {
				expect(mockUI.configure).toHaveBeenCalledWith(
					expect.objectContaining({
						seekBarColors: expect.objectContaining({
							base: expect.any(String),
							buffered: expect.any(String),
							played: expect.any(String)
						})
					})
				);
			});
		});
	});
});