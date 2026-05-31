<script lang="ts">
	import { goto } from "$app/navigation";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";


</script>

<main class="p-4 min-h-full rounded-md bg-sidebar text-sidebar-foreground">
	<div class="flex justify-between">
		<Input type="search" placeholder="Rechercher une personne" class="max-w-md" />
		<Button onclick={() => goto('personne/new')}>Creer</Button>
	</div>
</main>
