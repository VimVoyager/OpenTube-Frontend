/**
 * Shared Test Helpers for API Tests
 * 
 * Contains reusable mock functions and utilities for API testing
 */

import { vi } from 'vitest';

// =============================================================================
// Types
// =============================================================================

/**
 * Type for a mocked fetch function that can be used in tests
 * This combines the fetch signature with Vitest mock capabilities
 */
export type MockFetch = ReturnType<typeof vi.fn> & ((input: RequestInfo | URL, init?: RequestInit) => Promise<Response>);

// =============================================================================
// Mock Environment Variables
// =============================================================================

// Mock SvelteKit environment module
export function mockStaticEnv() {
    vi.mock('$env/static/public', () => {
        return Promise.resolve({
            PUBLIC_API_URL: 'http://localhost:8000/api/v1',
            PUBLIC_PROXY_URL: 'http://localhost:8888'
        });
    });
}

export function mockDynamicEnv() {
    vi.mock('$env/dynamic/public', () => ({
        PUBLIC_API_URL: 'http://localhost:8000'
    }));
}


// =============================================================================
// Mock Fetch Helpers
// =============================================================================

/**
 * Creates a successful mock fetch response
 */
export function createMockResponse<T>(
    data: T,
    options: { status?: number; statusText?: string } = {}
): Response {
    const { status = 200, statusText = 'OK' } = options;
    return {
        ok: status >= 200 && status < 300,
        status,
        statusText,
        json: vi.fn().mockResolvedValue(data),
        headers: new Headers({ 'Content-Type': 'application/json' }),
        text: vi.fn().mockResolvedValue(JSON.stringify(data)),
        blob: vi.fn().mockResolvedValue(new Blob()),
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
        bytes: vi.fn().mockResolvedValue(new Uint8Array()),
        formData: vi.fn().mockResolvedValue(new FormData()),
        clone: vi.fn(),
        body: null,
        bodyUsed: false,
        redirected: false,
        type: 'basic',
        url: ''
    } as Response;
}

/**
 * Creates a failed mock fetch response
 */
export function createErrorResponse(
    status: number,
    statusText: string
): Response {
    return {
        ok: false,
        status,
        statusText,
        json: vi.fn().mockRejectedValue(new Error('Failed to parse JSON')),
        headers: new Headers(),
        text: vi.fn().mockResolvedValue(statusText),
        blob: vi.fn().mockResolvedValue(new Blob()),
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
        bytes: vi.fn().mockResolvedValue(new Uint8Array()),
        formData: vi.fn().mockResolvedValue(new FormData()),
        clone: vi.fn(),
        body: null,
        bodyUsed: false,
        redirected: false,
        type: 'basic',
        url: ''
    } as Response;
}

/**
 * Creates a mock fetch function that succeeds
 */
export function createSuccessfulFetch<T>(data: T): ReturnType<typeof vi.fn> {
    return vi.fn().mockResolvedValue(createMockResponse(data));
}

/**
 * Creates a mock fetch function that fails
 */
export function createFailedFetch(
    status: number,
    statusText: string
): typeof globalThis.fetch {
    return vi.fn().mockResolvedValue(createErrorResponse(status, statusText));
}

/**
 * Creates a mock fetch function that throws a network error
 */
export function createNetworkErrorFetch(
    errorMessage = 'Network error'
): typeof globalThis.fetch {
    return vi.fn().mockRejectedValue(new Error(errorMessage));
}

// =============================================================================
// URL Testing Helpers
// =============================================================================

/**
 * Extracts query parameters from a URL string
 */
export function extractQueryParams(url: string): Record<string, string> {
    const urlObj = new URL(url);
    const params: Record<string, string> = {};

    urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
    });

    return params;
}

/**
 * Checks if a URL contains the expected query parameter
 */
export function hasQueryParam(
    url: string,
    paramName: string,
    expectedValue?: string
): boolean {
    const params = extractQueryParams(url);

    if (expectedValue !== undefined) {
        return params[paramName] === expectedValue;
    }

    return paramName in params;
}

/**
 * Extracts the base URL without query parameters
 */
export function getBaseUrl(url: string): string {
    const urlObj = new URL(url);
    return `${urlObj.origin}${urlObj.pathname}`;
}

// =============================================================================
// Assertion Helpers
// =============================================================================

/**
 * Asserts that a fetch function was called with the expected URL
 */
export function expectFetchCalledWithUrl(
    fetchMock: ReturnType<typeof vi.fn>,
    expectedUrl: string
): void {
    const calls = fetchMock.mock.calls;
    const actualUrl = calls[0]?.[0];

    if (actualUrl !== expectedUrl) {
        throw new Error(
            `Expected fetch to be called with "${expectedUrl}", but got "${actualUrl}"`
        );
    }
}

/**
 * Asserts that a fetch function was called with a URL containing a query param
 */
export function expectFetchCalledWithParam(
    fetchMock: ReturnType<typeof vi.fn>,
    paramName: string,
    expectedValue?: string
): void {
    const calls = fetchMock.mock.calls;
    const actualUrl = calls[0]?.[0];

    if (!actualUrl) {
        throw new Error('Fetch was not called');
    }

    if (!hasQueryParam(actualUrl, paramName, expectedValue)) {
        const params = extractQueryParams(actualUrl);
        throw new Error(
            `Expected fetch URL to have param "${paramName}${expectedValue ? `=${expectedValue}` : ''}", but got params: ${JSON.stringify(params)}`
        );
    }
}

/**
 * Gets the call count of a mock function
 */
export function getCallCount(mockFn: ReturnType<typeof vi.fn>): number {
    return mockFn.mock.calls.length;
}

/**
 * Gets the first argument of the first call to a mock function
 */
export function getFirstCallFirstArg(
    mockFn: ReturnType<typeof vi.fn>
): unknown {
    return mockFn.mock.calls[0]?.[0];
}

// =============================================================================
// Console Mock Helpers
// =============================================================================

/**
 * Creates a mock console.error function
 */
export function createMockConsoleError(): {
    mock: ReturnType<typeof vi.fn>;
    restore: () => void;
} {
    const originalError = console.error;
    const mock = vi.fn();
    console.error = mock;

    return {
        mock,
        restore: () => {
            console.error = originalError;
        }
    };
}

/**
 * Suppresses console.error during test execution
 */
export function suppressConsoleError(): () => void {
    const originalError = console.error;
    console.error = vi.fn();

    return () => {
        console.error = originalError;
    };
}

// =============================================================================
// Type Guards and Validators
// =============================================================================

/**
 * Checks if a value is a valid Response object
 */
export function isResponse(value: unknown): value is Response {
    return (
        value !== null &&
        typeof value === 'object' &&
        'ok' in value &&
        'status' in value &&
        'json' in value
    );
}

/**
 * Validates that data matches expected shape
 */
export function validateDataShape<T>(
    data: unknown,
    requiredKeys: (keyof T)[]
): data is T {
    if (!data || typeof data !== 'object') {
        return false;
    }

    return requiredKeys.every((key) => key in data);
}