export interface ShakaError {
	code: number;
	message: string;
	severity: number;
	category: number;
	data: unknown[];
}

export interface ShakaPlayerConfiguration {
	streaming?: {
		bufferingGoal?: number;
		rebufferingGoal?: number;
		bufferBehind?: number;
	};
	drm?: Record<string, unknown>;
	manifest?: Record<string, unknown>;
}

export interface ShakaUIConfiguration {
	overflowMenuButtons?: string[];
	seekBarColors?: {
		base?: string;
		buffered?: string;
		played?: string;
	};
	controlPanelElements?: string[];
	addSeekBar?: boolean;
	addBigPlayButton?: boolean;
}

export interface ShakaErrorEvent extends Event {
	detail: ShakaError;
}

export interface ShakaPlayerClass {
	new (video?: HTMLMediaElement): ShakaPlayerInstance;
	isBrowserSupported(): boolean;
}

export interface ShakaNetworkingEngine {
	registerRequestFilter(filter: (type: number, request: ShakaRequest) => void): void;
	unregisterRequestFilter(filter: (type: number, request: ShakaRequest) => void): void;
}

export interface ShakaRetryParameters {
	maxAttempts: number;
	baseDelay: number;
	backoffFactor: number;
	fuzzFactor: number;
	timeout: number;
	stallTimeout: number;
	connectionTimeout: number;
}

export interface ShakaRequest {
	uris: string[];
	method: string;
	body: ArrayBuffer | null;
	headers: Record<string, string>;
	allowCrossSiteCredentials: boolean;
	retryParameters: ShakaRetryParameters;
}

export interface ShakaPlayerInstance {
	attach(video: HTMLMediaElement): Promise<void>;
	load(manifestUri: string, startTime?: number | null, mimeType?: string): Promise<void>;
	configure(config: ShakaPlayerConfiguration): void;
	destroy(): Promise<void>;
	addEventListener(type: string, listener: (event: ShakaErrorEvent) => void): void;
	removeEventListener(type: string, listener: (event: ShakaErrorEvent) => void): void;
	getNetworkingEngine(): ShakaNetworkingEngine | null;
}

export interface ShakaUIOverlayClass {
	new (
		player: ShakaPlayerInstance,
		videoContainer: HTMLElement,
		video: HTMLMediaElement
	): ShakaUIOverlayInstance;
}

export interface ShakaUIOverlayInstance {
	configure(config: ShakaUIConfiguration): void;
	destroy(): Promise<void>;
}

export interface ShakaPolyfill {
	installAll(): void;
}