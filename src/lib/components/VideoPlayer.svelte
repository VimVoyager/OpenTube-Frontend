<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  // import shaka from 'shaka-player/dist/shaka-player.ui';
  // import 'shaka-player/dist/controls.css';
	import { browser } from '$app/environment';

  export let videoSrc: string = '';
  export let audioSrc: string = '';
  export let poster: string = '';
  export let videoHeight: number | undefined;
  export let videoWidth: number | undefined;

  let videoContainer: HTMLDivElement;
  let video: HTMLVideoElement;
  let player: any | null = null;
  let ui: any = null;
  let errorMessage: string = '';

  onMount(async () => {
    if (!browser) return;

    // Dynamically import Shaka Player only on in the browser
    const shakaModule = await import('shaka-player/dist/shaka-player.ui');
    const shaka = shakaModule.default;
    await import('shaka-player/dist/controls.css');

    // Check if browser supports Shaka Player
    if (!shaka.Player.isBrowserSupported()) {
      errorMessage = 'Browser not supported. Please use a modern browser.';
      console.error(errorMessage);
      return;
    }

    try {
      // Initialize Shaka Player
      player = new shaka.Player();
      await player.attach(video);

      // Create UI overlay
      const uiConfig = {
        overflowMenuButtons: ['quality', 'subtitles', 'playback_rate'],
        seekBarColors: {
          base: 'rgba(255, 255, 255, 0.3)',
          buffered: 'rgba(255, 255, 255, 0.54)',
          played: 'rgb(255, 0, 0)'
        }
      };

      ui = new shaka.ui.Overlay(player, videoContainer, video);
      ui.configure(uiConfig);

      // Listen for errors
      player.addEventListener('error', onErrorEvent);

      // Load the separate video and audio streams
      await loadStreams();
    } catch (error) {
      console.error('Error initializing Shaka Player:', error);
      errorMessage = 'Error initializing video player.';
    }
  });

  async function loadStreams() {
    if (!player) return;

    try {
      // Configure player to handle separate streams
      player.configure({
        streaming: {
          bufferingGoal: 30,
          rebufferingGoal: 2,
          bufferBehind: 30
        }
      });
      
      // For separate video and audio streams, we need to create a manifest
			// or use MediaSource API. Here's an approach using MediaSource:
			
			// If these are DASH manifests, load them directly
			if (videoSrc.includes('.mpd')) {
				await player.load(videoSrc);
			} else {
				// For separate progressive MP4 streams, we'll load the video
				// Note: Shaka Player works best with DASH/HLS manifests
				// For separate audio/video streams, you may need to create a manifest
				console.warn('Loading non-DASH streams. Consider using DASH manifests for better results.');
				await player.load(videoSrc);
			}
    } catch (error) {
      console.error('Error loading streams:', error);
      errorMessage = 'Failed to load video streams.';
      onError(error);
    }
  }

  function onErrorEvent(event: any) {
    onError(event.detail);
  }

  function onError(error: any) {
    console.error('Error code', error.code, 'object', error);
    errorMessage = error.message || 'An unknown error occurred.';
  }

  onDestroy(() => {
    if (player) {
      player.destroy();
      player = null;
    }
    if (ui) {
      ui = null;
    }
  });
</script>


<div class="player-wrapper" style="aspect-ratio: {videoWidth}/{videoHeight};">
	{#if errorMessage}
		<div class="error-message">
			<p>{errorMessage}</p>
		</div>
	{/if}
	
	<div bind:this={videoContainer} class="video-container">
		<video
			bind:this={video}
			class="shaka-video"
			{poster}
			playsinline
			crossorigin="anonymous"
		/>
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

	.error-message {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 20px;
		border-radius: 8px;
		z-index: 10;
		text-align: center;
	}

	:global(.shaka-controls-container) {
		font-family: inherit;
	}
</style>
