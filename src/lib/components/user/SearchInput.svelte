<script lang="ts">
	import SearchIcon from '@lucide/svelte/icons/search';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	let { value = $bindable(''), ...rest } = $props();
</script>

<InputGroup.Root class="max-w-md">
	<InputGroup.Input {...rest} type="search" bind:value />
	<InputGroup.Addon>
		<SearchIcon />
	</InputGroup.Addon>
</InputGroup.Root>
