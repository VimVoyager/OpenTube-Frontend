<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { SvelteURL} from 'svelte/reactivity';
	import { browser } from '$app/environment';
	import { PUBLIC_PROXY_URL } from '$env/static/public';
	import type { VideoPlayerConfig } from '$lib/adapters/types';
	import type {
		ShakaPlayerInstance,
		ShakaRequest,
		ShakaUIConfiguration,
		ShakaUIOverlayInstance
	} from '$lib/types';

	export let config: VideoPlayerConfig;

	let videoElement: HTMLVideoElement;
	let videoContainer: HTMLDivElement;
	let player: ShakaPlayerInstance | null = null;
	let ui: ShakaUIOverlayInstance | null = null;

	const PROXY_URL = PUBLIC_PROXY_URL || '/proxy';

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

		try {
			player = new shaka.Player();

			await player.attach(videoElement);

			ui = new shaka.ui.Overlay(
				player,
				videoContainer,
				videoElement
			);

			const config_ui: ShakaUIConfiguration = {
				addSeekBar: true,
				addBigPlayButton: true,
				controlPanelElements: [
					'play_pause',
					'time_and_duration',
					'mute',
					'volume',
					'spacer',
					'quality',  
					'captions',
					'overflow_menu',
					'fullscreen'
				],
			};

			ui.configure(config_ui);

			player.addEventListener('error', (event: Event) => {
				console.error('Shaka Player error event:', event);
			});

			// Request filter to proxy googlevideo.com URLs
			const networkingEngine = player.getNetworkingEngine();
			if (networkingEngine) {
				networkingEngine.registerRequestFilter((type: number, request: ShakaRequest) => {
					// Type 1 is SEGMENT in Shaka Player
					if (type === 1) {
						const originalUrl = new URL(request.uris[0]);

						if (originalUrl.host.endsWith('.googlevideo.com')) {

							originalUrl.searchParams.set('host', originalUrl.host);

							// Parse proxy URL
							const proxyBase = PROXY_URL.startsWith('/') 
								? `${window.location.origin}${PROXY_URL}`
								: PROXY_URL;

							// Build the new proxied URL
							const proxyUrl = new SvelteURL(proxyBase);
							proxyUrl.pathname = new SvelteURL(proxyBase).pathname + originalUrl.pathname;

							proxyUrl.search = originalUrl.search;

							// Handle Range header conversion to query parameter
							if (request.headers.Range) {
								const rangeValue = request.headers.Range.split('=')[1];
								proxyUrl.searchParams.set('range', rangeValue);
								request.headers = {};
							}

							request.uris[0] = proxyUrl.toString();
						}
					}
				});
			}

			if (!config.manifestUrl || config.manifestUrl === '') {
				throw new Error('Manifest URL is empty or undefined');
			}

			await player.load(config.manifestUrl);
		} catch (error) {
			console.error('Error initializing or loading video player:', error);
		}
	});

	onDestroy(() => {
		if (ui) {
			ui.destroy();
			ui = null;
		}
		if (player) {
			player.destroy();
			player = null;
		}
	});
</script>

<div bind:this={videoContainer} class="video-container">
	<video
		id="video"
		data-testid="video-player"
		bind:this={videoElement}
		class="video-player"
		poster={config.poster}
		playsinline
	>
		<track kind="captions" label="Captions"/>
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

	:global(.shaka-overflow-menu) {
		background: rgba(35, 35, 35, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
</style>