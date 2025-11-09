/**
 * Vitest Setup File - Client/Browser Tests
 * 
 * Setup for client-side/browser tests (Playwright environment)
 * Runs before each client test suite.
 */

import { expect, afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
	vi.clearAllMocks();
});

// Browser-specific setup
if (typeof window !== 'undefined') {
	// Mock IntersectionObserver (may not be available in test env)
	if (!window.IntersectionObserver) {
		window.IntersectionObserver = class IntersectionObserver {
			constructor() {}
			disconnect() {}
			observe() {}
			takeRecords() {
				return [];
			}
			unobserve() {}
		} as unknown as typeof IntersectionObserver;
	}

	// Mock ResizeObserver (may not be available in test env)
	if (!window.ResizeObserver) {
		window.ResizeObserver = class ResizeObserver {
			constructor() {}
			disconnect() {}
			observe() {}
			unobserve() {}
		} as unknown as typeof ResizeObserver;
	}

	// Mock matchMedia if not available
	if (!window.matchMedia) {
		window.matchMedia = (query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => true
		}) as MediaQueryList;
	}
}

// Add custom matchers
expect.extend({
	toBeValidLanguageCode(received: string) {
		const pass = /^[a-z]{2}(-[A-Z0-9]+)?$/.test(received);
		return {
			pass,
			message: () =>
				pass
					? `expected ${received} not to be a valid language code`
					: `expected ${received} to be a valid language code (e.g., 'en', 'es-419')`
		};
	},
	
	toBeValidUrl(received: string) {
		let pass = false;
		try {
			new URL(received);
			pass = true;
		} catch {
			// URL is invalid
		}
		
		return {
			pass,
			message: () =>
				pass
					? `expected ${received} not to be a valid URL`
					: `expected ${received} to be a valid URL`
		};
	}
});

// Type augmentation for custom matchers
declare module 'vitest' {
	interface Assertion {
		toBeValidLanguageCode(): void;
		toBeValidUrl(): void;
	}
}

// <reference types="@vitest/browser/matchers" />
// <reference types="@vitest/browser/providers/playwright" />
