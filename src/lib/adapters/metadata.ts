import type { Details } from '$lib/types';
import { selectBestAvatar } from '$lib/utils/mediaUtils';
import type { VideoMetadata } from './types';


/**
 * Adapt video details into metadata for display
 */
export function adaptVideoMetadata(
	details: Details,
	defaultAvatar: string
): VideoMetadata {
	return {
		title: details.videoTitle || 'Untitled Video',
		description: details.description?.content || 'No description available',
		channelName: details.channelName || 'Unknown Channel',
		channelAvatar: selectBestAvatar(details.uploaderAvatars, defaultAvatar),
		viewCount: details.viewCount || 0,
		uploadDate: details.uploadDate || '',
		likeCount: details.likeCount || 0,
		dislikeCount: details.dislikeCount || 0,
		subscriberCount: details.channelSubscriberCount || 0,
	};
}
