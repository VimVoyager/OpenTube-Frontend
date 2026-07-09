<div class="loading-container">
	<!-- Video player skeleton -->
	<div class="video-skeleton">
		<div class="flex aspect-video w-full items-center justify-center rounded-lg bg-gray-800">
			<!-- Loading spinner -->
			<div class="spinner"></div>
		</div>
	</div>

	<!-- Video details skeleton -->
	<div class="details-skeleton mt-6">
		<!-- Title skeleton -->
		<div class="mb-4 h-7 w-3/4 animate-pulse rounded bg-gray-700"></div>

		<!-- Channel info skeleton -->
		<div class="mb-4 flex items-center gap-3">
			<div class="h-12 w-12 animate-pulse rounded-full bg-gray-700"></div>
			<div class="flex-1">
				<div class="mb-2 h-4 w-40 animate-pulse rounded bg-gray-700"></div>
				<div class="h-3 w-32 animate-pulse rounded bg-gray-700"></div>
			</div>
		</div>

		<!-- Description skeleton -->
		<div class="space-y-2">
			<div class="h-3 w-full animate-pulse rounded bg-gray-700"></div>
			<div class="h-3 w-5/6 animate-pulse rounded bg-gray-700"></div>
			<div class="h-3 w-4/6 animate-pulse rounded bg-gray-700"></div>
		</div>
	</div>
</div>

<style>
	.loading-container {
		padding: 1rem;
		width: 100%;
	}

	.video-skeleton {
		width: 100%;
		max-width: 100%;
	}

	/* Spinner animation */
	.spinner {
		width: 60px;
		height: 60px;
		border: 4px solid rgba(255, 255, 255, 0.1);
		border-top-color: #ff0000;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Pulse animation is handled by Tailwind's animate-pulse */

	@media (min-width: 640px) {
		.loading-container {
			padding: 1.5rem;
		}
	}

	@media (min-width: 1024px) {
		.loading-container {
			padding: 2rem;
		}
	}
</style>
