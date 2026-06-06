<script lang="ts">
	import { goto } from '$app/navigation';
	import { Label } from '$lib/components/ui/label';
	import ImageSalle from '$lib/assets/images/1342060.jpeg';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	const { classe } = $props();

	function onClick() {
		goto(`/classe/${classe.id}/cours`);
	}

	let color = $state('');
	let niveau = $state('');

	// svelte-ignore state_referenced_locally
	switch (classe.niveau) {
		case '2':
			color = 'bg-orange-600';
			niveau = '2nd';
			break;
		case '1':
			color = 'bg-green-600';
			niveau = '1ere';
			break;
		case 't':
			color = 'bg-blue-600';
			niveau = 'Tle';
	}
</script>

<Card.Root class="transition-duration m-0 gap-y-0 p-0">
	<Card.Content class="m-0 p-0">
		<!-- svelte-ignore a11y_img_redundant_alt -->
		<img
			src={ImageSalle}
			alt="image salle"
			class="transitio-all h-full w-full object-cover duration-400 hover:scale-105 hover:grayscale-75"
		/>
	</Card.Content>
	<Separator class={color} />
	<Card.Footer class="m-0 flex flex-col items-start justify-center gap-5 bg-white/10 p-4">
		<Label>Classe - {niveau} {classe.series?.toUpperCase()}</Label>
		<Label>Nombre d'eleves - {classe.eleves}</Label>
		<Label>Titulaire - {classe.titulaire}</Label>
		<div class="flex w-full flex-row items-center justify-between">
			<Button variant="outline" onclick={onClick}>Configurer Classe</Button>
			<Button>Modifier image</Button>
		</div>
	</Card.Footer>
</Card.Root>
