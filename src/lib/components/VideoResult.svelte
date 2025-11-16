<script lang="ts">
	import thumbnailPlaceholder from '$lib/assets/thumbnail-placeholder.jpg';
	import roundLogo from '$lib/assets/logo-placeholder.svg';

	export let poster: string = thumbnailPlaceholder;
	export let title: string = 'Video Title';
	export let viewCount: number = 356910;
	export let uploadedAt: string = '2023-05-15T12:00:00Z';
	export let channelName: string = 'Glitch';
	export let description: string =
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

	const formattedDate = new Date(uploadedAt).toLocaleString(undefined, {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});

	const formatViewCount = (viewCount: number): string => {
		const formatter = Intl.NumberFormat('en-US');
		return formatter.format(viewCount);
	};
</script>

<div class="grid grid-cols-3 gap-4 rounded-lg p-4 shadow-sm transition-colors hover:bg-gray-900">
	<!-- Left side – thumbnail -->
	<div class="col-span-1 flex items-start justify-center">
		<img
			src={poster}
			alt={`Thumbnail for ${title}`}
			class="h-auto w-full rounded-md object-cover"
		/>
	</div>

	<!-- Right side – text (2/3 of the width) -->
	<div class="col-span-2 flex flex-col">
		<h3 class="mb-1 text-lg font-semibold text-white">{title}</h3>
		<p class="mb-2 text-sm text-gray-400">
			<span>{formatViewCount(viewCount)} views</span>
			<span class="mx-1 inline-block align-middle">•</span>
			<span>{formattedDate}</span>
		</p>
		<div class="col-space-2 my-3 flex items-center space-x-3">
			<img src={roundLogo} alt={channelName} class="h-8 w-8 rounded-full object-cover" />
			<p class="text-md font-semibold text-white">{channelName}</p>
		</div>

		<p
			class="
        line-clamp-3 overflow-hidden
        text-sm
        text-gray-400
      "
		>
			{description}
		</p>
	</div>
</div>
