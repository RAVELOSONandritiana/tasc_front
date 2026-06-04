<script lang="ts">
	import { goto } from '$app/navigation';
	import { Label } from '$lib/components/ui/label';
	import type { Classe } from '$lib/types/Materiel.type';
	const { classe }: { classe: Classe } = $props();

	function onClick() {
		goto(`/classe/${classe.id}/cours`);
	}

	let color = $state('border-l-blue-600');
	// svelte-ignore state_referenced_locally
	switch (classe.niveau) {
		case 2:
			color = 'border-l-orange-600';
			break;
		case 1:
			color = 'border-l-green-600';
			break;
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="} space-y-2 rounded-md border
    border-l-5 p-4 shadow-black/50 transition-all duration-300 hover:-translate-y-2 hover:cursor-pointer hover:shadow-lg {color}"
	onclick={onClick}
>
	<Label class="text-2xl hover:cursor-pointer">Classe - {classe.name}</Label>
	<Label class="hover:cursor-pointer">Nombre d'eleves: {classe.eleves}</Label>
	<Label class="hover:cursor-pointer">Niveau : {classe.niveau}</Label>
</div>
