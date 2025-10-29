<script lang="ts">
	import roundLogo from '$lib/assets/logo-placeholder.svg';

	export let channelAvatar = roundLogo;
	export let videoTitle = 'Video Title';
	export let channelName = 'Channel Name';
	export let viewCount = 147977;
	export let videoDescription =
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

	const formatViewCount = (viewCount: number): string => {
		const formatter = Intl.NumberFormat('en-US');
		return formatter.format(viewCount);
	};
</script>

<div>
	<div>
		<h2 class="mt-3 mb-3 text-2xl font-bold text-white">{videoTitle}</h2>
	</div>
	<div class="grid grid-cols-2 gap-3">
		<div class="col-spacn-2 flex items-center space-x-3">
			<img src={channelAvatar} alt={channelName} class="h-8 w-8 rounded-full object-cover" />
			<h3 class="text-md font-semibold text-white">{channelName}</h3>
			<button
				type="button"
				class="focus-visible:outline-offset rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-xs hover:bg-gray-100 focus-visible:outline-2"
				>Subscribe</button
			>
		</div>
	</div>
	<div>
		<div
			class="mt-6 bg-white shadow-sm sm:rounded-lg dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10"
		>
			<div class="px-4 py-5 sm:p-6">
				<h3 class="text-base font-semibold text-gray-900 dark:text-white">
					{formatViewCount(viewCount)} views
				</h3>
				<div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
					<p>{@html videoDescription}</p>
				</div>
			</div>
		</div>
	</div>
</div>
