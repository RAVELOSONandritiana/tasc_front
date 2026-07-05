<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Send, AlertCircle, Shield } from '@lucide/svelte/icons';
	import type { IncidentType } from '$lib/types/Incident.type';
	import type { PageProps } from './$types';
	import IncidentPost from '$lib/components/user/incidents/IncidentPost.svelte';

	const { data }: PageProps = $props();

	const incidents = $derived(data.incidents);
	const eleves = $derived(data.eleves);

	const typeLabels: Record<IncidentType, string> = {
		info: 'Information',
		erreur: 'Erreur',
		note: 'Note positive',
		absent: 'Absence'
	};

	let newMessage = $state('');
	let selectedEleveId = $state('');
	let selectedType = $state<IncidentType>('note');
	let dialogOpen = $state(false);

	function openNewIncident() {
		selectedEleveId = '';
		selectedType = 'note';
		newMessage = '';
		dialogOpen = true;
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
					<IncidentPost {incident} {eleves} />
				{/each}
			{/if}
		</div>
	</div>

	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Content class="sm:max-w-[500px]">
			<Dialog.Header>
				<Dialog.Title>Nouvelle note</Dialog.Title>
				<Dialog.Description>Signaler un événement concernant un élève.</Dialog.Description>
			</Dialog.Header>
			<form method="POST" action="?/create" class="contents">
				<div class="grid gap-4 py-4">
					<div class="grid gap-2">
						<Label>Type</Label>
						<Select.Root type="single" name="type" bind:value={selectedType}>
							<Select.Trigger class="w-full">
								{typeLabels[selectedType]}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="info">Information</Select.Item>
								<Select.Item value="erreur">Erreur</Select.Item>
								<Select.Item value="note">Note positive</Select.Item>
								<Select.Item value="absent">Absence</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
					<div class="grid gap-2">
						<Label>Élève</Label>
						<Select.Root type="single" name="eleveId" bind:value={selectedEleveId}>
							<Select.Trigger class="w-full">
								{selectedEleveId ? eleves.find((e) => e.id === selectedEleveId)?.prenom + ' ' + eleves.find((e) => e.id === selectedEleveId)?.nom : 'Sélectionner un élève'}
							</Select.Trigger>
							<Select.Content>
								{#each eleves as eleve}
									<Select.Item value={eleve.id}>{eleve.prenom} {eleve.nom}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<div class="grid gap-2">
						<Label>Message</Label>
						<Textarea name="message" bind:value={newMessage} placeholder="Décrire l'incident..." rows={4} />
					</div>
				</div>
				<Dialog.Footer>
					<Button variant="outline" onclick={() => (dialogOpen = false)}>Annuler</Button>
					<Button type="submit" disabled={!selectedEleveId || !newMessage.trim()}>Publier</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
</main>