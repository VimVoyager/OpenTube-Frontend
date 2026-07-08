/**
 * Test Suite: VideoResultLoading.svelte
 * 
 * Tests for individual search result loading skeleton
 */

import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import VideoResultLoading from './VideoResultLoading.svelte';

describe('VideoResultLoading', () => {
	it('announces itself to screen readers as a loading status', () => {
		render(VideoResultLoading);
		expect(screen.getByRole('status', { name: 'Loading search result' })).toBeInTheDocument();
	});

	it('renders thumbnail and text skeleton areas', () => {
		const { container } = render(VideoResultLoading);
		expect(container.querySelector('.col-span-1')).toBeInTheDocument();
		expect(container.querySelector('.col-span-2')).toBeInTheDocument();
	});
});