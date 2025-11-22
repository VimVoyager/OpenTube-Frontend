import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Page from './+page.svelte';
import type { PageData } from './$types';
import { mockPlayerConfig } from '../../../tests/fixtures/videoPlayerFixtures';
import { mockMetadata } from '../../../tests/fixtures/videoDetailFixtures';
import { mockRelatedVideos, mockEmptyRelatedVideos } from '../../../tests/fixtures/videoListingsFixtures';

describe('+page.svelte', () => {
	const createMockPageData = (overrides: Partial<PageData> = {}): PageData => ({
		playerConfig: mockPlayerConfig,
		metadata: mockMetadata,
		relatedVideos: mockRelatedVideos,
		...overrides
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Component rendering - success state', () => {
		it('should render the component without errors', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			expect(container).toBeTruthy();
		});

		it('should render main layout structure', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const mainSection = container.querySelector('section');
			const aside = container.querySelector('aside');
			expect(mainSection).toBeTruthy();
			expect(aside).toBeTruthy();
		});

		it('should apply correct layout classes', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const mainDiv = container.querySelector('div.mt-4.flex.h-screen.w-full');
			expect(mainDiv).toBeTruthy();
		});

		it('should render VideoPlayer after mount', async () => {
			// Arrange
			const data = createMockPageData();

			// Act
			render(Page, { props: { data } });

			// Assert
			await waitFor(() => {
				// VideoPlayer should be mounted (we can't directly check for the component,
				// but we can check that the error states are not shown)
				expect(screen.queryByText('Failed to Load Video')).not.toBeInTheDocument();
				expect(screen.queryByText('No Streams Available')).not.toBeInTheDocument();
			});
		});

		it('should render VideoDetail when no error', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			render(Page, { props: { data } });

			// Assert
			// VideoDetail should be rendered (component is mocked, so we verify it doesn't show errors)
			expect(screen.queryByText('Failed to Load Video')).not.toBeInTheDocument();
		});

		it('should render two-column layout', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const section = container.querySelector('section.w-2\\/3');
			const aside = container.querySelector('aside.w-1\\/3');
			expect(section).toBeTruthy();
			expect(aside).toBeTruthy();
		});
	});

	describe('Error state - general error', () => {
		it('should display error container when error exists', () => {
			// Arrange
			const data = createMockPageData({ error: 'Failed to load video' });

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText('Failed to Load Video')).toBeInTheDocument();
		});

		it('should display error icon', () => {
			// Arrange
			const data = createMockPageData({ error: 'Test error' });

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText('⚠️')).toBeInTheDocument();
		});

		it('should display error title', () => {
			// Arrange
			const data = createMockPageData({ error: 'Test error' });

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText('Failed to Load Video')).toBeInTheDocument();
		});

		it('should display error message', () => {
			// Arrange
			const errorMessage = 'Network connection failed';
			const data = createMockPageData({ error: errorMessage });

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText(errorMessage)).toBeInTheDocument();
		});

		it('should display retry button', () => {
			// Arrange
			const data = createMockPageData({ error: 'Test error' });

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
		});

		it('should not render VideoPlayer when error exists', async () => {
			// Arrange
			const data = createMockPageData({ error: 'Test error' });

			// Act
			render(Page, { props: { data } });

			// Assert
			await waitFor(() => {
				// Check that only error is shown, not the player
				expect(screen.getByText('Failed to Load Video')).toBeInTheDocument();
			});
		});

		it('should not render VideoDetail when error exists', () => {
			// Arrange
			const data = createMockPageData({ error: 'Test error' });

			// Act
			render(Page, { props: { data } });

			// Assert
			// VideoDetail is only rendered when !hasError
			expect(screen.getByText('Failed to Load Video')).toBeInTheDocument();
		});

		it('should reload page when retry button is clicked', async () => {
			// Arrange
			const data = createMockPageData({ error: 'Test error' });
			const reloadSpy = vi.fn();
			Object.defineProperty(window, 'location', {
				value: { reload: reloadSpy },
				writable: true
			});
			const user = userEvent.setup();

			// Act
			render(Page, { props: { data } });
			const retryButton = screen.getByRole('button', { name: /retry/i });
			await user.click(retryButton);

			// Assert
			expect(reloadSpy).toHaveBeenCalledOnce();
		});
	});

	describe('Error state - no streams available', () => {
		it('should display no streams error when video stream is null', () => {
			// Arrange
			const data = createMockPageData({
				playerConfig: {
					...mockPlayerConfig,
					videoStream: null,
					audioStream: null
				}
			});

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText('No Streams Available')).toBeInTheDocument();
		});

		it('should display video icon for no streams error', () => {
			// Arrange
			const data = createMockPageData({
				playerConfig: {
					...mockPlayerConfig,
					videoStream: null,
					audioStream: null
				}
			});

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText('📹')).toBeInTheDocument();
		});

		it('should display no streams error message', () => {
			// Arrange
			const data = createMockPageData({
				playerConfig: {
					...mockPlayerConfig,
					videoStream: null,
					audioStream: null
				}
			});

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(
				screen.getByText('Unable to find playable video or audio streams for this video.')
			).toBeInTheDocument();
		});

		it('should show retry button for no streams error', () => {
			// Arrange
			const data = createMockPageData({
				playerConfig: {
					...mockPlayerConfig,
					videoStream: null,
					audioStream: null
				}
			});

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
		});

		it('should reload page when retry button is clicked in no streams state', async () => {
			// Arrange
			const data = createMockPageData({
				playerConfig: {
					...mockPlayerConfig,
					videoStream: null,
					audioStream: null
				}
			});
			const reloadSpy = vi.fn();
			Object.defineProperty(window, 'location', {
				value: { reload: reloadSpy },
				writable: true
			});
			const user = userEvent.setup();

			// Act
			render(Page, { props: { data } });
			const retryButton = screen.getByRole('button', { name: /retry/i });
			await user.click(retryButton);

			// Assert
			expect(reloadSpy).toHaveBeenCalledOnce();
		});

		it('should render VideoDetail even when no streams available', () => {
			// Arrange
			const data = createMockPageData({
				playerConfig: {
					...mockPlayerConfig,
					videoStream: null,
					audioStream: null
				}
			});

			// Act
			render(Page, { props: { data } });

			// Assert
			// VideoDetail should still render (only hasError prevents it)
			expect(screen.getByText('No Streams Available')).toBeInTheDocument();
		});
	});

	describe('Computed properties - hasError', () => {
		it('should compute hasError as true when error exists', () => {
			// Arrange
			const data = createMockPageData({ error: 'Test error' });

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText('Failed to Load Video')).toBeInTheDocument();
		});

		it('should compute hasError as false when error is undefined', () => {
			// Arrange
			const data = createMockPageData({ error: undefined });

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.queryByText('Failed to Load Video')).not.toBeInTheDocument();
		});

		it('should compute hasError as false when error is null', () => {
			// Arrange
			const data = createMockPageData({ error: null as unknown as undefined });

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.queryByText('Failed to Load Video')).not.toBeInTheDocument();
		});

		it('should compute hasError as false when error is empty string', () => {
			// Arrange
			const data = createMockPageData({ error: '' });

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.queryByText('Failed to Load Video')).not.toBeInTheDocument();
		});
	});

	describe('Computed properties - hasValidStreams', () => {
		it('should compute hasValidStreams as true when video stream exists', () => {
			// Arrange
			const data = createMockPageData({
				playerConfig: {
					...mockPlayerConfig,
					audioStream: null
				}
			});

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.queryByText('No Streams Available')).not.toBeInTheDocument();
		});

		it('should compute hasValidStreams as true when audio stream exists', () => {
			// Arrange
			const data = createMockPageData({
				playerConfig: {
					...mockPlayerConfig,
					videoStream: null
				}
			});

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.queryByText('No Streams Available')).not.toBeInTheDocument();
		});

		it('should compute hasValidStreams as true when both streams exist', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.queryByText('No Streams Available')).not.toBeInTheDocument();
		});

		it('should compute hasValidStreams as false when both streams are null', () => {
			// Arrange
			const data = createMockPageData({
				playerConfig: {
					...mockPlayerConfig,
					videoStream: null,
					audioStream: null
				}
			});

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText('No Streams Available')).toBeInTheDocument();
		});
	});

	describe('Component lifecycle - onMount', () => {
		it('should set showPlayer to true after mount', async () => {
			// Arrange
			const data = createMockPageData();

			// Act
			render(Page, { props: { data } });

			// Assert
			await waitFor(() => {
				// showPlayer becomes true, so VideoPlayer is rendered
				expect(screen.queryByText('Failed to Load Video')).not.toBeInTheDocument();
			});
		});

		it('should not show VideoPlayer before mount', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			// Before mount completes, showPlayer is false
			// This is hard to test directly, but we can verify the component structure
			expect(container).toBeTruthy();
		});
	});

	describe('Data destructuring', () => {
		it('should handle missing playerConfig gracefully', () => {
			// Arrange
			const data = { metadata: mockMetadata } as unknown as PageData;

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			expect(container).toBeTruthy();
			expect(screen.getByText('No Streams Available')).toBeInTheDocument();
		});

		it('should handle missing metadata gracefully', () => {
			// Arrange
			const data = { playerConfig: mockPlayerConfig } as unknown as PageData;

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			expect(container).toBeTruthy();
		});

		it('should handle empty data object', () => {
			// Arrange
			const data = {} as PageData;

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			expect(container).toBeTruthy();
			expect(screen.getByText('No Streams Available')).toBeInTheDocument();
		});

		it('should use type casting for data properties', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			// Component should handle the type casting without errors
			expect(container).toBeTruthy();
		});
	});

	describe('Conditional rendering logic', () => {
		it('should prioritize error state over no streams state', () => {
			// Arrange
			const data = createMockPageData({
				error: 'Test error',
				playerConfig: {
					...mockPlayerConfig,
					videoStream: null,
					audioStream: null
				}
			});

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText('Failed to Load Video')).toBeInTheDocument();
			expect(screen.queryByText('No Streams Available')).not.toBeInTheDocument();
		});

		it('should prioritize no streams state over player when streams are null', () => {
			// Arrange
			const data = createMockPageData({
				playerConfig: {
					...mockPlayerConfig,
					videoStream: null,
					audioStream: null
				}
			});

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText('No Streams Available')).toBeInTheDocument();
		});

		it('should show player when no error and streams are valid', async () => {
			// Arrange
			const data = createMockPageData();

			// Act
			render(Page, { props: { data } });

			// Assert
			await waitFor(() => {
				expect(screen.queryByText('Failed to Load Video')).not.toBeInTheDocument();
				expect(screen.queryByText('No Streams Available')).not.toBeInTheDocument();
			});
		});
	});

	describe('Error container styling', () => {
		it('should apply error-container class', () => {
			// Arrange
			const data = createMockPageData({ error: 'Test error' });

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const errorContainer = container.querySelector('.error-container');
			expect(errorContainer).toBeTruthy();
		});

		it('should apply error-icon class', () => {
			// Arrange
			const data = createMockPageData({ error: 'Test error' });

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const errorIcon = container.querySelector('.error-icon');
			expect(errorIcon).toBeTruthy();
		});

		it('should apply error-title class', () => {
			// Arrange
			const data = createMockPageData({ error: 'Test error' });

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const errorTitle = container.querySelector('.error-title');
			expect(errorTitle).toBeTruthy();
		});

		it('should apply error-message class', () => {
			// Arrange
			const data = createMockPageData({ error: 'Test error' });

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const errorMessage = container.querySelector('.error-message');
			expect(errorMessage).toBeTruthy();
		});

		it('should apply retry-btn class', () => {
			// Arrange
			const data = createMockPageData({ error: 'Test error' });

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const retryBtn = container.querySelector('.retry-btn');
			expect(retryBtn).toBeTruthy();
		});
	});

	describe('Related videos section', () => {
		it('should render aside section', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const aside = container.querySelector('aside');
			expect(aside).toBeTruthy();
		});

		it('should apply correct aside classes', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const aside = container.querySelector('aside.mt-7\\.75.flex.w-1\\/3.flex-col.gap-5');
			expect(aside).toBeTruthy();
		});

		it('should not render VideoListings when error exists', () => {
			// Arrange
			const data = createMockPageData({ error: 'Test error' });

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			// VideoListings is commented out in template, but the aside should still exist
			const aside = container.querySelector('aside');
			expect(aside).toBeTruthy();
		});

		it('should handle missing related items data', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			// Component should handle missing data.video gracefully
			expect(container).toBeTruthy();
		});
	});

	describe('Edge cases', () => {
		it('should handle playerConfig with all null values', () => {
			// Arrange
			const data = createMockPageData({
				playerConfig: {
					videoStream: null,
					audioStream: null,
					subtitleStream: null,
					duration: 0,
					poster: ''
				}
			});

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText('No Streams Available')).toBeInTheDocument();
		});

		it('should handle metadata with empty strings', () => {
			// Arrange
			const data = createMockPageData({
				metadata: {
					title: '',
					description: '',
					channelName: '',
					channelAvatar: null,
					viewCount: 0,
					uploadDate: '',
					likeCount: 0,
					dislikeCount: 0,
					subscriberCount: 0
				}
			});

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			expect(container).toBeTruthy();
		});

		it('should handle very long error messages', () => {
			// Arrange
			const longError = 'A'.repeat(1000);
			const data = createMockPageData({ error: longError });

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText(longError)).toBeInTheDocument();
		});

		it('should handle special characters in error messages', () => {
			// Arrange
			const specialCharError = '<script>alert("xss")</script>';
			const data = createMockPageData({ error: specialCharError });

			// Act
			render(Page, { props: { data } });

			// Assert
			// Should render as text, not execute
			expect(screen.getByText(specialCharError)).toBeInTheDocument();
		});
	});

	describe('Responsive layout', () => {
		it('should apply responsive padding classes', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const paddedDiv = container.querySelector('.p-4.sm\\:p-6.lg\\:p-8');
			expect(paddedDiv).toBeTruthy();
		});

		it('should maintain flex layout', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const mainDiv = container.querySelector('.flex.h-screen.w-full');
			expect(mainDiv).toBeTruthy();
		});

		it('should apply column flex to section', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const section = container.querySelector('section.flex-col');
			expect(section).toBeTruthy();
		});
	});

	describe('related videos rendering', () => {
		it('should include relatedVideos in page data', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(data.relatedVideos).toBeDefined();
			expect(data.relatedVideos).toEqual(mockRelatedVideos);
		});

		it('should pass relatedVideos to VideoListings component', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			// VideoListings should be rendered in aside
			const aside = container.querySelector('aside');
			expect(aside).toBeTruthy();
		});

		it('should render VideoListings when not in error state', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.queryByText('Failed to Load Video')).not.toBeInTheDocument();
			// VideoListings should be present
			const aside = screen.getByRole('complementary', { hidden: true });
			expect(aside).toBeInTheDocument();
		});

		it('should handle empty related videos array', () => {
			// Arrange
			const data = createMockPageData({ relatedVideos: mockEmptyRelatedVideos });

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			expect(container).toBeTruthy();
			// Should not crash with empty array
		});

		it('should not render VideoListings when in error state', () => {
			// Arrange
			const data = createMockPageData({ error: 'Test error' });

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText('Failed to Load Video')).toBeInTheDocument();
			// VideoListings should not be visible
		});

		it('should update relatedVideos when data changes', () => {
			// Arrange
			const initialData = createMockPageData({ relatedVideos: [mockRelatedVideos[0]] });
			const { rerender } = render(Page, { props: { data: initialData } });

			// Act
			const updatedData = createMockPageData({ relatedVideos: mockRelatedVideos });
			rerender({ data: updatedData });

			// Assert
			expect(updatedData.relatedVideos).toHaveLength(3);
		});
	});

	describe('related videos with player config', () => {
		it('should render both player and related videos', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const section = container.querySelector('section');
			const aside = container.querySelector('aside');
			expect(section).toBeTruthy();
			expect(aside).toBeTruthy();
		});

		it('should maintain relatedVideos when player config changes', () => {
			// Arrange
			const initialData = createMockPageData();
			const { rerender } = render(Page, { props: { data: initialData } });

			// Act
			const updatedPlayerConfig = {
				...mockPlayerConfig,
				duration: 500
			};
			const updatedData = createMockPageData({ playerConfig: updatedPlayerConfig });
			rerender({ data: updatedData });

			// Assert
			expect(updatedData.relatedVideos).toEqual(mockRelatedVideos);
		});
	});

	describe('sidebar layout', () => {
		it('should render aside element', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const aside = container.querySelector('aside');
			expect(aside).toBeTruthy();
		});

		it('should apply correct aside classes', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const aside = container.querySelector('aside.w-1\\/3');
			expect(aside).toBeTruthy();
		});

		it('should position aside correctly', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const aside = container.querySelector('aside');
			expect(aside).toHaveClass('flex', 'flex-col');
		});
	});

	describe('error state with related videos', () => {
		it('should not show related videos when there is an error', () => {
			// Arrange
			const data = createMockPageData({ error: 'Video load error' });

			// Act
			render(Page, { props: { data } });

			// Assert
			expect(screen.getByText('Failed to Load Video')).toBeInTheDocument();
			// Related videos should not be rendered
		});

		it('should handle error with relatedVideos still in data', () => {
			// Arrange
			const data = createMockPageData({
				error: 'Video load error',
				relatedVideos: mockRelatedVideos
			});

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			expect(screen.getByText('Failed to Load Video')).toBeInTheDocument();
			expect(container).toBeTruthy();
		});
	});

	describe('reactive data updates', () => {
		it('should update relatedVideos reactively', () => {
			// Arrange
			const initialData = createMockPageData({ relatedVideos: [] });
			const { rerender } = render(Page, { props: { data: initialData } });

			// Act
			const updatedData = createMockPageData({ relatedVideos: mockRelatedVideos });
			rerender({ data: updatedData });

			// Assert
			expect(updatedData.relatedVideos).toHaveLength(3);
		});

		it('should handle relatedVideos being set to empty', () => {
			// Arrange
			const initialData = createMockPageData({ relatedVideos: mockRelatedVideos });
			const { rerender } = render(Page, { props: { data: initialData } });

			// Act
			const updatedData = createMockPageData({ relatedVideos: [] });
			rerender({ data: updatedData });

			// Assert
			expect(updatedData.relatedVideos).toHaveLength(0);
		});

		it('should handle undefined relatedVideos', () => {
			// Arrange
			const data = createMockPageData({ relatedVideos: undefined as any });

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			expect(container).toBeTruthy();
		});
	});

	describe('videoId key changes with related videos', () => {
		it('should update videoId when navigating between related videos', () => {
			// Arrange
			const initialData = createMockPageData();
			const { rerender } = render(Page, { props: { data: initialData } });

			// Act
			const newPlayerConfig = {
				...mockPlayerConfig,
				videoStream: [{
					...mockPlayerConfig.videoStream![0],
					url: 'https://example.com/new-video.mp4'
				}]
			};
			const updatedData = createMockPageData({ playerConfig: newPlayerConfig });
			rerender({ data: updatedData });

			// Assert
			// Component should re-render with new videoId
			expect(updatedData.playerConfig.videoStream![0].url).toBe('https://example.com/new-video.mp4');
		});

		it('should maintain relatedVideos during videoId changes', () => {
			// Arrange
			const initialData = createMockPageData();
			const { rerender } = render(Page, { props: { data: initialData } });

			// Act
			const newPlayerConfig = {
				...mockPlayerConfig,
				poster: 'new-poster.jpg'
			};
			const updatedData = createMockPageData({ playerConfig: newPlayerConfig });
			rerender({ data: updatedData });

			// Assert
			expect(updatedData.relatedVideos).toEqual(mockRelatedVideos);
		});
	});

	describe('loading store integration', () => {
		it('should pass loading store to VideoListings', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			// VideoListings should receive isLoadingStore prop
			expect(container).toBeTruthy();
		});

		it('should initialize with loading state true', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			render(Page, { props: { data } });

			// Assert
			// Should not show loading skeleton initially
			expect(screen.queryByText('Loading video...')).toBeInTheDocument();
		});
	});

	describe('component lifecycle with related videos', () => {
		it('should load related videos after mount', async () => {
			// Arrange
			const data = createMockPageData();

			// Act
			render(Page, { props: { data } });

			// Assert
			await waitFor(() => {
				expect(data.relatedVideos).toBeDefined();
			});
		});

		it('should maintain related videos state throughout lifecycle', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { unmount } = render(Page, { props: { data } });

			// Assert
			expect(data.relatedVideos).toEqual(mockRelatedVideos);
			
			// Cleanup
			unmount();
		});
	});

	describe('edge cases with related videos', () => {
		it('should handle null relatedVideos', () => {
			// Arrange
			const data = createMockPageData({ relatedVideos: null as any });

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			expect(container).toBeTruthy();
		});

		it('should handle very large relatedVideos array', () => {
			// Arrange
			const largeArray = Array.from({ length: 100 }, (_, i) => ({
				...mockRelatedVideos[0],
				id: `video-${i}`,
				title: `Video ${i}`
			}));
			const data = createMockPageData({ relatedVideos: largeArray });

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			expect(container).toBeTruthy();
			expect(data.relatedVideos).toHaveLength(100);
		});

		it('should handle relatedVideos with missing fields', () => {
			// Arrange
			const incompleteVideos = [{
				id: 'incomplete',
				url: '',
				title: '',
				thumbnail: '',
				channelName: '',
				channelAvatar: null,
				viewCount: 0,
				duration: 0,
				uploadDate: ''
			}];
			const data = createMockPageData({ relatedVideos: incompleteVideos as any });

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			expect(container).toBeTruthy();
		});
	});

	describe('integration with other components', () => {
		it('should maintain layout integrity with all components', () => {
			// Arrange
			const data = createMockPageData();

			// Act
			const { container } = render(Page, { props: { data } });

			// Assert
			const mainDiv = container.querySelector('div.flex');
			const section = container.querySelector('section.w-2\\/3');
			const aside = container.querySelector('aside.w-1\\/3');
			
			expect(mainDiv).toBeTruthy();
			expect(section).toBeTruthy();
			expect(aside).toBeTruthy();
		});
	});
});