<script lang="ts">
	import type { Salle } from '$lib/types/Materiel.type';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import UploadFile from '../form/UploadFile.svelte';
	import pb from '$lib/pocketbase/pocketbase';

	const { salle }: { salle: Salle } = $props();

	// svelte-ignore state_referenced_locally
	let sl = $state(salle);

	let open = $state(false);
	let files = $state<FileList | null>(null);
	async function handleSubmit() {
		if (files && files.length > 0) {
			const formdata = new FormData();
			formdata.append('file', files[0]);
			const record = await pb.collection('tasc_statics').create(formdata);
			if (record) {
				sl.url = await pb.files.getURL(record, record.file);
			}
			open = false;
		}
	}
</script>

<Card.Root class="transition-duration m-0 gap-y-0 p-0 transition-all duration-300">
	<Card.Content class="m-0 p-0">
		<!-- svelte-ignore a11y_img_redundant_alt -->
		<img
			src={sl.url ??
				'http://127.0.0.1:8090/api/files/pbc_2737510288/9k76pvudya1tu4k/1333324_sj3bdcj31d.png'}
			alt="image salle"
			class="h-50 w-full object-cover transition-all duration-300 hover:scale-105 hover:grayscale-75"
		/>
	</Card.Content>
	<Card.Footer class="m-0 flex flex-col items-start justify-center gap-5 bg-white/10 p-4">
		<div class="flex w-full items-center justify-between">
			<Label>Salle - {sl.num}</Label><span
				class="h-4 w-4 rounded-full {sl.used ? 'bg-purple-500' : 'bg-green-600'}"
			>
			</span>
		</div>
		<Label>Place - {salle.place}</Label>
		<div class="flex w-full flex-row items-center justify-between">
			<Button variant="outline">Modifier Salle</Button>
			<Button onclick={() => (open = true)}>Modifier image</Button>
			<UploadFile bind:open bind:files>
				<Button onclick={handleSubmit}>Envoyer</Button>
			</UploadFile>
		</div>
	</Card.Footer>
</Card.Root>
