import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import PageComponent from './+page.svelte';
import type { CommentConfig, PlaylistInfoConfig, RelatedVideoConfig } from '$lib/adapters/types';

describe('+page.svelte', () => {
	const mockPlayerConfig = {
		manifestUrl: 'blob:http://localhost:5173/abc-123',
		duration: 180,
		poster: 'https://example.com/poster.jpg'
	};

	const mockMetadata = {
		title: 'Test Video Title',
		description: 'This is a test video description with <strong>HTML</strong> content.',
		channelName: 'Test Channel',
		channelAvatar: 'https://example.com/avatar.jpg',
		viewCount: 1234567,
		uploadDate: '2024-01-15',
		likeCount: 50000,
		dislikeCount: 500,
		subscriberCount: 1000000
	};

	const mockRelatedVideos = [
		{
			id: 'related-1',
			url: 'https://www.youtube.com/watch?v=related-1',
			title: 'First Related Video',
			thumbnail: 'https://example.com/thumbnail.jpg',
			channelName: 'Test Channel',
			channelId: 'channel1',
			channelAvatar: 'https://example.com/avatar.jpg',
			viewCount: 1000000,
			duration: 600,
			uploadDate: '1 day ago'
		},
		{
			id: 'related-2',
			url: 'https://www.youtube.com/watch?v=related-2',
			title: 'Second Related Video',
			thumbnail: 'https://example.com/thumbnail2.jpg',
			channelName: 'Channel Two',
			channelId: 'channel2',
			channelAvatar: 'https://example.com/avatar2.jpg',
			viewCount: 500000,
			duration: 450,
			uploadDate: '3 days ago'
		},
		{
			id: 'related-3',
			url: 'https://www.youtube.com/watch?v=related-3',
			title: 'Third Related Video',
			thumbnail: 'https://example.com/thumbnail3.jpg',
			channelName: 'Channel Three',
			channelId: 'channel3',
			channelAvatar: null,
			viewCount: 250000,
			duration: 3665,
			uploadDate: '1 week ago'
		}
	];

	const mockComments: CommentConfig[] = [
		{
			id: 'comment-1',
			author: 'Alice',
			text: 'Great video!',
			authorAvatar: 'https://example.com/alice.jpg',
			authorUrl: 'https://www.youtube.com/@alice',
			isVerified: false,
			isChannelOwner: false,
			likeCount: 12,
			likeCountText: "12",
			replyCount: 0,
			uploadDate: '1 day ago',
			isPinned: false,
			isHearted: false,
			hasReplies: false
		},
		{
			id: 'comment-2',
			author: 'Bob',
			text: 'Thanks for this.',
			authorAvatar: 'https://example.com/bob.jpg',
			authorUrl: 'https://www.youtube.com/@bob',
			isVerified: true,
			isChannelOwner: false,
			likeCount: 5,
			likeCountText: "5",
			replyCount: 1,
			uploadDate: '3 hours ago',
			isPinned: false,
			isHearted: true,
			hasReplies: true
		}
	];

	const mockPlaylistVideos: RelatedVideoConfig[] = [
		{
			id: 'pl-1',
			url: 'https://www.youtube.com/watch?v=pl-1',
			title: 'Playlist Video One',
			thumbnail: 'https://example.com/pl-thumb1.jpg',
			channelName: 'Test Channel',
			channelId: 'channel1',
			channelAvatar: 'https://example.com/avatar.jpg',
			viewCount: 100000,
			duration: 300,
			uploadDate: '2 days ago'
		},
		{
			id: 'pl-2',
			url: 'https://www.youtube.com/watch?v=pl-2',
			title: 'Playlist Video Two',
			thumbnail: 'https://example.com/pl-thumb2.jpg',
			channelName: 'Test Channel',
			channelId: 'channel1',
			channelAvatar: 'https://example.com/avatar.jpg',
			viewCount: 90000,
			duration: 240,
			uploadDate: '2 days ago'
		}
	];

	const mockPlaylistInfo: PlaylistInfoConfig = {
		id: 'playlist-123',
		name: 'My Playlist',
		url: 'https://www.youtube.com/playlist?list=playlist-123',
		uploaderName: 'Test Channel',
		uploaderId: 'channel1',
		uploaderAvatarUrl: 'https://example.com/avatar.jpg',
		bannerUrl: null,
		thumbnailUrl: 'https://example.com/thumb.jpg',
		uploaderUrl: 'https://www.youtube.com/channel/channel1',
		description: null
	};

	// Full dataset used to exercise every branch (playlist + comments + related videos all present)
	const fullData = {
		playerConfig: mockPlayerConfig,
		metadata: mockMetadata,
		relatedVideos: mockRelatedVideos,
		comments: mockComments,
		playlistId: 'playlist-123',
		playlistIndex: 1,
		playlistVideos: mockPlaylistVideos,
		playlistInfo: mockPlaylistInfo
	};

	beforeEach(() => {
		vi.clearAllMocks();
		// jsdom doesn't implement scrollIntoView; PlaylistQueue.svelte calls it on mount.
		Element.prototype.scrollIntoView = vi.fn();
	});

	describe('Error handling', () => {
		it('should show error card and hide video detail/listings on error', () => {
			// Error prop set: error card, message, retry button all render; related videos suppressed
			const errorData = {
				playerConfig: {
					manifestUrl: '',
					duration: 0,
					poster: ''
				},
				metadata: mockMetadata,
				relatedVideos: mockRelatedVideos,
				error: 'Failed to load video'
			};
			const { unmount } = render(PageComponent, { data: errorData });

			expect(screen.getByText('Failed to Load Video')).toBeInTheDocument();
			expect(screen.getByText('Failed to load video')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
			expect(screen.queryByText('First Related Video')).not.toBeInTheDocument();

			unmount();

			// No error prop, but empty manifestUrl: distinct "No Streams Available" state
			const noStreamsData = {
				playerConfig: {
					manifestUrl: '',
					duration: 0,
					poster: ''
				},
				metadata: mockMetadata,
				relatedVideos: mockRelatedVideos
			};
			render(PageComponent, { data: noStreamsData });

			expect(screen.getByText('No Streams Available')).toBeInTheDocument();
			expect(
				screen.getByText(
					'Unable to load DASH manifest for this video. The video may be unavailable or restricted.'
				)
			).toBeInTheDocument();
		});
	});

	describe('Conditional rendering logic', () => {
		it('should render full success composition and suppress it on error', async () => {
			// Success case: player, VideoDetail, and VideoListings all render together
			const data = {
				playerConfig: mockPlayerConfig,
				metadata: mockMetadata,
				relatedVideos: mockRelatedVideos
			};
			const { unmount } = render(PageComponent, { data });

			await waitFor(() => {
				expect(screen.queryByText('Failed to Load Video')).not.toBeInTheDocument();
				expect(screen.queryByText('No Streams Available')).not.toBeInTheDocument();
			});

			const titleArray = screen.getAllByRole('heading', { name: mockMetadata.title });
			expect(titleArray[0]).toBeInTheDocument();
			expect(titleArray.length).toBe(2);

			const channelHeadings = screen.getAllByText(mockMetadata.channelName);
			expect(channelHeadings.length).toBeGreaterThan(0);

			expect(screen.getByText('First Related Video')).toBeInTheDocument();
			expect(screen.getByText('Second Related Video')).toBeInTheDocument();

			unmount();

			// Error case: VideoDetail (and by extension the success composition) is suppressed
			const errorData = {
				playerConfig: {
					manifestUrl: '',
					duration: 0,
					poster: ''
				},
				metadata: mockMetadata,
				relatedVideos: [],
				error: 'Test error'
			};
			render(PageComponent, { data: errorData });
			expect(screen.queryByText(mockMetadata.title)).not.toBeInTheDocument();
		});
	});

	describe('Comments section (desktop)', () => {
		it('should render the comment count heading and list when comments are present', () => {
			const data = {
				playerConfig: mockPlayerConfig,
				metadata: mockMetadata,
				relatedVideos: mockRelatedVideos,
				comments: mockComments
			};
			render(PageComponent, { data });

			// Default active tab is 'details', so this heading can only come from the desktop pane
			expect(screen.getByText(`${mockComments.length} Comments`)).toBeInTheDocument();
		});

		it('should not render a comments heading when comments are absent', () => {
			const data = {
				playerConfig: mockPlayerConfig,
				metadata: mockMetadata,
				relatedVideos: mockRelatedVideos
			};
			render(PageComponent, { data });

			// Match the "<n> Comments" heading specifically, not the "Comments" tab button label
			expect(screen.queryByText(/^\d+\s+comments$/i)).not.toBeInTheDocument();
		});
	});

	describe('Playlist queue (desktop)', () => {
		it('should render additional content in the sidebar when a playlist is active', () => {
			const withPlaylist = {
				playerConfig: mockPlayerConfig,
				metadata: mockMetadata,
				relatedVideos: mockRelatedVideos,
				playlistId: 'playlist-123',
				playlistIndex: 0,
				playlistVideos: mockPlaylistVideos,
				playlistInfo: mockPlaylistInfo
			};
			const { container, unmount } = render(PageComponent, { data: withPlaylist });
			const asideWithPlaylist = container.querySelector('aside');
			const childCountWithPlaylist = asideWithPlaylist?.children.length ?? 0;
			unmount();

			const withoutPlaylist = {
				playerConfig: mockPlayerConfig,
				metadata: mockMetadata,
				relatedVideos: mockRelatedVideos
			};
			const { container: containerNoPlaylist } = render(PageComponent, { data: withoutPlaylist });
			const asideWithoutPlaylist = containerNoPlaylist.querySelector('aside');
			const childCountWithoutPlaylist = asideWithoutPlaylist?.children.length ?? 0;

			// The playlist branch adds a PlaylistQueue instance alongside VideoListings,
			// so the sidebar should have strictly more child nodes when a playlist is active.
			expect(childCountWithPlaylist).toBeGreaterThan(childCountWithoutPlaylist);
		});
	});

	describe('Mobile tab navigation', () => {
		const getMobilePane = (container: HTMLElement) => {
			const pane = container.querySelector('.lg\\:hidden');
			if (!pane) throw new Error('Mobile pane not found');
			return within(pane as HTMLElement);
		};

		it('should default to the Details tab and show VideoDetail in the mobile pane', () => {
			const { container } = render(PageComponent, { data: fullData });
			const mobile = getMobilePane(container);

			expect(mobile.getAllByRole('heading', { name: mockMetadata.title }).length).toBeGreaterThan(
				0
			);
			expect(mobile.getByRole('button', { name: 'Details' })).toHaveClass('text-primary');
		});

		it('should hide the Playlist tab button when no playlist is active', () => {
			const data = {
				playerConfig: mockPlayerConfig,
				metadata: mockMetadata,
				relatedVideos: mockRelatedVideos
			};
			const { container } = render(PageComponent, { data });
			const mobile = getMobilePane(container);

			expect(mobile.queryByRole('button', { name: 'Playlist' })).not.toBeInTheDocument();
		});

		it('should switch tab content and active styling as each tab is clicked', async () => {
			const { container } = render(PageComponent, { data: fullData });
			const mobile = getMobilePane(container);

			// Details -> Playlist
			await fireEvent.click(mobile.getByRole('button', { name: 'Playlist' }));
			expect(mobile.getByRole('button', { name: 'Playlist' })).toHaveClass('text-primary');
			expect(mobile.queryByRole('heading', { name: mockMetadata.title })).not.toBeInTheDocument();

			// Playlist -> Related Videos
			await fireEvent.click(mobile.getByRole('button', { name: 'Related Videos' }));
			expect(mobile.getByRole('button', { name: 'Related Videos' })).toHaveClass('text-primary');
			expect(mobile.getByText('First Related Video')).toBeInTheDocument();
			expect(mobile.getByText('Second Related Video')).toBeInTheDocument();

			// Related Videos -> Comments
			await fireEvent.click(mobile.getByRole('button', { name: 'Comments' }));
			expect(mobile.getByRole('button', { name: 'Comments' })).toHaveClass('text-primary');
			expect(mobile.getByText(`${mockComments.length} Comments`)).toBeInTheDocument();
			expect(mobile.queryByText('First Related Video')).not.toBeInTheDocument();

			// Comments -> back to Details
			await fireEvent.click(mobile.getByRole('button', { name: 'Details' }));
			expect(mobile.getByRole('button', { name: 'Details' })).toHaveClass('text-primary');
			expect(mobile.getAllByRole('heading', { name: mockMetadata.title }).length).toBeGreaterThan(
				0
			);
		});

		it('should show nothing extra in the Comments tab when there are no comments', async () => {
			const data = {
				playerConfig: mockPlayerConfig,
				metadata: mockMetadata,
				relatedVideos: mockRelatedVideos
			};
			const { container } = render(PageComponent, { data });
			const mobile = getMobilePane(container);

			await fireEvent.click(mobile.getByRole('button', { name: 'Comments' }));

			// Match the "<n> Comments" heading specifically, not the "Comments" tab button label
			expect(mobile.queryByText(/^\d+\s+comments$/i)).not.toBeInTheDocument();
		});
	});

	describe('Default values', () => {
		it('should handle undefined playerConfig gracefully', () => {
			const data = {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				playerConfig: undefined as any,
				metadata: mockMetadata,
				relatedVideos: []
			};

			render(PageComponent, { data });

			expect(screen.getByText('No Streams Available')).toBeInTheDocument();
		});

		it('should handle undefined metadata gracefully', () => {
			const data = {
				playerConfig: mockPlayerConfig,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				metadata: undefined as any,
				relatedVideos: []
			};

			const { container } = render(PageComponent, { data });

			expect(container).toBeInTheDocument();
		});

		it('should handle undefined relatedVideos gracefully', () => {
			const data = {
				playerConfig: mockPlayerConfig,
				metadata: mockMetadata,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				relatedVideos: undefined as any
			};

			const { container } = render(PageComponent, { data });

			expect(container).toBeInTheDocument();
		});

		it('should handle undefined comments and playlistId gracefully', () => {
			const data = {
				playerConfig: mockPlayerConfig,
				metadata: mockMetadata,
				relatedVideos: mockRelatedVideos
				// comments, playlistId intentionally omitted
			};

			const { container } = render(PageComponent, { data });

			expect(container.querySelector('aside')?.children.length).toBe(1);
			// Match the "<n> Comments" heading specifically, not the "Comments" tab button label
			expect(screen.queryByText(/^\d+\s+comments$/i)).not.toBeInTheDocument();
		});
	});
});
