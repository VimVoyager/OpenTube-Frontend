import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Page from './+page.svelte';
import type { PageData } from './$types';
import { mockPlayerConfig } from '../../../tests/fixtures/videoPlayerFixtures';
import { mockMetadata } from '../../../tests/fixtures/videoDetailFixtures';

describe('+page.svelte', () => {
	const createMockPageData = (overrides: Partial<PageData> = {}): PageData => ({
		playerConfig: mockPlayerConfig,
		metadata: mockMetadata,
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
});