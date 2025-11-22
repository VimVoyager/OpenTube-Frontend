<script lang="ts">
	// Optional: can accept a message prop
	export let message: string = 'Loading video...';
</script>

<div class="loading-container">
	<!-- Video player skeleton -->
	<div class="video-skeleton">
		<div class="aspect-video w-full bg-gray-800 rounded-lg flex items-center justify-center">
			<!-- Loading spinner -->
			<div class="spinner"></div>
		</div>
	</div>

	<!-- Video details skeleton -->
	<div class="details-skeleton mt-6">
		<!-- Title skeleton -->
		<div class="h-7 bg-gray-700 rounded w-3/4 mb-4 animate-pulse"></div>
		
		<!-- Channel info skeleton -->
		<div class="flex items-center gap-3 mb-4">
			<div class="h-12 w-12 bg-gray-700 rounded-full animate-pulse"></div>
			<div class="flex-1">
				<div class="h-4 bg-gray-700 rounded w-40 mb-2 animate-pulse"></div>
				<div class="h-3 bg-gray-700 rounded w-32 animate-pulse"></div>
			</div>
		</div>

		<!-- Description skeleton -->
		<div class="space-y-2">
			<div class="h-3 bg-gray-700 rounded w-full animate-pulse"></div>
			<div class="h-3 bg-gray-700 rounded w-5/6 animate-pulse"></div>
			<div class="h-3 bg-gray-700 rounded w-4/6 animate-pulse"></div>
		</div>
	</div>

	<!-- Loading message -->
	<div class="text-center mt-8">
		<p class="text-gray-400 text-sm">{message}</p>
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