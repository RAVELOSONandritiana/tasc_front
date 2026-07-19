<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Spinner } from '$lib/components/ui/spinner';
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import type { Eleve } from '$lib/types/Personne.type';
	import PersonAvatar from '$lib/components/user/PersonAvatar.svelte';
	import ConfirmDeleteDialog from '$lib/components/user/ConfirmDeleteDialog.svelte';
	import { formatAge } from '$lib/utils';

	let {
		eleve,
		onDelete
	}: {
		eleve: Eleve;
		onDelete?: (id: string) => void;
	} = $props();

	let submittingDelete = $state(false);
	let confirmOpen = $state(false);
	let deleteForm = $state<HTMLFormElement | null>(null);
	let imageError = $state(false);

	const initials = $derived(
		`${eleve.prenom?.[0] || ''}${eleve.nom?.[0] || ''}`.toUpperCase() || '?'
	);
	const age = $derived(formatAge(eleve.dateNaissance));
</script>

<CardUI
	class="relative flex h-full flex-col overflow-hidden transition-all duration-200 hover:shadow-md"
>
	<form
		bind:this={deleteForm}
		method="POST"
		action="?/delete"
		use:enhance={() => {
			submittingDelete = true;
			return async ({ result }: { result: ActionResult }) => {
				submittingDelete = false;
				if (result.type === 'success') {
					onDelete?.(eleve.id);
				} else if (result.type === 'failure') {
					alert(result.data?.error || 'Suppression impossible');
				}
			};
		}}
	>
		<input type="hidden" name="id" value={eleve.id} />
	</form>
	<Button
		size="icon"
		variant="destructive"
		class="absolute top-4 right-4 z-10 size-8 rounded-full shadow-sm"
		type="button"
		title="Supprimer"
		onclick={() => (confirmOpen = true)}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path
				d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
			/></svg
		>
	</Button>
	<ConfirmDeleteDialog
		bind:open={confirmOpen}
		title="Supprimer l'élève"
		description="Êtes-vous sûr de vouloir supprimer {eleve.nom} {eleve.prenom} ? Cette action est irréversible."
		loading={submittingDelete}
		onConfirm={() => deleteForm?.requestSubmit()}
	/>

	<div class="h-50 w-full overflow-hidden">
		{#if eleve.imageUrl && !imageError}
			<!-- svelte-ignore a11y_img_redundant_alt -->
			<img
				src={eleve.imageUrl}
				alt="{eleve.nom} {eleve.prenom}"
				class="h-full w-full object-cover transition-all duration-300 hover:scale-105 hover:grayscale-75"
				onerror={() => (imageError = true)}
			/>
		{:else}
			<div class="flex h-full w-full items-center justify-center bg-muted/30">
				<PersonAvatar
					imageUrl={null}
					name={eleve.nom}
					lastname={eleve.prenom}
					{initials}
					sizeClass="size-16"
				/>
			</div>
		{/if}
	</div>
	<div class="h-2 w-full bg-primary"></div>
	<div class="flex flex-col gap-4 bg-white/5 p-4">
		<div class="flex items-center gap-2">
			<span class="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
				>ELEVE -</span
			>
			<span class="text-sm font-bold">{eleve.nom} {eleve.prenom}</span>
		</div>
		<span class="text-xs text-muted-foreground">Classe - {eleve.classe}</span>
		{#if age}
			<span class="text-xs text-muted-foreground">Âge - {age}</span>
		{/if}
		<div class="flex w-full items-center justify-between gap-2">
			<Button
				variant="outline"
				size="sm"
				class="h-8 flex-1 rounded-lg px-3 text-xs"
				onclick={() => goto(`/eleves/${eleve.id}`)}>Voir profil</Button
			>
		</div>
	</div>
</CardUI>
