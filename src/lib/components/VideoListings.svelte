<script lang="ts">
	import type { RelatedItem } from '$lib/types';

	export let videos: RelatedItem[] = [];

	const formatViewCount = (viewCount: number): string => {
		const formatter = Intl.NumberFormat('en-US');
		return formatter.format(viewCount);
	};
</script>

<div class="flex w-full flex-col gap-0.25 px-6">
	{#each videos as video (video.id)}
		<div>
			<div class="flex items-center sm:flex-row sm:gap-4" style="aspect-ratio: 16/9;">
				<img src={video.thumbnails[video.thumbnails.length - 1].url} alt="Thumbnail" class="rounded-md object-cover" />
			</div>
			<div class="mb-1 flex flex-col">
				<h3 class="text-lg font-semibold text-gray-900 dark:text-white">{video.name}</h3>
				
			</div>
		</div>
		<div class="mb-4">
			<div class="grid grid-cols-7">
				<div class="col-span-1 flex items-center justify-start">
					<img src={video.uploaderAvatars[video.uploaderAvatars.length - 1].url} alt={video.uploaderName} class="h-8 w-8 rounded-full object-cover" />
				</div>
				<div class="col-span-3 flex flex-col">
					<p class="text-sm text-gray-500 dark:text-gray-400">{video.uploaderName}</p>
					<p class="text-sm text-gray-500 dark:text-gray-400">{formatViewCount(video.viewCount)} views</p>
				</div>
			</div>
		</div>
	{/each}
</div>
