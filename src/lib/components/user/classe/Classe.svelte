<script lang="ts">
	import { goto } from '$app/navigation';
	import { Label } from '$lib/components/ui/label';
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Button } from '$lib/components/ui/button';
	import UploadFile from '../form/UploadFile.svelte';
	import pb, { auth } from '$lib/pocketbase/pocketbase';
	const { classe: cl } = $props();

	let c = $state(cl);

	async function ensureAuth() {
		try {
			await auth();
		} catch (e) {
			console.error('PocketBase unavailable' , e);
		}
	}

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
		await ensureAuth();
		const formdata = new FormData();
		formdata.append('file', files[0]);
		try {
			const record = await pb.collection('tasc_statics').create(formdata);
			if (record && record.file) {
					const url = pb.files.getURL(record, record.file);
					c.url = url;
					try {
						const fd = new FormData();
						fd.append('id', c.id);
						fd.append('imageUrl', url);
						const res = await fetch('/classe?/updateImage', { method: 'POST', body: fd });
						const result = await res.json().catch(() => null);
						const oldImageUrl = result?.oldImageUrl;
						if (oldImageUrl && oldImageUrl !== url) {
							const segments = oldImageUrl.split('/');
							const recordId = segments[segments.length - 2];
							if (recordId) {
								await pb.collection('tasc_statics').delete(recordId).catch(() => {});
							}
						}
					} catch (e) {
						console.error('Failed to save image to DB:', e);
					}
			}
		} catch (e) {
			console.error('Upload failed:', e);
		}
		open = false;
	}

	let imageError = $state(false);
</script>

<CardUI>
	<div class="h-50 w-full overflow-hidden">
		{#if c.url && !imageError}
			<!-- svelte-ignore a11y_img_redundant_alt -->
			<img
				src={c.url}
				alt="image classe"
				class="h-full w-full object-cover transition-all duration-300 hover:scale-105 hover:grayscale-75"
				onerror={() => (imageError = true)}
			/>
		{:else}
			<div class="flex h-full w-full items-center justify-center bg-muted/30">
				<span class="text-lg font-bold text-muted-foreground">
					CLASSE - {niveau} {c.nom ? c.nom.toUpperCase() : ''}
				</span>
			</div>
		{/if}
	</div>
	<div class={color + ' h-2 w-full'} ></div>
	<div class="flex flex-col gap-4 bg-white/5 p-4">
		<div class="flex items-center gap-2">
			<span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CLASSE -</span>
			<span class="text-sm font-bold">{niveau} {c.nom ? c.nom.toUpperCase() : ''}</span>
		</div>
		<Label>Nombre d'eleves - {c.eleves}</Label>
		{#if c.titulaireId}
			<a href="/enseignant/{c.titulaireId}" class="text-sm font-medium text-primary hover:underline">
				Titulaire - {c.titulaire}
			</a>
		{:else}
			<Label>Titulaire - {c.titulaire}</Label>
		{/if}
		<div class="flex w-full items-center justify-between gap-2">
			<Button
				variant="outline"
				size="sm"
				class="h-8 flex-1 rounded-lg px-3 text-xs"
				onclick={onClick}>Configurer classe</Button
			>
			<div class="flex flex-1 gap-2">
				<Button
					size="sm"
					variant="default"
					class="h-8 flex-1 rounded-lg px-3 text-xs"
					onclick={() => (open = true)}>Modifier image</Button
				>
				<UploadFile bind:open bind:files onSubmit={handleSubmit} />
			</div>
		</div>
	</div>
</CardUI>
