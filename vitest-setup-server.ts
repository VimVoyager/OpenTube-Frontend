/**
 * Vitest Setup File - Server Tests
 * 
 * Setup for server-side tests (Node environment)
 * Runs before each server test suite.
 */

import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
    vi.clearAllMocks();
});

beforeAll(() => {
    process.env.NODE_ENV = 'test';
});

afterAll(() => {
    // Cleanup
});

// Add custom matchers
expect.extend({
    toBeValidLanuageCode(received: string) {
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
