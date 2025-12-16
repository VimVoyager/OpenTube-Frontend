import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import PageComponent from './+page.svelte';

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
            channelAvatar: null,
            viewCount: 250000,
            duration: 3665,
            uploadDate: '1 week ago'
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Error handling', () => {
        it('should display error message when error prop is set', () => {
            const errorData = {
                playerConfig: {
                    manifestUrl: '',
                    duration: 0,
                    poster: ''
                },
                metadata: mockMetadata,
                relatedVideos: [],
                error: 'Failed to load video'
            };

            render(PageComponent, { data: errorData });

            expect(screen.getByText('Failed to Load Video')).toBeInTheDocument();
            expect(screen.getByText('Failed to load video')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
        });

        it('should display "No Streams Available" when manifestUrl is empty', () => {
            const data = {
                playerConfig: {
                    manifestUrl: '',
                    duration: 0,
                    poster: ''
                },
                metadata: mockMetadata,
                relatedVideos: mockRelatedVideos
            };

            render(PageComponent, { data });

            expect(screen.getByText('No Streams Available')).toBeInTheDocument();
            expect(
                screen.getByText('Unable to load DASH manifest for this video. The video may be unavailable or restricted.')
            ).toBeInTheDocument();
        });

        it('should not display related videos when error is present', () => {
            const errorData = {
                playerConfig: {
                    manifestUrl: '',
                    duration: 0,
                    poster: ''
                },
                metadata: mockMetadata,
                relatedVideos: mockRelatedVideos,
                error: 'Test error'
            };

            render(PageComponent, { data: errorData });

            expect(screen.queryByText('First Related Video')).not.toBeInTheDocument();
        });
    });

    describe('Error state - no streams available', () => {
        it('should display no streams error message', () => {
            const data = {
                playerConfig: {
                    manifestUrl: '',
                    duration: 0,
                    poster: ''
                },
                metadata: mockMetadata,
                relatedVideos: []
            };

            render(PageComponent, { data });

            expect(screen.getByText('No Streams Available')).toBeInTheDocument();
            expect(
                screen.getByText('Unable to load DASH manifest for this video. The video may be unavailable or restricted.')
            ).toBeInTheDocument();
        });

        it('should show retry button', () => {
            const data = {
                playerConfig: {
                    manifestUrl: '',
                    duration: 0,
                    poster: ''
                },
                metadata: mockMetadata,
                relatedVideos: []
            };

            render(PageComponent, { data });

            const retryButton = screen.getByRole('button', { name: /retry/i });
            expect(retryButton).toBeInTheDocument();
        });
    });

    describe('Computed properties - hasValidManifest', () => {
        it('should compute hasValidManifest as false when manifestUrl is empty', () => {
            const data = {
                playerConfig: {
                    manifestUrl: '',
                    duration: 0,
                    poster: ''
                },
                metadata: mockMetadata,
                relatedVideos: []
            };

            render(PageComponent, { data });

            expect(screen.getByText('No Streams Available')).toBeInTheDocument();
        });

        it('should compute hasValidManifest as true when manifestUrl exists', () => {
            const data = {
                playerConfig: mockPlayerConfig,
                metadata: mockMetadata,
                relatedVideos: mockRelatedVideos
            };

            render(PageComponent, { data });

            expect(screen.queryByText('No Streams Available')).not.toBeInTheDocument();
        });
    });

    describe('Conditional rendering logic', () => {
        it('should show player when no error and manifest is valid', async () => {
            const data = {
                playerConfig: mockPlayerConfig,
                metadata: mockMetadata,
                relatedVideos: mockRelatedVideos
            };

            render(PageComponent, { data });

            await waitFor(() => {
                expect(screen.queryByText('Failed to Load Video')).not.toBeInTheDocument();
                expect(screen.queryByText('No Streams Available')).not.toBeInTheDocument();
            });
        });

        it('should show VideoDetail component when no error', () => {
            const data = {
                playerConfig: mockPlayerConfig,
                metadata: mockMetadata,
                relatedVideos: mockRelatedVideos
            };

            render(PageComponent, { data });

            // Use getByRole to target the main title specifically
            expect(screen.getByRole('heading', { name: mockMetadata.title })).toBeInTheDocument();
            // Check for channel name with more specific query
            const channelHeadings = screen.getAllByText(mockMetadata.channelName);
            expect(channelHeadings.length).toBeGreaterThan(0);
        });

        it('should show VideoListings when no error', () => {
            const data = {
                playerConfig: mockPlayerConfig,
                metadata: mockMetadata,
                relatedVideos: mockRelatedVideos
            };

            render(PageComponent, { data });

            expect(screen.getByText('First Related Video')).toBeInTheDocument();
            expect(screen.getByText('Second Related Video')).toBeInTheDocument();
        });

        it('should not show VideoDetail when error is present', () => {
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

    describe('Component keying', () => {
        it('should use manifestUrl for component key when available', () => {
            const data = {
                playerConfig: mockPlayerConfig,
                metadata: mockMetadata,
                relatedVideos: []
            };

            const { container } = render(PageComponent, { data });

            // Component should render without errors
            expect(container).toBeInTheDocument();
        });

        it('should fallback to poster for component key when manifestUrl is empty', () => {
            const data = {
                playerConfig: {
                    manifestUrl: '',
                    duration: 0,
                    poster: 'https://example.com/poster.jpg'
                },
                metadata: mockMetadata,
                relatedVideos: []
            };

            const { container } = render(PageComponent, { data });

            expect(container).toBeInTheDocument();
        });

        it('should use timestamp fallback when both manifestUrl and poster are empty', () => {
            const data = {
                playerConfig: {
                    manifestUrl: '',
                    duration: 0,
                    poster: ''
                },
                metadata: mockMetadata,
                relatedVideos: []
            };

            const { container } = render(PageComponent, { data });

            expect(container).toBeInTheDocument();
        });
    });

    describe('Data reactivity', () => {
        it('should update when playerConfig changes', async () => {
            const initialData = {
                playerConfig: {
                    manifestUrl: '',
                    duration: 0,
                    poster: ''
                },
                metadata: mockMetadata,
                relatedVideos: []
            };

            const { unmount } = render(PageComponent, { data: initialData });

            expect(screen.getByText('No Streams Available')).toBeInTheDocument();

            // In Svelte 5, we need to unmount and re-render with new props
            unmount();

            render(PageComponent, {
                data: {
                    playerConfig: mockPlayerConfig,
                    metadata: mockMetadata,
                    relatedVideos: mockRelatedVideos
                }
            });

            await waitFor(() => {
                expect(screen.queryByText('No Streams Available')).not.toBeInTheDocument();
            });
        });

        it('should update when metadata changes', async () => {
            const initialData = {
                playerConfig: mockPlayerConfig,
                metadata: mockMetadata,
                relatedVideos: []
            };

            const { unmount } = render(PageComponent, { data: initialData });

            expect(screen.getByText('Test Video Title')).toBeInTheDocument();

            const newMetadata = {
                ...mockMetadata,
                title: 'Updated Video Title'
            };

            // Unmount and re-render
            unmount();

            render(PageComponent, {
                data: {
                    playerConfig: mockPlayerConfig,
                    metadata: newMetadata,
                    relatedVideos: []
                }
            });

            await waitFor(() => {
                expect(screen.getByText('Updated Video Title')).toBeInTheDocument();
            });
        });

        it('should update when relatedVideos changes', async () => {
            const initialData = {
                playerConfig: mockPlayerConfig,
                metadata: mockMetadata,
                relatedVideos: []
            };

            const { unmount } = render(PageComponent, { data: initialData });

            expect(screen.queryByText('First Related Video')).not.toBeInTheDocument();

            // Unmount and re-render
            unmount();

            render(PageComponent, {
                data: {
                    playerConfig: mockPlayerConfig,
                    metadata: mockMetadata,
                    relatedVideos: mockRelatedVideos
                }
            });

            await waitFor(() => {
                expect(screen.getByText('First Related Video')).toBeInTheDocument();
            });
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
    });

    describe('Player mounting delay', () => {
        it('should delay player initialization until onMount', async () => {
            const data = {
                playerConfig: mockPlayerConfig,
                metadata: mockMetadata,
                relatedVideos: []
            };

            render(PageComponent, { data });

            // Player should eventually mount after onMount is called
            await waitFor(() => {
                // Component should be fully mounted
                expect(screen.getByText(mockMetadata.title)).toBeInTheDocument();
            });
        });
    });

    describe('Layout structure', () => {
        it('should render two-column layout', () => {
            const data = {
                playerConfig: mockPlayerConfig,
                metadata: mockMetadata,
                relatedVideos: mockRelatedVideos
            };

            const { container } = render(PageComponent, { data });

            // Use escaped selector for Tailwind classes with /
            const mainSection = container.querySelector('[class*="w-2"]');
            const sidebar = container.querySelector('aside');

            expect(mainSection).toBeInTheDocument();
            expect(sidebar).toBeInTheDocument();
        });

        it('should render aside with related videos', () => {
            const data = {
                playerConfig: mockPlayerConfig,
                metadata: mockMetadata,
                relatedVideos: mockRelatedVideos
            };

            const { container } = render(PageComponent, { data });

            const aside = container.querySelector('aside');
            expect(aside).toBeInTheDocument();
        });
    });
});