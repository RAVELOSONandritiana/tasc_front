<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Avatar  from '$lib/components/ui/avatar';
	import { Send, AlertCircle, Info, Star, UserX, Shield } from '@lucide/svelte/icons';
	import type { Incident, IncidentType } from '$lib/types/Incident.type';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	let incidents = $state<Incident[]>(data.incidents);
	let newMessage = $state('');
	let selectedEleveId = $state('');
	let selectedType = $state<IncidentType>('note');
	let dialogOpen = $state(false);
	let commentTexts = $state<Record<string, string>>({});
	let reactingTo = $state<string | null>(null);

	const typeLabels: Record<IncidentType, string> = {
		info: 'Information',
		erreur: 'Erreur',
		note: 'Note positive',
		absent: 'Absence'
	};

	const typeConfig: Record<IncidentType, { icon: typeof Info; color: string; bg: string; border: string; dot: string }> = {
		info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/15', border: 'border-blue-500/30', dot: 'bg-blue-500' },
		erreur: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/15', border: 'border-red-500/30', dot: 'bg-red-500' },
		note: { icon: Star, color: 'text-emerald-500', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
		absent: { icon: UserX, color: 'text-amber-500', bg: 'bg-amber-500/15', border: 'border-amber-500/30', dot: 'bg-amber-500' }
	};

	const reactionEmojis = ['⚠️', '👍', '❤️', '😂', '🌟', '😢'];

	const mockEleves = [
		{ id: '1', nom: 'RANDRIANANTENAINA', prenom: 'Tsitoarimanjakely' },
		{ id: '2', nom: 'RAKOTO', prenom: 'Fanomezamasy' },
		{ id: '3', nom: 'ANDRIANTENAINA', prenom: 'Bako' }
	];

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
		reactingTo = null;
	}

	function getReactionCount(incident: Incident, emoji: string) {
		return incident.reactions.filter((r) => r.emoji === emoji).length;
	}

	function hasUserReacted(incident: Incident, emoji: string) {
		return incident.reactions.some((r) => r.emoji === emoji && r.user === 'Moi');
	}

	function getTotalReactions(incident: Incident) {
		return incident.reactions.length;
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

	function timeAgo(dateStr: string) {
		const now = new Date();
		const date = new Date(dateStr);
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);
		if (minutes < 1) return "à l'instant";
		if (minutes < 60) return `il y a ${minutes}min`;
		if (hours < 24) return `il y a ${hours}h`;
		if (days < 7) return `il y a ${days}j`;
		return formatDate(dateStr);
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

	<div class="flex-1 overflow-y-auto p-4 space-y-3">
		{#if incidents.length === 0}
			<div class="flex flex-col items-center justify-center py-20 text-muted-foreground">
				<div class="size-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
					<AlertCircle class="size-8 text-muted-foreground/50" />
				</div>
				<p class="text-sm font-medium mb-1">Aucun incident signalé</p>
				<p class="text-xs text-muted-foreground/70 mb-4">Les incidents apparaîtront ici une fois créés.</p>
				<Button onclick={openNewIncident} variant="outline" size="sm">Créer un incident</Button>
			</div>
		{:else}
			{#each incidents as incident, idx (incident.id)}
				{@const config = typeConfig[incident.type]}
				<Card class="animate-slide-up opacity-0 border-l-4 {config.border} transition-all duration-200 hover:shadow-md" style="animation-delay: {Math.min(idx * 50, 300)}ms">
					<div class="p-4">
						<div class="flex items-start justify-between">
							<div class="flex items-center gap-3">
								<Avatar.Root class="size-10">
									<Avatar.Fallback class="text-xs font-bold">{incident.elevePrenom[0]}{incident.eleveNom[0]}</Avatar.Fallback>
								</Avatar.Root>
								<div>
									<button
										class="font-semibold text-sm hover:text-primary hover:underline transition-colors"
										onclick={() => goto(`/eleves/${incident.eleveId}`)}
									>
										{incident.elevePrenom} {incident.eleveNom}
									</button>
									<div class="flex items-center gap-2 mt-0.5">
										<span class="text-xs text-muted-foreground">{timeAgo(incident.date)}</span>
										<span class="text-xs text-muted-foreground">·</span>
										<span class="text-xs text-muted-foreground">{incident.auteur}</span>
									</div>
								</div>
							</div>
							<Badge variant="outline" class="gap-1.5 text-xs {config.bg} {config.color} border-0">
								<config.icon class="size-3" />
								{typeLabels[incident.type]}
							</Badge>
						</div>

						<p class="mt-3 text-sm leading-relaxed">{incident.message}</p>

						{#if getTotalReactions(incident) > 0 || incident.comments.length > 0}
							<div class="mt-3 flex items-center justify-between text-xs text-muted-foreground">
								{#if getTotalReactions(incident) > 0}
									<div class="flex items-center gap-1">
										<div class="flex -space-x-1">
											{#each [...new Set(incident.reactions.map(r => r.emoji))] as emoji}
												<span class="flex size-5 items-center justify-center rounded-full bg-muted text-xs ring-2 ring-card">{emoji}</span>
											{/each}
										</div>
										<span class="ml-1">{getTotalReactions(incident)}</span>
									</div>
								{/if}
								{#if incident.comments.length > 0}
									<button class="hover:text-foreground transition-colors">
										{incident.comments.length} commentaire{incident.comments.length > 1 ? 's' : ''}
									</button>
								{/if}
							</div>
						{/if}

						<div class="mt-3 flex items-center gap-1 border-t border-sidebar-border pt-3">
							{#each reactionEmojis as emoji}
								{@const count = getReactionCount(incident, emoji)}
								{@const active = hasUserReacted(incident, emoji)}
								<button
									class="group flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-all duration-200 hover:scale-105 {active ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-muted/50 hover:bg-muted'}"
									onclick={() => addReaction(incident.id, emoji)}
								>
									<span class="transition-transform duration-200 group-hover:scale-125">{emoji}</span>
									{#if count > 0}
										<span class="font-medium {active ? 'text-primary' : 'text-muted-foreground'}">{count}</span>
									{/if}
								</button>
							{/each}
						</div>

						{#if incident.comments.length > 0}
							<div class="mt-3 space-y-2 border-t border-sidebar-border pt-3">
								{#each incident.comments as comment}
									<div class="flex items-start gap-2.5 animate-fade-in">
										<Avatar.Root class="size-7">
											<Avatar.Fallback class="text-[10px] font-bold">{comment.author[0]}</Avatar.Fallback>
										</Avatar.Root>
										<div class="flex-1 rounded-lg bg-muted/50 px-3 py-2">
											<div class="flex items-center gap-2">
												<span class="text-xs font-semibold">{comment.author}</span>
												<span class="text-[10px] text-muted-foreground">{timeAgo(comment.date)}</span>
											</div>
											<p class="mt-0.5 text-xs text-muted-foreground leading-relaxed">{comment.text}</p>
										</div>
									</div>
								{/each}
							</div>
						{/if}

						<div class="mt-3 flex items-center gap-2 border-t border-sidebar-border pt-3">
							<Avatar.Root class="size-7">
								<Avatar.Fallback class="text-[10px] font-bold">M</Avatar.Fallback>
							</Avatar.Root>
							<Input
								placeholder="Écrire un commentaire..."
								bind:value={commentTexts[incident.id]}
								class="h-8 text-xs bg-muted/50 border-0 flex-1"
								onkeydown={(e) => {
									if (e.key === 'Enter') addComment(incident.id);
								}}
							/>
							<Button size="icon" variant="ghost" class="size-8 shrink-0" onclick={() => addComment(incident.id)}>
								<Send class="size-3.5" />
							</Button>
						</div>
					</div>
				</Card>
			{/each}
		{/if}
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
					<Label>Élève</Label>
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
					<Label>Message</Label>
					<Textarea bind:value={newMessage} placeholder="Décrire l'incident..." rows={4} />
				</div>
			</div>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => (dialogOpen = false)}>Annuler</Button>
				<Button onclick={submitIncident} disabled={!selectedEleveId || !newMessage.trim()}>Publier</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</main>