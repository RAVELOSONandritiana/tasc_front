<script lang="ts">
	import { goto } from '$app/navigation';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import UploadFile from '../form/UploadFile.svelte';
	import pb from '$lib/pocketbase/pocketbase';
	import { env } from '$env/dynamic/public';
	const { classe: cl } = $props();

	// svelte-ignore state_referenced_locally
	let c = $state(cl);

	function onClick() {
		goto(`/classe/${c.id}/cours`);
	}

	let color = $state('');
	let niveau = $state('');
	let open = $state(false);
	let files = $state<FileList | null>(null);
	switch (c.niveau) {
		case 0:
			color = 'bg-orange-600';
			niveau = '2nd';
			break;
		case 1:
			color = 'bg-green-600';
			niveau = '1ere';
			break;
		case 2:
			color = 'bg-blue-600';
			niveau = 'Tle';
	}

	async function handleSubmit() {
		if (files) {
			const formdata = new FormData();
			formdata.append('file', files[0]);
			const record = await pb.collection('tasc_statics').create(formdata);
			c.url = pb.files.getURL(record, record.file);
			console.log(record);
		}
		open = false;
	}
</script>

<Card.Root class="transition-duration m-0 gap-y-0 p-0">
	<Card.Content class="m-0 p-0">
		<!-- svelte-ignore a11y_img_redundant_alt -->
		<img
			src={c.url ?? env.PUBLIC_DEFAULT_IMAGE}
			alt="image salle"
			class="transitio-all h-50 w-full object-cover duration-400 hover:scale-105 hover:grayscale-75"
		/>
	</Card.Content>
	<Separator class={color} />
	<Card.Footer class="m-0 flex flex-col items-start justify-center gap-5 bg-white/10 p-4">
		<Label>Classe - {niveau} {c.series?.toUpperCase()}</Label>
		<Label>Nombre d'eleves - {c.eleves}</Label>
		<Label>Titulaire - {c.titulaire}</Label>
		<div class="flex w-full flex-row items-center justify-between">
			<Button variant="outline" onclick={onClick}>Configurer Classe</Button>
			<Button variant="default" onclick={() => (open = true)}>Modifier image</Button>
			<UploadFile bind:open bind:files>
				<Button onclick={handleSubmit}>Envoyer</Button>
			</UploadFile>
		</div>
	</Card.Footer>
</Card.Root>
