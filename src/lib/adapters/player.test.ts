/**
 * Test Suite: player.ts
 *
 * Tests for video player configuration adaptation
 */

import { describe, it, expect } from 'vitest';
import { adaptPlayerConfig } from './player';

describe('adaptPlayerConfig', () => {
	it('maps manifest URL, duration, and poster into a player config', () => {
		expect(
			adaptPlayerConfig(
				'blob:http://localhost:5173/abc-123',
				180.5,
				'https://example.com/poster.jpg'
			)
		).toEqual({
			manifestUrl: 'blob:http://localhost:5173/abc-123',
			duration: 180.5,
			poster: 'https://example.com/poster.jpg'
		});
	});

	it('passes empty/zero values through untouched (error-recovery shape)', () => {
		expect(adaptPlayerConfig('', 0, '')).toEqual({
			manifestUrl: '',
			duration: 0,
			poster: ''
		});
	});
});
