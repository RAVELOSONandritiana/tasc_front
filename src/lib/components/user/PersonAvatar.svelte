<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';

	let {
		imageUrl = null,
		name = '',
		lastname = '',
		initials = '',
		sizeClass = 'size-10',
		ringClass = ''
	}: {
		imageUrl?: string | null;
		name?: string;
		lastname?: string;
		initials?: string;
		sizeClass?: string;
		ringClass?: string;
	} = $props();

	let imageError = $state(false);

	const computedInitials = $derived(
		initials ||
			`${lastname?.[0] || ''}${name?.[0] || ''}`.toUpperCase() ||
			'?'
	);
</script>

<Avatar.Root class="{sizeClass} {ringClass}">
	{#if imageUrl && !imageError}
		<Avatar.Image src={imageUrl} alt="{name} {lastname}" onerror={() => (imageError = true)} />
	{/if}
	<Avatar.Fallback class="text-sm font-bold">{computedInitials}</Avatar.Fallback>
</Avatar.Root>
