<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import {
		generateDashManifestBlobUrl,
		revokeDashManifestBlobUrl,
		type DashManifestConfig,
		type StreamMetadata
	} from '$lib/utils/dashManifestGenerator';

	// Props
	export let videoUrl: string = '';
	export let audioUrl: string = '';
	export let poster: string = '';
	export let duration: number = 0;

	// Video stream metadata
	export let videoCodec: string = 'avc1.42E01E';
	export let videoMimeType: string = 'video/mp4';
	export let videoWidth: number = 1920;
	export let videoHeight: number = 1080;
	export let videoBandwidth: number = 1000000;
	export let videoFrameRate: number = 30;
	export let videoFormat: string = 'MPEG_4';
	export let videoInitStart: number | undefined = undefined;
	export let videoInitEnd: number | undefined = undefined;
	export let videoIndexStart: number | undefined = undefined;
	export let videoIndexEnd: number | undefined = undefined;

	// Audio stream metadata
	export let audioCodec: string = 'mp4a.40.2';
	export let audioMimeType: string = 'audio/mp4';
	export let audioBandwidth: number = 128000;
	export let audioSampleRate: number = 44100;
	export let audioChannels: number = 2;
	export let audioFormat: string = 'M4A';
	export let audioInitStart: number | undefined = undefined;
	export let audioInitEnd: number | undefined = undefined;
	export let audioIndexStart: number | undefined = undefined;
	export let audioIndexEnd: number | undefined = undefined;

	// Component state
	let videoContainer: HTMLDivElement;
	let video: HTMLVideoElement;
	let player: any | null = null;
	let ui: any = null;
	let errorMessage: string = '';
	let isLoading: boolean = true;
	let manifestBlobUrl: string = '';

	onMount(async () => {
		if (!browser) return;

		try {
			// Dynamically import Shaka Player only in the browser
			const shakaModule = await import('shaka-player/dist/shaka-player.ui');
			const shaka = shakaModule.default;
			await import('shaka-player/dist/controls.css');

			// Check if browser supports Shaka Player
			if (!shaka.Player.isBrowserSupported()) {
				errorMessage = 'Browser not supported. Please use a modern browser with DASH support.';
				console.error(errorMessage);
				isLoading = false;
				return;
			}

			// Generate DASH manifest client-side
			await initializePlayer(shaka);
		} catch (error) {
			console.error('Error initializing video player:', error);
			errorMessage = error instanceof Error ? error.message : 'Error initializing video player.';
			isLoading = false;
		}
	});

	async function initializePlayer(shaka: any) {
		try {
			player = new shaka.Player();
			await player.attach(video);

			// Register request filter to proxy googlevideo.com requests
			player
				.getNetworkingEngine()
				.registerRequestFilter(
					(_type: shaka.net.NetworkingEngine.RequestType, request: shaka.extern.Request) => {
						if (
							!request ||
							!request.uris ||
							!Array.isArray(request.uris) ||
							request.uris.length === 0
						) {
							console.warn('Invalid request object in filter:', request);
							return;
						}
						const uri = request.uris[0];

						try {
							const url = new URL(uri);

							//Proxy requests to googlevideo.com through local proxy
							if (url.host.endsWith('.googlevideo.com')) {
								console.log('Intercepting googlevideo.com request:', url.host);

								const headers = request.headers;
								url.searchParams.set('host', url.host);

								url.protocol = 'http:';
								url.host = 'localhost:8081';

								// Convert Range header to query parameter (this is the KEY!)
								if (headers.Range) {
									const rangeValue = headers.Range.split('=')[1]; // "bytes=0-1000" -> "0-1000"
									url.searchParams.set('range', rangeValue);
									console.log('📦 Converted Range header to query param:', rangeValue);
									request.headers = {}; // Remove ALL headers to avoid CORS preflight
								}

								request.uris[0] = url.toString();
								console.log('Proxied request URL:', request.uris[0].substring(0, 100) + '...');
							}
						} catch (error) {
							console.error('Error in request filter:', error);
						}
					}
				);

			// Configure player settings
			player.configure({
				streaming: {
					bufferingGoal: 30,
					rebufferingGoal: 2,
					bufferBehind: 30,
					retryParameters: {
						timeout: 30000,
						maxAttempts: 3,
						baseDelay: 1000,
						backoffFactor: 2,
						fuzzFactor: 0.5
					}
				},
				manifest: {
					retryParameters: {
						timeout: 30000,
						maxAttempts: 3,
						baseDelay: 1000,
						backoffFactor: 2,
						fuzzFactor: 0.5
					},
					dash: {
						ignoreSuggestedPresentationDelay: true,
						autoCorrectDrift: false
					}
				}
			});

			// Create UI overlay
			const uiConfig = {
				overflowMenuButtons: ['quality', 'playback_rate'],
				seekBarColors: {
					base: 'rgba(255, 255, 255, 0.3)',
					buffered: 'rgba(255, 255, 255, 0.54)',
					played: 'rgb(255, 0, 0)'
				},
				controlPanelElements: [
					'play_pause',
					'time_and_duration',
					'spacer',
					'mute',
					'volume',
					'fullscreen',
					'overflow_menu'
				]
			};

			ui = new shaka.ui.Overlay(player, videoContainer, video);
			ui.configure(uiConfig);

			player.addEventListener('error', onErrorEvent);

			// Generate and load DASH manifest
			await loadDashManifest();

			isLoading = false;
		} catch (error) {
			console.error('Error in initializePlayer:', error);
			throw error;
		}
	}

	async function loadDashManifest() {
		if (!player) {
			throw new Error('Player not initialized');
		}

		if (!videoUrl && !audioUrl) {
			throw new Error('No video or audio URL provided');
		}

		try {
			// Prepare stream metadata
			const videoStream: StreamMetadata | undefined = videoUrl
				? {
						url: videoUrl,
						codec: videoCodec,
						mimeType: videoMimeType,
						bandwidth: videoBandwidth,
						width: videoWidth,
						height: videoHeight,
						frameRate: videoFrameRate,
						format: videoFormat,
						initStart: videoInitStart,
						initEnd: videoInitEnd,
						indexStart: videoIndexStart,
						indexEnd: videoIndexEnd
					}
				: undefined;

			const audioStream: StreamMetadata | undefined = audioUrl
				? {
						url: audioUrl,
						codec: audioCodec,
						mimeType: audioMimeType,
						bandwidth: audioBandwidth,
						audioSampleRate: audioSampleRate,
						audioChannels: audioChannels,
						format: audioFormat,
						initStart: audioInitStart,
						initEnd: audioInitEnd,
						indexStart: audioIndexStart,
						indexEnd: audioIndexEnd
					}
				: undefined;

			// Generate DASH manifest configuration
			const manifestConfig: DashManifestConfig = {
				videoStream,
				audioStream,
				duration: duration || 0
			};

			console.log('Generating DASH manifest with config:', manifestConfig);

			// Generate blob URL from manifest
			manifestBlobUrl = generateDashManifestBlobUrl(manifestConfig);

			console.log('Loading DASH manifest from blob URL:', manifestBlobUrl);

			// Load the manifest into Shaka Player
			// The browser will make direct requests to Google's servers using the URLs in the manifest
			await player.load(manifestBlobUrl);

			console.log('DASH manifest loaded successfully');
		} catch (error) {
			console.error('Error loading DASH manifest:', error);
			errorMessage = error instanceof Error ? error.message : 'Failed to load video streams.';
			throw error;
		}
	}

	function onErrorEvent(event: any) {
		onError(event.detail);
	}

	function onError(error: any) {
		console.error('Error code', error.code, 'object', error);

		// Provide user-friendly error messages
		let message = 'An error occurred while playing the video.';

		switch (error.code) {
			case 1001: 
				message = 'Network error. Please check your connection.';
				break;
			case 3016:
				message = 'Video format not supported by your browser.';
				break;
			case 4012: 
				message = 'Unable to load video. The stream may have expired.';
				break;
			case 4006: 
				message = 'Unable to load video manifest. The stream format may not be supported.';
				break;
			default:
				message = error.message;
				break
		}	
		
		errorMessage = message;
		isLoading = false;
	}

	onDestroy(() => {
		// Clean up player
		if (player) {
			player.destroy().catch((error: any) => {
				console.error('Error destroying player:', error);
			});
			player = null;
		}

		// Clean up UI
		if (ui) {
			ui = null;
		}

		// Revoke blob URL to free memory
		if (manifestBlobUrl) {
			revokeDashManifestBlobUrl(manifestBlobUrl);
			manifestBlobUrl = '';
		}
	});
</script>

<div class="player-wrapper" style="aspect-ratio: {videoWidth}/{videoHeight};">
	{#if isLoading}
		<div class="loading-overlay">
			<div class="loading-spinner"></div>
			<p>Loading video...</p>
		</div>
	{/if}

	{#if errorMessage}
		<div class="error-message">
			<p>{errorMessage}</p>
		</div>
		<div class="error-message">
			<div class="error-icon">⚠️</div>
			<p class="error-text">{errorMessage}</p>
			<button class="retry-button" on:click={() => window.location.reload()}> Retry </button>
		</div>
	{/if}

	<div bind:this={videoContainer} class="video-container">
		<video bind:this={video} class="shaka-video" {poster} playsinline crossorigin="anonymous" >
			<track kind="captions" />
		</video>
	</div>
</div>

<style>
	.player-wrapper {
		position: relative;
		width: 100%;
		max-width: 100%;
		background: #000;
		border-radius: 8px;
		overflow: hidden;
	}

	.video-container {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.shaka-video {
		width: 100%;
		height: 100%;
		display: block;
	}

	.loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.9);
		color: white;
		z-index: 10;
	}

	.loading-spinner {
		width: 50px;
		height: 50px;
		border: 4px solid rgba(255, 255, 255, 0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 16px;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-message {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: rgba(0, 0, 0, 0.95);
		color: white;
		padding: 32px;
		border-radius: 12px;
		z-index: 10;
		text-align: center;
		max-width: 400px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
	}

	.error-icon {
		font-size: 48px;
		margin-bottom: 16px;
	}

	.error-text {
		margin: 0 0 20px 0;
		font-size: 16px;
		line-height: 1.5;
	}

	.retry-button {
		background: #ff0000;
		color: white;
		border: none;
		padding: 10px 24px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	.retry-button:hover {
		background: #cc0000;
	}

	.retry-button:active {
		transform: scale(0.98);
	}

	:global(.shaka-controls-container) {
		font-family: inherit;
	}
</style>
