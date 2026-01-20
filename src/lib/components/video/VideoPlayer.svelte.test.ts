import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import type { VideoPlayerConfig } from '$lib/adapters/types';

// Create mocks for Shaka Player
const mockPlayerInstance = {
	attach: vi.fn().mockResolvedValue(undefined),
	load: vi.fn().mockResolvedValue(undefined),
	getNetworkingEngine: vi.fn(() => ({
		registerRequestFilter: vi.fn()
	})),
	configure: vi.fn(),
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
		console.log('MockShakaPlayer constructor called');
	}

	attach(videoEl: HTMLVideoElement) {
		// console.log('Instance attach called with:', videoEl);
		capturedVideoElement = videoEl;
		mockPlayerInstance.attach(videoEl);
		return Promise.resolve();
	}

	// load = mockPlayerInstance.load;
	load = vi.fn((manifestUrl: string) => {
		// console.log('Instance load called with:', manifestUrl);
		return mockPlayerInstance.load(manifestUrl);
	});
	getNetworkingEngine = vi.fn(() => {
		return mockPlayerInstance.getNetworkingEngine();
	});
	configure = vi.fn((config: any) => {
		return mockPlayerInstance.configure(config);
	});
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
	configure = vi.fn((config: any) => {
		return mockUIInstance.configure(config);
	});

	destroy = vi.fn(() => {
		return mockUIInstance.destroy();
	});

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
	let consoleLogSpy: ReturnType<typeof vi.spyOn>;

	const mockConfig: VideoPlayerConfig = {
		manifestUrl: 'blob:http://localhost:5173/test-manifest',
		duration: 180,
		poster: 'https://example.com/poster.jpg'
	};

	beforeEach(() => {
		vi.clearAllMocks();
		capturedVideoElement = null;
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
		consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

		// Reset to success state
		MockShakaPlayer.isBrowserSupported = vi.fn(() => true);
		mockPlayerInstance.attach.mockResolvedValue(undefined);
		mockPlayerInstance.load.mockResolvedValue(undefined);
		mockPlayerInstance.destroy.mockImplementation(() => Promise.resolve());
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
		consoleLogSpy.mockRestore();
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

		it('should check browser support and attach player to video element and attach player', async () => {
			render(VideoPlayer, { config: mockConfig });

			await waitFor(
				() => {
					// Just verify player methods are called, constructor is implicit
					expect(mockPlayerInstance.attach).toHaveBeenCalled();

					// Check the captured video element
					expect(capturedVideoElement).not.toBeNull();
					expect(capturedVideoElement).toBeInstanceOf(HTMLVideoElement);
					expect(capturedVideoElement?.dataset.testid).toBe('video-player');

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