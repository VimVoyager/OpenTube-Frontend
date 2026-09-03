export interface NextPage {
	url: string;
	id: string;
}

export interface Replies {
	url: string;
	id: string;
}

export interface UploadDate {
	approximation: boolean;
}

export interface Image {
	url: string;
	height: number;
	width: number;
	estimatedResolutionLevel?: string;
}

