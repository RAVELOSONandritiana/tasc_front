<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Dialog from '$lib/components/ui/dialog';
	import { AlertCircle, Shield, X } from '@lucide/svelte/icons';
	import type { PageProps } from './$types';
	import IncidentPost from '$lib/components/user/incidents/IncidentPost.svelte';

	const { data }: PageProps = $props();

	const incidents = $derived(data.incidents);
	const eleves = $derived(data.eleves);
	const currentUserId = $derived(data.currentUserId);

	let newMessage = $state('');
	let selectedEleveId = $state<string>('');
	let selectedType = $state<'info' | 'erreur' | 'note' | 'absent'>('note');
	let dialogOpen = $state(false);
	let searchQuery = $state('');

	const searchResults = $derived(
		searchQuery.trim().length > 0 && !selectedEleveId
			? eleves.filter((e) =>
					`${e.prenom}${e.nom}${e.classe}${e.dateNaissance}`.toLowerCase().includes(searchQuery.toLowerCase())
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

	function selectEleve(e: typeof eleves[0]) {
		selectedEleveId = e.id;
		searchQuery = `${e.prenom} ${e.nom}`;
	}

	function resetSelection() {
		selectedEleveId = '';
		searchQuery = '';
	}
</script>

<main class="flex h-[calc(100vh-4rem)] flex-col bg-background text-foreground">
	<div class="animate-slide-down flex items-center justify-between border-b border-sidebar-border bg-card/80 backdrop-blur-sm px-4 py-3 sticky top-16 z-40">
		<div class="flex items-center gap-3">
			<div class="flex size-9 items-center justify-center rounded-lg bg-primary/10">
				<Shield class="size-5 text-primary" />
			</div>
			<div>
				<h1 class="text-lg font-bold">Fil d'incidents</h1>
				<p class="text-xs text-muted-foreground">{incidents.length} incident{incidents.length > 1 ? 's' : ''}</p>
			</div>
		</div>
		<Button onclick={openNewIncident} size="sm" class="gap-2">
			<AlertCircle class="size-3.5" />
			Nouvelle note
		</Button>
	</div>

	<div class="flex-1 overflow-y-auto p-4">
		<div class="max-w-2xl mx-auto space-y-4">
			{#if incidents.length === 0}
				<div class="flex flex-col items-center justify-center py-20 text-muted-foreground">
					<div class="size-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
						<AlertCircle class="size-10 text-muted-foreground/50" />
					</div>
					<p class="text-sm font-medium mb-1">Aucun incident signalé</p>
					<p class="text-xs text-muted-foreground/70 mb-6 text-center">Les incidents apparaîtront ici une fois créés.</p>
					<Button onclick={openNewIncident} variant="outline" size="sm">Créer un incident</Button>
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
			<form method="POST" action="?/create">
				<div class="grid gap-4 py-4">
					<div class="grid gap-2">
						<Label for="type">Type</Label>
						<select id="type" name="type" bind:value={selectedType} class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
							<option value="info">Information</option>
							<option value="erreur">Erreur</option>
							<option value="note">Note positive</option>
							<option value="absent">Absence</option>
						</select>
					</div>
					<div class="grid gap-2">
						<Label>Élève</Label>
						<Input placeholder="Rechercher un élève..." bind:value={searchQuery} />
						{#if searchResults.length > 0 && !selectedEleveId}
							<div class="mt-2 max-h-72 space-y-2 overflow-y-auto rounded-md border p-2">
								{#each searchResults as e (e.id)}
									<button
										type="button"
										class="flex w-full flex-col rounded-md border px-3 py-2 text-left hover:bg-muted transition-colors"
										onclick={() => selectEleve(e)}
									>
										<p class="text-sm font-medium">{e.prenom} {e.nom}</p>
										<p class="text-xs text-muted-foreground">{e.classe || ''}</p>
										<p class="text-xs text-muted-foreground">{e.dateNaissance || ''}</p>
									</button>
								{/each}
							</div>
						{/if}
						{#if selectedEleveId}
							{@const selectedEleve = eleves.find((e) => e.id === selectedEleveId)}
							<div class="flex items-center justify-between gap-2 rounded-md border p-3 mt-2">
								<div>
									<p class="text-sm font-medium">{selectedEleve?.prenom} {selectedEleve?.nom}</p>
									<p class="text-xs text-muted-foreground">{selectedEleve?.classe || ''}</p>
									<p class="text-xs text-muted-foreground">{selectedEleve?.dateNaissance || ''}</p>
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
						<Textarea id="message" name="message" bind:value={newMessage} placeholder="Décrire l'incident..." rows={4} />
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