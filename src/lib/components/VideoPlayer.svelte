<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { PUBLIC_PROXY_URL } from '$env/static/public';
	import type { VideoPlayerConfig } from '$lib/adapters/types';

	export let config: VideoPlayerConfig;

	let videoElement: HTMLVideoElement;
	let videoContainer: HTMLDivElement;
	let player: any = null;
	let ui: any = null;

	const PROXY_URL = PUBLIC_PROXY_URL || '/proxy';

	console.log('VideoPlayer initialized');
	console.log('Config:', config);
	console.log('PROXY_URL:', PROXY_URL);

	onMount(async () => {
		// Only run in browser
		if (!browser) return;

		// Dynamically import Shaka Player only in the browser (no SSR)
		const shakaModule = await import('shaka-player/dist/shaka-player.ui');
		await import('shaka-player/dist/controls.css');
		const shaka = shakaModule.default;

		shaka.polyfill.installAll();

		if (!shaka.Player.isBrowserSupported()) {
			console.error('Browser not supported!');
			return;
		}

		player = new shaka.Player();

		await player.attach(videoElement);

		ui = new shaka.ui.Overlay(
			player,
			videoContainer,
			videoElement
		);

		const config_ui = {
			addSeekBar: true,
			addAddPlayButton: true,
			controlPanelElements: [
				'play_pause',
				'time_and_duration',
				'mute',
				'volume',
				'spacer',
				'quality',  // Resolution selector
				'captions',
				'overflow_menu',
				'fullscreen'
			],
		};

		ui.configure(config_ui);

		// Get the controls from UI
		const controls = ui.getControls();

		player.addEventListener('error', (event: any) => {
			console.error('Shaka Player error event:', event);
		});

		// Request filter to proxy googlevideo.com URLs
		const networkingEngine = player.getNetworkingEngine();
		if (networkingEngine) {
			networkingEngine.registerRequestFilter((type: number, request: { uris: string[]; headers: { Range?: any; }; }) => {
				console.log('Request filter - Type:', type, 'URL:', request.uris[0]);

				// Type 1 is SEGMENT in Shaka Player
				if (type === 1) {
					const originalUrl = new URL(request.uris[0]);

					if (originalUrl.host.endsWith('.googlevideo.com')) {
						console.log('Intercepting googlevideo.com request:', originalUrl.host);

						originalUrl.searchParams.set('host', originalUrl.host);

						// Parse proxy URL
						const proxyBase = PROXY_URL.startsWith('/') 
							? `${window.location.origin}${PROXY_URL}`
							: PROXY_URL;

						console.log('Proxy base URL:', proxyBase);

						// Build the new proxied URL
						const proxyUrl = new URL(proxyBase);
						const newPath = proxyUrl.pathname + originalUrl.pathname;
						
						const proxiedUrl = new URL(proxyBase);
						proxiedUrl.pathname = newPath;
						proxiedUrl.search = originalUrl.search;

						// Handle Range header conversion to query parameter
						if (request.headers.Range) {
							const rangeValue = request.headers.Range.split('=')[1];
							proxiedUrl.searchParams.set('range', rangeValue);
							console.log('Converted Range header to query param:', rangeValue);
							request.headers = {};
						}

						request.uris[0] = proxiedUrl.toString();
						console.log('Proxied request URL:', request.uris[0].substring(0, 150) + '...');
					}
				}
			});
		}

		try {
			console.log('Attempting to load manifest URL:', config.manifestUrl);
			
			if (!config.manifestUrl || config.manifestUrl === '') {
				throw new Error('Manifest URL is empty or undefined');
			}

			await player.load(config.manifestUrl);
			console.log('Video loaded successfully!');
		} catch (error) {
			console.error('Error loading video:', error);
		}
	});

	onDestroy(() => {
		if (ui) {
			ui.destroy();
		}
		if (player) {
			console.log('Destroying player');
			player.destroy();
		}
	});
</script>

<div bind:this={videoContainer} class="video-container" data-shaka-player-container>
	<video
		bind:this={videoElement}
		class="video-player"
		poster={config.poster}
		data-shaka-player
		playsinline
	>
		<track kind="captions" label="English captions" />
	</video>
</div>

<style>
	.video-container {
		position: relative;
		width: 100%;
		max-width: 1280px;
		margin: 0 auto;
		background: black;
	}

	.video-player {
		width: 100%;
		height: auto;
	}

	/* Ensure Shaka controls are visible */
	:global(.shaka-controls-container) {
		background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%);
	}

	:global(.shaka-overflow-menu) {
		background: rgba(35, 35, 35, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
</style>