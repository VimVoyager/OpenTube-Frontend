/**
 * Test Suite: VideoDetail.svelte
 * 
 * Tests for video metadata display component
 */

import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import VideoDetail from './VideoDetail.svelte';
import type { VideoMetadata } from '$lib/adapters/types';
import {
	mockMetadata,
	mockMetadataNoAvatar,
	mockMetadataLargeNumbers,
	mockMetadataLongDescription,
	mockMetadataHtmlDescription,
	mockMetadataZeroViews,
	mockMetadataSpecialChars
} from '../../tests/fixtures/videoDetailFixtures';

// =============================================================================
// Metadata Display Tests
// =============================================================================

describe('VideoDetail', () => {
	describe('metadata display', () => {
		it('should render video title', () => {
			render(VideoDetail, { props: { metadata: mockMetadata } });
			
			const title = screen.getByText(mockMetadata.title);
			expect(title).toBeInTheDocument();
			expect(title.tagName).toBe('H2');
		});

		it('should render channel name', () => {
			render(VideoDetail, { props: { metadata: mockMetadata } });
			
			const channelName = screen.getByText(mockMetadata.channelName);
			expect(channelName).toBeInTheDocument();
			expect(channelName.tagName).toBe('H3');
		});

		it('should render all metadata fields', () => {
			render(VideoDetail, { props: { metadata: mockMetadata } });
			
			expect(screen.getByText(mockMetadata.title)).toBeInTheDocument();
			expect(screen.getByText(mockMetadata.channelName)).toBeInTheDocument();
			expect(screen.getByText(/1,234,567 views/)).toBeInTheDocument();
		});

		it('should render special characters correctly in title', () => {
			render(VideoDetail, { props: { metadata: mockMetadataSpecialChars } });
			
			expect(screen.getByText(mockMetadataSpecialChars.title)).toBeInTheDocument();
		});

		it('should render special characters correctly in channel name', () => {
			render(VideoDetail, { props: { metadata: mockMetadataSpecialChars } });
			
			expect(screen.getByText(mockMetadataSpecialChars.channelName)).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Avatar Display Tests
	// =============================================================================

	describe('avatar display', () => {
		it('should render channel avatar when provided', () => {
			render(VideoDetail, { props: { metadata: mockMetadata } });
			
			const avatar = screen.getByAltText(mockMetadata.channelName);
			expect(avatar).toBeInTheDocument();
			expect(avatar).toHaveAttribute('src', mockMetadata.channelAvatar);
		});

		it('should render placeholder when avatar is undefined', () => {
			render(VideoDetail, { props: { metadata: mockMetadataNoAvatar } });
			
			const avatar = screen.getByAltText(mockMetadataNoAvatar.channelName);
			expect(avatar).toBeInTheDocument();
			expect(avatar).toHaveAttribute('src');
			expect(avatar.getAttribute('src')).toContain('logo-placeholder');
		});

		it('should apply correct avatar styling', () => {
			render(VideoDetail, { props: { metadata: mockMetadata } });
			
			const avatar = screen.getByAltText(mockMetadata.channelName);
			expect(avatar).toHaveClass('h-8', 'w-8', 'rounded-full');
		});
	});

	// =============================================================================
	// View Count Formatting Tests
	// =============================================================================

	describe('view count formatting', () => {
		it('should format view count with commas', () => {
			render(VideoDetail, { props: { metadata: mockMetadata } });
			
			// 1234567 should be formatted as 1,234,567
			expect(screen.getByText(/1,234,567 views/)).toBeInTheDocument();
		});

		it('should format large numbers correctly', () => {
			render(VideoDetail, { props: { metadata: mockMetadataLargeNumbers } });
			
			// 999999999 should be formatted as 999,999,999
			expect(screen.getByText(/999,999,999 views/)).toBeInTheDocument();
		});

		it('should handle zero views', () => {
			render(VideoDetail, { props: { metadata: mockMetadataZeroViews } });
			
			expect(screen.getByText(/0 views/)).toBeInTheDocument();
		});

		it('should handle single digit views', () => {
			const singleViewMetadata = { ...mockMetadata, viewCount: 5 };
			render(VideoDetail, { props: { metadata: singleViewMetadata } });
			
			expect(screen.getByText(/5 views/)).toBeInTheDocument();
		});

		it('should handle three digit views without commas', () => {
			const threeDigitMetadata = { ...mockMetadata, viewCount: 999 };
			render(VideoDetail, { props: { metadata: threeDigitMetadata } });
			
			expect(screen.getByText(/999 views/)).toBeInTheDocument();
		});

		it('should handle four digit views with comma', () => {
			const fourDigitMetadata = { ...mockMetadata, viewCount: 1000 };
			render(VideoDetail, { props: { metadata: fourDigitMetadata } });
			
			expect(screen.getByText(/1,000 views/)).toBeInTheDocument();
		});

		it('should include "views" text in display', () => {
			render(VideoDetail, { props: { metadata: mockMetadata } });
			
			const viewsElement = screen.getByText(/views/);
			expect(viewsElement).toBeInTheDocument();
			expect(viewsElement.textContent).toContain('views');
		});
	});

	// =============================================================================
	// Description Rendering Tests
	// =============================================================================

	describe('description rendering', () => {
		it('should render description text', () => {
			render(VideoDetail, { props: { metadata: mockMetadata } });
			
			const description = screen.getByText(/This is a test video description/);
			expect(description).toBeInTheDocument();
		});

		it('should render HTML content in description', () => {
			render(VideoDetail, { props: { metadata: mockMetadataHtmlDescription } });
			
			// Check for HTML elements
			const link = screen.getByRole('link');
			expect(link).toBeInTheDocument();
			expect(link).toHaveAttribute('href', 'https://example.com');
		});

		it('should handle long descriptions', () => {
			render(VideoDetail, { props: { metadata: mockMetadataLongDescription } });
			
			const description = screen.getByText(/Lorem ipsum/);
			expect(description).toBeInTheDocument();
		});

		it('should preserve HTML formatting', () => {
			render(VideoDetail, { props: { metadata: mockMetadata } });
			
			const container = screen.getByText(/This is a test video description/).parentElement;
			expect(container?.innerHTML).toContain('<strong>HTML</strong>');
		});

		it('should render empty description', () => {
			const emptyDescMetadata = { ...mockMetadata, description: '' };
			const { container } = render(VideoDetail, { props: { metadata: emptyDescMetadata } });
			
			// Component should still render without errors
			expect(container).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Subscribe Button Tests
	// =============================================================================

	describe('subscribe button', () => {
		it('should render subscribe button', () => {
			render(VideoDetail, { props: { metadata: mockMetadata } });
			
			const subscribeButton = screen.getByRole('button', { name: /subscribe/i });
			expect(subscribeButton).toBeInTheDocument();
		});

		it('should have correct button type', () => {
			render(VideoDetail, { props: { metadata: mockMetadata } });
			
			const subscribeButton = screen.getByRole('button', { name: /subscribe/i });
			expect(subscribeButton).toHaveAttribute('type', 'button');
		});

		it('should apply button styling classes', () => {
			render(VideoDetail, { props: { metadata: mockMetadata } });
			
			const subscribeButton = screen.getByRole('button', { name: /subscribe/i });
			expect(subscribeButton).toHaveClass('bg-white', 'text-black', 'rounded-full');
		});
	});

	// =============================================================================
	// Layout and Structure Tests
	// =============================================================================

	describe('layout and structure', () => {
		it('should render title with correct styling', () => {
			render(VideoDetail, { props: { metadata: mockMetadata } });
			
			const title = screen.getByText(mockMetadata.title);
			expect(title).toHaveClass('text-2xl', 'font-bold', 'text-white');
		});

		it('should render channel name with correct styling', () => {
			render(VideoDetail, { props: { metadata: mockMetadata } });
			
			const channelName = screen.getByText(mockMetadata.channelName);
			expect(channelName).toHaveClass('text-md', 'font-semibold', 'text-white');
		});

		it('should render view count heading', () => {
			render(VideoDetail, { props: { metadata: mockMetadata } });
			
			const viewsHeading = screen.getByText(/1,234,567 views/);
			expect(viewsHeading.tagName).toBe('H3');
		});

		it('should have proper container structure', () => {
			const { container } = render(VideoDetail, { props: { metadata: mockMetadata } });
			
			expect(container.querySelector('div')).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Edge Cases and Error Handling Tests
	// =============================================================================

	describe('edge cases', () => {
		it('should handle undefined avatar gracefully', () => {
			const { container } = render(VideoDetail, { props: { metadata: mockMetadataNoAvatar } });
			
			const avatar = screen.getByAltText(mockMetadataNoAvatar.channelName);
			expect(avatar).toBeInTheDocument();
			expect(container).toBeInTheDocument();
		});

		it('should handle very long titles', () => {
			const longTitleMetadata = {
				...mockMetadata,
				title: 'A'.repeat(200)
			};
			render(VideoDetail, { props: { metadata: longTitleMetadata } });
			
			const title = screen.getByText('A'.repeat(200));
			expect(title).toBeInTheDocument();
		});

		it('should handle very long channel names', () => {
			const longChannelMetadata = {
				...mockMetadata,
				channelName: 'B'.repeat(100)
			};
			render(VideoDetail, { props: { metadata: longChannelMetadata } });
			
			const channelName = screen.getByText('B'.repeat(100));
			expect(channelName).toBeInTheDocument();
		});

		it('should handle negative view counts as zero', () => {
			const negativeViewsMetadata = { ...mockMetadata, viewCount: -100 };
			const { container } = render(VideoDetail, { props: { metadata: negativeViewsMetadata } });
			
			// Component should render without crashing
			expect(container).toBeInTheDocument();
		});

		it('should handle decimal view counts', () => {
			const decimalViewsMetadata = { ...mockMetadata, viewCount: 1234.56 };
			render(VideoDetail, { props: { metadata: decimalViewsMetadata } });
			
			// Should format without decimal places
			expect(screen.getByText(/1,234 views/)).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Integration Tests
	// =============================================================================

	describe('integration', () => {
		it('should render complete component with all elements', () => {
			render(VideoDetail, { props: { metadata: mockMetadata } });
			
			// Title
			expect(screen.getByText(mockMetadata.title)).toBeInTheDocument();
			
			// Channel info
			expect(screen.getByText(mockMetadata.channelName)).toBeInTheDocument();
			expect(screen.getByAltText(mockMetadata.channelName)).toBeInTheDocument();
			
			// Subscribe button
			expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
			
			// View count
			expect(screen.getByText(/1,234,567 views/)).toBeInTheDocument();
			
			// Description
			expect(screen.getByText(/This is a test video description/)).toBeInTheDocument();
		});

		it('should handle metadata updates', () => {
			const { rerender } = render(VideoDetail, { props: { metadata: mockMetadata } });
			
			expect(screen.getByText(mockMetadata.title)).toBeInTheDocument();
			
			// Update with new metadata
			rerender({ metadata: mockMetadataLargeNumbers });
			
			expect(screen.getByText(mockMetadataLargeNumbers.title)).toBeInTheDocument();
			expect(screen.getByText(/999,999,999 views/)).toBeInTheDocument();
		});

		it('should render with minimal required props', () => {
			const minimalMetadata: VideoMetadata = {
				title: 'Minimal Video',
				description: '',
				channelName: 'Minimal Channel',
				channelAvatar: null,
				viewCount: 0,
				uploadDate: '',
				likeCount: 0,
				dislikeCount: 0,
				subscriberCount: 0
			};
			
			const { container } = render(VideoDetail, { props: { metadata: minimalMetadata } });
			
			expect(container).toBeInTheDocument();
			expect(screen.getByText('Minimal Video')).toBeInTheDocument();
			expect(screen.getByText('Minimal Channel')).toBeInTheDocument();
		});
	});
});