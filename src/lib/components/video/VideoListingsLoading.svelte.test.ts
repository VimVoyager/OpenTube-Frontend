/**
 * Test Suite: VideoListingsLoading.svelte
 * 
 * Tests for related videos listing loading skeleton
 */

import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import VideoListingsLoading from './VideoListingsLoading.svelte';

describe('VideoListingsLoading', () => {
	// =============================================================================
	// Container Structure Tests
	// =============================================================================

	describe('container structure', () => {
		it('should render main container', () => {
			const { container } = render(VideoListingsLoading);
			
			const mainContainer = container.querySelector('.flex.w-full.flex-col');
			expect(mainContainer).toBeInTheDocument();
		});

		it('should have gap between items', () => {
			const { container } = render(VideoListingsLoading);
			
			const mainContainer = container.querySelector('.gap-4');
			expect(mainContainer).toBeInTheDocument();
		});

		it('should have horizontal padding', () => {
			const { container } = render(VideoListingsLoading);
			
			const mainContainer = container.querySelector('.px-6');
			expect(mainContainer).toBeInTheDocument();
		});

		it('should use flex column layout', () => {
			const { container } = render(VideoListingsLoading);
			
			const mainContainer = container.querySelector('.flex-col');
			expect(mainContainer).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Multiple Items Tests
	// =============================================================================

	describe('multiple loading items', () => {
		it('should render 5 loading items', () => {
			const { container } = render(VideoListingsLoading);
			
			const items = container.querySelectorAll('.flex.gap-2.p-2');
			expect(items).toHaveLength(5);
		});

		it('should render items in sequence', () => {
			const { container } = render(VideoListingsLoading);
			
			const items = container.querySelectorAll('.flex.gap-2.p-2');
			expect(items.length).toBe(5);
			
			// Verify all items are present
			items.forEach(item => {
				expect(item).toBeInTheDocument();
			});
		});
	});

	// =============================================================================
	// Item Structure Tests
	// =============================================================================

	describe('item structure', () => {
		it('should have flex layout for each item', () => {
			const { container } = render(VideoListingsLoading);
			
			const firstItem = container.querySelector('.flex.gap-2.p-2');
			expect(firstItem).toBeInTheDocument();
			expect(firstItem).toHaveClass('flex', 'gap-2', 'p-2');
		});

		it('should have gap between thumbnail and info', () => {
			const { container } = render(VideoListingsLoading);
			
			const items = container.querySelectorAll('.gap-2.p-2');
			expect(items.length).toBeGreaterThan(0);
		});

		it('should have padding on each item', () =>{
			const { container } = render(VideoListingsLoading);
			
			const items = container.querySelectorAll('.p-2');
			expect(items.length).toBeGreaterThanOrEqual(5);
		});
	});

	// =============================================================================
	// Thumbnail Skeleton Tests
	// =============================================================================

	describe('thumbnail skeletons', () => {
		it('should render thumbnail for each item', () => {
			const { container } = render(VideoListingsLoading);
			
			const thumbnails = container.querySelectorAll('.relative.shrink-0.w-40');
			expect(thumbnails).toHaveLength(5);
		});

		it('should have 16:9 aspect ratio', () => {
			const { container } = render(VideoListingsLoading);
			
			const aspectRatios = container.querySelectorAll('[style*="aspect-ratio: 16/9"]');
			expect(aspectRatios).toHaveLength(5);
		});

		it('should have fixed width of 40', () => {
			const { container } = render(VideoListingsLoading);
			
			const thumbnails = container.querySelectorAll('.w-40');
			expect(thumbnails).toHaveLength(5);
		});

		it('should prevent shrinking', () => {
			const { container } = render(VideoListingsLoading);
			
			const thumbnails = container.querySelectorAll('.shrink-0');
			expect(thumbnails).toHaveLength(5);
		});

		it('should have gray background', () => {
			const { container } = render(VideoListingsLoading);
			
			const thumbnailInners = container.querySelectorAll('[style*="aspect-ratio: 16/9"]');
			thumbnailInners.forEach(thumbnail => {
				expect(thumbnail).toHaveClass('bg-gray-700');
			});
		});

		it('should have pulse animation', () => {
			const { container } = render(VideoListingsLoading);
			
			const thumbnailInners = container.querySelectorAll('[style*="aspect-ratio: 16/9"]');
			thumbnailInners.forEach(thumbnail => {
				expect(thumbnail).toHaveClass('animate-pulse');
			});
		});

		it('should have rounded corners', () => {
			const { container } = render(VideoListingsLoading);
			
			const thumbnailInners = container.querySelectorAll('[style*="aspect-ratio: 16/9"]');
			thumbnailInners.forEach(thumbnail => {
				expect(thumbnail).toHaveClass('rounded-md');
			});
		});
	});

	// =============================================================================
	// Info Section Tests
	// =============================================================================

	describe('info section', () => {
		it('should render info container for each item', () => {
			const { container } = render(VideoListingsLoading);
			
			const infoContainers = container.querySelectorAll('.flex.flex-col.flex-1.gap-2.min-w-0');
			expect(infoContainers).toHaveLength(5);
		});

		it('should use flex column layout', () => {
			const { container } = render(VideoListingsLoading);
			
			const infoContainers = container.querySelectorAll('.flex-col.flex-1');
			expect(infoContainers).toHaveLength(5);
		});

		it('should have flex-1 to fill remaining space', () => {
			const { container } = render(VideoListingsLoading);
			
			const infoContainers = container.querySelectorAll('.flex-1.gap-2');
			expect(infoContainers).toHaveLength(5);
		});

		it('should have min-width-0 for text truncation', () => {
			const { container } = render(VideoListingsLoading);
			
			const infoContainers = container.querySelectorAll('.min-w-0');
			expect(infoContainers).toHaveLength(5);
		});

		it('should have gap between elements', () => {
			const { container } = render(VideoListingsLoading);
			
			const infoContainers = container.querySelectorAll('.flex-col.gap-2');
			expect(infoContainers).toHaveLength(5);
		});
	});

	// =============================================================================
	// Title Skeleton Tests
	// =============================================================================

	describe('title skeletons', () => {
		it('should render two title lines per item', () => {
			const { container } = render(VideoListingsLoading);
			
			const titleLines = container.querySelectorAll('.h-4.w-full.animate-pulse, .h-4.w-4\\/5.animate-pulse');
			expect(titleLines.length).toBe(10); // 2 lines × 5 items
		});

		it('should have first line full width', () => {
			const { container } = render(VideoListingsLoading);
			
			const items = container.querySelectorAll('.flex.gap-2.p-2');
			items.forEach(item => {
				const fullWidthLine = item.querySelector('.h-4.w-full');
				expect(fullWidthLine).toBeInTheDocument();
			});
		});

		it('should have second line 4/5 width', () => {
			const { container } = render(VideoListingsLoading);
			
			const items = container.querySelectorAll('.flex.gap-2.p-2');
			items.forEach(item => {
				const partialLine = item.querySelector('.h-4.w-4\\/5');
				expect(partialLine).toBeInTheDocument();
			});
		});

		it('should have gray background on title lines', () => {
			const { container } = render(VideoListingsLoading);
			
			const titleLines = container.querySelectorAll('.h-4.bg-gray-700');
			expect(titleLines.length).toBeGreaterThanOrEqual(10);
		});

		it('should have pulse animation on title lines', () => {
			const { container } = render(VideoListingsLoading);
			
			const items = container.querySelectorAll('.flex.gap-2.p-2');
			items.forEach(item => {
				const animatedTitles = item.querySelectorAll('.h-4.animate-pulse');
				expect(animatedTitles.length).toBeGreaterThanOrEqual(2);
			});
		});

		it('should have rounded corners on title lines', () => {
			const { container } = render(VideoListingsLoading);
			
			const titleLines = container.querySelectorAll('.h-4.rounded');
			expect(titleLines.length).toBeGreaterThanOrEqual(10);
		});
	});

	// =============================================================================
	// Channel Info Skeleton Tests
	// =============================================================================

	describe('channel info skeletons', () => {
		it('should render channel info for each item', () => {
			const { container } = render(VideoListingsLoading);
			
			const channelContainers = container.querySelectorAll('.flex.items-center.gap-2.mt-1');
			expect(channelContainers).toHaveLength(5);
		});

		it('should render channel avatar for each item', () => {
			const { container } = render(VideoListingsLoading);
			
			const avatars = container.querySelectorAll('.h-6.w-6.rounded-full');
			expect(avatars).toHaveLength(5);
		});

		it('should render channel name for each item', () => {
			const { container } = render(VideoListingsLoading);
			
			const channelNames = container.querySelectorAll('.h-3.w-24.animate-pulse');
			expect(channelNames).toHaveLength(5);
		});

		it('should have gap between avatar and name', () => {
			const { container } = render(VideoListingsLoading);
			
			const channelContainers = container.querySelectorAll('.flex.items-center.gap-2');
			expect(channelContainers.length).toBeGreaterThanOrEqual(5);
		});

		it('should have top margin on channel info', () => {
			const { container } = render(VideoListingsLoading);
			
			const channelContainers = container.querySelectorAll('.mt-1');
			expect(channelContainers.length).toBeGreaterThanOrEqual(5);
		});

		it('should align items center', () => {
			const { container } = render(VideoListingsLoading);
			
			const channelContainers = container.querySelectorAll('.items-center.gap-2.mt-1');
			expect(channelContainers).toHaveLength(5);
		});

		it('should have pulse animation on channel elements', () => {
			const { container } = render(VideoListingsLoading);
			
			const items = container.querySelectorAll('.flex.gap-2.p-2');
			items.forEach(item => {
				const channelAnimated = item.querySelectorAll('.flex.items-center.gap-2 .animate-pulse');
				expect(channelAnimated.length).toBe(2); // Avatar + name
			});
		});
	});

	// =============================================================================
	// Stats Skeleton Tests
	// =============================================================================

	describe('stats skeletons', () => {
		it('should render stats line for each item', () => {
			const { container } = render(VideoListingsLoading);
			
			// Stats are the h-3 w-20 elements that are not inside channel info
			const items = container.querySelectorAll('.flex.gap-2.p-2');
			items.forEach(item => {
				const stats = item.querySelector('.h-3.w-20');
				expect(stats).toBeInTheDocument();
			});
		});

		it('should have gray background on stats', () => {
			const { container } = render(VideoListingsLoading);
			
			const items = container.querySelectorAll('.flex.gap-2.p-2');
			items.forEach(item => {
				const stats = item.querySelector('.h-3.w-20.bg-gray-700');
				expect(stats).toBeInTheDocument();
			});
		});

		it('should have pulse animation on stats', () => {
			const { container } = render(VideoListingsLoading);
			
			const items = container.querySelectorAll('.flex.gap-2.p-2');
			items.forEach(item => {
				const stats = item.querySelector('.h-3.w-20.animate-pulse');
				expect(stats).toBeInTheDocument();
			});
		});

		it('should have rounded corners on stats', () => {
			const { container } = render(VideoListingsLoading);
			
			const items = container.querySelectorAll('.flex.gap-2.p-2');
			items.forEach(item => {
				const stats = item.querySelector('.h-3.w-20.rounded');
				expect(stats).toBeInTheDocument();
			});
		});
	});

	// =============================================================================
	// Animation Tests
	// =============================================================================

	describe('animations', () => {
		it('should have pulse animation on all skeleton elements', () => {
			const { container } = render(VideoListingsLoading);
			
			const animatedElements = container.querySelectorAll('.animate-pulse');
			// Per item: 1 thumbnail + 2 title + 2 channel + 1 stats = 6
			// 6 × 5 items = 30
			expect(animatedElements.length).toBe(30);
		});

		it('should use consistent gray color', () => {
			const { container } = render(VideoListingsLoading);
			
			const grayElements = container.querySelectorAll('.bg-gray-700');
			expect(grayElements.length).toBe(30);
		});

		it('should have rounded corners on appropriate elements', () => {
			const { container } = render(VideoListingsLoading);
			
			const roundedElements = container.querySelectorAll('.rounded, .rounded-md, .rounded-full');
			expect(roundedElements.length).toBeGreaterThan(0);
		});
	});

	// =============================================================================
	// Visual Hierarchy Tests
	// =============================================================================

	describe('visual hierarchy', () => {
		it('should have consistent height for title elements', () => {
			const { container } = render(VideoListingsLoading);
			
			const titleElements = container.querySelectorAll('.h-4.bg-gray-700.rounded');
			// Should include title lines but exclude stats
			expect(titleElements.length).toBeGreaterThanOrEqual(10);
		});

		it('should have smaller height for metadata elements', () => {
			const { container } = render(VideoListingsLoading);
			
			const metadataElements = container.querySelectorAll('.h-3');
			expect(metadataElements.length).toBeGreaterThanOrEqual(10);
		});

		it('should have medium size for channel avatars', () => {
			const { container } = render(VideoListingsLoading);
			
			const avatars = container.querySelectorAll('.h-6.w-6');
			expect(avatars).toHaveLength(5);
		});
	});

	// =============================================================================
	// Responsive Behavior Tests
	// =============================================================================

	describe('responsive behavior', () => {
		it('should have fixed thumbnail width', () => {
			const { container } = render(VideoListingsLoading);
			
			const thumbnails = container.querySelectorAll('.w-40.shrink-0');
			expect(thumbnails).toHaveLength(5);
		});

		it('should allow info section to grow', () => {
			const { container } = render(VideoListingsLoading);
			
			const infoSections = container.querySelectorAll('.flex-1');
			expect(infoSections).toHaveLength(5);
		});

		it('should prevent text overflow with min-w-0', () => {
			const { container } = render(VideoListingsLoading);
			
			const infoSections = container.querySelectorAll('.min-w-0');
			expect(infoSections).toHaveLength(5);
		});
	});

	// =============================================================================
	// Integration Tests
	// =============================================================================

	describe('integration', () => {
		it('should render complete skeleton structure', () => {
			const { container } = render(VideoListingsLoading);
			
			// Main container
			expect(container.querySelector('.flex.w-full.flex-col')).toBeInTheDocument();
			
			// 5 items
			const items = container.querySelectorAll('.flex.gap-2.p-2');
			expect(items).toHaveLength(5);
			
			// Verify each item has all parts
			items.forEach(item => {
				expect(item.querySelector('.w-40')).toBeInTheDocument(); // Thumbnail
				expect(item.querySelector('.flex-1')).toBeInTheDocument(); // Info
				expect(item.querySelector('.h-6.w-6.rounded-full')).toBeInTheDocument(); // Avatar
			});
		});

		it('should have consistent structure across all items', () => {
			const { container } = render(VideoListingsLoading);
			
			const items = container.querySelectorAll('.flex.gap-2.p-2');
			
			items.forEach(item => {
				// Thumbnail
				expect(item.querySelector('[style*="aspect-ratio: 16/9"]')).toBeInTheDocument();
				
				// Title lines
				const titleLines = item.querySelectorAll('.h-4.rounded');
				expect(titleLines.length).toBeGreaterThanOrEqual(2);
				
				// Channel info
				expect(item.querySelector('.h-6.w-6.rounded-full')).toBeInTheDocument();
				expect(item.querySelector('.h-3.w-24')).toBeInTheDocument();
				
				// Stats
				expect(item.querySelector('.h-3.w-20')).toBeInTheDocument();
			});
		});

		it('should be self-contained without props', () => {
			const { container } = render(VideoListingsLoading);
			
			expect(container.firstChild).toBeInTheDocument();
		});

		it('should maintain proper spacing throughout', () => {
			const { container } = render(VideoListingsLoading);
			
			// Container spacing
			expect(container.querySelector('.gap-4')).toBeInTheDocument();
			expect(container.querySelector('.px-6')).toBeInTheDocument();
			
			// Item spacing
			const items = container.querySelectorAll('.gap-2.p-2');
			expect(items).toHaveLength(5);
		});
	});

	// =============================================================================
	// Count Verification Tests
	// =============================================================================

	describe('item count', () => {
		it('should render exactly 5 skeleton items', () => {
			const { container } = render(VideoListingsLoading);
			
			const items = container.querySelectorAll('.flex.gap-2.p-2');
			expect(items).toHaveLength(5);
		});

		it('should not render more or fewer than 5 items', () => {
			const { container } = render(VideoListingsLoading);
			
			const items = container.querySelectorAll('.flex.gap-2.p-2');
			expect(items.length).not.toBeLessThan(5);
			expect(items.length).not.toBeGreaterThan(5);
		});
	});
});