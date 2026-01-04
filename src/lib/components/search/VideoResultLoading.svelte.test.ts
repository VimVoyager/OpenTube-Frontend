/**
 * Test Suite: VideoResultLoading.svelte
 * 
 * Tests for individual search result loading skeleton
 */

import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import VideoResultLoading from './VideoResultLoading.svelte';

describe('VideoResultLoading', () => {
	// =============================================================================
	// Accessibility Tests
	// =============================================================================

	describe('accessibility', () => {
		it('should have role="status" for screen readers', () => {
			const { container } = render(VideoResultLoading);
			
			const statusElement = container.querySelector('[role="status"]');
			expect(statusElement).toBeInTheDocument();
		});

		it('should have aria-label for loading context', () => {
			const { container } = render(VideoResultLoading);
			
			const statusElement = container.querySelector('[role="status"]');
			expect(statusElement).toHaveAttribute('aria-label', 'Loading search result');
		});
	});

	// =============================================================================
	// Structure and Layout Tests
	// =============================================================================

	describe('structure and layout', () => {
		it('should render with grid layout', () => {
			const { container } = render(VideoResultLoading);
			
			const gridElement = container.querySelector('.grid');
			expect(gridElement).toBeInTheDocument();
			expect(gridElement).toHaveClass('grid-cols-3');
		});

		it('should apply gap between columns', () => {
			const { container } = render(VideoResultLoading);
			
			const gridElement = container.querySelector('.grid');
			expect(gridElement).toHaveClass('gap-4');
		});

		it('should have rounded corners', () => {
			const { container } = render(VideoResultLoading);
			
			const gridElement = container.querySelector('.grid');
			expect(gridElement).toHaveClass('rounded-lg');
		});

		it('should have padding', () => {
			const { container } = render(VideoResultLoading);
			
			const gridElement = container.querySelector('.grid');
			expect(gridElement).toHaveClass('p-4');
		});

		it('should have shadow styling', () => {
			const { container } = render(VideoResultLoading);
			
			const gridElement = container.querySelector('.grid');
			expect(gridElement).toHaveClass('shadow-sm');
		});
	});

	// =============================================================================
	// Thumbnail Skeleton Tests
	// =============================================================================

	describe('thumbnail skeleton', () => {
		it('should render thumbnail skeleton', () => {
			const { container } = render(VideoResultLoading);
			
			const thumbnail = container.querySelector('.col-span-1');
			expect(thumbnail).toBeInTheDocument();
		});

		it('should have 16:9 aspect ratio', () => {
			const { container } = render(VideoResultLoading);
			
			const thumbnailInner = container.querySelector('[style*="aspect-ratio: 16/9"]');
			expect(thumbnailInner).toBeInTheDocument();
		});

		it('should have pulse animation', () => {
			const { container } = render(VideoResultLoading);
			
			const thumbnailInner = container.querySelector('.col-span-1 .animate-pulse');
			expect(thumbnailInner).toBeInTheDocument();
		});

		it('should have gray background', () => {
			const { container } = render(VideoResultLoading);
			
			const thumbnailInner = container.querySelector('.col-span-1 .bg-gray-700');
			expect(thumbnailInner).toBeInTheDocument();
		});

		it('should have rounded corners', () => {
			const { container } = render(VideoResultLoading);
			
			const thumbnailInner = container.querySelector('.col-span-1 .rounded-md');
			expect(thumbnailInner).toBeInTheDocument();
		});

		it('should be full width', () => {
			const { container } = render(VideoResultLoading);
			
			const thumbnailInner = container.querySelector('.col-span-1 .w-full');
			expect(thumbnailInner).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Title Skeleton Tests
	// =============================================================================

	describe('title skeleton', () => {
		it('should render two title lines', () => {
			const { container } = render(VideoResultLoading);
			
			const titleContainer = container.querySelector('.mb-1.space-y-2');
			const titleLines = titleContainer?.querySelectorAll('.h-5');
			expect(titleLines).toHaveLength(2);
		});

		it('should have first line full width', () => {
			const { container } = render(VideoResultLoading);
			
			const titleContainer = container.querySelector('.mb-1.space-y-2');
			const firstLine = titleContainer?.querySelector('.w-full');
			expect(firstLine).toBeInTheDocument();
		});

		it('should have second line 4/5 width', () => {
			const { container } = render(VideoResultLoading);
			
			const titleContainer = container.querySelector('.mb-1.space-y-2');
			const secondLine = titleContainer?.querySelector('.w-4\\/5');
			expect(secondLine).toBeInTheDocument();
		});

		it('should have pulse animation on both lines', () => {
			const { container } = render(VideoResultLoading);
			
			const titleContainer = container.querySelector('.mb-1.space-y-2');
			const animatedLines = titleContainer?.querySelectorAll('.animate-pulse');
			expect(animatedLines).toHaveLength(2);
		});

		it('should have rounded corners on both lines', () => {
			const { container } = render(VideoResultLoading);
			
			const titleContainer = container.querySelector('.mb-1.space-y-2');
			const roundedLines = titleContainer?.querySelectorAll('.rounded');
			expect(roundedLines).toHaveLength(2);
		});
	});

	// =============================================================================
	// Metadata Skeleton Tests
	// =============================================================================

	describe('metadata skeleton', () => {
		it('should render view count skeleton', () => {
			const { container } = render(VideoResultLoading);
			
			const viewCount = container.querySelector('.h-4.w-24');
			expect(viewCount).toBeInTheDocument();
		});

		it('should render date skeleton', () => {
			const { container } = render(VideoResultLoading);
			
			const date = container.querySelector('.h-4.w-20');
			expect(date).toBeInTheDocument();
		});

		it('should render separator dot', () => {
			const { container } = render(VideoResultLoading);
			
			const dot = container.querySelector('.h-2.w-2.rounded-full');
			expect(dot).toBeInTheDocument();
		});

		it('should have metadata in flex container', () => {
			const { container } = render(VideoResultLoading);
			
			const metadataContainer = container.querySelector('.mb-2.mt-2.flex');
			expect(metadataContainer).toBeInTheDocument();
			expect(metadataContainer).toHaveClass('items-center', 'gap-2');
		});

		it('should have pulse animation on metadata elements', () => {
			const { container } = render(VideoResultLoading);
			
			const metadataContainer = container.querySelector('.mb-2.mt-2.flex');
			const animatedElements = metadataContainer?.querySelectorAll('.animate-pulse');
			expect(animatedElements?.length).toBeGreaterThan(0);
		});
	});

	// =============================================================================
	// Channel Info Skeleton Tests
	// =============================================================================

	describe('channel info skeleton', () => {
		it('should render channel avatar skeleton', () => {
			const { container } = render(VideoResultLoading);
			
			const avatar = container.querySelector('.h-8.w-8.rounded-full');
			expect(avatar).toBeInTheDocument();
		});

		it('should render channel name skeleton', () => {
			const { container } = render(VideoResultLoading);
			
			const channelName = container.querySelector('.h-4.w-32');
			expect(channelName).toBeInTheDocument();
		});

		it('should have channel info in flex container', () => {
			const { container } = render(VideoResultLoading);
			
			const channelContainer = container.querySelector('.my-3.flex.items-center');
			expect(channelContainer).toBeInTheDocument();
			expect(channelContainer).toHaveClass('space-x-3');
		});

		it('should have pulse animation on channel elements', () => {
			const { container } = render(VideoResultLoading);
			
			const channelContainer = container.querySelector('.my-3.flex');
			const animatedElements = channelContainer?.querySelectorAll('.animate-pulse');
			expect(animatedElements).toHaveLength(2);
		});

		it('should have gray background on channel elements', () => {
			const { container } = render(VideoResultLoading);
			
			const channelContainer = container.querySelector('.my-3.flex');
			const grayElements = channelContainer?.querySelectorAll('.bg-gray-700');
			expect(grayElements).toHaveLength(2);
		});
	});

	// =============================================================================
	// Description Skeleton Tests
	// =============================================================================

	describe('description skeleton', () => {
		it('should render three description lines', () => {
			const { container } = render(VideoResultLoading);
			
			const descriptionContainer = container.querySelector('.space-y-2:last-of-type');
			const descLines = descriptionContainer?.querySelectorAll('.h-3');
			expect(descLines).toHaveLength(3);
		});

		it('should have first two lines full width', () => {
			const { container } = render(VideoResultLoading);
			
			const descriptionContainer = container.querySelector('.space-y-2:last-of-type');
			const fullWidthLines = descriptionContainer?.querySelectorAll('.w-full');
			expect(fullWidthLines).toHaveLength(2);
		});

		it('should have third line 3/4 width', () => {
			const { container } = render(VideoResultLoading);
			
			const descriptionContainer = container.querySelector('.space-y-2:last-of-type');
			const partialLine = descriptionContainer?.querySelector('.w-3\\/4');
			expect(partialLine).toBeInTheDocument();
		});

		it('should have pulse animation on all description lines', () => {
			const { container } = render(VideoResultLoading);
			
			const descriptionContainer = container.querySelector('.space-y-2:last-of-type');
			const animatedLines = descriptionContainer?.querySelectorAll('.animate-pulse');
			expect(animatedLines).toHaveLength(3);
		});

		it('should have rounded corners on all description lines', () => {
			const { container } = render(VideoResultLoading);
			
			const descriptionContainer = container.querySelector('.space-y-2:last-of-type');
			const roundedLines = descriptionContainer?.querySelectorAll('.rounded');
			expect(roundedLines).toHaveLength(3);
		});
	});

	// =============================================================================
	// Animation Tests
	// =============================================================================

	describe('animations', () => {
		it('should have pulse animation on all skeleton elements', () => {
			const { container } = render(VideoResultLoading);
			
			const animatedElements = container.querySelectorAll('.animate-pulse');
			// Thumbnail + 2 title lines + 3 metadata + 2 channel + 3 description = 11
			expect(animatedElements.length).toBeGreaterThanOrEqual(11);
		});

		it('should use consistent gray color across all skeletons', () => {
			const { container } = render(VideoResultLoading);
			
			const grayElements = container.querySelectorAll('.bg-gray-700');
			expect(grayElements.length).toBeGreaterThanOrEqual(11);
		});
	});

	// =============================================================================
	// Content Area Division Tests
	// =============================================================================

	describe('content area division', () => {
		it('should allocate 1/3 width to thumbnail area', () => {
			const { container } = render(VideoResultLoading);
			
			const thumbnailArea = container.querySelector('.col-span-1');
			expect(thumbnailArea).toBeInTheDocument();
		});

		it('should allocate 2/3 width to content area', () => {
			const { container } = render(VideoResultLoading);
			
			const contentArea = container.querySelector('.col-span-2');
			expect(contentArea).toBeInTheDocument();
		});

		it('should use flex column layout for content area', () => {
			const { container } = render(VideoResultLoading);
			
			const contentArea = container.querySelector('.col-span-2');
			expect(contentArea).toHaveClass('flex', 'flex-col');
		});
	});

	// =============================================================================
	// Integration Tests
	// =============================================================================

	describe('integration', () => {
		it('should render complete skeleton structure', () => {
			const { container } = render(VideoResultLoading);
			
			// Main container
			expect(container.querySelector('[role="status"]')).toBeInTheDocument();
			
			// Thumbnail
			expect(container.querySelector('[style*="aspect-ratio: 16/9"]')).toBeInTheDocument();
			
			// Title lines
			expect(container.querySelectorAll('.mb-1.space-y-2 .h-5')).toHaveLength(2);
			
			// Metadata
			expect(container.querySelector('.h-4.w-24')).toBeInTheDocument();
			
			// Channel info
			expect(container.querySelector('.h-8.w-8.rounded-full')).toBeInTheDocument();
			
			// Description
			expect(container.querySelector('.space-y-2:last-of-type')).toBeInTheDocument();
		});

		it('should match expected visual hierarchy', () => {
			const { container } = render(VideoResultLoading);
			
			// Larger elements for title
			const titleLines = container.querySelectorAll('.mb-1 .h-5');
			expect(titleLines).toHaveLength(2);
			
			// Medium elements for metadata
			const metadataElements = container.querySelectorAll('.h-4');
			expect(metadataElements.length).toBeGreaterThan(0);
			
			// Smaller elements for description
			const descriptionLines = container.querySelectorAll('.space-y-2:last-of-type .h-3');
			expect(descriptionLines).toHaveLength(3);
		});

		it('should be self-contained without props', () => {
			const { container } = render(VideoResultLoading);
			
			expect(container.firstChild).toBeInTheDocument();
		});
	});
});