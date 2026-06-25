<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card } from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { buttonVariants } from '$lib/components/ui/button';
	import { User, Send } from '@lucide/svelte/icons';
	import type { Incident, IncidentType } from '$lib/types/Incident.type';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	let incidents = $state<Incident[]>(data.incidents);
	let newMessage = $state('');
	let selectedEleveId = $state('');
	let selectedType = $state<IncidentType>('note');
	let dialogOpen = $state(false);
	let commentTexts = $state<Record<string, string>>({});


	const typeLabels: Record<IncidentType, string> = {
		info: 'Information',
		erreur: 'Erreur',
		note: 'Note positive',
		absent: 'Absence'
	};

	function openNewIncident() {
		selectedEleveId = '';
		selectedType = 'note';
		newMessage = '';
		dialogOpen = true;
	}

	function submitIncident() {
		if (!selectedEleveId || !newMessage.trim()) return;
		const eleve = mockEleves.find((e) => e.id === selectedEleveId);
		if (!eleve) return;
		const incident: Incident = {
			id: Date.now().toString(),
			eleveId: eleve.id,
			eleveNom: eleve.nom,
			elevePrenom: eleve.prenom,
			type: selectedType,
			message: newMessage.trim(),
			auteur: 'Moi',
			date: new Date().toISOString(),
			reactions: [],
			comments: []
		};
		incidents = [incident, ...incidents];
		dialogOpen = false;
	}

	function addReaction(incidentId: string, emoji: string) {
		const incident = incidents.find((i) => i.id === incidentId);
		if (!incident) return;
		const exists = incident.reactions.find((r) => r.emoji === emoji && r.user === 'Moi');
		if (exists) {
			incident.reactions = incident.reactions.filter((r) => !(r.emoji === emoji && r.user === 'Moi'));
		} else {
			incident.reactions = [...incident.reactions, { emoji, user: 'Moi' }];
		}
	}

	function addComment(incidentId: string) {
		const text = commentTexts[incidentId]?.trim();
		if (!text) return;
		const incident = incidents.find((i) => i.id === incidentId);
		if (!incident) return;
		incident.comments = [
			...incident.comments,
			{ id: Date.now().toString(), author: 'Moi', text, date: new Date().toISOString() }
		];
		commentTexts = { ...commentTexts, [incidentId]: '' };
	}

	function formatDate(dateStr: string) {
		const d = new Date(dateStr);
		return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	const mockEleves = [
		{ id: '1', nom: 'RANDRIANANTENAINA', prenom: 'Tsitoarimanjakely' },
		{ id: '2', nom: 'RAKOTO', prenom: 'Fanomezamasy' },
		{ id: '3', nom: 'ANDRIANTENAINA', prenom: 'Bako' }
	];
</script>

<main class="flex h-[calc(100vh-4rem)] flex-col bg-sidebar text-sidebar-foreground">
	<div class="border-border flex items-center justify-between border-b p-4">
		<h1 class="text-xl font-bold">Fil d'incidents</h1>
		<Button onclick={openNewIncident} size="sm">Nouvelle note</Button>
	</div>

	<div class="flex-1 overflow-y-auto p-4 space-y-4">
		{#each incidents as incident (incident.id)}
			<Card class="border-l-4 border-sidebar-border bg-card">
				<div class="p-4">
					<div class="mb-2 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<button
								class="flex items-center gap-2 font-semibold text-primary hover:underline"
								onclick={() => goto(`/eleves/${incident.eleveId}`)}
							>
								<User class="size-4" />
								{incident.eleveNom} {incident.elevePrenom}
							</button>
							<span class="rounded-full bg-muted px-2 py-0.5 text-xs">{typeLabels[incident.type]}</span>
						</div>
						<span class="text-xs text-muted-foreground">{formatDate(incident.date)}</span>
					</div>
					<p class="text-sm leading-relaxed">{incident.message}</p>

					<div class="mt-3 flex items-center gap-2">
						<div class="flex gap-1">
							{#each ['⚠️', '👍', '❤️', '😂'] as emoji}
								<button
									class="rounded px-1.5 py-0.5 text-sm hover:bg-muted {incident.reactions.some((r) => r.emoji === emoji && r.user === 'Moi') ? 'bg-muted' : ''}"
									onclick={() => addReaction(incident.id, emoji)}
								>
									{emoji}
								</button>
							{/each}
						</div>
						{#if incident.reactions.length > 0}
							<span class="text-xs text-muted-foreground">
								{incident.reactions.map((r) => r.emoji).join(' ')}
							</span>
						{/if}
					</div>

					{#if incident.comments.length > 0}
						<div class="mt-3 space-y-2 border-t pt-3">
							{#each incident.comments as comment}
								<div class="flex items-start gap-2">
									<div class="min-w-0 flex-1">
										<span class="text-xs font-medium">{comment.author}</span>
										<p class="text-xs text-muted-foreground">{comment.text}</p>
									</div>
								</div>
							{/each}
						</div>
					{/if}

					<div class="mt-3 flex items-center gap-2">
						<Input
							placeholder="Commenter..."
							bind:value={commentTexts[incident.id]}
							class="h-8 text-xs"
							onkeydown={(e) => {
								if (e.key === 'Enter') addComment(incident.id);
							}}
						/>
						<Button size="icon" variant="ghost" class="h-8 w-8" onclick={() => addComment(incident.id)}>
							<Send class="size-3.5" />
						</Button>
					</div>
				</div>
			</Card>
		{/each}
	</div>

	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Content class="sm:max-w-[500px]">
			<Dialog.Header>
				<Dialog.Title>Nouvelle note</Dialog.Title>
				<Dialog.Description>Signaler un événement concernant un élève.</Dialog.Description>
			</Dialog.Header>
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label>Type</Label>
					<Select.Root type="single" bind:value={selectedType}>
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
					<Label for="eleve-select">Élève</Label>
					<Select.Root type="single" bind:value={selectedEleveId}>
						<Select.Trigger class="w-full">
							{selectedEleveId ? mockEleves.find((e) => e.id === selectedEleveId)?.prenom + ' ' + mockEleves.find((e) => e.id === selectedEleveId)?.nom : 'Sélectionner un élève'}
						</Select.Trigger>
						<Select.Content>
							{#each mockEleves as eleve}
								<Select.Item value={eleve.id}>{eleve.prenom} {eleve.nom}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="grid gap-2">
					<Label for="message">Message</Label>
					<Textarea id="message" bind:value={newMessage} placeholder="Décrire l'incident..." rows={4} />
				</div>
			</div>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => (dialogOpen = false)}>Annuler</Button>
				<Button onclick={submitIncident} disabled={!selectedEleveId || !newMessage.trim()}>Publier</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</main>
