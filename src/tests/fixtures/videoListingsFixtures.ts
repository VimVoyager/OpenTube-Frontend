/**
 * Test Fixtures: VideoListings Component
 * 
 * Mock data for testing VideoListings component functionality
 */

import type { RelatedVideoConfig } from '$lib/adapters/types';

export const mockRelatedVideo: RelatedVideoConfig = {
	id: 'test-video-1',
	url: 'https://www.youtube.com/watch?v=test-video-1',
	title: 'First Related Video',
	thumbnail: 'https://example.com/thumbnail.jpg',
	channelName: 'Test Channel',
	channelAvatar: 'https://example.com/avatar.jpg',
	viewCount: 1000000,
	duration: 600,
	uploadDate: '1 day ago'
};

export const mockRelatedVideos: RelatedVideoConfig[] = [
	mockRelatedVideo,
	{
		id: 'test-video-2',
		url: 'https://www.youtube.com/watch?v=test-video-2',
		title: 'Second Related Video',
		thumbnail: 'https://example.com/thumbnail2.jpg',
		channelName: 'Channel Two',
		channelAvatar: 'https://example.com/avatar2.jpg',
		viewCount: 500000,
		duration: 450,
		uploadDate: '3 days ago'
	},
	{
		id: 'test-video-3',
		url: 'https://www.youtube.com/watch?v=test-video-3',
		title: 'Third Related Video',
		thumbnail: 'https://example.com/thumbnail3.jpg',
		channelName: 'Channel Three',
		channelAvatar: null,
		viewCount: 250000,
		duration: 3665,
		uploadDate: '1 week ago'
	}
];

export const mockRelatedVideoNoAvatar: RelatedVideoConfig = {
	id: 'video-no-avatar',
	url: 'https://www.youtube.com/watch?v=video-no-avatar',
	title: 'Video Without Avatar',
	thumbnail: 'https://example.com/thumbnail-no-avatar.jpg',
	channelName: 'No Avatar Channel',
	channelAvatar: null,
	viewCount: 5000,
	duration: 300,
	uploadDate: '2 weeks ago'
};

export const mockRelatedVideoLongDuration: RelatedVideoConfig = {
	id: 'video-long',
	url: 'https://www.youtube.com/watch?v=video-long',
	title: 'Long Duration Video',
	thumbnail: 'https://example.com/thumbnail-long.jpg',
	channelName: 'Long Content Channel',
	channelAvatar: 'https://example.com/avatar-long.jpg',
	viewCount: 2000000,
	duration: 36000, // 10 hours
	uploadDate: '3 months ago'
};

export const mockRelatedVideoZeroViews: RelatedVideoConfig = {
	id: 'video-new',
	url: 'https://www.youtube.com/watch?v=video-new',
	title: 'Brand New Video',
	thumbnail: 'https://example.com/thumbnail-new.jpg',
	channelName: 'New Channel',
	channelAvatar: 'https://example.com/avatar-new.jpg',
	viewCount: 0,
	duration: 180,
	uploadDate: '1 hour ago'
};

export const mockRelatedVideoShort: RelatedVideoConfig = {
	id: 'video-short',
	url: 'https://www.youtube.com/watch?v=video-short',
	title: 'Short Video',
	thumbnail: 'https://example.com/thumbnail-short.jpg',
	channelName: 'Shorts Channel',
	channelAvatar: 'https://example.com/avatar-short.jpg',
	viewCount: 50000,
	duration: 45,
	uploadDate: '5 days ago'
};

export const mockRelatedVideoLargeNumbers: RelatedVideoConfig = {
	id: 'video-popular',
	url: 'https://www.youtube.com/watch?v=video-popular',
	title: 'Extremely Popular Video',
	thumbnail: 'https://example.com/thumbnail-popular.jpg',
	channelName: 'Viral Channel',
	channelAvatar: 'https://example.com/avatar-popular.jpg',
	viewCount: 999999999,
	duration: 1200,
	uploadDate: '1 year ago'
};

export const mockRelatedVideoSpecialChars: RelatedVideoConfig = {
	id: 'video-special',
	url: 'https://www.youtube.com/watch?v=video-special',
	title: 'Video with "quotes" & <special> characters',
	thumbnail: 'https://example.com/thumbnail-special.jpg',
	channelName: 'Special & Channel',
	channelAvatar: 'https://example.com/avatar-special.jpg',
	viewCount: 75000,
	duration: 360,
	uploadDate: '2 months ago'
};

export const mockRelatedVideoLongTitle: RelatedVideoConfig = {
	id: 'video-long-title',
	url: 'https://www.youtube.com/watch?v=video-long-title',
	title: 'This is an extremely long video title that goes on and on and should be truncated by the component because it is way too long to display in full without taking up too much space',
	thumbnail: 'https://example.com/thumbnail-long-title.jpg',
	channelName: 'Verbose Channel',
	channelAvatar: 'https://example.com/avatar-long-title.jpg',
	viewCount: 100000,
	duration: 720,
	uploadDate: '3 weeks ago'
};

export const mockEmptyRelatedVideos: RelatedVideoConfig[] = [];