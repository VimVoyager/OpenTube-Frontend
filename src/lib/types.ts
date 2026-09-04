export interface Details {
	uploaderAvatars: Image[];
	videoTitle: string;
	description: Description;
	uploadDate: string;
	channelSubscriberCount: number;
	dislikeCount: number;
	likeCount: number;
	viewCount: number;
	channelName: string;
}

export interface Image {
	url: string;
	height: number;
	width: number;
	estimatedResolutionLevel?: string;
}

export interface Description {
	content: string;
	type: number;
}

export interface Avatar {
	url: string;
	height: number;
	width: number;
	estimatedResolutionLevel?: string;
}
