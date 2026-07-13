<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import PersonAvatar from '$lib/components/user/PersonAvatar.svelte';
	import {
		AlertCircle,
		Info,
		Star,
		UserX,
		MessageCircle,
		Heart,
		Share2,
		Send,
		Trash2,
		Pencil,
		Reply
	} from '@lucide/svelte/icons';
	import type { Incident, IncidentType, Comment } from '$lib/types/Incident.type';
	import { loadingForm } from '$lib/actions/loadingForm';
	import { Spinner } from '$lib/components/ui/spinner';
	import ConfirmDeleteDialog from '$lib/components/user/ConfirmDeleteDialog.svelte';

	const { incident, eleves, currentUserId } = $props<{
		incident: Incident;
		eleves: { id: string; nom: string; prenom: string; imageUrl?: string | null }[];
		currentUserId?: string;
	}>();

	const isAuthor = $derived(incident.auteurId === currentUserId);
	const validType = $derived(incident.type as IncidentType);

	let showComments = $state(false);
	let commentText = $state('');

	let editingId = $state<string | null>(null);
	let editText = $state('');
	let replyingTo = $state<string | null>(null);
	let replyText = $state('');

	const topLevelComments = $derived((incident.comments || []).filter((c) => !c.parentId));

	function repliesOf(parentId: string): Comment[] {
		return (incident.comments || []).filter((c) => c.parentId === parentId);
	}

	function canEditComment(c: Comment): boolean {
		return !!c.authorId && c.authorId === currentUserId;
	}

	function startEdit(c: Comment) {
		editingId = c.id;
		editText = c.text;
		replyingTo = null;
	}

	function startReply(id: string) {
		replyingTo = id;
		replyText = '';
		editingId = null;
	}

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

	function getEleveImage(id: string) {
		const e = eleves.find(
			(el: { id: string; nom: string; prenom: string; imageUrl?: string | null }) => el.id === id
		);
		return e?.imageUrl || null;
	}

	function handleEleveClick(id: string) {
		goto(`/eleves/${id}`);
	}

	function handleToggleComments() {
		showComments = !showComments;
	}

	const reactionCount = $derived(incident.reactions?.length || 0);
	const commentCount = $derived(incident.comments?.length || 0);
	const userReacted = $derived(
		incident.reactions?.some((r: { emoji: string; user: string }) => r.user === currentUserId) ||
			false
	);

	let submittingDelete = $state(false);
	let confirmOpen = $state(false);
	let deleteForm = $state<HTMLFormElement | null>(null);

	function handleShare() {
		const url = window.location.origin + '/incidents';
		navigator.clipboard.writeText(url).then(() => {
			alert('Lien copié dans le presse-papiers');
		});
	}
</script>

{#snippet commentBlock(comment: Comment)}
	<div class="text-sm">
		<div class="flex flex-wrap items-baseline gap-2">
			<span class="text-xs font-semibold">{comment.author}</span>
			{#if comment.edited}
				<span class="text-[10px] text-muted-foreground italic">modifié</span>
			{/if}
			<span class="text-xs text-muted-foreground">{comment.text}</span>
		</div>

		<div class="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
			<button type="button" class="hover:text-foreground" onclick={() => startReply(comment.id)}
				>Répondre</button
			>
			{#if canEditComment(comment)}
				<button type="button" class="hover:text-foreground" onclick={() => startEdit(comment)}
					>Modifier</button
				>
			{/if}
		</div>

		{#if editingId === comment.id}
			<form
				method="POST"
				action="?/editComment"
				class="mt-1 flex items-center gap-2"
				use:loadingForm
			>
				<input type="hidden" name="commentId" value={comment.id} />
				<input
					type="text"
					name="text"
					bind:value={editText}
					class="flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none"
				/>
				<Button type="submit" size="sm" disabled={!editText.trim()}>Enregistrer</Button>
				<Button type="button" variant="ghost" size="sm" onclick={() => (editingId = null)}
					>Annuler</Button
				>
			</form>
		{/if}

		{#if replyingTo === comment.id}
			<form
				method="POST"
				action="?/replyComment"
				class="mt-1 flex items-center gap-2"
				use:loadingForm
			>
				<input type="hidden" name="incidentId" value={incident.id} />
				<input type="hidden" name="parentId" value={comment.id} />
				<input
					type="text"
					name="text"
					bind:value={replyText}
					placeholder="Répondre..."
					class="flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none"
				/>
				<Button type="submit" size="sm" disabled={!replyText.trim()}>Envoyer</Button>
				<Button type="button" variant="ghost" size="sm" onclick={() => (replyingTo = null)}
					>Annuler</Button
				>
			</form>
		{/if}

		{#each repliesOf(comment.id) as reply (reply.id)}
			<div class="mt-2 ml-4 border-l border-sidebar-border pl-3">
				{@render commentBlock(reply)}
			</div>
		{/each}
	</div>
{/snippet}

<div class="mx-auto w-full max-w-2xl">
	<div
		class="rounded-xl border border-sidebar-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md"
	>
		<div class="p-4">
			<div class="flex items-start justify-between">
				<div class="flex items-center gap-3">
					<PersonAvatar
						imageUrl={getEleveImage(incident.eleveId)}
						name={getEleveName(incident.eleveId).split(' ')[0] || ''}
						lastname={getEleveName(incident.eleveId).split(' ')[1] || ''}
						sizeClass="size-10"
					/>
					<div>
						<div class="flex items-center gap-2">
							<button
								class="text-sm font-semibold transition-colors hover:text-primary hover:underline"
								onclick={() => handleEleveClick(incident.eleveId)}
							>
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
					{validType === 'note'
						? 'Note'
						: validType === 'erreur'
							? 'Erreur'
							: validType === 'info'
								? 'Info'
								: 'Absent'}
				</Badge>
			</div>

			<p class="mt-3 text-sm leading-relaxed">{incident.message}</p>

			<div class="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
				<span class="flex items-center gap-1 {typeInfo.color}">
					{validType === 'note'
						? 'Positive'
						: validType === 'erreur'
							? 'Problème'
							: validType === 'info'
								? 'Info'
								: 'Absent'}
				</span>
			</div>

			<div class="mt-3 border-t border-sidebar-border">
				<div class="flex items-center justify-between pt-3">
					<div class="flex items-center gap-1">
						<form method="POST" action="?/reaction" class="inline" use:loadingForm>
							<input type="hidden" name="incidentId" value={incident.id} />
							<input type="hidden" name="emoji" value="❤️" />
							<Button
								type="submit"
								variant="ghost"
								size="sm"
								class="gap-1.5 text-xs {userReacted ? 'text-red-500' : ''}"
							>
								<Heart class="size-3.5 {userReacted ? 'fill-red-500 text-red-500' : ''}" />
								<span>{reactionCount}</span>
							</Button>
						</form>
						<Button
							variant="ghost"
							size="sm"
							class="gap-1.5 text-xs"
							onclick={handleToggleComments}
						>
							<MessageCircle class="size-3.5" />
							<span>{commentCount}</span>
						</Button>
						<Button variant="ghost" size="sm" class="gap-1.5 text-xs" onclick={handleShare}>
							<Share2 class="size-3.5" />
						</Button>
					</div>
					{#if isAuthor}
						<form
							bind:this={deleteForm}
							method="POST"
							action="?/delete"
							class="inline"
							use:loadingForm
						>
							<input type="hidden" name="incidentId" value={incident.id} />
						</form>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							class="gap-1.5 text-xs text-red-500 hover:text-red-600"
							onclick={() => (confirmOpen = true)}
						>
							{#if submittingDelete}
								<Spinner class="size-3.5" />
							{:else}
								<Trash2 class="size-3.5" />
							{/if}
						</Button>
						<ConfirmDeleteDialog
							bind:open={confirmOpen}
							title="Supprimer l'incident"
							description="Êtes-vous sûr de vouloir supprimer cet incident ? Cette action est irréversible."
							loading={submittingDelete}
							onConfirm={() => {
								submittingDelete = true;
								deleteForm?.requestSubmit();
							}}
						/>
					{/if}
				</div>
			</div>
		</div>

		{#if showComments}
			<div class="border-t border-sidebar-border bg-muted/20 p-4">
				<form method="POST" action="?/comment" class="mb-3 flex items-center gap-2" use:loadingForm>
					<input type="hidden" name="incidentId" value={incident.id} />
					<input
						type="text"
						name="text"
						bind:value={commentText}
						placeholder="Ajouter un commentaire..."
						class="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
					/>
					<Button type="submit" size="sm" disabled={!commentText.trim()}>
						<Send class="size-3.5" />
					</Button>
				</form>
				{#if incident.comments && incident.comments.length > 0}
					<div class="max-h-72 space-y-3 overflow-y-auto">
						{#each topLevelComments as comment (comment.id)}
							{@render commentBlock(comment)}
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
