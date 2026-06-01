<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
</script>

<main class="min-h-full rounded-md bg-sidebar p-4 text-sidebar-foreground">
	<div class="flex justify-between">
		<Input
			type="search"
			placeholder="Rechercher un eleve"
			class="max-w-md"
		/>
		<Button onclick={() => goto('eleves/new')}>Nouveau</Button>
	</div>
</main>
