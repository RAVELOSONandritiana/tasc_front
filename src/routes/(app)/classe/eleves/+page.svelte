<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import SearchIcon from '@lucide/svelte/icons/search';
</script>

<main class="min-h-full rounded-md bg-sidebar p-4 text-sidebar-foreground">
	<div class="flex justify-between">
		<InputGroup.Root class="max-w-md">
			<InputGroup.Input type="search" placeholder="Rechercher un eleve" />
			<InputGroup.Addon>
				<SearchIcon />
			</InputGroup.Addon>
		</InputGroup.Root>
		<Button onclick={() => goto('eleves/new')}>Nouveau</Button>
	</div>
</main>
