<script lang="ts">
	import type { VideoMetadata } from '$lib/adapters/types';
	import roundLogo from '$lib/assets/logo-placeholder.svg';

	export let metadata: VideoMetadata;

	$: displayAvatar = metadata.channelAvatar || roundLogo;
	
	/**
	 * Format view count with locale specific number formatting
	 */
	const formatViewCount = (viewCount: number): string => {
		const formatter = Intl.NumberFormat('en-US');
		return formatter.format(Math.floor(viewCount));
	};
</script>

<div>
	<div>
		<h2 class="mt-3 mb-3 text-2xl font-bold text-primary">{metadata.title}</h2>
	</div>
	<div class="grid grid-cols-2 gap-3">
		<div class="col-spacn-2 flex items-center space-x-3">
			<img src={displayAvatar} alt={metadata.channelName} class="h-8 w-8 rounded-full object-cover" />
			<h3 class="text-md font-semibold text-primary">{metadata.channelName}</h3>
			<button
				type="button"
				class="rounded-full bg-accent hover:bg-accent-hover px-3.5 py-2 text-sm font-semibold text-white shadow-xs transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
				>Subscribe</button
			>
		</div>
	</div>
	<div>
		<div class="mt-6 bg-card border border-default shadow-sm sm:rounded-lg">
			<div class="px-4 py-5 sm:p-6">
				<h3 class="text-base font-semibold text-primary">
					{formatViewCount(metadata.viewCount)} views
				</h3>
				<div class="mt-2 text-sm text-secondary">
					<p>{@html metadata.description}</p>
				</div>
			</div>
		</div>
	</div>
</div>