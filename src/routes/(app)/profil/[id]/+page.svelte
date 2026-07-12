<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Avatar from '$lib/components/ui/avatar/avatar.svelte';
	import AvatarFallback from '$lib/components/ui/avatar/avatar-fallback.svelte';
	import AvatarImage from '$lib/components/ui/avatar/avatar-image.svelte';
	import { User, Mail, Phone, MapPin, Calendar, Shield, ArrowLeft, History } from '@lucide/svelte/icons';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
	const user = data.user;
	const initial = $derived((user.prenom?.charAt(0) || '') + (user.nom?.charAt(0) || ''));
</script>

<main class="flex h-screen flex-col bg-background text-foreground">
	<div class="flex-1 overflow-y-auto">
		<div class="p-4 md:p-6">
			<div class="mb-4 flex items-center justify-between">
				<Button variant="ghost" class="gap-2" onclick={() => goto('/personne')}>
					<ArrowLeft class="size-4" />
					Retour
				</Button>
				<Button variant="outline" class="gap-2" onclick={() => goto(`/profil/${user.id}/history`)}>
					<History class="size-4" />
					Historique
				</Button>
			</div>

			<Card class="p-6">
				<div class="flex items-center gap-4">
					<Avatar class="h-20 w-20">
						<AvatarImage src="https://github.com/vanessa.png" alt={user.prenom} />
						<AvatarFallback class="text-xl font-bold">{initial || '?'}</AvatarFallback>
					</Avatar>
					<div>
						<h1 class="text-2xl font-bold">{user.prenom} {user.nom}</h1>
						<Badge variant="outline" class="text-xs">{user.role}</Badge>
						<p class="mt-1 text-xs text-muted-foreground">Matricule: {user.matricule}</p>
					</div>
				</div>
			</Card>

			<div class="mt-4 grid gap-4 md:grid-cols-2">
				<Card class="space-y-3 p-4">
					<h3 class="font-semibold">Informations personnelles</h3>
					<div class="flex items-center gap-3">
						<Mail class="size-4 text-muted-foreground" />
						<div>
							<p class="text-xs text-muted-foreground">Email</p>
							<p class="text-sm font-medium">{user.email}</p>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<Phone class="size-4 text-muted-foreground" />
						<div>
							<p class="text-xs text-muted-foreground">Téléphone</p>
							<p class="text-sm font-medium">{user.phone}</p>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<MapPin class="size-4 text-muted-foreground" />
						<div>
							<p class="text-xs text-muted-foreground">Adresse</p>
							<p class="text-sm font-medium">{user.domicile}, {user.commune}</p>
						</div>
					</div>
				</Card>

				<Card class="space-y-3 p-4">
					<h3 class="font-semibold">Compte</h3>
					<div class="flex items-center gap-3">
						<Shield class="size-4 text-muted-foreground" />
						<div>
							<p class="text-xs text-muted-foreground">Rôle</p>
							<p class="text-sm font-medium">{user.role}</p>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<Calendar class="size-4 text-muted-foreground" />
						<div>
							<p class="text-xs text-muted-foreground">Membre depuis</p>
							<p class="text-sm font-medium">{user.dateCreation}</p>
						</div>
					</div>
				</Card>
			</div>

			{#if data.presence}
				<Card class="space-y-3 p-4">
					<h3 class="font-semibold">Historique de présence</h3>
					{#if data.presence.statutEleve.length > 0}
						<div class="space-y-2">
							{#each data.presence.statutEleve as p (p.id)}
								<div class="flex items-center justify-between gap-2 rounded-lg border border-sidebar-border p-2.5">
									<div class="min-w-0">
										<p class="truncate text-sm font-medium">{p.cours}</p>
										<p class="text-xs text-muted-foreground">
											{new Date(p.date).toLocaleString('fr-FR', {
												day: 'numeric',
												month: 'short',
												hour: '2-digit',
												minute: '2-digit'
											})}
										</p>
									</div>
									<Badge
										variant="outline"
										class={p.statut === 'PRESENT'
											? 'border-emerald-500/40 text-emerald-500'
											: p.statut === 'RETARD'
												? 'border-amber-500/40 text-amber-500'
												: 'border-red-500/40 text-red-500'}>{p.statut === 'PRESENT'
											? 'Présent'
											: p.statut === 'RETARD'
												? 'Retard'
												: 'Absent'}</Badge
									>
								</div>
							{/each}
						</div>
					{:else if data.presence.seancesDonnees.length > 0}
						<div class="space-y-2">
							{#each data.presence.seancesDonnees as s (s.id)}
								<div class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sidebar-border p-2.5">
									<div>
										<p class="text-sm font-medium">{s.cours}</p>
										<p class="text-xs text-muted-foreground">
											{new Date(s.date).toLocaleString('fr-FR', {
												day: 'numeric',
												month: 'short',
												hour: '2-digit',
												minute: '2-digit'
											})}
										</p>
									</div>
									<div class="flex items-center gap-2 text-xs">
										<span class="text-emerald-500">{s.presents} prés.</span>
										<span class="text-amber-500">{s.retards} ret.</span>
										<span class="text-red-500">{s.absents} abs.</span>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-muted-foreground">Aucun historique de présence.</p>
					{/if}
				</Card>
			{/if}
		</div>
	</div>
</main>
