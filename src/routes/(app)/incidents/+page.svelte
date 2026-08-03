<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import { AlertCircle, Shield, X } from '@lucide/svelte/icons';
	import type { PageProps } from './$types';
	import IncidentPost from '$lib/components/user/incidents/IncidentPost.svelte';
						import { loadingForm } from '$lib/actions/loadingForm';
	import { page } from '$app/stores';
	import { formatAge } from '$lib/utils';

	const { data, form }: PageProps = $props();
	const incidents = $derived(data.incidents);
	const eleves = $derived(data.eleves);
	const currentUserId = $derived(data.currentUserId);
	const anneeSelectionnee = $derived(Boolean($page.data.anneeActiveId));

	let newMessage = $state('');
	let selectedEleveId = $state<string>('');
	let selectedType = $state<'info' | 'erreur' | 'note'>('note');
	let dialogOpen = $state(false);
	let searchQuery = $state('');

	const searchResults = $derived(
		searchQuery.trim().length > 0 && !selectedEleveId
			? eleves.filter((e) =>
					`${e.prenom}${e.nom}${e.classe}${e.dateNaissance}`
						.toLowerCase()
						.includes(searchQuery.toLowerCase())
				)
			: []
	);

	function openNewIncident() {
		selectedEleveId = '';
		selectedType = 'note';
		newMessage = '';
		searchQuery = '';
		dialogOpen = true;
	}

	function selectEleve(e: (typeof eleves)[0]) {
		selectedEleveId = e.id;
		searchQuery = `${e.nom} ${e.prenom}`;
	}

	function resetSelection() {
		selectedEleveId = '';
		searchQuery = '';
	}
</script>

<main class="flex min-h-0 flex-1 flex-col bg-background text-foreground">
	<div
		class="animate-slide-down sticky top-0 z-40 flex items-center justify-between border-b border-sidebar-border bg-card/80 px-4 py-3 backdrop-blur-sm"
	>
		<div class="flex items-center gap-3">
			<div class="flex size-9 items-center justify-center rounded-lg bg-primary/10">
				<Shield class="size-5 text-primary" />
			</div>
			<div>
				<h1 class="text-lg font-bold">Fil d'incidents</h1>
				<p class="text-xs text-muted-foreground">
					{incidents.length} incident{incidents.length > 1 ? 's' : ''}
				</p>
			</div>
		</div>
		<Button
			onclick={openNewIncident}
			size="sm"
			class="gap-2"
			disabled={!anneeSelectionnee}
			title={anneeSelectionnee ? undefined : "Aucune année scolaire n'est sélectionnée"}
		>
			<AlertCircle class="size-3.5" />
			Nouvelle note
		</Button>
	</div>

	<div class="flex-1 overflow-y-auto p-4">
		<div class="space-y-4">
			{#if incidents.length === 0}
				<div class="flex flex-col items-center justify-center py-20 text-muted-foreground">
					<div class="mb-4 flex size-20 items-center justify-center rounded-full bg-muted/30">
						<AlertCircle class="size-10 text-muted-foreground/50" />
					</div>
					<p class="mb-1 text-sm font-medium">Aucun incident signalé</p>
					<p class="mb-6 text-center text-xs text-muted-foreground/70">
						Les incidents apparaîtront ici une fois créés.
					</p>
					<Button
						onclick={openNewIncident}
						variant="outline"
						size="sm"
						disabled={!anneeSelectionnee}
						title={anneeSelectionnee ? undefined : "Aucune année scolaire n'est sélectionnée"}
						>Créer un incident</Button
					>
				</div>
			{:else}
				{#each incidents as incident (incident.id)}
					<IncidentPost {incident} {eleves} {currentUserId} />
				{/each}
			{/if}
		</div>
	</div>

	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Content class="sm:max-w-125">
			<Dialog.Header>
				<Dialog.Title>Nouvelle note</Dialog.Title>
				<Dialog.Description>Signaler un événement concernant un élève.</Dialog.Description>
			</Dialog.Header>
			<form method="POST" action="?/create" use:loadingForm>
				<div class="grid gap-4 py-4">
					{#if form?.error}
						<div class="rounded-md border border-destructive/50 bg-destructive/10 p-3">
							<p class="text-sm text-destructive">{form.error}</p>
						</div>
					{/if}
					<div class="grid gap-2">
						<Label>Type</Label>
						<ToggleGroup.Root
							type="single"
							variant="outline"
							class="grid w-full grid-cols-3"
							value={selectedType}
							onValueChange={(v) => {
								if (v) selectedType = v as 'info' | 'erreur' | 'note';
							}}
						>
							<ToggleGroup.Item value="info">Information</ToggleGroup.Item>
							<ToggleGroup.Item value="erreur">Erreur</ToggleGroup.Item>
							<ToggleGroup.Item value="note">Note positive</ToggleGroup.Item>
						</ToggleGroup.Root>
						<input type="hidden" name="type" value={selectedType} />
					</div>
					<div class="grid gap-2">
						<Label>Élève</Label>
						<Input placeholder="Rechercher un élève..." bind:value={searchQuery} />
						{#if searchResults.length > 0 && !selectedEleveId}
							<div class="mt-2 max-h-72 space-y-2 overflow-y-auto rounded-md border p-2">
								{#each searchResults as e (e.id)}
									<button
										type="button"
										class="flex w-full flex-col rounded-md border px-3 py-2 text-left transition-colors hover:bg-muted"
										onclick={() => selectEleve(e)}
									>
									<p class="text-sm font-medium">{e.nom} {e.prenom}</p>
									<p class="text-xs text-muted-foreground">{e.classe || ''}</p>
									<p class="text-xs text-muted-foreground">
										{e.dateNaissance ? new Date(e.dateNaissance).toLocaleDateString() : ''}
										{formatAge(e.dateNaissance) ? ` · ${formatAge(e.dateNaissance)}` : ''}
									</p>
									</button>
								{/each}
							</div>
						{/if}
						{#if selectedEleveId}
							{@const selectedEleve = eleves.find((e) => e.id === selectedEleveId)}
							<div class="mt-2 flex items-center justify-between gap-2 rounded-md border p-3">
								<div>
									<p class="text-sm font-medium">{selectedEleve?.nom} {selectedEleve?.prenom}</p>
									<p class="text-xs text-muted-foreground">{selectedEleve?.classe || ''}</p>
									<p class="text-xs text-muted-foreground">
										{selectedEleve?.dateNaissance
											? new Date(selectedEleve.dateNaissance).toLocaleDateString()
											: ''}
										{formatAge(selectedEleve?.dateNaissance)
											? ` · ${formatAge(selectedEleve?.dateNaissance)}`
											: ''}
									</p>
								</div>
								<button
									type="button"
									class="rounded-full p-1 hover:bg-muted"
									onclick={resetSelection}
								>
									<X class="size-4 text-muted-foreground" />
								</button>
							</div>
						{/if}
					</div>
					<div class="grid gap-2">
						<Label for="message">Message</Label>
						<Textarea
							id="message"
							name="message"
							bind:value={newMessage}
							placeholder="Décrire l'incident..."
							rows={4}
						/>
					</div>
					<input type="hidden" name="eleveId" value={selectedEleveId} />
				</div>
				<Dialog.Footer>
					<Button variant="outline" onclick={() => (dialogOpen = false)}>Annuler</Button>
					<Button type="submit" disabled={!selectedEleveId || !newMessage.trim()}>Publier</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
</main>
