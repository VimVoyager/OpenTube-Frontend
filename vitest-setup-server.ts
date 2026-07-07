/**
 * Vitest Setup File - Server Tests
 * 
 * Setup for server-side tests (Node environment)
 * Runs before each server test suite.
 */

import { afterEach, beforeAll, vi } from 'vitest';
import './src/tests/matchers';

vi.mock('$env/static/public', () => ({
	PUBLIC_API_URL: 'http://localhost:8000/api/v1',
	PUBLIC_PROXY_URL: 'http://localhost:8888'
}));

vi.mock('$lib/assets/logo-placeholder.svg', () => ({
	default: 'mock-logo-placeholder.svg'
}));

vi.mock('$lib/assets/thumbnail-placeholder.svg', () => ({
	default: 'mock-thumbnail-placeholder.svg'
}));

afterEach(() => {
    vi.clearAllMocks();
});

beforeAll(() => {
    process.env.NODE_ENV = 'test';
});