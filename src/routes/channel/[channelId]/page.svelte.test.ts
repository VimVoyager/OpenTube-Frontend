import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/svelte';
import Page from './+page.svelte';
import type { ChannelConfig, ChannelVideoConfig } from '$lib/adapters/types';
import channelDetailsFixture from '../../../tests/fixtures/adapters/channelDetails.json';
import channelVideosFixture from '../../../tests/fixtures/adapters/channelVideos.json';


// =============================================================================
// Mocks
// =============================================================================

vi.mock('$lib/components/channel/ChannelDetails.svelte', () => ({
	default: vi.fn(() => null)
}));

vi.mock('$lib/components/channel/ChannelVideos.svelte', () => ({
	default: vi.fn(() => null)
}));

vi.mock('$lib/components/ErrorCard.svelte', () => ({
	default: vi.fn(() => null)
}));

import ChannelDetails from '$lib/components/channel/ChannelDetails.svelte';
import ErrorCard from '$lib/components/ErrorCard.svelte';

// =============================================================================
// Fixtures
// =============================================================================

const mockChannel = channelDetailsFixture as ChannelConfig;
const mockVideos = channelVideosFixture as ChannelVideoConfig[];

// Bare channel produced by createErrorPageData — name is empty, which triggers
// the full-page error branch: `{#if error && !channel.name}`.
const errorChannel: ChannelConfig = {
	id: '',
	name: '',
	handle: '',
	avatarUrl: null,
	bannerUrl: null,
	description: null,
	subscriberCount: '0',
	videoCount: 0,
	verified: false
};

const createPageData = (overrides: Record<string, unknown> = {}) => ({
	channel: mockChannel,
	videos: mockVideos,
	error: null,
	...overrides
});

// =============================================================================
// Setup
// =============================================================================

beforeEach(() => {
	vi.clearAllMocks();
});

afterEach(() => {
	vi.restoreAllMocks();
});

// =============================================================================
// Tests
// =============================================================================

describe('+page.svelte - Channel', () => {
	describe('Normal state (channel loaded successfully)', () => {
		it('should render without throwing', () => {
			const { container } = render(Page, { props: { data: createPageData() } });
			expect(container).toBeTruthy();
		});

		it('should render the outer page wrapper', () => {
			const { container } = render(Page, { props: { data: createPageData() } });
			const wrapper = container.querySelector('.w-full.bg-primary.min-h-screen');
			expect(wrapper).toBeTruthy();
		});

		it('should call ChannelDetails when channel loads successfully', () => {
			render(Page, { props: { data: createPageData() } });
			expect(vi.mocked(ChannelDetails)).toHaveBeenCalled();
		});

		it('should not render the full-page error wrapper when channel loaded', () => {
			const { container } = render(Page, { props: { data: createPageData() } });
			const errorWrapper = container.querySelector('.flex.min-h-screen.items-center');
			expect(errorWrapper).toBeNull();
		});

		it('should not call ErrorCard when there is no error', () => {
			render(Page, { props: { data: createPageData() } });
			expect(vi.mocked(ErrorCard)).not.toHaveBeenCalled();
		});
	});

	describe('Full-page error state (error + no channel name)', () => {
		it('should render the full-page error wrapper when error is set and channel name is empty', () => {
			const data = createPageData({ channel: errorChannel, error: 'Channel not found' });
			const { container } = render(Page, { props: { data } });
			const errorWrapper = container.querySelector(
				'.flex.min-h-screen.items-center.justify-center'
			);
			expect(errorWrapper).toBeTruthy();
		});

		it('should not call ChannelDetails in the full-page error state', () => {
			const data = createPageData({ channel: errorChannel, error: 'Channel not found' });
			render(Page, { props: { data } });
			expect(vi.mocked(ChannelDetails)).not.toHaveBeenCalled();
		});

		it('should call ErrorCard with the correct error message', () => {
			const data = createPageData({ channel: errorChannel, error: 'Channel not found' });
			render(Page, { props: { data } });
			expect(vi.mocked(ErrorCard)).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ message: 'Channel not found' })
			);
		});

		it('should call ErrorCard with the "Failed to Load Channel" title', () => {
			const data = createPageData({ channel: errorChannel, error: 'Network failure' });
			render(Page, { props: { data } });
			expect(vi.mocked(ErrorCard)).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ title: 'Failed to Load Channel' })
			);
		});

		it('should call ErrorCard with the "error" variant', () => {
			const data = createPageData({ channel: errorChannel, error: 'Network failure' });
			render(Page, { props: { data } });
			expect(vi.mocked(ErrorCard)).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ variant: 'error' })
			);
		});

		it('should call ErrorCard with showRetry enabled', () => {
			const data = createPageData({ channel: errorChannel, error: 'Network failure' });
			render(Page, { props: { data } });
			expect(vi.mocked(ErrorCard)).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ showRetry: true })
			);
		});
	});

	describe('Partial error state (error set but channel name present)', () => {
		it('should call ChannelDetails when error is set but channel name is populated', () => {
			// error && !channel.name is false when channel.name is truthy — the page
			// falls through to the normal branch even with a partial error.
			const data = createPageData({ error: 'Videos unavailable' });
			render(Page, { props: { data } });
			expect(vi.mocked(ChannelDetails)).toHaveBeenCalled();
		});

		it('should not render the full-page error wrapper when channel name is populated', () => {
			const data = createPageData({ error: 'Videos unavailable' });
			const { container } = render(Page, { props: { data } });
			const errorWrapper = container.querySelector('.flex.min-h-screen.items-center');
			expect(errorWrapper).toBeNull();
		});

		it('should not call ErrorCard when channel name is populated', () => {
			const data = createPageData({ error: 'Videos unavailable' });
			render(Page, { props: { data } });
			expect(vi.mocked(ErrorCard)).not.toHaveBeenCalled();
		});
	});

	describe('Defensive defaults (missing or incomplete data)', () => {
		it('should not throw when data.channel is undefined', () => {
			const data = { videos: [], error: null };
			expect(() => render(Page, { props: { data } })).not.toThrow();
		});

		it('should not throw when data.videos is undefined', () => {
			const data = { channel: mockChannel, error: null };
			expect(() => render(Page, { props: { data } })).not.toThrow();
		});

		it('should not throw when data is entirely empty', () => {
			expect(() => render(Page, { props: { data: {} } })).not.toThrow();
		});

		it('should call ChannelDetails even when data is minimal', () => {
			// With empty data the $derived defaults kick in — channel.name is ''
			// and error is null, so error && !channel.name is false and the normal
			// branch renders.
			render(Page, { props: { data: {} } });
			expect(vi.mocked(ChannelDetails)).toHaveBeenCalled();
		});
	});

	describe('Styling and layout', () => {
		it('should apply min-h-screen to the root wrapper', () => {
			const { container } = render(Page, { props: { data: createPageData() } });
			expect(container.querySelector('.min-h-screen')).toBeTruthy();
		});

		it('should apply bg-primary to the root wrapper', () => {
			const { container } = render(Page, { props: { data: createPageData() } });
			expect(container.querySelector('.bg-primary')).toBeTruthy();
		});

		it('should apply w-full to the root wrapper', () => {
			const { container } = render(Page, { props: { data: createPageData() } });
			expect(container.querySelector('.w-full')).toBeTruthy();
		});

		it('should apply centering classes to the full-page error container', () => {
			const data = createPageData({ channel: errorChannel, error: 'Fatal error' });
			const { container } = render(Page, { props: { data } });
			const errorWrapper = container.querySelector(
				'.flex.min-h-screen.items-center.justify-center.px-4'
			);
			expect(errorWrapper).toBeTruthy();
		});
	});
});
