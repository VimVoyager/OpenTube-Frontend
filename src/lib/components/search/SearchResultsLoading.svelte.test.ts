/**
 * Test Suite: SearchResultsLoading.svelte
 * 
 * Tests for search results page loading skeleton with configurable count
 */

import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import SearchResultsLoading from './SearchResultsLoading.svelte';

describe('SearchResultsLoading', () => {
	// =============================================================================
	// Default Rendering Tests
	// =============================================================================

	describe('default rendering', () => {
		it('should render without props', () => {
			const { container } = render(SearchResultsLoading);
			
			expect(container.firstChild).toBeInTheDocument();
		});

		it('should render with default count of 10', () => {
			const { container } = render(SearchResultsLoading);
			
			const statusElement = container.querySelector('[role="status"][aria-label="Loading search results"]');
			const items = statusElement?.querySelectorAll('[role="status"][aria-label="Loading search result"]');
			expect(items).toHaveLength(10);
		});

		it('should render main container', () => {
			const { container } = render(SearchResultsLoading);
			
			const mainContainer = container.querySelector('.container.mx-auto.w-3\\/4');
			expect(mainContainer).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Container Structure Tests
	// =============================================================================

	describe('container structure', () => {
		it('should have centered container', () => {
			const { container } = render(SearchResultsLoading);
			
			const mainContainer = container.querySelector('.mx-auto');
			expect(mainContainer).toBeInTheDocument();
		});

		it('should have 3/4 width container', () => {
			const { container } = render(SearchResultsLoading);
			
			const mainContainer = container.querySelector('.w-3\\/4');
			expect(mainContainer).toBeInTheDocument();
		});

		it('should have horizontal padding', () => {
			const { container } = render(SearchResultsLoading);
			
			const mainContainer = container.querySelector('.px-4');
			expect(mainContainer).toBeInTheDocument();
		});

		it('should have vertical padding', () => {
			const { container } = render(SearchResultsLoading);
			
			const mainContainer = container.querySelector('.py-8');
			expect(mainContainer).toBeInTheDocument();
		});

		it('should use container class', () => {
			const { container } = render(SearchResultsLoading);
			
			const mainContainer = container.querySelector('.container');
			expect(mainContainer).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Header Skeleton Tests
	// =============================================================================

	describe('header skeleton', () => {
		it('should render header skeleton', () => {
			const { container } = render(SearchResultsLoading);
			
			const header = container.querySelector('.mb-6 .h-8.w-64');
			expect(header).toBeInTheDocument();
		});

		it('should have gray background', () => {
			const { container } = render(SearchResultsLoading);
			
			const header = container.querySelector('.h-8.bg-gray-700');
			expect(header).toBeInTheDocument();
		});

		it('should have pulse animation', () => {
			const { container } = render(SearchResultsLoading);
			
			const header = container.querySelector('.h-8.animate-pulse');
			expect(header).toBeInTheDocument();
		});

		it('should have rounded corners', () => {
			const { container } = render(SearchResultsLoading);
			
			const header = container.querySelector('.h-8.rounded');
			expect(header).toBeInTheDocument();
		});

		it('should have bottom margin', () => {
			const { container } = render(SearchResultsLoading);
			
			const headerContainer = container.querySelector('.mb-6');
			expect(headerContainer).toBeInTheDocument();
		});

		it('should have fixed width', () => {
			const { container } = render(SearchResultsLoading);
			
			const header = container.querySelector('.w-64');
			expect(header).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Results Container Tests
	// =============================================================================

	describe('results container', () => {
		it('should render results container', () => {
			const { container } = render(SearchResultsLoading);
			
			const resultsContainer = container.querySelector('.space-y-4[role="status"]');
			expect(resultsContainer).toBeInTheDocument();
		});

		it('should have role="status" for accessibility', () => {
			const { container } = render(SearchResultsLoading);
			
			const resultsContainer = container.querySelector('[role="status"][aria-label="Loading search results"]');
			expect(resultsContainer).toBeInTheDocument();
		});

		it('should have aria-label for screen readers', () => {
			const { container } = render(SearchResultsLoading);
			
			const resultsContainer = container.querySelector('[role="status"]');
			expect(resultsContainer).toHaveAttribute('aria-label', 'Loading search results');
		});

		it('should have vertical spacing between items', () => {
			const { container } = render(SearchResultsLoading);
			
			const resultsContainer = container.querySelector('.space-y-4');
			expect(resultsContainer).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Count Footer Tests
	// =============================================================================

	describe('count footer', () => {
		it('should render count skeleton', () => {
			const { container } = render(SearchResultsLoading);
			
			const countSkeleton = container.querySelector('.mt-8 .h-4.w-32');
			expect(countSkeleton).toBeInTheDocument();
		});

		it('should have top margin', () => {
			const { container } = render(SearchResultsLoading);
			
			const footerContainer = container.querySelector('.mt-8');
			expect(footerContainer).toBeInTheDocument();
		});

		it('should be centered', () => {
			const { container } = render(SearchResultsLoading);
			
			const footerContainer = container.querySelector('.flex.justify-center');
			expect(footerContainer).toBeInTheDocument();
		});

		it('should have gray background', () => {
			const { container } = render(SearchResultsLoading);
			
			const countSkeleton = container.querySelector('.mt-8 .bg-gray-700');
			expect(countSkeleton).toBeInTheDocument();
		});

		it('should have pulse animation', () => {
			const { container } = render(SearchResultsLoading);
			
			const countSkeleton = container.querySelector('.mt-8 .animate-pulse');
			expect(countSkeleton).toBeInTheDocument();
		});

		it('should have rounded corners', () => {
			const { container } = render(SearchResultsLoading);
			
			const countSkeleton = container.querySelector('.mt-8 .rounded');
			expect(countSkeleton).toBeInTheDocument();
		});
	});

	// =============================================================================
	// VideoResultLoading Component Tests
	// =============================================================================

	describe('VideoResultLoading components', () => {
		it('should render VideoResultLoading components', () => {
			const { container } = render(SearchResultsLoading);
			
			// VideoResultLoading has role="status" and aria-label="Loading search result"
			const items = container.querySelectorAll('[role="status"][aria-label="Loading search result"]');
			expect(items).toHaveLength(10);
		});

		it('should render VideoResultLoading in results container', () => {
			const { container } = render(SearchResultsLoading);
			
			const resultsContainer = container.querySelector('.space-y-4[role="status"]');
			const items = resultsContainer?.querySelectorAll('[role="status"][aria-label="Loading search result"]');
			expect(items).toHaveLength(10);
		});
	});

	// =============================================================================
	// Custom Count Prop Tests
	// =============================================================================

	describe('custom count prop', () => {
		it('should render 5 items when count is 5', () => {
			const { container } = render(SearchResultsLoading, { props: { count: 5 } });
			
			const items = container.querySelectorAll('[role="status"][aria-label="Loading search result"]');
			expect(items).toHaveLength(5);
		});

		it('should render 15 items when count is 15', () => {
			const { container } = render(SearchResultsLoading, { props: { count: 15 } });
			
			const items = container.querySelectorAll('[role="status"][aria-label="Loading search result"]');
			expect(items).toHaveLength(15);
		});

		it('should render 1 item when count is 1', () => {
			const { container } = render(SearchResultsLoading, { props: { count: 1 } });
			
			const items = container.querySelectorAll('[role="status"][aria-label="Loading search result"]');
			expect(items).toHaveLength(1);
		});

		it('should render 20 items when count is 20', () => {
			const { container } = render(SearchResultsLoading, { props: { count: 20 } });
			
			const items = container.querySelectorAll('[role="status"][aria-label="Loading search result"]');
			expect(items).toHaveLength(20);
		});

		it('should render 3 items when count is 3', () => {
			const { container } = render(SearchResultsLoading, { props: { count: 3 } });
			
			const items = container.querySelectorAll('[role="status"][aria-label="Loading search result"]');
			expect(items).toHaveLength(3);
		});
	});

	// =============================================================================
	// Edge Cases Tests
	// =============================================================================

	describe('edge cases', () => {
		it('should handle count of 0', () => {
			const { container } = render(SearchResultsLoading, { props: { count: 0 } });
			
			const items = container.querySelectorAll('[role="status"][aria-label="Loading search result"]');
			expect(items).toHaveLength(0);
		});

		it('should still render header and footer with count of 0', () => {
			const { container } = render(SearchResultsLoading, { props: { count: 0 } });
			
			expect(container.querySelector('.mb-6 .h-8')).toBeInTheDocument();
			expect(container.querySelector('.mt-8 .h-4')).toBeInTheDocument();
		});

		it('should handle very large count', () => {
			const { container } = render(SearchResultsLoading, { props: { count: 100 } });
			
			const items = container.querySelectorAll('[role="status"][aria-label="Loading search result"]');
			expect(items).toHaveLength(100);
		});

		it('should maintain structure with custom count', () => {
			const { container } = render(SearchResultsLoading, { props: { count: 7 } });
			
			// Header
			expect(container.querySelector('.mb-6 .h-8')).toBeInTheDocument();
			
			// Items
			const items = container.querySelectorAll('[role="status"][aria-label="Loading search result"]');
			expect(items).toHaveLength(7);
			
			// Footer
			expect(container.querySelector('.mt-8 .h-4')).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Layout Tests
	// =============================================================================

	describe('layout', () => {
		it('should maintain proper section order', () => {
			const { container } = render(SearchResultsLoading);
			
			const mainContainer = container.querySelector('.container');
			const sections = Array.from(mainContainer?.children || []);
			
			// First section: header
			expect(sections[0]).toHaveClass('mb-6');
			
			// Second section: results
			expect(sections[1]).toHaveAttribute('role', 'status');
			expect(sections[1]).toHaveAttribute('aria-label', 'Loading search results');
			
			// Third section: footer
			expect(sections[2]).toHaveClass('mt-8');
		});

		it('should have consistent spacing throughout', () => {
			const { container } = render(SearchResultsLoading);
			
			// Container padding
			expect(container.querySelector('.px-4.py-8')).toBeInTheDocument();
			
			// Header margin
			expect(container.querySelector('.mb-6')).toBeInTheDocument();
			
			// Results spacing
			expect(container.querySelector('.space-y-4')).toBeInTheDocument();
			
			// Footer margin
			expect(container.querySelector('.mt-8')).toBeInTheDocument();
		});
	});

	// =============================================================================
	// Accessibility Tests
	// =============================================================================

	describe('accessibility', () => {
		it('should have proper ARIA labels', () => {
			const { container } = render(SearchResultsLoading);
			
			const mainStatus = container.querySelector('[aria-label="Loading search results"]');
			expect(mainStatus).toBeInTheDocument();
			
			const itemStatuses = container.querySelectorAll('[aria-label="Loading search result"]');
			expect(itemStatuses.length).toBeGreaterThan(0);
		});

		it('should have role="status" for screen readers', () => {
			const { container } = render(SearchResultsLoading);
			
			const statusElements = container.querySelectorAll('[role="status"]');
			// Main container + all items
			expect(statusElements.length).toBeGreaterThanOrEqual(11);
		});

		it('should be keyboard navigable', () => {
			const { container } = render(SearchResultsLoading);
			
			// Component should render without interactive elements during loading
			const buttons = container.querySelectorAll('button');
			const links = container.querySelectorAll('a');
			expect(buttons).toHaveLength(0);
			expect(links).toHaveLength(0);
		});
	});

	// =============================================================================
	// Animation Tests
	// =============================================================================

	describe('animations', () => {
		it('should have pulse animations on skeletons', () => {
			const { container } = render(SearchResultsLoading);
			
			const animatedElements = container.querySelectorAll('.animate-pulse');
			expect(animatedElements.length).toBeGreaterThan(0);
		});

		it('should use consistent gray background', () => {
			const { container } = render(SearchResultsLoading);
			
			const grayElements = container.querySelectorAll('.bg-gray-700');
			expect(grayElements.length).toBeGreaterThan(0);
		});
	});

	// =============================================================================
	// Integration Tests
	// =============================================================================

	describe('integration', () => {
		it('should render complete loading page structure', () => {
			const { container } = render(SearchResultsLoading);
			
			// Container
			expect(container.querySelector('.container.mx-auto')).toBeInTheDocument();
			
			// Header
			expect(container.querySelector('.mb-6 .h-8')).toBeInTheDocument();
			
			// Results
			const resultsContainer = container.querySelector('[role="status"][aria-label="Loading search results"]');
			expect(resultsContainer).toBeInTheDocument();
			
			// Items
			const items = container.querySelectorAll('[role="status"][aria-label="Loading search result"]');
			expect(items.length).toBeGreaterThan(0);
			
			// Footer
			expect(container.querySelector('.mt-8 .h-4')).toBeInTheDocument();
		});

		it('should integrate VideoResultLoading correctly', () => {
			const { container } = render(SearchResultsLoading, { props: { count: 3 } });
			
			const items = container.querySelectorAll('[role="status"][aria-label="Loading search result"]');
			
			// Each item should have VideoResultLoading structure
			items.forEach(item => {
				// Grid layout from VideoResultLoading
				expect(item).toHaveClass('grid', 'grid-cols-3');
			});
		});

		it('should work with different count values', () => {
			const counts = [0, 1, 5, 10, 15, 20];
			
			counts.forEach(count => {
				const { container } = render(SearchResultsLoading, { props: { count } });
				const items = container.querySelectorAll('[role="status"][aria-label="Loading search result"]');
				expect(items).toHaveLength(count);
			});
		});

		it('should maintain visual consistency across all skeletons', () => {
			const { container } = render(SearchResultsLoading);
			
			// All skeletons should have consistent styling
			const allSkeletons = container.querySelectorAll('.bg-gray-700.animate-pulse.rounded');
			expect(allSkeletons.length).toBeGreaterThan(0);
		});
	});

	// =============================================================================
	// Props Tests
	// =============================================================================

	describe('props', () => {
		it('should accept count prop', () => {
			const { container } = render(SearchResultsLoading, { props: { count: 8 } });
			
			const items = container.querySelectorAll('[role="status"][aria-label="Loading search result"]');
			expect(items).toHaveLength(8);
		});

		it('should use default count when not provided', () => {
			const { container } = render(SearchResultsLoading);
			
			const items = container.querySelectorAll('[role="status"][aria-label="Loading search result"]');
			expect(items).toHaveLength(10);
		});

		it('should override default count when provided', () => {
			const { container } = render(SearchResultsLoading, { props: { count: 12 } });
			
			const items = container.querySelectorAll('[role="status"][aria-label="Loading search result"]');
			expect(items).toHaveLength(12);
		});
	});

	// =============================================================================
	// Responsive Design Tests
	// =============================================================================

	describe('responsive design', () => {
		it('should have responsive container width', () => {
			const { container } = render(SearchResultsLoading);
			
			const mainContainer = container.querySelector('.w-3\\/4');
			expect(mainContainer).toBeInTheDocument();
		});

		it('should have responsive padding', () => {
			const { container } = render(SearchResultsLoading);
			
			const mainContainer = container.querySelector('.px-4.py-8');
			expect(mainContainer).toBeInTheDocument();
		});

		it('should center content', () => {
			const { container } = render(SearchResultsLoading);
			
			const mainContainer = container.querySelector('.mx-auto');
			expect(mainContainer).toBeInTheDocument();
		});
	});
});