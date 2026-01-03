/**
 * Test Suite: VideoLoading.svelte
 * 
 * Tests for video player page loading skeleton
 */

import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import VideoLoading from './VideoLoading.svelte';

describe('VideoLoading', () => {
	// =============================================================================
	// Container Structure Tests
	// =============================================================================

	describe('container structure', () => {
		it('should render loading container', () => {
			const { container } = render(VideoLoading);
			
			const loadingContainer = container.querySelector('.loading-container');
			expect(loadingContainer).toBeInTheDocument();
		});

		it('should have full width container', () => {
			const { container } = render(VideoLoading);
			
			const loadingContainer = container.querySelector('.loading-container');
			expect(loadingContainer).toBeInTheDocument();
			// Width is set via CSS, just verify container exists
		});
	});

	// =============================================================================
	// Video Player Skeleton Tests
	// =============================================================================

	describe('video player skeleton', () => {
		it('should render video skeleton container', () => {
			const { container } = render(VideoLoading);
			
			const videoSkeleton = container.querySelector('.video-skeleton');
			expect(videoSkeleton).toBeInTheDocument();
		});

		it('should have aspect-video ratio', () => {
			const { container } = render(VideoLoading);
			
			const playerBox = container.querySelector('.aspect-video');
			expect(playerBox).toBeInTheDocument();
		});

		it('should have full width player', () => {
			const { container } = render(VideoLoading);
			
			const playerBox = container.querySelector('.aspect-video.w-full');
			expect(playerBox).toBeInTheDocument();
		});

		it('should have dark background', () => {
			const { container } = render(VideoLoading);
			
			const playerBox = container.querySelector('.bg-gray-800');
			expect(playerBox).toBeInTheDocument();
		});

		it('should have rounded corners', () => {
			const { container } = render(VideoLoading);
			
			const playerBox = container.querySelector('.aspect-video.rounded-lg');
			expect(playerBox).toBeInTheDocument();
		});

		it('should center content with flex', () => {
			const { container } = render(VideoLoading);
			
			const playerBox = container.querySelector('.aspect-video');
			expect(playerBox).toHaveClass('flex', 'items-center', 'justify-center');
		});
	});

	// =============================================================================
	// Spinner Tests
	// =============================================================================

	describe('loading spinner', () => {
		it('should render spinner element', () => {
			const { container } = render(VideoLoading);
			
			const spinner = container.querySelector('.spinner');
			expect(spinner).toBeInTheDocument();
		});

		it('should be inside video skeleton', () => {
			const { container } = render(VideoLoading);
			
			const videoSkeleton = container.querySelector('.video-skeleton');
			const spinner = videoSkeleton?.querySelector('.spinner');
			expect(spinner).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Details Skeleton Tests
	// =============================================================================

	describe('details skeleton', () => {
		it('should render details skeleton container', () => {
			const { container } = render(VideoLoading);
			
			const detailsSkeleton = container.querySelector('.details-skeleton');
			expect(detailsSkeleton).toBeInTheDocument();
		});

		it('should have top margin', () => {
			const { container } = render(VideoLoading);
			
			const detailsSkeleton = container.querySelector('.details-skeleton');
			expect(detailsSkeleton).toHaveClass('mt-6');
		});
	});

	// =============================================================================
	// Title Skeleton Tests
	// =============================================================================

	describe('title skeleton', () => {
		it('should render title skeleton', () => {
			const { container } = render(VideoLoading);
			
			const title = container.querySelector('.h-7.w-3\\/4');
			expect(title).toBeInTheDocument();
		});

		it('should have gray background', () => {
			const { container } = render(VideoLoading);
			
			const title = container.querySelector('.h-7.bg-gray-700');
			expect(title).toBeInTheDocument();
		});

		it('should have pulse animation', () => {
			const { container } = render(VideoLoading);
			
			const title = container.querySelector('.h-7.animate-pulse');
			expect(title).toBeInTheDocument();
		});

		it('should have rounded corners', () => {
			const { container } = render(VideoLoading);
			
			const title = container.querySelector('.h-7.rounded');
			expect(title).toBeInTheDocument();
		});

		it('should have bottom margin', () => {
			const { container } = render(VideoLoading);
			
			const title = container.querySelector('.h-7.mb-4');
			expect(title).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Channel Info Skeleton Tests
	// =============================================================================

	describe('channel info skeleton', () => {
		it('should render channel info container', () => {
			const { container } = render(VideoLoading);
			
			const channelContainer = container.querySelector('.flex.items-center.gap-3');
			expect(channelContainer).toBeInTheDocument();
		});

		it('should render channel avatar skeleton', () => {
			const { container } = render(VideoLoading);
			
			const avatar = container.querySelector('.h-12.w-12.rounded-full');
			expect(avatar).toBeInTheDocument();
		});

		it('should have avatar pulse animation', () => {
			const { container } = render(VideoLoading);
			
			const avatar = container.querySelector('.h-12.w-12.animate-pulse');
			expect(avatar).toBeInTheDocument();
		});

		it('should render channel name skeleton', () => {
			const { container } = render(VideoLoading);
			
			const channelName = container.querySelector('.h-4.w-40');
			expect(channelName).toBeInTheDocument();
		});

		it('should render subscriber count skeleton', () => {
			const { container } = render(VideoLoading);
			
			const subscriberCount = container.querySelector('.h-3.w-32');
			expect(subscriberCount).toBeInTheDocument();
		});

		it('should have flex-1 layout for channel text', () => {
			const { container } = render(VideoLoading);
			
			const channelText = container.querySelector('.flex-1');
			expect(channelText).toBeInTheDocument();
		});

		it('should have bottom margin on channel container', () => {
			const { container } = render(VideoLoading);
			
			const channelContainer = container.querySelector('.flex.items-center.gap-3.mb-4');
			expect(channelContainer).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Description Skeleton Tests
	// =============================================================================

	describe('description skeleton', () => {
		it('should render description container', () => {
			const { container } = render(VideoLoading);
			
			const descContainer = container.querySelector('.space-y-2');
			expect(descContainer).toBeInTheDocument();
		});

		it('should render three description lines', () => {
			const { container } = render(VideoLoading);
			
			const descContainer = container.querySelector('.space-y-2');
			const descLines = descContainer?.querySelectorAll('.h-3');
			expect(descLines).toHaveLength(3);
		});

		it('should have first line full width', () => {
			const { container } = render(VideoLoading);
			
			const descContainer = container.querySelector('.space-y-2');
			const firstLine = descContainer?.querySelector('.w-full');
			expect(firstLine).toBeInTheDocument();
		});

		it('should have second line 5/6 width', () => {
			const { container } = render(VideoLoading);
			
			const descContainer = container.querySelector('.space-y-2');
			const secondLine = descContainer?.querySelector('.w-5\\/6');
			expect(secondLine).toBeInTheDocument();
		});

		it('should have third line 4/6 width', () => {
			const { container } = render(VideoLoading);
			
			const descContainer = container.querySelector('.space-y-2');
			const thirdLine = descContainer?.querySelector('.w-4\\/6');
			expect(thirdLine).toBeInTheDocument();
		});

		it('should have pulse animation on all description lines', () => {
			const { container } = render(VideoLoading);
			
			const descContainer = container.querySelector('.space-y-2');
			const animatedLines = descContainer?.querySelectorAll('.animate-pulse');
			expect(animatedLines).toHaveLength(3);
		});

		it('should have gray background on all description lines', () => {
			const { container } = render(VideoLoading);
			
			const descContainer = container.querySelector('.space-y-2');
			const grayLines = descContainer?.querySelectorAll('.bg-gray-700');
			expect(grayLines).toHaveLength(3);
		});

		it('should have rounded corners on all description lines', () => {
			const { container } = render(VideoLoading);
			
			const descContainer = container.querySelector('.space-y-2');
			const roundedLines = descContainer?.querySelectorAll('.rounded');
			expect(roundedLines).toHaveLength(3);
		});
	});

	// =============================================================================
	// Animation Tests
	// =============================================================================

	describe('animations', () => {
		it('should have pulse animation on multiple elements', () => {
			const { container } = render(VideoLoading);
			
			const animatedElements = container.querySelectorAll('.animate-pulse');
			// Title + avatar + 2 channel text + 3 description = 7
			expect(animatedElements.length).toBeGreaterThanOrEqual(7);
		});

		it('should use consistent gray color for skeletons', () => {
			const { container } = render(VideoLoading);
			
			const grayElements = container.querySelectorAll('.bg-gray-700');
			expect(grayElements.length).toBeGreaterThanOrEqual(6);
		});

		it('should have darker background for video player area', () => {
			const { container } = render(VideoLoading);
			
			const playerBox = container.querySelector('.bg-gray-800');
			expect(playerBox).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Visual Hierarchy Tests
	// =============================================================================

	describe('visual hierarchy', () => {
		it('should have largest skeleton for title', () => {
			const { container } = render(VideoLoading);
			
			const title = container.querySelector('.h-7');
			expect(title).toBeInTheDocument();
		});

		it('should have medium skeleton for channel name', () => {
			const { container } = render(VideoLoading);
			
			const channelName = container.querySelector('.h-4');
			expect(channelName).toBeInTheDocument();
		});

		it('should have smallest skeletons for description', () => {
			const { container } = render(VideoLoading);
			
			const descLines = container.querySelectorAll('.space-y-2 .h-3');
			expect(descLines).toHaveLength(3);
		});

		it('should have decreasing width for description lines', () => {
			const { container } = render(VideoLoading);
			
			const descContainer = container.querySelector('.space-y-2');
			expect(descContainer?.querySelector('.w-full')).toBeInTheDocument();
			expect(descContainer?.querySelector('.w-5\\/6')).toBeInTheDocument();
			expect(descContainer?.querySelector('.w-4\\/6')).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Layout Spacing Tests
	// =============================================================================

	describe('layout spacing', () => {
		it('should have spacing between details sections', () => {
			const { container } = render(VideoLoading);
			
			expect(container.querySelector('.mb-4')).toBeInTheDocument();
		});

		it('should have gap in channel info', () => {
			const { container } = render(VideoLoading);
			
			const channelContainer = container.querySelector('.flex.gap-3');
			expect(channelContainer).toBeInTheDocument();
		});

		it('should have vertical spacing in description', () => {
			const { container } = render(VideoLoading);
			
			const descContainer = container.querySelector('.space-y-2');
			expect(descContainer).toBeInTheDocument();
		});

		it('should have margin between video and details', () => {
			const { container } = render(VideoLoading);
			
			const detailsSkeleton = container.querySelector('.details-skeleton.mt-6');
			expect(detailsSkeleton).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Integration Tests
	// =============================================================================

	describe('integration', () => {
		it('should render complete loading skeleton', () => {
			const { container } = render(VideoLoading);
			
			// Video player
			expect(container.querySelector('.video-skeleton')).toBeInTheDocument();
			expect(container.querySelector('.spinner')).toBeInTheDocument();
			
			// Details
			expect(container.querySelector('.details-skeleton')).toBeInTheDocument();
			expect(container.querySelector('.h-7')).toBeInTheDocument();
			
			// Channel info
			expect(container.querySelector('.h-12.w-12.rounded-full')).toBeInTheDocument();
			
			// Description
			expect(container.querySelector('.space-y-2')).toBeInTheDocument();
		});

		it('should maintain proper section order', () => {
			const { container } = render(VideoLoading);
			
			const loadingContainer = container.querySelector('.loading-container');
			const children = Array.from(loadingContainer?.children || []);
			
			expect(children[0]).toHaveClass('video-skeleton');
			expect(children[1]).toHaveClass('details-skeleton');
		});

		it('should be self-contained without props', () => {
			const { container } = render(VideoLoading);
			
			expect(container.firstChild).toBeInTheDocument();
		});

		it('should have consistent rounded corners throughout', () => {
			const { container } = render(VideoLoading);
			
			const roundedElements = container.querySelectorAll('.rounded, .rounded-lg, .rounded-full');
			expect(roundedElements.length).toBeGreaterThan(0);
		});
	});

	// =============================================================================
	// Style Tests
	// =============================================================================

	describe('component styles', () => {
		it('should render with component styles', () => {
			const { container } = render(VideoLoading);
			
			// Verify that classes from the style block are applied
			expect(container.querySelector('.loading-container')).toBeInTheDocument();
			expect(container.querySelector('.video-skeleton')).toBeInTheDocument();
			expect(container.querySelector('.spinner')).toBeInTheDocument();
		});
	});
});