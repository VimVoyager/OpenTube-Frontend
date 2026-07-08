/**
 * Test Suite: VideoLoading.svelte
 * 
 * Tests for video player page loading skeleton
 */

import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import VideoLoading from './VideoLoading.svelte';

describe('VideoLoading', () => {
	it('renders the player and details skeleton sections', () => {
		const { container } = render(VideoLoading);
		expect(container.querySelector('.video-skeleton .spinner')).toBeInTheDocument();
		expect(container.querySelector('.details-skeleton')).toBeInTheDocument();
	});
});