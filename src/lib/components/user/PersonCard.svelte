<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import { Mail, Phone, MapPin } from '@lucide/svelte/icons';
	import PersonAvatar from '$lib/components/user/PersonAvatar.svelte';
	import ConfirmDeleteDialog from '$lib/components/user/ConfirmDeleteDialog.svelte';

	type Person = {
		id: string;
		name: string;
		lastname: string;
		imageUrl?: string | null;
	};

	let {
		personne,
		role = 'PERSONNEL',
		detail = '',
		email = '',
		phone = '',
		domicile = '',
		hrefProfil = '#',
		onDelete
	}: {
		personne: Person;
		role?: string;
		detail?: string;
		email?: string;
		phone?: string;
		domicile?: string;
		hrefProfil?: string;
		onDelete?: (id: string) => void;
	} = $props();

	let submittingDelete = $state(false);
	let confirmOpen = $state(false);
	let deleteForm = $state<HTMLFormElement | null>(null);
	let imageError = $state(false);

	const initials = $derived(
		`${personne.name?.[0] || ''}${personne.lastname?.[0] || ''}`.toUpperCase() || '?'
	);

	const roleLabel = $derived(
		{
			ADMINISTRATEUR: 'Administrateur',
			ENSEIGNANT: 'Enseignant',
			SURVEILLANT: 'Surveillant',
			PERSONNEL: 'Personnel'
		}[role] || role
	);

	const hasContact = $derived(Boolean(email || phone || domicile));
</script>

<CardUI
	class="relative flex h-full flex-col overflow-hidden transition-all duration-200 hover:shadow-md"
>
	{#if onDelete}
		<form
			bind:this={deleteForm}
			method="POST"
			action="?/delete"
			use:enhance={() => {
				submittingDelete = true;
				return async ({ result }: { result: ActionResult }) => {
					submittingDelete = false;
					if (result.type === 'success') {
						onDelete?.(personne.id);
					} else if (result.type === 'failure') {
						alert(result.data?.error || 'Suppression impossible');
					}
				};
			}}
		>
			<input type="hidden" name="id" value={personne.id} />
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
			title="Supprimer {personne.name} {personne.lastname}"
			description="Êtes-vous sûr de vouloir supprimer {personne.name} {personne.lastname} ? Cette action est irréversible."
			loading={submittingDelete}
			onConfirm={() => deleteForm?.requestSubmit()}
		/>
	{/if}

	<div class="h-50 w-full overflow-hidden">
		{#if personne.imageUrl && !imageError}
			<!-- svelte-ignore a11y_img_redundant_alt -->
			<img
				src={personne.imageUrl}
				alt="{personne.name} {personne.lastname}"
				class="h-full w-full object-cover transition-all duration-300 hover:scale-105 hover:grayscale-75"
				onerror={() => (imageError = true)}
			/>
		{:else}
			<div class="flex h-full w-full items-center justify-center bg-muted/30">
				<PersonAvatar
					imageUrl={null}
					name={personne.name}
					lastname={personne.lastname}
					{initials}
					sizeClass="size-16"
				/>
			</div>
		{/if}
	</div>
	<div class="h-2 w-full bg-primary"></div>
	<div class="flex flex-1 flex-col gap-3 bg-white/5 p-4">
		<div class="flex items-center gap-2">
			<span class="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
				>{roleLabel} -</span
			>
			<span class="text-sm font-bold">{personne.name} {personne.lastname}</span>
		</div>
		{#if detail}
			<span class="text-xs text-muted-foreground">{detail}</span>
		{/if}

		{#if hasContact}
			<div class="space-y-1.5 border-t border-white/10 pt-3 text-xs text-muted-foreground">
				<span class="flex items-center gap-2">
					<Mail class="size-3.5 shrink-0" />
					{#if email}
						<span class="truncate">{email}</span>
					{:else}
						<span class="text-muted-foreground/50">—</span>
					{/if}
				</span>
				<span class="flex items-center gap-2">
					<Phone class="size-3.5 shrink-0" />
					{#if phone}
						<span class="truncate">{phone}</span>
					{:else}
						<span class="text-muted-foreground/50">—</span>
					{/if}
				</span>
				<span class="flex items-center gap-2">
					<MapPin class="size-3.5 shrink-0" />
					{#if domicile}
						<span class="truncate">{domicile}</span>
					{:else}
						<span class="text-muted-foreground/50">—</span>
					{/if}
				</span>
			</div>
		{/if}

		<div class="mt-auto flex w-full items-center justify-between gap-2 pt-1">
			<Button
				variant="outline"
				size="sm"
				class="h-8 flex-1 rounded-lg px-3 text-xs"
				onclick={() => goto(hrefProfil)}>Voir profil</Button
			>
		</div>
	</div>
</CardUI>
