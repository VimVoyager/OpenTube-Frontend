/**
 * Test Suite: mediaUtils.ts
 * 
 * Tests for media thumbnail and avatar selection utilities
 */

import { describe, it, expect } from 'vitest';
import {
    selectBestThumbnail,
    selectBestUploaderAvatar,
    selectBestAvatar
} from './mediaUtils';
import type { Thumbnail, Avatar } from '$lib/types';

// Helper functions to create test data with all required properties
const createThumbnail = (url: string, height: number, width: number): Thumbnail => ({
    url,
    height,
    width,
    estimatedResolutionLevel: 'MEDIUM' // Default value for tests
});

const createAvatar = (url: string, height: number, width: number): Avatar => ({
    url,
    height,
    width,
    estimatedResolutionLevel: 'MEDIUM' // Default value for tests
});

// =============================================================================
// selectBestThumbnail() Tests
// =============================================================================

describe('selectBestThumbnail', () => {
    describe('successful selection', () => {
        it('should prefer medium quality thumbnail at index 1', () => {
            const thumbnails: Thumbnail[] = [
                createThumbnail('https://example.com/thumb-low.jpg', 90, 120),
                createThumbnail('https://example.com/thumb-medium.jpg', 180, 320),
                createThumbnail('https://example.com/thumb-high.jpg', 360, 640)
            ];

            const result = selectBestThumbnail(thumbnails, 'fallback.jpg');
            expect(result).toBe('https://example.com/thumb-medium.jpg');
        });

        it('should fall back to last thumbnail if index 1 is missing', () => {
            const thumbnails: Thumbnail[] = [
                createThumbnail('https://example.com/thumb-only.jpg', 360, 640)
            ];

            const result = selectBestThumbnail(thumbnails, 'fallback.jpg');
            expect(result).toBe('https://example.com/thumb-only.jpg');
        });

        it('should use first thumbnail when index 1 and last have empty URLs', () => {
            const thumbnails: Thumbnail[] = [
                createThumbnail('https://example.com/thumb-first.jpg', 90, 120)
            ];

            const result = selectBestThumbnail(thumbnails, 'fallback.jpg');
            expect(result).toBe('https://example.com/thumb-first.jpg');
        });

        it('should handle exactly 2 thumbnails correctly', () => {
            const thumbnails: Thumbnail[] = [
                createThumbnail('https://example.com/thumb-0.jpg', 90, 120),
                createThumbnail('https://example.com/thumb-1.jpg', 180, 320)
            ];

            const result = selectBestThumbnail(thumbnails, 'fallback.jpg');
            expect(result).toBe('https://example.com/thumb-1.jpg');
        });

        it('should handle many thumbnails correctly', () => {
            const thumbnails: Thumbnail[] = [
                createThumbnail('https://example.com/thumb-0.jpg', 90, 120),
                createThumbnail('https://example.com/thumb-1.jpg', 180, 320),
                createThumbnail('https://example.com/thumb-2.jpg', 360, 640),
                createThumbnail('https://example.com/thumb-3.jpg', 480, 854),
                createThumbnail('https://example.com/thumb-4.jpg', 720, 1280)
            ];

            // Should prefer index 1
            const result = selectBestThumbnail(thumbnails, 'fallback.jpg');
            expect(result).toBe('https://example.com/thumb-1.jpg');
        });
    });

    describe('fallback behavior', () => {
        it('should return fallback when thumbnails array is empty', () => {
            const result = selectBestThumbnail([], 'https://example.com/fallback.jpg');
            expect(result).toBe('https://example.com/fallback.jpg');
        });

        it('should return fallback when thumbnails is null', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = selectBestThumbnail(null as any, 'https://example.com/fallback.jpg');
            expect(result).toBe('https://example.com/fallback.jpg');
        });

        it('should return fallback when thumbnails is undefined', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = selectBestThumbnail(undefined as any, 'https://example.com/fallback.jpg');
            expect(result).toBe('https://example.com/fallback.jpg');
        });

        it('should handle empty string fallback', () => {
            const result = selectBestThumbnail([], '');
            expect(result).toBe('');
        });

        it('should handle different fallback URLs', () => {
            expect(selectBestThumbnail([], 'default.jpg')).toBe('default.jpg');
            expect(selectBestThumbnail([], 'https://cdn.example.com/no-thumb.png')).toBe(
                'https://cdn.example.com/no-thumb.png'
            );
            expect(selectBestThumbnail([], '/static/placeholder.jpg')).toBe('/static/placeholder.jpg');
        });
    });

    describe('edge cases', () => {
        it('should handle thumbnail with empty URL at preferred index', () => {
            const thumbnails: Thumbnail[] = [
                createThumbnail('https://example.com/thumb-0.jpg', 90, 120),
                createThumbnail('', 180, 320), // Empty URL at index 1
                createThumbnail('https://example.com/thumb-2.jpg', 360, 640)
            ];

            const result = selectBestThumbnail(thumbnails, 'fallback.jpg');
            // thumbnails[1]?.url returns '' which is falsy, so falls back to thumbnails[2] (last)
            expect(result).toBe('https://example.com/thumb-2.jpg');
        });

        it('should handle thumbnail with null URL', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const thumbnails: any[] = [
                createThumbnail('https://example.com/thumb-0.jpg', 90, 120),
                createThumbnail(null, 180, 320),
                createThumbnail('https://example.com/thumb-2.jpg', 360, 640)
            ];

            const result = selectBestThumbnail(thumbnails, 'fallback.jpg');
            // thumbnails[1]?.url returns null which is falsy, falls back to last
            expect(result).toBe('https://example.com/thumb-2.jpg');
        });

        it('should handle all thumbnails having empty URLs', () => {
            const thumbnails: Thumbnail[] = [
                createThumbnail('', 90, 120),
                createThumbnail('', 180, 320)
            ];

            const result = selectBestThumbnail(thumbnails, 'fallback.jpg');
            // All URLs are falsy, uses fallback
            expect(result).toBe('fallback.jpg');
        });

        it('should handle thumbnails with special characters in URLs', () => {
            const thumbnails: Thumbnail[] = [
                createThumbnail('https://example.com/thumb?v=1&quality=low', 90, 120),
                createThumbnail('https://example.com/thumb?v=1&quality=medium', 180, 320),
                createThumbnail('https://example.com/thumb?v=1&quality=high', 360, 640)
            ];

            const result = selectBestThumbnail(thumbnails, 'fallback.jpg');
            expect(result).toBe('https://example.com/thumb?v=1&quality=medium');
        });

        it('should handle very long URL strings', () => {
            const longUrl = 'https://example.com/' + 'x'.repeat(1000) + '.jpg';
            const thumbnails: Thumbnail[] = [
                createThumbnail('https://example.com/short.jpg', 90, 120),
                createThumbnail(longUrl, 180, 320)
            ];

            const result = selectBestThumbnail(thumbnails, 'fallback.jpg');
            expect(result).toBe(longUrl);
        });

        it('should prefer index 1 even if last has valid URL', () => {
            const thumbnails: Thumbnail[] = [
                createThumbnail('https://example.com/thumb-0.jpg', 90, 120),
                createThumbnail('https://example.com/thumb-1.jpg', 180, 320),
                createThumbnail('', 360, 640) // Empty at last
            ];

            const result = selectBestThumbnail(thumbnails, 'fallback.jpg');
            // Index 1 has valid URL, so that's selected
            expect(result).toBe('https://example.com/thumb-1.jpg');
        });

        it('should use first when both index 1 and last are empty', () => {
            const thumbnails: Thumbnail[] = [
                createThumbnail('https://example.com/thumb-0.jpg', 90, 120),
                createThumbnail('', 180, 320),
                createThumbnail('', 360, 640)
            ];

            const result = selectBestThumbnail(thumbnails, 'fallback.jpg');
            // Falls back through: index 1 (empty) -> last (empty) -> first (valid)
            expect(result).toBe('https://example.com/thumb-0.jpg');
        });
    });

    describe('real-world scenarios', () => {
        it('should handle YouTube-style thumbnail array', () => {
            const thumbnails: Thumbnail[] = [
                createThumbnail('https://i.ytimg.com/vi/abc123/default.jpg', 90, 120),
                createThumbnail('https://i.ytimg.com/vi/abc123/mqdefault.jpg', 180, 320),
                createThumbnail('https://i.ytimg.com/vi/abc123/hqdefault.jpg', 360, 480),
                createThumbnail('https://i.ytimg.com/vi/abc123/sddefault.jpg', 480, 640),
                createThumbnail('https://i.ytimg.com/vi/abc123/maxresdefault.jpg', 720, 1280)
            ];

            const result = selectBestThumbnail(thumbnails, '');
            expect(result).toBe('https://i.ytimg.com/vi/abc123/mqdefault.jpg');
        });

        it('should handle missing medium quality thumbnail gracefully', () => {
            // Only low and high quality available
            const thumbnails: Thumbnail[] = [
                createThumbnail('https://i.ytimg.com/vi/abc123/default.jpg', 90, 120),
                createThumbnail('https://i.ytimg.com/vi/abc123/maxresdefault.jpg', 720, 1280)
            ];

            const result = selectBestThumbnail(thumbnails, 'fallback.jpg');
            // Should use last (high quality)
            expect(result).toBe('https://i.ytimg.com/vi/abc123/maxresdefault.jpg');
        });

        it('should handle single thumbnail from low-quality source', () => {
            const thumbnails: Thumbnail[] = [
                createThumbnail('https://example.com/video-thumb.jpg', 120, 160)
            ];

            const result = selectBestThumbnail(thumbnails, 'no-image.png');
            expect(result).toBe('https://example.com/video-thumb.jpg');
        });
    });
});

// =============================================================================
// selectBestUploaderAvatar() Tests
// =============================================================================

describe('selectBestUploaderAvatar', () => {
    describe('successful selection', () => {
        it('should prefer last avatar (highest quality)', () => {
            const avatars: Avatar[] = [
                createAvatar('https://example.com/avatar-low.jpg', 48, 48),
                createAvatar('https://example.com/avatar-medium.jpg', 88, 88),
                createAvatar('https://example.com/avatar-high.jpg', 176, 176)
            ];

            const result = selectBestUploaderAvatar(avatars, 'fallback.jpg');
            expect(result).toBe('https://example.com/avatar-high.jpg');
        });

        it('should fall back to first avatar if only one available', () => {
            const avatars: Avatar[] = [
                createAvatar('https://example.com/avatar-only.jpg', 88, 88)
            ];

            const result = selectBestUploaderAvatar(avatars, 'fallback.jpg');
            expect(result).toBe('https://example.com/avatar-only.jpg');
        });

        it('should handle exactly 2 avatars correctly', () => {
            const avatars: Avatar[] = [
                createAvatar('https://example.com/avatar-0.jpg', 48, 48),
                createAvatar('https://example.com/avatar-1.jpg', 88, 88)
            ];

            const result = selectBestUploaderAvatar(avatars, 'fallback.jpg');
            expect(result).toBe('https://example.com/avatar-1.jpg');
        });

        it('should handle many avatars correctly', () => {
            const avatars: Avatar[] = [
                createAvatar('https://example.com/avatar-0.jpg', 32, 32),
                createAvatar('https://example.com/avatar-1.jpg', 48, 48),
                createAvatar('https://example.com/avatar-2.jpg', 88, 88),
                createAvatar('https://example.com/avatar-3.jpg', 176, 176),
                createAvatar('https://example.com/avatar-4.jpg', 256, 256)
            ];

            // Should use last (highest quality)
            const result = selectBestUploaderAvatar(avatars, 'fallback.jpg');
            expect(result).toBe('https://example.com/avatar-4.jpg');
        });
    });

    describe('fallback behavior', () => {
        it('should return fallback when avatars array is empty', () => {
            const result = selectBestUploaderAvatar([], 'https://example.com/default-avatar.jpg');
            expect(result).toBe('https://example.com/default-avatar.jpg');
        });

        it('should return fallback when avatars is null', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = selectBestUploaderAvatar(null as any, 'default.jpg');
            expect(result).toBe('default.jpg');
        });

        it('should return fallback when avatars is undefined', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = selectBestUploaderAvatar(undefined as any, 'default.jpg');
            expect(result).toBe('default.jpg');
        });

        it('should handle empty string fallback', () => {
            const result = selectBestUploaderAvatar([], '');
            expect(result).toBe('');
        });

        it('should handle different fallback URLs', () => {
            expect(selectBestUploaderAvatar([], '/images/no-avatar.png')).toBe('/images/no-avatar.png');
            expect(selectBestUploaderAvatar([], 'https://cdn.example.com/default.jpg')).toBe(
                'https://cdn.example.com/default.jpg'
            );
        });
    });

    describe('edge cases', () => {
        it('should handle avatar with empty URL at last index', () => {
            const avatars: Avatar[] = [
                createAvatar('https://example.com/avatar-0.jpg', 48, 48),
                createAvatar('https://example.com/avatar-1.jpg', 88, 88),
                createAvatar('', 176, 176) // Empty URL at last index
            ];

            const result = selectBestUploaderAvatar(avatars, 'fallback.jpg');
            // Should fall back to first avatar
            expect(result).toBe('https://example.com/avatar-0.jpg');
        });

        it('should handle avatar with null URL', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const avatars: any[] = [
                createAvatar('https://example.com/avatar-0.jpg', 48, 48),
                createAvatar(null, 88, 88)
            ];

            const result = selectBestUploaderAvatar(avatars, 'fallback.jpg');
            expect(result).toBe('https://example.com/avatar-0.jpg');
        });

        it('should handle all avatars having empty URLs', () => {
            const avatars: Avatar[] = [
                createAvatar('', 48, 48),
                createAvatar('', 88, 88)
            ];

            const result = selectBestUploaderAvatar(avatars, 'fallback.jpg');
            expect(result).toBe('fallback.jpg');
        });

        it('should handle avatars with special characters in URLs', () => {
            const avatars: Avatar[] = [
                createAvatar('https://example.com/avatar?user=123&size=small', 48, 48),
                createAvatar('https://example.com/avatar?user=123&size=large', 176, 176)
            ];

            const result = selectBestUploaderAvatar(avatars, 'fallback.jpg');
            expect(result).toBe('https://example.com/avatar?user=123&size=large');
        });
    });

    describe('real-world scenarios', () => {
        it('should handle YouTube-style avatar array', () => {
            const avatars: Avatar[] = [
                createAvatar('https://yt3.ggpht.com/abc/photo.jpg?s=48', 48, 48),
                createAvatar('https://yt3.ggpht.com/abc/photo.jpg?s=88', 88, 88),
                createAvatar('https://yt3.ggpht.com/abc/photo.jpg?s=176', 176, 176)
            ];

            const result = selectBestUploaderAvatar(avatars, '');
            expect(result).toBe('https://yt3.ggpht.com/abc/photo.jpg?s=176');
        });

        it('should handle single avatar from basic source', () => {
            const avatars: Avatar[] = [createAvatar('https://example.com/user-pic.jpg', 64, 64)];

            const result = selectBestUploaderAvatar(avatars, 'anonymous.png');
            expect(result).toBe('https://example.com/user-pic.jpg');
        });
    });
});

// =============================================================================
// selectBestAvatar() Tests
// =============================================================================

describe('selectBestAvatar', () => {
    describe('successful selection', () => {
        it('should prefer avatar at index 2 (medium quality)', () => {
            const avatars: Avatar[] = [
                createAvatar('https://example.com/avatar-0.jpg', 48, 48),
                createAvatar('https://example.com/avatar-1.jpg', 88, 88),
                createAvatar('https://example.com/avatar-2.jpg', 176, 176),
                createAvatar('https://example.com/avatar-3.jpg', 256, 256)
            ];

            const result = selectBestAvatar(avatars, 'fallback.jpg');
            expect(result).toBe('https://example.com/avatar-2.jpg');
        });

        it('should fall back to first avatar if index 2 is unavailable', () => {
            const avatars: Avatar[] = [
                createAvatar('https://example.com/avatar-0.jpg', 48, 48),
                createAvatar('https://example.com/avatar-1.jpg', 88, 88)
            ];

            const result = selectBestAvatar(avatars, 'fallback.jpg');
            expect(result).toBe('https://example.com/avatar-0.jpg');
        });

        it('should handle single avatar correctly', () => {
            const avatars: Avatar[] = [createAvatar('https://example.com/avatar-only.jpg', 88, 88)];

            const result = selectBestAvatar(avatars, 'fallback.jpg');
            expect(result).toBe('https://example.com/avatar-only.jpg');
        });

        it('should handle exactly 3 avatars correctly', () => {
            const avatars: Avatar[] = [
                createAvatar('https://example.com/avatar-0.jpg', 48, 48),
                createAvatar('https://example.com/avatar-1.jpg', 88, 88),
                createAvatar('https://example.com/avatar-2.jpg', 176, 176)
            ];

            const result = selectBestAvatar(avatars, 'fallback.jpg');
            expect(result).toBe('https://example.com/avatar-2.jpg');
        });

        it('should handle many avatars correctly', () => {
            const avatars: Avatar[] = [
                createAvatar('https://example.com/avatar-0.jpg', 32, 32),
                createAvatar('https://example.com/avatar-1.jpg', 48, 48),
                createAvatar('https://example.com/avatar-2.jpg', 88, 88),
                createAvatar('https://example.com/avatar-3.jpg', 176, 176),
                createAvatar('https://example.com/avatar-4.jpg', 256, 256)
            ];

            // Should prefer index 2
            const result = selectBestAvatar(avatars, 'fallback.jpg');
            expect(result).toBe('https://example.com/avatar-2.jpg');
        });
    });

    describe('fallback behavior', () => {
        it('should return fallback when avatars array is empty', () => {
            const result = selectBestAvatar([], 'https://example.com/default.jpg');
            expect(result).toBe('https://example.com/default.jpg');
        });

        it('should return fallback when avatars is null', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = selectBestAvatar(null as any, 'default.jpg');
            expect(result).toBe('default.jpg');
        });

        it('should return fallback when avatars is undefined', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = selectBestAvatar(undefined as any, 'default.jpg');
            expect(result).toBe('default.jpg');
        });

        it('should handle empty string fallback', () => {
            const result = selectBestAvatar([], '');
            expect(result).toBe('');
        });

        it('should handle different fallback URLs', () => {
            expect(selectBestAvatar([], 'default-profile.png')).toBe('default-profile.png');
            expect(selectBestAvatar([], '/static/anonymous.jpg')).toBe('/static/anonymous.jpg');
        });
    });

    describe('edge cases', () => {
        it('should handle avatar with empty URL at index 2', () => {
            const avatars: Avatar[] = [
                createAvatar('https://example.com/avatar-0.jpg', 48, 48),
                createAvatar('https://example.com/avatar-1.jpg', 88, 88),
                createAvatar('', 176, 176), // Empty at preferred index
                createAvatar('https://example.com/avatar-3.jpg', 256, 256)
            ];

            const result = selectBestAvatar(avatars, 'fallback.jpg');
            // Should fall back to first
            expect(result).toBe('https://example.com/avatar-0.jpg');
        });

        it('should handle avatar with null URL at index 2', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const avatars: any[] = [
                createAvatar('https://example.com/avatar-0.jpg', 48, 48),
                createAvatar('https://example.com/avatar-1.jpg', 88, 88),
                createAvatar(null, 176, 176)
            ];

            const result = selectBestAvatar(avatars, 'fallback.jpg');
            expect(result).toBe('https://example.com/avatar-0.jpg');
        });

        it('should handle all avatars having empty URLs', () => {
            const avatars: Avatar[] = [
                createAvatar('', 48, 48),
                createAvatar('', 88, 88),
                createAvatar('', 176, 176)
            ];

            const result = selectBestAvatar(avatars, 'fallback.jpg');
            expect(result).toBe('fallback.jpg');
        });

        it('should handle avatars with special characters in URLs', () => {
            const avatars: Avatar[] = [
                createAvatar('https://example.com/user/avatar?id=1', 48, 48),
                createAvatar('https://example.com/user/avatar?id=2', 88, 88),
                createAvatar('https://example.com/user/avatar?id=3', 176, 176)
            ];

            const result = selectBestAvatar(avatars, 'fallback.jpg');
            expect(result).toBe('https://example.com/user/avatar?id=3');
        });
    });

    describe('real-world scenarios', () => {
        it('should handle detailed channel avatar array', () => {
            const avatars: Avatar[] = [
                createAvatar('https://yt3.ggpht.com/channel/photo.jpg?s=48', 48, 48),
                createAvatar('https://yt3.ggpht.com/channel/photo.jpg?s=88', 88, 88),
                createAvatar('https://yt3.ggpht.com/channel/photo.jpg?s=176', 176, 176),
                createAvatar('https://yt3.ggpht.com/channel/photo.jpg?s=256', 256, 256)
            ];

            const result = selectBestAvatar(avatars, '');
            expect(result).toBe('https://yt3.ggpht.com/channel/photo.jpg?s=176');
        });

        it('should handle channel with limited avatar sizes', () => {
            const avatars: Avatar[] = [
                createAvatar('https://example.com/channel-avatar-sm.jpg', 48, 48),
                createAvatar('https://example.com/channel-avatar-lg.jpg', 88, 88)
            ];

            const result = selectBestAvatar(avatars, 'no-avatar.png');
            // Only 2 available, should use first
            expect(result).toBe('https://example.com/channel-avatar-sm.jpg');
        });
    });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Media Utils Integration', () => {
    describe('using functions together for complete media data', () => {
        it('should select best media for a related video item', () => {
            const relatedVideo = {
                thumbnails: [
                    createThumbnail('https://i.ytimg.com/vi/abc/default.jpg', 90, 120),
                    createThumbnail('https://i.ytimg.com/vi/abc/mqdefault.jpg', 180, 320),
                    createThumbnail('https://i.ytimg.com/vi/abc/hqdefault.jpg', 360, 480)
                ],
                uploaderAvatars: [
                    createThumbnail('https://yt3.ggpht.com/user/s48.jpg', 48, 48),
                    createThumbnail('https://yt3.ggpht.com/user/s88.jpg', 88, 88),
                    createThumbnail('https://yt3.ggpht.com/user/s176.jpg', 176, 176)
                ]
            };

            const thumbnail = selectBestThumbnail(relatedVideo.thumbnails, 'default-thumb.jpg');
            const avatar = selectBestUploaderAvatar(relatedVideo.uploaderAvatars, 'default-avatar.jpg');

            expect(thumbnail).toBe('https://i.ytimg.com/vi/abc/mqdefault.jpg');
            expect(avatar).toBe('https://yt3.ggpht.com/user/s176.jpg');
        });

        it('should select best media for video details', () => {
            const videoDetails = {
                uploaderAvatars: [
                    createThumbnail('https://yt3.ggpht.com/channel/s48.jpg', 48, 48),
                    createThumbnail('https://yt3.ggpht.com/channel/s88.jpg', 88, 88),
                    createThumbnail('https://yt3.ggpht.com/channel/s176.jpg', 176, 176),
                    createThumbnail('https://yt3.ggpht.com/channel/s256.jpg', 256, 256)
                ]
            };

            const avatar = selectBestAvatar(videoDetails.uploaderAvatars, 'anonymous.jpg');

            // Should prefer index 2 (176px)
            expect(avatar).toBe('https://yt3.ggpht.com/channel/s176.jpg');
        });

        it('should handle missing media gracefully with fallbacks', () => {
            const incompleteVideo = {
                thumbnails: [],
                uploaderAvatars: []
            };

            const thumbnail = selectBestThumbnail(incompleteVideo.thumbnails, '/no-thumbnail.png');
            const avatar = selectBestUploaderAvatar(incompleteVideo.uploaderAvatars, '/anonymous.png');

            expect(thumbnail).toBe('/no-thumbnail.png');
            expect(avatar).toBe('/anonymous.png');
        });
    });

    describe('different selection strategies comparison', () => {
        it('should show difference between uploader avatar and detail avatar selection', () => {
            const avatars: Avatar[] = [
                createAvatar('https://example.com/s48.jpg', 48, 48),
                createAvatar('https://example.com/s88.jpg', 88, 88),
                createAvatar('https://example.com/s176.jpg', 176, 176),
                createAvatar('https://example.com/s256.jpg', 256, 256)
            ];

            // selectBestUploaderAvatar prefers last (highest quality)
            const uploaderResult = selectBestUploaderAvatar(avatars, 'fallback.jpg');
            expect(uploaderResult).toBe('https://example.com/s256.jpg');

            // selectBestAvatar prefers index 2 (medium quality)
            const detailResult = selectBestAvatar(avatars, 'fallback.jpg');
            expect(detailResult).toBe('https://example.com/s176.jpg');

            // They select different sizes for same input
            expect(uploaderResult).not.toBe(detailResult);
        });

        it('should show difference in fallback behavior with limited options', () => {
            const limitedAvatars: Avatar[] = [createAvatar('https://example.com/only.jpg', 48, 48)];

            // Both should select the only available option
            const uploaderResult = selectBestUploaderAvatar(limitedAvatars, 'fallback.jpg');
            const detailResult = selectBestAvatar(limitedAvatars, 'fallback.jpg');

            expect(uploaderResult).toBe('https://example.com/only.jpg');
            expect(detailResult).toBe('https://example.com/only.jpg');
            // When only one option, both strategies converge
            expect(uploaderResult).toBe(detailResult);
        });
    });

    describe('typical YouTube video processing workflow', () => {
        it('should process a complete YouTube video with all media', () => {
            // Typical YouTube video response structure
            const youtubeVideo = {
                thumbnails: [
                    createThumbnail('https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg', 90, 120),
                    createThumbnail('https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', 180, 320),
                    createThumbnail('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', 360, 480),
                    createThumbnail('https://i.ytimg.com/vi/dQw4w9WgXcQ/sddefault.jpg', 480, 640),
                    createThumbnail('https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', 720, 1280)
                ],
                uploaderAvatars: [
                    createThumbnail('https://yt3.ggpht.com/ytc/channel48.jpg', 48, 48),
                    createThumbnail('https://yt3.ggpht.com/ytc/channel88.jpg', 88, 88),
                    createThumbnail('https://yt3.ggpht.com/ytc/channel176.jpg', 176, 176)
                ]
            };

            const thumbnail = selectBestThumbnail(youtubeVideo.thumbnails, '');
            const avatar = selectBestUploaderAvatar(youtubeVideo.uploaderAvatars, '');

            // Should select medium quality thumbnail (index 1)
            expect(thumbnail).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg');
            // Should select highest quality avatar (last)
            expect(avatar).toBe('https://yt3.ggpht.com/ytc/channel176.jpg');
        });

        it('should handle YouTube video with missing high-res thumbnails', () => {
            const limitedVideo = {
                thumbnails: [
                    createThumbnail('https://i.ytimg.com/vi/abc123/default.jpg', 90, 120),
                    createThumbnail('https://i.ytimg.com/vi/abc123/mqdefault.jpg', 180, 320)
                ],
                uploaderAvatars: [createThumbnail('https://yt3.ggpht.com/ytc/s48.jpg', 48, 48)]
            };

            const thumbnail = selectBestThumbnail(limitedVideo.thumbnails, 'placeholder.jpg');
            const avatar = selectBestUploaderAvatar(limitedVideo.uploaderAvatars, 'anon.jpg');

            // Should select medium quality (index 1)
            expect(thumbnail).toBe('https://i.ytimg.com/vi/abc123/mqdefault.jpg');
            // Should select the only available avatar
            expect(avatar).toBe('https://yt3.ggpht.com/ytc/s48.jpg');
        });

        it('should handle corrupted YouTube video data', () => {
            const corruptedVideo = {
                thumbnails: [
                    createThumbnail('', 90, 120),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    createThumbnail(null as any, 180, 320),
                    createThumbnail('https://i.ytimg.com/vi/abc/hq.jpg', 360, 480)
                ],
                uploaderAvatars: [createThumbnail('', 48, 48)]
            };

            const thumbnail = selectBestThumbnail(corruptedVideo.thumbnails, 'broken-thumb.jpg');
            const avatar = selectBestUploaderAvatar(corruptedVideo.uploaderAvatars, 'broken-avatar.jpg');

            // Should fall back to last valid thumbnail
            expect(thumbnail).toBe('https://i.ytimg.com/vi/abc/hq.jpg');
            // Should use fallback for empty avatar
            expect(avatar).toBe('broken-avatar.jpg');
        });
    });
});