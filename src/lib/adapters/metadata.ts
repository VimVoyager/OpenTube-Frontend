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
		viewCount: handleNegativeCount(details.viewCount)  || 0,
		uploadDate: details.uploadDate || '',
		likeCount: handleNegativeCount(details.likeCount) || 0,
		dislikeCount: handleNegativeCount(details.dislikeCount) || 0,
		subscriberCount: handleNegativeCount(details.channelSubscriberCount) || 0,
	};
}

function handleNegativeCount(count: number) {
    return count < 0 ? 0 : count;
}
