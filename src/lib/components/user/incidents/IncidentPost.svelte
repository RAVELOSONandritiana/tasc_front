<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Avatar from '$lib/components/ui/avatar';
	import {
		AlertCircle,
		Info,
		Star,
		UserX,
		MessageCircle,
		Heart,
		Share2,
		Send,
		Trash2
	} from '@lucide/svelte/icons';
	import type { Incident, IncidentType } from '$lib/types/Incident.type';

	const { incident, eleves, currentUserId } = $props<{
		incident: Incident;
		eleves: { id: string; nom: string; prenom: string }[];
		currentUserId?: string;
	}>();

	const isAuthor = $derived(incident.auteurId === currentUserId);
	const validType = $derived(incident.type as IncidentType);

	let showComments = $state(false);
	let commentText = $state('');

	const typeConfig: Record<IncidentType, { icon: typeof Info; color: string; bg: string }> = {
		info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
		erreur: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
		note: { icon: Star, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
		absent: { icon: UserX, color: 'text-amber-500', bg: 'bg-amber-500/10' }
	};

	const typeInfo = $derived(typeConfig[validType] || typeConfig.info);

	function timeAgo(dateStr: string) {
		const now = new Date();
		const date = new Date(dateStr);
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);
		if (minutes < 1) return "à l'instant";
		if (minutes < 60) return `${minutes}min`;
		if (hours < 24) return `${hours}h`;
		if (days < 7) return `${days}j`;
		return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
	}

	function getEleveName(id: string) {
		const e = eleves.find((el: { id: string; nom: string; prenom: string }) => el.id === id);
		return e ? `${e.prenom} ${e.nom}` : 'Inconnu';
	}

	function getEleveInitials(id: string) {
		const e = eleves.find((el: { id: string; nom: string; prenom: string }) => el.id === id);
		return e ? `${e.prenom[0]}${e.nom[0]}` : '??';
	}

	function handleEleveClick(id: string) {
		goto(`/eleves/${id}`);
	}

	function handleToggleComments() {
		showComments = !showComments;
	}

	const reactionCount = $derived(incident.reactions?.length || 0);
	const commentCount = $derived(incident.comments?.length || 0);
	const userReacted = $derived(incident.reactions?.some((r: { emoji: string; user: string }) => r.user === currentUserId) || false);

	function handleShare() {
		const url = window.location.origin + '/incidents';
		navigator.clipboard.writeText(url).then(() => {
			alert('Lien copié dans le presse-papiers');
		});
	}
</script>

<div class="mx-auto w-full max-w-2xl">
	<div class="rounded-xl border border-sidebar-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md">
		<div class="p-4">
			<div class="flex items-start justify-between">
				<div class="flex items-center gap-3">
					<Avatar.Root class="size-10">
						<Avatar.Fallback class="bg-primary/10 text-xs font-bold">
							{getEleveInitials(incident.eleveId)}
						</Avatar.Fallback>
					</Avatar.Root>
					<div>
						<div class="flex items-center gap-2">
							<button class="text-sm font-semibold transition-colors hover:text-primary hover:underline" onclick={() => handleEleveClick(incident.eleveId)}>
								{getEleveName(incident.eleveId)}
							</button>
							<span class="text-xs text-muted-foreground">·</span>
							<span class="text-xs text-muted-foreground">{incident.auteur}</span>
						</div>
						<div class="mt-0.5 flex items-center gap-2">
							<span class="text-xs text-muted-foreground">{timeAgo(incident.date)}</span>
						</div>
					</div>
				</div>
				<Badge variant="outline" class="gap-1.5 text-xs {typeInfo.bg} {typeInfo.color} border-0">
					{#if validType === 'note'}
						<Star class="size-3" />
					{:else if validType === 'erreur'}
						<AlertCircle class="size-3" />
					{:else if validType === 'info'}
						<Info class="size-3" />
					{:else}
						<UserX class="size-3" />
					{/if}
					{validType === 'note' ? 'Note' : validType === 'erreur' ? 'Erreur' : validType === 'info' ? 'Info' : 'Absent'}
				</Badge>
			</div>

			<p class="mt-3 text-sm leading-relaxed">{incident.message}</p>

			<div class="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
				<span class="flex items-center gap-1 {typeInfo.color}">
					{validType === 'note' ? 'Positive' : validType === 'erreur' ? 'Problème' : validType === 'info' ? 'Info' : 'Absent'}
				</span>
			</div>

			<div class="mt-3 border-t border-sidebar-border">
				<div class="flex items-center justify-between pt-3">
					<div class="flex items-center gap-1">
						<form method="POST" action="?/reaction" class="inline">
							<input type="hidden" name="incidentId" value={incident.id} />
							<input type="hidden" name="emoji" value="❤️" />
							<Button type="submit" variant="ghost" size="sm" class="gap-1.5 text-xs">
								<Heart class="size-3.5 {userReacted ? 'fill-red-500 text-red-500' : ''}" />
								<span>{reactionCount}</span>
							</Button>
						</form>
						<Button variant="ghost" size="sm" class="gap-1.5 text-xs" onclick={handleToggleComments}>
							<MessageCircle class="size-3.5" />
							<span>{commentCount}</span>
						</Button>
						<Button variant="ghost" size="sm" class="gap-1.5 text-xs" onclick={handleShare}>
							<Share2 class="size-3.5" />
						</Button>
					</div>
					{#if isAuthor}
						<form method="POST" action="?/delete" class="inline">
							<input type="hidden" name="incidentId" value={incident.id} />
							<Button type="submit" variant="ghost" size="sm" class="gap-1.5 text-xs text-red-500 hover:text-red-600">
								<Trash2 class="size-3.5" />
							</Button>
						</form>
					{/if}
				</div>
			</div>
		</div>

		{#if showComments}
			<div class="border-t border-sidebar-border bg-muted/20 p-4">
				<form method="POST" action="?/comment" class="mb-3 flex items-center gap-2">
					<input type="hidden" name="incidentId" value={incident.id} />
					<input type="text" name="text" bind:value={commentText} placeholder="Ajouter un commentaire..." class="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none" />
					<Button type="submit" size="sm" disabled={!commentText.trim()}>
						<Send class="size-3.5" />
					</Button>
				</form>
				{#if incident.comments && incident.comments.length > 0}
					<div class="max-h-60 space-y-2 overflow-y-auto">
						{#each incident.comments as comment (comment.id)}
							<div class="flex items-start gap-2 text-sm">
								<span class="text-xs font-medium">{comment.author}</span>
								<span class="text-xs text-muted-foreground">{comment.text}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
