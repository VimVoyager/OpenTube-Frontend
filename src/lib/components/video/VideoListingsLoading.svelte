<div class="flex w-full flex-col gap-4 px-6">
	<!-- Related videos loading skeletons -->
	{#each [...Array(5).keys()] as i (i)}
		<div class="flex gap-2 p-2">
			<!-- Thumbnail skeleton -->
			<div class="relative w-40 shrink-0">
				<div class="animate-pulse rounded-md bg-gray-700" style="aspect-ratio: 16/9;"></div>
			</div>

			<!-- Info skeleton -->
			<div class="flex min-w-0 flex-1 flex-col gap-2">
				<!-- Title -->
				<div class="h-4 w-full animate-pulse rounded bg-gray-700"></div>
				<div class="h-4 w-4/5 animate-pulse rounded bg-gray-700"></div>

				<!-- Channel info -->
				<div class="mt-1 flex items-center gap-2">
					<div class="h-6 w-6 animate-pulse rounded-full bg-gray-700"></div>
					<div class="h-3 w-24 animate-pulse rounded bg-gray-700"></div>
				</div>

				<!-- Stats -->
				<div class="h-3 w-20 animate-pulse rounded bg-gray-700"></div>
			</div>
		</div>
	{/each}
</div>
