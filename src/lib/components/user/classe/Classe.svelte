<script lang="ts">
	import { goto } from '$app/navigation';
	import { Label } from '$lib/components/ui/label';
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import UploadFile from '../form/UploadFile.svelte';
	import pb, { auth } from '$lib/pocketbase/pocketbase';
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import { Spinner } from '$lib/components/ui/spinner';
	import * as NativeSelect from '$lib/components/ui/native-select/index.js';
	import type { Personne } from '$lib/types/Personne.type';
	import { Pencil } from '@lucide/svelte/icons';
	import { Input } from '$lib/components/ui/input';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	const {
		classe: cl,
		id: classeId,
		deleteAction = '',
		enseignants = []
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

	let open = $state(false);
	let files = $state<FileList | null>(null);

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
				imageError = false;
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

	let openEdit = $state(false);
	let editNom = $state('');
	let editNiveau = $state('0');
	let editSerie = $state('');
	let editSelectedProf: Personne | null = $state(null);
	let editSearchProf = $state('');
	let editSubmitting = $state(false);
	let editSuccess = $state(false);
	let editErrors = $state<Record<string, string>>({});

	const editSearchResults = $derived(
		editSearchProf.trim().length > 0 && !editSelectedProf
			? enseignants.filter((p) =>
					`${p.name} ${p.lastname} ${p.email} ${p.phone}`
						.toLowerCase()
						.includes(editSearchProf.toLowerCase())
				)
			: []
	);

	function openEditDialog() {
		editNom = c.nom || '';
		editNiveau = c.niveau.toString();
		editSerie = c.series || '';
		editSelectedProf = c.titulaireId && enseignants.find((p) => p.id === c.titulaireId) || null;
		editSearchProf = editSelectedProf ? `${editSelectedProf.name} ${editSelectedProf.lastname}` : '';
		editErrors = {};
		editSuccess = false;
		openEdit = true;
	}

	function resetEditForm() {
		editNom = '';
		editNiveau = '0';
		editSerie = '';
		editSearchProf = '';
		editSelectedProf = null;
		editErrors = {};
		editSuccess = false;
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
					dispatch('delete', { id: classeId });
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

	<div class="absolute right-16 top-4 z-10">
		<Dialog.Root bind:open={openEdit}>
			<Dialog.Trigger type="button" class={buttonVariants({ variant: 'secondary', size: 'icon', class: 'size-8 rounded-full shadow-sm' })} onclick={openEditDialog}>
				<Pencil class="size-4" />
			</Dialog.Trigger>
			<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-sm">
				<Dialog.Header>
					<Dialog.Title>Modifier la classe</Dialog.Title>
				</Dialog.Header>

				{#if editSuccess}
					<div class="mb-4 rounded-md border border-emerald-500 bg-emerald-500/10 p-4 text-center">
						<p class="text-sm font-medium text-emerald-500">Classe modifiée avec succès !</p>
					</div>
				{/if}
				{#if editErrors._form}
					<div class="mb-4 rounded-md border border-destructive bg-destructive/10 p-3">
						<p class="text-sm text-destructive">{editErrors._form}</p>
					</div>
				{/if}

				<form
					method="POST"
					action="?/update"
					use:enhance={() => {
						editSubmitting = true;
						editErrors = {};
						return async ({ result }: { result: ActionResult }) => {
							editSubmitting = false;
							const data = result.data as { classe?: typeof cl } | undefined;
							if (result.type === 'success') {
								const updatedClasse = data?.classe;
								if (updatedClasse) {
									c.nom = updatedClasse.nom;
									c.niveau = updatedClasse.niveau;
									c.series = updatedClasse.series;
									c.titulaire = updatedClasse.titulaire;
									c.titulaireId = updatedClasse.titulaireId;
									c.eleves = updatedClasse.eleves;
								}
								editSuccess = true;
								setTimeout(() => {
									resetEditForm();
									openEdit = false;
								}, 800);
							} else if (result.type === 'failure') {
								editErrors = result.data?.errors || {};
							}
						};
					}}
					class="space-y-4"
				>
					<div class="grid gap-4">
						<div class="grid gap-2">
							<Label for="nom">Nom</Label>
							<input
								id="nom"
								name="nom"
								bind:value={editNom}
								placeholder="Ex: 2nde S, 1ère L..."
								class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							/>
						</div>

						<div class="grid gap-2">
							<Label for="niveau">Niveau *</Label>
							<NativeSelect.Root required class="w-full" bind:value={editNiveau} name="niveau">
								<NativeSelect.Option value="0">2nd</NativeSelect.Option>
								<NativeSelect.Option value="1">1ere</NativeSelect.Option>
								<NativeSelect.Option value="2">Terminale</NativeSelect.Option>
							</NativeSelect.Root>
						</div>

						<div class="grid gap-2">
							<Label for="serie">Série</Label>
							<NativeSelect.Root class="w-full" bind:value={editSerie} name="serie">
								<NativeSelect.Option value="">Aucune</NativeSelect.Option>
								<NativeSelect.Option value="ose">OSE</NativeSelect.Option>
								<NativeSelect.Option value="s">S</NativeSelect.Option>
								<NativeSelect.Option value="l">L</NativeSelect.Option>
							</NativeSelect.Root>
						</div>

						<div class="grid gap-3">
							<Label>Prof titulaire</Label>
							<div class="relative">
								<Input
									id="editProf"
									placeholder="Rechercher un professeur..."
									value={editSearchProf}
									oninput={(e) =>
										(editSearchProf = (e.target as HTMLInputElement).value
											.replace(/\s+/g, ' ')
											.trim())}
								/>
								{#if editSearchResults.length > 0 && !editSelectedProf}
									<div class="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-md border p-2">
										{#each editSearchResults as p (p.id)}
											<button
												type="button"
												class="flex w-full flex-col rounded-md border px-3 py-2 text-left transition-colors hover:bg-muted"
												onclick={() => {
													editSelectedProf = p;
													editSearchProf = `${p.name} ${p.lastname}`;
												}}
											>
												<p class="text-sm font-medium">{p.name} {p.lastname}</p>
												<p class="text-xs text-muted-foreground">{p.email || ''}</p>
											</button>
										{/each}
									</div>
								{/if}
								{#if editSelectedProf}
									<div class="mt-2 flex items-center justify-between gap-2 rounded-lg bg-muted/30 p-2">
										<div class="flex items-center gap-2">
											<div class="flex size-8 items-center justify-center rounded-full bg-primary/10">
												<span class="text-sm font-bold text-primary">
													{editSelectedProf.name[0]}{editSelectedProf.lastname[0]}
												</span>
											</div>
											<span class="text-sm font-medium">
												{editSelectedProf.name} {editSelectedProf.lastname}
											</span>
										</div>
										<button
											type="button"
											class="rounded-full p-1 hover:bg-muted"
											onclick={() => {
												editSelectedProf = null;
												editSearchProf = '';
											}}
										>
											<span class="text-xs text-muted-foreground">×</span>
										</button>
									</div>
								{/if}
							</div>
						</div>
					</div>

					<div class="flex items-center gap-2">
						<Button type="submit" disabled={editSubmitting || editSuccess}>
							{#if editSubmitting}
								<Spinner class="mr-2 size-4" />
								Sauvegarde...
							{:else if editSuccess}
								Sauvé !
							{:else}
								<Pencil class="mr-2 size-4" />
								Sauvegarder
							{/if}
						</Button>
						<Button
							type="button"
							variant="outline"
							onclick={resetEditForm}
							disabled={editSubmitting || editSuccess}
						>
							Annuler
						</Button>
					</div>

					<input type="hidden" name="id" value={classeId} />
					<input type="hidden" name="titulaireId" value={editSelectedProf?.id || ''} />
				</form>
			</Dialog.Content>
		</Dialog.Root>
	</div>

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
