<script lang="ts">
	import { goto } from '$app/navigation';
	import { Label } from '$lib/components/ui/label';
	const { classe } = $props();

	function onClick() {
		goto(`/classe/${classe.id}/cours`);
	}

	let color = $state('');
	let niveau = $state('');
	// svelte-ignore state_referenced_locally
	switch (classe.niveau) {
		case '2':
			color = 'border-l-orange-600';
			niveau = '2nd';
			break;
		case '1':
			color = 'border-l-green-600';
			niveau = '1ere';
			break;
		case 't':
			color = 'border-l-blue-600';
			niveau = 'Tle'
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="} space-y-2 rounded-md border
    border-l-5 p-4 shadow-black/50 transition-all duration-300 hover:-translate-y-2 hover:cursor-pointer hover:shadow-lg {color}"
	onclick={onClick}
>
	<Label class="text-2xl hover:cursor-pointer">Classe - {niveau} {classe.series?.toUpperCase()}</Label>
	<Label class="hover:cursor-pointer">Nombre d'eleves: {classe.eleves}</Label>
	<Label class="hover:cursor-pointer">Titulaire : {classe.titulaire}</Label>
</div>
