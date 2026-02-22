import type { CommentResponse, RelatedCommentItem } from '../api/types';
import type { CommentConfig } from './types';
import { selectBestAvatar } from '$lib/utils/mediaUtils';

/**
 * Adapt raw comment data into a cleaner format for display
 */
export function adaptComment(
	comment: RelatedCommentItem,
	defaultAvatar: string
): CommentConfig {
	return {
		id: comment.commentId,
		text: comment.commentText || '',
		author: comment.uploaderName || 'Unknown User',
		authorAvatar: selectBestAvatar(comment.uploaderAvatars, defaultAvatar),
		authorUrl: comment.uploaderUrl || '',
		isVerified: comment.uploaderVerified || false,
		isChannelOwner: comment.channelOwner || false,
		uploadDate: comment.textualUploadDate || '',
		likeCount: comment.likeCount || 0,
		likeCountText: comment.textualLikeCount || '0',
		isPinned: comment.pinned || false,
		isHearted: comment.heartedByUploader || false,
		replyCount: comment.replyCount || 0,
		hasReplies: (comment.replyCount || 0) > 0,
		repliesUrl: comment.replies?.url
	};
}

/**
 * Adapt an array of comments
 */
export function adaptComments(
	comments: RelatedCommentItem[],
	defaultAvatar: string
): CommentConfig[] {
	return comments.map((comment) => adaptComment(comment, defaultAvatar));
}

/**
 * Adapt a full CommentResponse object from the API
 * This is a convenience function that extracts relatedItems and adapts them
 */
export function adaptCommentResponse(
	response: CommentResponse | null,
	defaultAvatar: string
): CommentConfig[] {
	if (!response) return [];
	return adaptComments(response.relatedItems || [], defaultAvatar);
}