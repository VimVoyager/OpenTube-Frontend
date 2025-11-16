/**
 * Test Fixtures: VideoDetail Component
 * 
 * Mock data for testing VideoDetail component functionality
 */

import type { VideoMetadata } from '$lib/adapters';

export const mockMetadata: VideoMetadata = {
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

export const mockMetadataNoAvatar: VideoMetadata = {
	title: 'Video Without Avatar',
	description: 'Simple description',
	channelName: 'Channel Without Avatar',
	channelAvatar: null,
	viewCount: 5000,
	uploadDate: '2024-02-01',
	likeCount: 250,
	dislikeCount: 10,
	subscriberCount: 50000
};

export const mockMetadataLargeNumbers: VideoMetadata = {
	title: 'Popular Video',
	description: 'Very popular video',
	channelName: 'Popular Channel',
	channelAvatar: 'https://example.com/popular-avatar.jpg',
	viewCount: 999999999,
	uploadDate: '2023-12-01',
	likeCount: 5000000,
	dislikeCount: 50000,
	subscriberCount: 10000000
};

export const mockMetadataLongDescription: VideoMetadata = {
	title: 'Video with Long Description',
	description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20),
	channelName: 'Detailed Channel',
	channelAvatar: 'https://example.com/detailed-avatar.jpg',
	viewCount: 50000,
	uploadDate: '2024-03-10',
	likeCount: 2500,
	dislikeCount: 100,
	subscriberCount: 250000
};

export const mockMetadataHtmlDescription: VideoMetadata = {
	title: 'Video with HTML',
	description: '<p>Paragraph with <a href="https://example.com">link</a></p><ul><li>Item 1</li><li>Item 2</li></ul>',
	channelName: 'HTML Channel',
	channelAvatar: 'https://example.com/html-avatar.jpg',
	viewCount: 10000,
	uploadDate: '2024-04-05',
	likeCount: 800,
	dislikeCount: 20,
	subscriberCount: 75000
};

export const mockMetadataZeroViews: VideoMetadata = {
	title: 'New Video',
	description: 'Brand new video',
	channelName: 'New Channel',
	channelAvatar: 'https://example.com/new-avatar.jpg',
	viewCount: 0,
	uploadDate: '2024-11-13',
	likeCount: 0,
	dislikeCount: 0,
	subscriberCount: 100
};

export const mockMetadataSpecialChars: VideoMetadata = {
	title: 'Video with "quotes" & <special> characters',
	description: 'Description with "quotes", & ampersands, and <brackets>',
	channelName: 'Special & Channel',
	channelAvatar: 'https://example.com/special-avatar.jpg',
	viewCount: 12345,
	uploadDate: '2024-05-20',
	likeCount: 1000,
	dislikeCount: 50,
	subscriberCount: 150000
};