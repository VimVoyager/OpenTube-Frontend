<script lang="ts">
	import type { CommentConfig } from '$lib/adapters/types';
	import { HeartIcon, ThumbsUpIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-svelte';

	interface Props {
		comment: CommentConfig;
		depth?: number;
	}

	let { comment, depth = 0 }: Props = $props();

	let showReplies = $state(false);
	let loadingReplies = $state(false);

	const maxDepth = 3; // Maximum nesting level for replies

	function toggleReplies() {
		if (comment.hasReplies && !showReplies) {
			loadingReplies = true;
			// TODO: Implement reply loading
			// For now, just toggle the state
			setTimeout(() => {
				showReplies = !showReplies;
				loadingReplies = false;
			}, 300);
		} else {
			showReplies = !showReplies;
		}
	}

	function stripHtmlTags(html: string): string {
		// Basic HTML stripping - converts <br> to newlines and removes other tags
		return html
			.replace(/<br\s*\/?>/gi, '\n')
			.replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '$2 ($1)')
			.replace(/<[^>]+>/g, '');
	}
</script>

<div
	class="comment-container"
	class:ml-8={depth > 0}
	class:ml-12={depth > 1}
	style="border-left: {depth > 0 ? '2px solid rgb(var(--color-border) / 0.3)' : 'none'}; padding-left: {depth > 0 ? '1rem' : '0'}"
>
	<div class="flex gap-3 py-4">
		<!-- Avatar -->
		<div class="flex-shrink-0">
			<a href={comment.authorUrl} target="_blank" rel="noopener noreferrer">
				<img
					src={comment.authorAvatar}
					alt="{comment.author}'s avatar"
					class="w-10 h-10 rounded-full object-cover"
				/>
			</a>
		</div>

		<!-- Comment Content -->
		<div class="flex-1 min-w-0">
			<!-- Author and Date -->
			<div class="flex items-center gap-2 mb-1 flex-wrap">
				<a
					href={comment.authorUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="font-semibold text-sm hover:underline"
				>
					{comment.author}
				</a>

				{#if comment.isVerified}
					<svg
						class="w-4 h-4 text-gray-500"
						viewBox="0 0 24 24"
						fill="currentColor"
						aria-label="Verified"
					>
						<path
							d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
						/>
					</svg>
				{/if}

				{#if comment.isChannelOwner}
					<span
						class="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-xs rounded-full font-medium"
					>
						Creator
					</span>
				{/if}

				<span class="text-xs text-gray-600 dark:text-gray-400">
					{comment.uploadDate}
				</span>

				{#if comment.isPinned}
					<span class="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
						<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
							<path
								d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146z"
							/>
						</svg>
						Pinned
					</span>
				{/if}
			</div>

			<!-- Comment Text -->
			<div class="text-sm mb-2 whitespace-pre-wrap wrap-break-word">
				{@html comment.text}
			</div>

			<!-- Actions -->
			<div class="flex items-center gap-4 text-xs">
				<button
					class="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded transition-colors"
				>
					<ThumbsUpIcon class="w-4 h-4" />
					<span>{comment.likeCountText}</span>
				</button>

				{#if comment.isHearted}
					<div class="flex items-center gap-1 text-red-500" title="Hearted by creator">
						<HeartIcon class="w-4 h-4 fill-current" />
					</div>
				{/if}

				{#if comment.hasReplies && depth < maxDepth}
					<button
						onclick={toggleReplies}
						class="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded transition-colors font-medium"
						disabled={loadingReplies}
					>
						{#if loadingReplies}
							<span class="animate-pulse">Loading...</span>
						{:else}
							{#if showReplies}
								<ChevronUpIcon class="w-4 h-4" />
							{:else}
								<ChevronDownIcon class="w-4 h-4" />
							{/if}
							<span>
								{comment.replyCount}
								{comment.replyCount === 1 ? 'reply' : 'replies'}
							</span>
						{/if}
					</button>
				{/if}
			</div>

			<!-- Replies Section (placeholder for future implementation) -->
			{#if showReplies && comment.hasReplies}
				<div class="mt-4">
					<p class="text-sm text-gray-500 italic">
						Replies loading... (To be implemented with reply fetching)
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
    .comment-container {
        transition: background-color 0.2s ease;
    }

    .comment-container:hover {
        background-color: rgb(0 0 0 / 0.02);
    }

    :global(.dark) .comment-container:hover {
        background-color: rgb(255 255 255 / 0.02);
    }
</style>