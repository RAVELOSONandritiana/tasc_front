<script lang="ts">
	import { goto } from '$app/navigation';
	import { Label } from '$lib/components/ui/label';
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Button } from '$lib/components/ui/button';
	import UploadFile from '../form/UploadFile.svelte';
	import pb, { auth } from '$lib/pocketbase/pocketbase';
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import { Spinner } from '$lib/components/ui/spinner';
	const {
		classe: cl,
		id: classeId,
		deleteAction = ''
	} = $props();

	let c = $state(cl);

	let submittingDelete = $state(false);

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

<CardUI class="relative flex h-full flex-col overflow-hidden transition-all duration-200 hover:shadow-md">
	{#if deleteAction}
		<form method="POST" action={deleteAction} use:enhance={() => {
			submittingDelete = true;
			return async ({ result }: { result: ActionResult }) => {
				submittingDelete = false;
				if (result.type === 'success') {
					window.location.reload();
				} else if (result.type === 'failure') {
					console.error('[Delete] Failure:', result.data);
					alert(result.data?.error || 'Suppression impossible');
				} else {
					console.error('[Delete] Error:', result);
					alert('Erreur lors de la suppression');
				}
			};
		}}>
			<input type="hidden" name="id" value={classeId} />
			<Button
				size="icon"
				variant="destructive"
				class="absolute right-4 top-4 z-10 size-8 rounded-full shadow-sm"
				type="submit"
				title="Supprimer"
				disabled={submittingDelete}
			>
				{#if submittingDelete}
					<Spinner class="size-4" />
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
				{/if}
			</Button>
		</form>
	{/if}
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
