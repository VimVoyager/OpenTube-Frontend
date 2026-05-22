<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
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
	import VideoPlayerError, { type ShakaErrorDetail } from '$lib/components/video/VideoPlayerError.svelte';

	let { config }: { config: VideoPlayerConfig } = $props();

	let videoElement: HTMLVideoElement = $state(null!);
	let videoContainer: HTMLDivElement = $state(null!);
	let player: ShakaPlayerInstance | null = null;
	let ui: ShakaUIOverlayInstance | null = null;

	// Error State
	let playerError = $state<ShakaErrorDetail | null>(null);
	let retrying = $state(false);

	const PROXY_URL = PUBLIC_PROXY_URL || '/proxy';

	function setShakaControlsVisible(visible: boolean) {
		if (!videoContainer) return;
		const controls = videoContainer.querySelector('.shaka-controls-container') as HTMLElement | null;
		if (controls) {
			controls.style.visibility = visible ? '' : 'hidden';
			controls.style.pointerEvents = visible ? '' : 'none';
		}
	}

	/**
	 * Load or reload the manifest into an already-attached player.
	 * Called on first mount and on retry.
	 */
	async function loadManifest() {
		if (!player) return;

		if(!config.manifestUrl) {
			console.error('Manifest URL is empty or undefined');
			playerError = { category: 4, code: 0, severity: 2};
			await tick();
			setShakaControlsVisible(false);
			return;
		}

		try {
			await player.load(config.manifestUrl);
			playerError = null;
			await tick();
			setShakaControlsVisible(true);
		} catch (err) {
			console.error('Error loading video player manifest:', err);
			// If Shaka threw its own error object, extract the detail.
			// Otherwise fall back to a generic MANIFEST error.
			const shakaErr = err as any;
			if (typeof shakaErr?.category === 'number') {
				playerError = {
					category: shakaErr.category,
					code: shakaErr.code,
					severity: shakaErr.severity ?? 2
				};
			} else {
				playerError = { category: 4, code: 0, severity: 2 };
			}
			await tick();
			setShakaControlsVisible(false);
		}
	}

	/**
	 * Shaka event error handler
	 */
	function handleShakaErrorEvent(event: Event) {
		const detail = (event as CustomEvent)?.detail;
		if (!detail) return;

		const { category, code, severity } = detail;

		console.error(
			`Shaka error — category: ${category}, code: ${code}, severity: ${severity}`,
			detail
		);

		playerError = { category, code, severity };
	}

	async function handleRetry() {
		if (retrying) return;
		retrying = true;
		playerError = null;

		await tick();
		setShakaControlsVisible(false);

		// Small tick so Svelte can re-render the video element before we load
		// await new Promise((r) => setTimeout(r, 50));

		await loadManifest();
		retrying = false;
	}



	onMount(async () => {
		if (!browser) return;

		// Dynamically import Shaka Player only in the browser (no SSR)
		const shakaModule = await import('shaka-player/dist/shaka-player.ui');
		await import('shaka-player/dist/controls.css');
		const shaka = shakaModule.default;

		shaka.polyfill.installAll();

		if (!shaka.Player.isBrowserSupported()) {
			console.error('Browser not supported!');
			playerError = { category: 7, code: 0, severity: 2};
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

			player.addEventListener('error', handleShakaErrorEvent);

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

			await loadManifest();
		} catch (error) {
			console.error('Error initializing video player:', error);
			playerError = { category: 7, code: 0, severity: 2 };
			await tick();
			setShakaControlsVisible(false);
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
	{#if playerError && !retrying}
		<VideoPlayerError error={playerError} onRetry={handleRetry} {retrying} />
	{:else}
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
		{/if}
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