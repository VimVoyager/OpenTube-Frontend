import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import VideoPlayer from './VideoPlayer.svelte';
import type { VideoPlayerConfig } from '$lib/adapters/types';

// Create mocks BEFORE vi.mock calls (hoisting requirement)
const mockPlayerInstance = {
	attach: vi.fn().mockResolvedValue(undefined),
	load: vi.fn().mockResolvedValue(undefined),
	getNetworkingEngine: vi.fn(() => ({
		registerRequestFilter: vi.fn()
	})),
	configure: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	destroy: vi.fn().mockImplementation(() => Promise.resolve()) // Return actual Promise
};

const mockUIInstance = {
	configure: vi.fn(),
	destroy: vi.fn()
};

// Create a proper constructor function
class MockShakaPlayer {
	attach = mockPlayerInstance.attach;
	load = mockPlayerInstance.load;
	getNetworkingEngine = mockPlayerInstance.getNetworkingEngine;
	configure = mockPlayerInstance.configure;
	addEventListener = mockPlayerInstance.addEventListener;
	removeEventListener = mockPlayerInstance.removeEventListener;
	destroy = mockPlayerInstance.destroy;

	static isBrowserSupported = vi.fn(() => true);
}

class MockShakaUIOverlay {
	configure = mockUIInstance.configure;
	destroy = mockUIInstance.destroy;
}

// Mock Shaka Player module
vi.mock('shaka-player/dist/shaka-player.ui', () => ({
	default: {
		Player: MockShakaPlayer,
		ui: {
			Overlay: MockShakaUIOverlay
		}
	}
}));

vi.mock('shaka-player/dist/controls.css', () => ({}));

describe('VideoPlayer.svelte', () => {
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	const mockConfig: VideoPlayerConfig = {
		manifestUrl: 'blob:http://localhost:5173/test-manifest',
		duration: 180,
		poster: 'https://example.com/poster.jpg'
	};

	beforeEach(() => {
		vi.clearAllMocks();
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		// Reset to success state
		MockShakaPlayer.isBrowserSupported = vi.fn(() => true);
		mockPlayerInstance.attach.mockResolvedValue(undefined);
		mockPlayerInstance.load.mockResolvedValue(undefined);
		mockPlayerInstance.destroy.mockImplementation(() => Promise.resolve());
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
	});

	describe('Component rendering', () => {
		it('should render video element', () => {
			const { container } = render(VideoPlayer, { config: mockConfig });
			expect(container.querySelector('video')).toBeInTheDocument();
		});

		it('should set poster on video element', () => {
			const { container } = render(VideoPlayer, { config: mockConfig });
			const video = container.querySelector('video');
			expect(video).toHaveAttribute('poster', mockConfig.poster);
		});

		it('should set required video attributes', () => {
			const { container } = render(VideoPlayer, { config: mockConfig });
			const video = container.querySelector('video');
			expect(video).toHaveAttribute('crossorigin', 'anonymous');
			expect(video).toHaveAttribute('playsinline');
		});
	});

	describe('Player initialization', () => {
		it('should check browser support', async () => {
			render(VideoPlayer, { config: mockConfig });

			await waitFor(
				() => {
					expect(MockShakaPlayer.isBrowserSupported).toHaveBeenCalled();
				},
				{ timeout: 2000 }
			);
		});

		it('should create player instance', async () => {
			render(VideoPlayer, { config: mockConfig });

			await waitFor(
				() => {
					// Just verify player methods are called, constructor is implicit
					expect(mockPlayerInstance.attach).toHaveBeenCalled();
				},
				{ timeout: 2000 }
			);
		});

		it('should attach player to video element', async () => {
			render(VideoPlayer, { config: mockConfig });

			await waitFor(
				() => {
					expect(mockPlayerInstance.attach).toHaveBeenCalled();
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
			mockPlayerInstance.attach.mockRejectedValueOnce(new Error('Attach failed'));
			render(VideoPlayer, { config: mockConfig });

			await waitFor(
				() => {
					expect(consoleErrorSpy).toHaveBeenCalled();
				},
				{ timeout: 2000 }
			);
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