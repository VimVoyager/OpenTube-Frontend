/**
 * Test Suite: comments adapter
 *
 * Tests for comment data adaptation and transformation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adaptComment, adaptComments } from './comments';
import commentsResponse from '../../tests/fixtures/api/commentsResponse.json';
import commentsResultFixture from '../../tests/fixtures/adapters/commentsResult.json';
import type { CommentConfig } from './types';
import type { CommentResponse, RelatedCommentItem } from '$lib/api/types';

// Mock the mediaUtils module
vi.mock('$lib/utils/mediaUtils', () => ({
	selectBestAvatar: vi.fn((avatars, fallback) => {
		if (!avatars || avatars.length === 0) return fallback;
		// Select highest quality (last in array)
		return avatars[avatars.length - 1]?.url || avatars[0]?.url || fallback;
	})
}));

import { selectBestAvatar } from '$lib/utils/mediaUtils';

// =============================================================================
// Test Fixtures
// =============================================================================

const mockCommentsResponseData = commentsResponse[0] as CommentResponse;
const mockRelatedItems = mockCommentsResponseData.relatedItems as RelatedCommentItem[];
const mockFirstComment: RelatedCommentItem = mockRelatedItems[0];
const mockSecondComment: RelatedCommentItem = mockRelatedItems[1];
const mockCommentConfigs: CommentConfig[] = commentsResultFixture as CommentConfig[];
const mockFirstCommentConfig: CommentConfig = mockCommentConfigs[0];

const defaultAvatar = 'https://example.com/default-avatar.jpg';

// =============================================================================
// Setup and Teardown
// =============================================================================

beforeEach(() => {
	vi.clearAllMocks();
});

// =============================================================================
// adaptComment Tests
// =============================================================================

describe('adaptComment', () => {
	// =============================================================================
	// Successful Adaptation Tests
	// =============================================================================

	describe('successful comment adaptation', () => {
		it('should adapt complete comment correctly', () => {
			const result = adaptComment(mockFirstComment, defaultAvatar);

			expect(result).toEqual(mockFirstCommentConfig);
			expect(selectBestAvatar).toHaveBeenCalledWith(
				mockFirstComment.uploaderAvatars,
				defaultAvatar
			);
			expect(selectBestAvatar).toHaveBeenCalledTimes(1);
		});

		it('should adapt comment with all required properties', () => {
			const result = adaptComment(mockFirstComment, defaultAvatar);

			expect(result).toHaveProperty('id');
			expect(result).toHaveProperty('text');
			expect(result).toHaveProperty('author');
			expect(result).toHaveProperty('authorAvatar');
			expect(result).toHaveProperty('authorUrl');
			expect(result).toHaveProperty('isVerified');
			expect(result).toHaveProperty('isChannelOwner');
			expect(result).toHaveProperty('uploadDate');
			expect(result).toHaveProperty('likeCount');
			expect(result).toHaveProperty('likeCountText');
			expect(result).toHaveProperty('isPinned');
			expect(result).toHaveProperty('isHearted');
			expect(result).toHaveProperty('replyCount');
			expect(result).toHaveProperty('hasReplies');
			expect(result).toHaveProperty('repliesUrl');
		});

		it('should correctly map comment ID', () => {
			const result = adaptComment(mockFirstComment, defaultAvatar);

			expect(result.id).toBe(mockFirstComment.commentId);
		});

		it('should correctly map comment text', () => {
			const result = adaptComment(mockFirstComment, defaultAvatar);

			expect(result.text).toBe(mockFirstComment.commentText.content);
		});

		it('should correctly map author information', () => {
			const result = adaptComment(mockFirstComment, defaultAvatar);

			expect(result.author).toBe(mockFirstComment.uploaderName);
			expect(result.authorUrl).toBe(mockFirstComment.uploaderUrl);
			expect(result.isVerified).toBe(mockFirstComment.uploaderVerified);
		});

		it('should correctly map engagement metrics', () => {
			const result = adaptComment(mockFirstComment, defaultAvatar);

			expect(result.likeCount).toBe(mockFirstComment.likeCount);
			expect(result.likeCountText).toBe(mockFirstComment.textualLikeCount);
		});

		it('should correctly map flags and states', () => {
			const result = adaptComment(mockFirstComment, defaultAvatar);

			expect(result.isPinned).toBe(mockFirstComment.pinned);
			expect(result.isHearted).toBe(mockFirstComment.heartedByUploader);
			expect(result.isChannelOwner).toBe(mockFirstComment.channelOwner);
		});

		it('should correctly calculate hasReplies', () => {
			const result = adaptComment(mockFirstComment, defaultAvatar);

			expect(result.hasReplies).toBe(true);
			expect(result.replyCount).toBe(914);
		});

		it('should correctly map replies URL', () => {
			const result = adaptComment(mockFirstComment, defaultAvatar);

			expect(result.repliesUrl).toBe(mockFirstComment.replies?.url);
		});
	});

	// =============================================================================
	// Different Comment Types Tests
	// =============================================================================

	describe('different comment types', () => {
		it('should adapt pinned comment from channel owner', () => {
			const result = adaptComment(mockFirstComment, defaultAvatar);

			expect(result.isPinned).toBe(true);
			expect(result.isChannelOwner).toBe(true);
			expect(result.isVerified).toBe(true);
			expect(result.isHearted).toBe(true);
		});

		it('should adapt regular comment without special flags', () => {
			const result = adaptComment(mockSecondComment, defaultAvatar);

			expect(result.isPinned).toBe(false);
			expect(result.isChannelOwner).toBe(false);
			expect(result.isHearted).toBe(false);
			expect(result.isVerified).toBe(false);
		});
	});

	// =============================================================================
	// Default Values Tests
	// =============================================================================

	describe('default values handling', () => {
		it('should use empty string when comment text is missing', () => {
			const comment: RelatedCommentItem = {
				...mockFirstComment,
				commentText: undefined as any
			};

			const result = adaptComment(comment, defaultAvatar);

			expect(result.text).toBe('');
		});

		it('should use "Unknown User" when uploader name is missing', () => {
			const comment: RelatedCommentItem = {
				...mockFirstComment,
				uploaderName: '' as any
			};

			const result = adaptComment(comment, defaultAvatar);

			expect(result.author).toBe('Unknown User');
		});

		it('should use empty string when uploader URL is missing', () => {
			const comment: RelatedCommentItem = {
				...mockFirstComment,
				uploaderUrl: '' as any
			};

			const result = adaptComment(comment, defaultAvatar);

			expect(result.authorUrl).toBe('');
		});

		it('should use default avatar when avatars are missing', () => {
			const comment: RelatedCommentItem = {
				...mockFirstComment,
				uploaderAvatars: [] as any
			};

			const result = adaptComment(comment, defaultAvatar);

			expect(result.authorAvatar).toBe(defaultAvatar);
			expect(selectBestAvatar).toHaveBeenCalledWith([], defaultAvatar);
		});

		it('should use false for missing boolean flags', () => {
			const comment: RelatedCommentItem = {
				...mockFirstComment,
				uploaderVerified: undefined as any,
				channelOwner: undefined as any,
				pinned: undefined as any,
				heartedByUploader: undefined as any
			};

			const result = adaptComment(comment, defaultAvatar);

			expect(result.isVerified).toBe(false);
			expect(result.isChannelOwner).toBe(false);
			expect(result.isPinned).toBe(false);
			expect(result.isHearted).toBe(false);
		});

		it('should use 0 for missing numeric counts', () => {
			const comment: RelatedCommentItem = {
				...mockFirstComment,
				likeCount: undefined as any,
				replyCount: undefined as any
			};

			const result = adaptComment(comment, defaultAvatar);

			expect(result.likeCount).toBe(0);
			expect(result.replyCount).toBe(0);
		});

		it('should use "0" for missing like count text', () => {
			const comment: RelatedCommentItem = {
				...mockFirstComment,
				textualLikeCount: '' as any
			};

			const result = adaptComment(comment, defaultAvatar);

			expect(result.likeCountText).toBe('0');
		});

		it('should use empty string for missing upload date', () => {
			const comment: RelatedCommentItem = {
				...mockFirstComment,
				textualUploadDate: '' as any
			};

			const result = adaptComment(comment, defaultAvatar);

			expect(result.uploadDate).toBe('');
		});

		it('should set hasReplies to false when replyCount is 0', () => {
			const comment: RelatedCommentItem = {
				...mockFirstComment,
				replyCount: 0
			};

			const result = adaptComment(comment, defaultAvatar);

			expect(result.hasReplies).toBe(false);
			expect(result.replyCount).toBe(0);
		});
	});

	// =============================================================================
	// Edge Cases Tests
	// =============================================================================

	describe('edge cases', () => {
		it('should handle comment with no replies', () => {
			const comment: RelatedCommentItem = {
				...mockFirstComment,
				replyCount: 0,
				replies: undefined as any
			};

			const result = adaptComment(comment, defaultAvatar);

			expect(result.hasReplies).toBe(false);
			expect(result.replyCount).toBe(0);
			expect(result.repliesUrl).toBeUndefined();
		});

		it('should handle very large like counts', () => {
			const comment: RelatedCommentItem = {
				...mockFirstComment,
				likeCount: 999999999999
			};

			const result = adaptComment(comment, defaultAvatar);

			expect(result.likeCount).toBe(999999999999);
		});

		it('should handle very large reply counts', () => {
			const comment: RelatedCommentItem = {
				...mockFirstComment,
				replyCount: 1000000
			};

			const result = adaptComment(comment, defaultAvatar);

			expect(result.replyCount).toBe(1000000);
			expect(result.hasReplies).toBe(true);
		});

		it('should handle comment with HTML in text', () => {
			const comment: RelatedCommentItem = {
				...mockFirstComment,
				commentText: {
					content: '<a href="http://example.com">Link</a><br>New line',
					type: 1
				}
			};

			const result = adaptComment(comment, defaultAvatar);

			expect(result.text).toBe('<a href="http://example.com">Link</a><br>New line');
		});

		it('should handle undefined comment text content', () => {
			const comment: RelatedCommentItem = {
				...mockFirstComment,
				commentText: {
					content: undefined as any,
					type: 1
				}
			};

			const result = adaptComment(comment, defaultAvatar);

			expect(result.text).toBe('');
		});

		it('should handle undefined replies object', () => {
			const comment: RelatedCommentItem = {
				...mockFirstComment,
				replies: undefined as any
			};

			const result = adaptComment(comment, defaultAvatar);

			expect(result.repliesUrl).toBeUndefined();
		});
	});

	// =============================================================================
	// Avatar Selection Tests
	// =============================================================================

	describe('avatar selection', () => {
		it('should call selectBestAvatar with correct arguments', () => {
			adaptComment(mockFirstComment, defaultAvatar);

			expect(selectBestAvatar).toHaveBeenCalledWith(
				mockFirstComment.uploaderAvatars,
				defaultAvatar
			);
		});

		it('should use result from selectBestAvatar', () => {
			const expectedAvatar = 'https://yt3.ggpht.com/avatar3.jpg';
			vi.mocked(selectBestAvatar).mockReturnValueOnce(expectedAvatar);

			const result = adaptComment(mockFirstComment, defaultAvatar);

			expect(result.authorAvatar).toBe(expectedAvatar);
		});

		it('should handle selectBestAvatar returning fallback', () => {
			vi.mocked(selectBestAvatar).mockReturnValueOnce(defaultAvatar);

			const result = adaptComment(mockFirstComment, defaultAvatar);

			expect(result.authorAvatar).toBe(defaultAvatar);
		});
	});
});

// =============================================================================
// adaptComments Tests
// =============================================================================

describe('adaptComments', () => {
	// =============================================================================
	// Array Adaptation Tests
	// =============================================================================

	describe('array adaptation', () => {
		it('should adapt array of comments correctly', () => {
			const result = adaptComments(mockRelatedItems, defaultAvatar);

			expect(result).toHaveLength(mockRelatedItems.length);
			expect(Array.isArray(result)).toBe(true);
		});

		it('should call selectBestAvatar for each comment', () => {
			adaptComments(mockRelatedItems, defaultAvatar);

			expect(selectBestAvatar).toHaveBeenCalledTimes(mockRelatedItems.length);
		});

		it('should handle empty array', () => {
			const result = adaptComments([], defaultAvatar);

			expect(result).toEqual([]);
			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBe(0);
		});

		it('should maintain order of comments', () => {
			const result = adaptComments(mockRelatedItems, defaultAvatar);

			expect(result[0].id).toBe(mockFirstComment.commentId);
			expect(result[1].id).toBe(mockSecondComment.commentId);
		});
	});

	// =============================================================================
	// Multiple Comment Types Tests
	// =============================================================================

	describe('multiple comment types', () => {
		it('should correctly adapt mixed comment types', () => {
			const result = adaptComments(mockRelatedItems, defaultAvatar);

			// First comment: pinned, channel owner, verified
			expect(result[0].isPinned).toBe(true);
			expect(result[0].isChannelOwner).toBe(true);
			expect(result[0].isVerified).toBe(true);

			// Second comment: regular comment
			expect(result[1].isPinned).toBe(false);
			expect(result[1].isChannelOwner).toBe(false);
		});

		it('should handle array with only pinned comments', () => {
			const pinnedOnly = [mockFirstComment];
			const result = adaptComments(pinnedOnly, defaultAvatar);

			expect(result.length).toBe(1);
			expect(result[0].isPinned).toBe(true);
		});

		it('should handle array with no pinned comments', () => {
			const noPinned = [mockSecondComment];
			const result = adaptComments(noPinned, defaultAvatar);

			expect(result.length).toBe(1);
			expect(result[0].isPinned).toBe(false);
		});
	});

	// =============================================================================
	// Edge Cases Tests
	// =============================================================================

	describe('edge cases', () => {
		it('should handle large arrays efficiently', () => {
			const largeArray = Array(100).fill(mockFirstComment);
			const result = adaptComments(largeArray, defaultAvatar);

			expect(result.length).toBe(100);
			expect(selectBestAvatar).toHaveBeenCalledTimes(100);
		});

		it('should handle array with incomplete comment data', () => {
			const incompleteComment: RelatedCommentItem = {
				commentId: 'test-id',
				commentText: { content: 'Test', type: 1 },
				uploaderName: '',
				uploaderAvatars: [],
				uploaderUrl: '',
				uploaderVerified: false,
				textualUploadDate: '',
				uploadDate: { approximation: true },
				likeCount: 0,
				textualLikeCount: '0',
				heartedByUploader: false,
				pinned: false,
				streamPosition: -1,
				replyCount: 0,
				replies: { url: '', id: '' },
				channelOwner: false,
				infoType: 'COMMENT',
				serviceId: 0,
				url: '',
				name: '',
				thumbnails: []
			};

			const result = adaptComments([incompleteComment], defaultAvatar);

			expect(result.length).toBe(1);
			expect(result[0].author).toBe('Unknown User');
			expect(result[0].authorAvatar).toBe(defaultAvatar);
		});
	});

	// =============================================================================
	// Integration Tests
	// =============================================================================

	describe('integration with selectBestAvatar', () => {
		it('should use different avatars from selectBestAvatar for different comments', () => {
			const avatar1 = 'https://example.com/avatar1.jpg';
			const avatar2 = 'https://example.com/avatar2.jpg';

			vi.mocked(selectBestAvatar).mockReturnValueOnce(avatar1).mockReturnValueOnce(avatar2);

			const result = adaptComments(mockRelatedItems, defaultAvatar);

			expect(result[0].authorAvatar).toBe(avatar1);
			expect(result[1].authorAvatar).toBe(avatar2);
		});

		it('should pass same default avatar to all calls', () => {
			adaptComments(mockRelatedItems, defaultAvatar);

			const calls = vi.mocked(selectBestAvatar).mock.calls;
			expect(calls[0][1]).toBe(defaultAvatar);
			expect(calls[1][1]).toBe(defaultAvatar);
		});
	});
});
