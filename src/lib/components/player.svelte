<script lang="ts">
	import type { VendorDoc, VendorEl } from '$lib/types';

	import { onDestroy } from 'svelte';
	import { Icon } from 'svelte-icons-pack';
	import { FaSolidPlay, FaSolidPause } from 'svelte-icons-pack/fa';
	import { VscMute, VscUnmute } from 'svelte-icons-pack/vsc';
	import { RiMediaFullscreenLine, RiMediaFullscreenExitFill } from 'svelte-icons-pack/ri';

	export let videoSrc: string = '';
	export let audioSrc: string = '';
	export let poster: string = '';
	export let duration: number | undefined;
	export let videoWidth: number | undefined;
	export let videoHeight: number | undefined;

	let paused: boolean = true;
	let muted: boolean = false;
	let currentTime: number = 0;
	let isFullScreen: boolean = false;
	let progressPlayed: number = 0;

	let videoEl: HTMLVideoElement | null = null;
	let audioEl: HTMLAudioElement | null = null;
	let videoContainer: VendorEl | null = null;
	let progressRef: HTMLDivElement | null = null;

	const BUFFER_TARGET = 15; // seconds we want buffered after current time
	let buffering: boolean = false;

	const togglePlay = (): void => {
		if (!videoEl) return;
		paused = !paused;

		if (paused) {
			videoEl.pause();
			audioEl?.pause();
		} else {
			videoEl.play();
			audioEl?.play();
		}
	};

	const toggleAudio = (): void => {
		muted = !muted;
		if (audioEl) audioEl.muted = muted;
	};

	const formatVideoTime = (t: number): string => {
		const hour = Math.floor(t / 3600);
		const minutes = Math.floor((t % 3600) / 60)
			.toString()
			.padStart(2, '0');
		const seconds = Math.floor(t % 60)
			.toString()
			.padStart(2, '0');
		return `${hour > 0 ? hour.toString().padStart(2, '0') + ':' : ''}${minutes}:${seconds}`;
	};

	const toggleFullScreen = (): void => {
		const doc: VendorDoc = document as VendorDoc;

		if (doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement) {
			doc.exitFullscreen?.() ?? doc.webkitFullscreenElement?.() ?? doc.msExitFullscreen?.();
			isFullScreen = false;
			return;
		}

		if (videoContainer) return;

		const el: VendorEl = videoContainer as VendorEl;
		el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.() ?? el.msRequestFullscreen?.();
		isFullScreen = true;
	};

	const syncAudioToVideo = (): void => {
		if (!audioEl || !videoEl) return;

		// if the audio is out of sync by > 0.1s, jump it
		if (Math.abs(audioEl.currentTime - videoEl.currentTime) > 0.1) {
			audioEl.currentTime = videoEl.currentTime;
		}
	};

	const handleTimeUpdate = (): void => {
		currentTime = videoEl?.currentTime ?? 0;
		syncAudioToVideo();
		progressPlayed = (duration ? currentTime / duration : 0) * 100;
	};

	const onKeyDown = (e: KeyboardEvent): void => {
		if (e.key.toLowerCase() === 'f') {
			e.preventDefault();
			toggleFullScreen();
		}
	};

	const seekTo = (ratio: number): void => {
		if (!videoEl || !duration) return;
		videoEl.currentTime = ratio * duration;
	};

	const onProgressClick = (e: MouseEvent): void => {
		if (!progressRef) return;
		const rect = progressRef.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const ratio = Math.min(Math.max(clickX / rect.width, 0), 1);
		seekTo(ratio);
	};

	let isDragging = false;

	function onDragStart(e: MouseEvent) {
		isDragging = true;
		onProgressClick(e);
		document.addEventListener('mousemove', onDragMove);
		document.addEventListener('mouseup', onDragEnd);
	}

	function onDragMove(e: MouseEvent) {
		if (!isDragging) return;
		onProgressClick(e);
	}

	function onDragEnd() {
		isDragging = false;
		document.removeEventListener('mousemove', onDragMove);
		document.removeEventListener('mouseup', onDragEnd);
	}

	function bufferedAfter(time: number): number {
		if (!videoEl || !audioEl) return 0;

		const ranges = videoEl.buffered;
		let bufferedVideo = 0;
		for (let i = 0; i < ranges.length; ++i) {
			if (ranges.start(i) <= time && time < ranges.end(i)) {
				bufferedVideo = ranges.end(i) - time;
				break;
			}
		}

		const audioRanges = audioEl.buffered;
		let bufferedAudio = 0;
		for (let i = 0; i < audioRanges.length; ++i) {
			if (audioRanges.start(i) <= time && time < audioRanges.end(i)) {
				bufferedAudio = audioRanges.end(i) - time;
				break;
			}
		}

		return Math.min(bufferedVideo, bufferedAudio);
	}

	const bufferCheck = () => {
		if (!videoEl) return;

		const needed = BUFFER_TARGET;
		const buffered = bufferedAfter(videoEl.currentTime);

		if (buffered < needed && !paused) {
			// not enough – pause
			buffering = true;
			togglePlay(); // pauses both video & audio
		} else if (buffered >= needed && buffering) {
			// enough – resume
			buffering = false;
			if (!paused) togglePlay(); // only play if we were playing before pause
		}
	};

	const intervalId = setInterval(bufferCheck, 250);

	onDestroy(() => clearInterval(intervalId));
</script>

<svelte:window on:keydown={onKeyDown} />

<div class="flex flex-col">
	<div class="w-full">
		<!-- Video wrapper -->
		<div
			class="relative w-full overflow-hidden bg-black"
			bind:this={videoContainer}
			style="aspect-ratio: {videoWidth && videoHeight ? `${videoWidth}/${videoHeight}` : '16/9'};"
		>
			<video
				class="h-full w-full rounded-lg object-cover"
				bind:this={videoEl}
				bind:paused
				bind:muted
				bind:currentTime
				bind:duration
				preload="auto"
				on:timeupdate={handleTimeUpdate}
				{poster}
			>
				<track kind="captions" />
				<source src={videoSrc} type="video/mp4" />
			</video>

			<!-- Audio element (hidden) -->
			<audio bind:this={audioEl} class="hidden" on:timeupdate={handleTimeUpdate}>
				<source src={audioSrc} type="audio/mpeg" />
			</audio>

			{#if buffering}
				<div class="absolute inset-0 flex items-center justify-center bg-black/50">
					<svg
						aria-hidden="true"
						class="inline h-10 w-10 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600"
						viewBox="0 0 100 101"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
							fill="currentColor"
						/>
						<path
							d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
							fill="currentFill"
						/>
					</svg>
				</div>
			{/if}

			<!-- Controls overlay -->
			<div class="absolute inset-x-0 bottom-0 bg-black/60">
				<!-- Progress bar -->
				<div class="px-2 py-1">
					<div
						class="relative h-1 cursor-pointer overflow-hidden rounded-lg bg-gray-700"
						role="progressbar"
						bind:this={progressRef}
						on:mousedown={onDragStart}
						on:click={onProgressClick}
					>
						<div class="h-full bg-white" style="width: {progressPlayed}%"></div>
						<div
							class="left-[calc(var(--played, 0%)-10px)] absolute -top-1 h-4 w-4 rounded-full bg-white shadow-md"
							style="--played:{progressPlayed}%"
						></div>
					</div>
				</div>

				<!-- Control bar -->
				<div class="flex h-12 items-center justify-between px-4 py-1 text-sm">
					<div class="flex items-center space-x-3">
						<button
							on:click={togglePlay}
							class="rounded-full p-1 ring-white hover:bg-gray-600 focus:ring-2 focus:outline-none"
						>
							<Icon src={paused ? FaSolidPlay : FaSolidPause} size="22px" color="white" />
						</button>

						<button
							on:click={toggleAudio}
							class="focus: foucs:ring-2 rounded-full p-1 ring-white outline-none hover:bg-gray-600"
						>
							<Icon src={muted ? VscMute : VscUnmute} size="22px" color="white" />
						</button>

						<p class="test-xs whitespace-nowrap text-white">
							{formatVideoTime(currentTime)} / {formatVideoTime(duration ?? 0)}
						</p>
					</div>

					<div>
						<button
							on:click={toggleFullScreen}
							class="rounded-full p-1 ring-white hover:bg-gray-600 focus:ring-2 focus:outline-none"
						>
							<Icon
								src={isFullScreen ? RiMediaFullscreenExitFill : RiMediaFullscreenLine}
								size="22px"
								color="white"
							/>
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
