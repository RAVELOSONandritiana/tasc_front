<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Upload } from '@lucide/svelte';
	let {
		open = $bindable(false),
		header = 'uploader image',
		children,
		files = $bindable<FileList | null>(null)
	} = $props();
	let previewUrl = $state('');

	$effect(() => {
		if (files && files.length > 0) {
			previewUrl = URL.createObjectURL(files[0]);
		}
	});
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{header}</AlertDialog.Title>
		</AlertDialog.Header>

		<label
			for="image"
			class="flex h-50 w-full items-center justify-center overflow-hidden border border-2 border-dashed"
		>
			<input type="file" name="image" id="image" class="hidden" bind:files />
			{#if previewUrl.length > 0}
				<img src={previewUrl} alt="preview url" class="object-cover" />
			{:else}
				<Upload size={80} />
			{/if}
		</label>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => (previewUrl = '')}>Cancel</AlertDialog.Cancel>
			{@render children?.()}
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
