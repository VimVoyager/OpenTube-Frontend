<div class="flex w-full flex-col gap-4 px-6">
	<!-- Related videos loading skeletons -->
	{#each Array(5) as _, i}
		<div class="flex gap-2 p-2">
			<!-- Thumbnail skeleton -->
			<div class="relative shrink-0 w-40">
				<div class="bg-gray-700 rounded-md animate-pulse" style="aspect-ratio: 16/9;"></div>
			</div>

			<!-- Info skeleton -->
			<div class="flex flex-col flex-1 gap-2 min-w-0">
				<!-- Title -->
				<div class="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
				<div class="h-4 bg-gray-700 rounded w-4/5 animate-pulse"></div>
				
				<!-- Channel info -->
				<div class="flex items-center gap-2 mt-1">
					<div class="h-6 w-6 bg-gray-700 rounded-full animate-pulse"></div>
					<div class="h-3 bg-gray-700 rounded w-24 animate-pulse"></div>
				</div>
				
				<!-- Stats -->
				<div class="h-3 bg-gray-700 rounded w-20 animate-pulse"></div>
			</div>
		</div>
	{/each}
</div>