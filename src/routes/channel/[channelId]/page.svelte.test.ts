import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';
import type { ChannelConfig, ChannelVideoConfig } from '$lib/adapters/types';
import channelDetailsFixture from '../../../tests/fixtures/adapters/channelDetails.json';
import channelVideosFixture from '../../../tests/fixtures/adapters/channelVideos.json';

// ChannelDetails passthrough stub so the page snippet bodies actually render
vi.mock('$lib/components/channel/ChannelDetails.svelte', async () => ({
	default: (await import('../../../tests/stubs/ChannelDetailsStub.svelte')).default
}));

vi.mock('$lib/components/channel/ChannelVideos.svelte', () => ({
	default: vi.fn(() => null)
}));

vi.mock('$lib/components/ErrorCard.svelte', () => ({
	default: vi.fn(() => null)
}));

import ChannelVideos from '$lib/components/channel/ChannelVideos.svelte';
import ErrorCard from '$lib/components/ErrorCard.svelte';
import type { ChannelPageData } from '../../types';

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
	error: undefined,
	...overrides
});

const reloadMock = vi.fn();

beforeEach(() => {
	vi.clearAllMocks();
	// jsdom's location.reload is not implemented (and location itself is not
	// writable), so stub the whole global for tests that exercise onRetry
	vi.stubGlobal('location', { ...window.location, reload: reloadMock });
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('+page.svelte - Channel', () => {
	it('should render the normal channel composition when the channel loads successfully', () => {
		// Act
		const { container } = render(Page, { props: { data: createPageData() } });

		// Assert — styled root wrapper, details rendered with both snippets, no error UI
		expect(container.querySelector('.w-full.bg-primary.min-h-screen')).toBeTruthy();
		expect(screen.getByTestId('channel-details-stub')).toBeTruthy();
		expect(container.querySelector('.flex.min-h-screen.items-center')).toBeNull();
		expect(vi.mocked(ErrorCard)).not.toHaveBeenCalled();
	});

	it('should pass the adapted videos through the videos snippet to ChannelVideos', () => {
		// Act
		render(Page, { props: { data: createPageData() } });

		// Assert — the videos snippet rendered and the channelVideos derived
		// resolved to data.videos
		expect(vi.mocked(ChannelVideos)).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ videos: mockVideos })
		);
	});

	it('should render the playlists snippet placeholder', () => {
		render(Page, { props: { data: createPageData() } });

		expect(screen.getByText('Playlists coming soon')).toBeTruthy();
	});

	it('should render the full-page error composition when error is set and channel name is empty', () => {
		const data = createPageData({ channel: errorChannel, error: 'Channel not found' });

		const { container } = render(Page, { props: { data } });

		// Centered error wrapper replaces the details view, and
		// ErrorCard receives the complete prop contract in one call
		expect(
			container.querySelector('.flex.min-h-screen.items-center.justify-center.px-4')
		).toBeTruthy();
		expect(screen.queryByTestId('channel-details-stub')).toBeNull();
		expect(vi.mocked(ErrorCard)).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				message: 'Channel not found',
				title: 'Failed to Load Channel',
				variant: 'error',
				showRetry: true,
				onRetry: expect.any(Function)
			})
		);
	});

	it('should reload the page when the ErrorCard retry callback is invoked', () => {
		const data = createPageData({ channel: errorChannel, error: 'Channel not found' });
		render(Page, { props: { data } });

		// Pull onRetry off the props the page passed to ErrorCard and
		// invoke it, exercising the () => window.location.reload() closure
		const errorCardProps = vi.mocked(ErrorCard).mock.calls[0][1] as { onRetry: () => void };
		errorCardProps.onRetry();

		expect(reloadMock).toHaveBeenCalledTimes(1);
	});

	it('should fall through to the normal branch when error is set but channel name is populated', () => {
		// Error && !channel.name is false when channel.name is truthy,
		// so a partial error (e.g. videos unavailable) still renders the channel
		const data = createPageData({ error: 'Videos unavailable' });

		const { container } = render(Page, { props: { data } });

		expect(screen.getByTestId('channel-details-stub')).toBeTruthy();
		expect(container.querySelector('.flex.min-h-screen.items-center')).toBeNull();
		expect(vi.mocked(ErrorCard)).not.toHaveBeenCalled();
	});

	it.each([
		['data is entirely empty', {}, []],
		['data.channel is undefined', { videos: mockVideos, error: undefined }, mockVideos],
		['data.videos is undefined', { channel: mockChannel, error: undefined }, []]
	])(
		'should render the normal branch via $derived defaults when %s',
		(_label, data, expectedVideos) => {
			expect(() => render(Page, { props: { data: data as ChannelPageData } })).not.toThrow();
			expect(screen.getByTestId('channel-details-stub')).toBeTruthy();
			expect(vi.mocked(ChannelVideos)).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ videos: expectedVideos })
			);
		}
	);
});
