<script lang="ts">
	type Variant = 'error' | 'warning' | 'info' | 'empty';
	
	export let variant: Variant = 'error';
	export let title: string;
	export let message: string;
	export let icon: string | null = null;
	export let showRetry: boolean = false;
	export let onRetry: (() => void) | null = null;

	// Default icons for each variant
	const defaultIcons = {
		error: '⚠️',
		warning: '📹',
		info: 'ℹ️',
		empty: '🔍'
	};

	$: displayIcon = icon ?? defaultIcons[variant];

	// Variant styles
	const variantStyles = {
		error: 'bg-accent/10 border-accent/20',
		warning: 'bg-secondary border-default',
		info: 'bg-secondary border-default',
		empty: 'bg-secondary border-default'
	};

	const iconStyles = {
		error: 'text-accent',
		warning: 'text-muted',
		info: 'text-muted',
		empty: 'text-muted'
	};

	$: containerClasses = variantStyles[variant];
	$: iconColorClasses = iconStyles[variant];
</script>

<div class="rounded-lg {containerClasses} bg-card p-8 text-center mx-auto">
	{#if displayIcon}
		<div class="text-5xl mb-4 {iconColorClasses}">
			{displayIcon}
		</div>
	{/if}
	
	<h2 class="text-lg font-semibold text-primary mb-2">
		{title}
	</h2>
	
	<p class="text-sm text-secondary max-w-md mx-auto">
		{message}
	</p>

	{#if showRetry && onRetry}
		<button 
			class="mt-6 bg-accent hover:bg-accent-hover text-white font-medium px-6 py-2 rounded-md transition-colors"
			on:click={onRetry}
		>
			Retry
		</button>
	{/if}

	<!-- Optional slot for custom actions -->
	<slot />
</div>