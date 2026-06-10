<script lang="ts">
	import { goto } from '$app/navigation';
	import { Label } from '$lib/components/ui/label';
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Button } from '$lib/components/ui/button';
	import UploadFile from '../form/UploadFile.svelte';
	import pb from '$lib/pocketbase/pocketbase';
	import { env } from '$env/dynamic/public';
	const { classe: cl } = $props();

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
		if (!files || files.length === 0) return;
		const formdata = new FormData();
		formdata.append('file', files[0]);
		const record = await pb.collection('tasc_statics').create(formdata);
		if (record && record.file) {
			c.url = pb.files.getURL(record, record.file);
		}
		open = false;
	}
</script>

<CardUI>
	<div class="h-50 w-full">
		<img
			src={c.url ?? env.PUBLIC_DEFAULT_IMAGE}
			alt="image classe"
			class="h-full w-full object-cover transition-all duration-300 hover:scale-105 hover:grayscale-75"
		/>
	</div>
	<div class={color + ' h-2 w-full'} />
	<div class="flex flex-col gap-4 bg-white/5 p-4">
		<Label>Classe - {niveau} {c.series?.toUpperCase()}</Label>
		<Label>Nombre d'eleves - {c.eleves}</Label>
		<Label>Titulaire - {c.titulaire}</Label>
		<div class="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
			<Button variant="outline" size="sm" class="h-8 rounded-lg px-3 text-xs" onclick={onClick}>Configurer classe</Button>
			<Button size="sm" variant="default" class="h-8 rounded-lg px-3 text-xs" onclick={() => (open = true)}>Modifier image</Button>
			<UploadFile bind:open bind:files>
				<Button size="sm" variant="secondary" class="h-8 rounded-lg px-3 text-xs" onclick={handleSubmit}>Envoyer</Button>
			</UploadFile>
		</div>
	</div>
</CardUI>
