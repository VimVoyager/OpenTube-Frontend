/**
 * Test Helpers: Shaka Player Mocks
 * 
 * Helper utilities for mocking Shaka Player functionality in component tests
 */

import { vi } from 'vitest';
import type { Mock } from 'vitest';

export interface MockShakaPlayer {
	attach: Mock;
	load: Mock;
	configure: Mock;
	destroy: Mock;
	addEventListener: Mock;
	removeEventListener: Mock;
	getNetworkingEngine: Mock;
}

export interface MockNetworkingEngine {
	registerRequestFilter: Mock;
}

export interface MockShakaUIOverlay {
	configure: Mock;
	destroy: Mock;
}

export interface MockShakaUI {
	Overlay: Mock;
}

export interface MockShakaPlayerClass {
	new(): MockShakaPlayer;
	isBrowserSupported: Mock;
}

export interface MockShakaModule {
	Player: MockShakaPlayerClass;
	ui: MockShakaUI;
	polyfill: {
		installAll: Mock;
	};
}

/**
 * Creates a mock Shaka Player instance
 */
export const createMockShakaPlayer = (): MockShakaPlayer => {
	const mockNetworkingEngine: MockNetworkingEngine = {
		registerRequestFilter: vi.fn()
	};

	return {
		attach: vi.fn().mockResolvedValue(undefined),
		load: vi.fn().mockResolvedValue(undefined),
		configure: vi.fn(),
		destroy: vi.fn().mockResolvedValue(undefined),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		getNetworkingEngine: vi.fn().mockReturnValue(mockNetworkingEngine)
	};
};

/**
 * Creates a mock Shaka UI overlay instance
 */
export const createMockShakaUIOverlay = (): MockShakaUIOverlay => ({
	configure: vi.fn(),
	destroy: vi.fn().mockResolvedValue(undefined)
});

/**
 * Creates a complete mock Shaka module
 */
export const createMockShakaModule = (playerInstance?: MockShakaPlayer): MockShakaModule => {
	const player = playerInstance || createMockShakaPlayer();
	const uiOverlay = createMockShakaUIOverlay();

	const PlayerClass = vi.fn(() => player) as unknown as MockShakaPlayerClass;
	PlayerClass.isBrowserSupported = vi.fn().mockReturnValue(true);

	const UIOverlayClass = vi.fn(() => uiOverlay) as unknown as Mock;

	return {
		Player: PlayerClass,
		ui: {
			Overlay: UIOverlayClass
		},
		polyfill: {
			installAll: vi.fn()
		}
	};
};

/**
 * Mock the Shaka Player module import
 * NOTE: This should be called at module level in test files, not inside functions
 */
export const mockShakaPlayerModule = (customModule?: Partial<MockShakaModule>): MockShakaModule => {
	const defaultModule = createMockShakaModule();
	const module = { ...defaultModule, ...customModule };

	vi.mock('shaka-player/dist/shaka-player.ui', () => ({
		default: module
	}));

	vi.mock('shaka-player/dist/controls.css', () => ({}));

	return module;
};

/**
 * Mock browser not supported scenario
 */
export const mockShakaPlayerNotSupported = (): MockShakaModule => {
	const module = createMockShakaModule();
	module.Player.isBrowserSupported = vi.fn().mockReturnValue(false);
	
	vi.mock('shaka-player/dist/shaka-player.ui', () => ({
		default: module
	}));

	vi.mock('shaka-player/dist/controls.css', () => ({}));

	return module;
};

/**
 * Mock Shaka Player initialization error
 */
export const mockShakaPlayerInitError = (error: Error): { module: MockShakaModule; player: MockShakaPlayer } => {
	const player = createMockShakaPlayer();
	player.attach.mockRejectedValue(error);

	const module = createMockShakaModule(player);
	
	vi.mock('shaka-player/dist/shaka-player.ui', () => ({
		default: module
	}));

	vi.mock('shaka-player/dist/controls.css', () => ({}));

	return { module, player };
};

/**
 * Mock Shaka Player load error
 */
export const mockShakaPlayerLoadError = (error: Error): { module: MockShakaModule; player: MockShakaPlayer } => {
	const player = createMockShakaPlayer();
	player.load.mockRejectedValue(error);

	const module = createMockShakaModule(player);
	
	vi.mock('shaka-player/dist/shaka-player.ui', () => ({
		default: module
	}));

	vi.mock('shaka-player/dist/controls.css', () => ({}));

	return { module, player };
};

/**
 * Trigger a Shaka error event
 */
export const triggerShakaError = (player: MockShakaPlayer, errorCode: number, errorMessage: string): void => {
	const errorEvent = {
		detail: {
			code: errorCode,
			message: errorMessage,
			severity: 2,
			category: 1,
			data: []
		}
	};

	// Get the error event listener that was registered
	const addEventListenerCalls = player.addEventListener.mock.calls;
	const errorListener = addEventListenerCalls.find((call: unknown[]) => call[0] === 'error');
	
	if (errorListener && errorListener[1]) {
		(errorListener[1] as (event: typeof errorEvent) => void)(errorEvent);
	}
};

/**
 * Wait for component to complete async operations
 * NOTE: This may not be enough time for all async operations.
 * Consider using a longer wait time in your tests if needed.
 */
export const waitForPlayerInitialization = (): Promise<void> => {
	return new Promise(resolve => setTimeout(resolve, 0));
};

/**
 * Reset all Shaka Player mocks
 */
export const resetShakaPlayerMocks = (player: MockShakaPlayer): void => {
	player.attach.mockClear();
	player.load.mockClear();
	player.configure.mockClear();
	player.destroy.mockClear();
	player.addEventListener.mockClear();
	player.removeEventListener.mockClear();
	player.getNetworkingEngine.mockClear();
};