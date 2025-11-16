import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		resolve: {
			conditions: ['browser', 'import'],
			alias: {
				'$lib': path.resolve('./src/lib'),
				'$env': path.resolve('./src/env')
			}
		},

		// Global test settings
		globals: true,
		expect: { requireAssertions: true },

		// Coverage configuration
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			exclude: [
				'node_modules/',
				'src/tests/',
				'**/*.d.ts',
				'**/*.config.*',
				'**/mockData/',
				'dist/',
				'.svelte-kit/'
			],
			// Coverage thresholds
			lines: 80,
			functions: 80,
			branches: 75,
			statements: 80
		},

		// Mock configuration
		mockReset: true,
		restoreMocks: true,
		clearMocks: true,

		// Test execution
		testTimeout: 10000,
		hookTimeout: 10000,

		// Projects for different test types
		projects: [
			// Client tests (Svelte components) - NO extends!
			{
				plugins: [svelte()],
				resolve: {
					conditions: ['browser'],
					alias: {
						'$lib': path.resolve('./src/lib'),
						'$app': path.resolve('./node_modules/@sveltejs/kit/src/runtime/app')
					}
				},
				test: {
					name: 'client',
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts'],
					environment: 'jsdom',
					globals: true,
					mockReset: true,
					restoreMocks: true,
					clearMocks: true,
					testTimeout: 10000,
					hookTimeout: 10000
				}
			},
			// Server tests (utilities, API)
			{
				resolve: {
					alias: {
						'$lib': path.resolve('./src/lib'),
						'$env/dynamic/public': path.resolve('./src/tests/helpers/env-dynamic-public.ts')
					}
				},
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					setupFiles: ['./vitest-setup-server.ts'],
					globals: true,
					mockReset: true,
					restoreMocks: true,
					clearMocks: true,
					testTimeout: 10000,
					hookTimeout: 10000
				}
			}
		]
	}
});