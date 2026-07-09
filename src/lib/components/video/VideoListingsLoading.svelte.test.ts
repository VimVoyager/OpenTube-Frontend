/**
 * Test Suite: VideoListingsLoading.svelte
 *
 * Tests for related videos listing loading skeleton
 */

import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import VideoListingsLoading from './VideoListingsLoading.svelte';

describe('VideoListingsLoading', () => {
	it('renders five loading item skeletons', () => {
		const { container } = render(VideoListingsLoading);
		const items = container.querySelectorAll('[style*="aspect-ratio: 16/9"]');
		expect(items).toHaveLength(5);
	});
});
