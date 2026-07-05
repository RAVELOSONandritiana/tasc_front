<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Users, GraduationCap, School, AlertCircle, Bell, BookOpen } from '@lucide/svelte/icons';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	const stats = $derived(data.stats);
	const classes = $derived(data.classes);
</script>

<div class="flex h-screen flex-col bg-background text-foreground">
	<div class="flex-1 overflow-y-auto">
		<div class="sticky top-0 z-10 border-b border-sidebar-border bg-background p-4 md:p-6">
			<div class="mx-auto max-w-7xl space-y-4">
				<div class="animate-slide-down flex items-center gap-3">
					<div class="flex size-10 items-center justify-center rounded-xl bg-primary/10">
						<School class="size-5 text-primary" />
					</div>
					<div>
						<h1 class="text-xl font-bold tracking-tight">Tableau de bord</h1>
						<p class="text-xs text-muted-foreground">Vue d'ensemble de l'établissement</p>
					</div>
				</div>
			</div>
		</div>

		<div class="mx-auto max-w-7xl p-4 md:p-6 space-y-6">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card class="animate-slide-up opacity-0 p-5">
					<div class="flex items-center gap-3">
						<div class="flex size-12 items-center justify-center rounded-lg bg-primary/10">
							<Users class="size-6 text-primary" />
						</div>
						<div>
							<p class="text-2xl font-bold">{stats.eleves}</p>
							<p class="text-xs text-muted-foreground">Élèves</p>
						</div>
					</div>
				</Card>

				<Card class="animate-slide-up opacity-0 p-5">
					<div class="flex items-center gap-3">
						<div class="flex size-12 items-center justify-center rounded-lg bg-emerald-500/10">
							<GraduationCap class="size-6 text-emerald-500" />
						</div>
						<div>
							<p class="text-2xl font-bold">{stats.professeurs}</p>
							<p class="text-xs text-muted-foreground">Enseignants</p>
						</div>
					</div>
				</Card>

				<Card class="animate-slide-up opacity-0 p-5">
					<div class="flex items-center gap-3">
						<div class="flex size-12 items-center justify-center rounded-lg bg-amber-500/10">
							<School class="size-6 text-amber-500" />
						</div>
						<div>
							<p class="text-2xl font-bold">{stats.classes}</p>
							<p class="text-xs text-muted-foreground">Classes</p>
						</div>
					</div>
				</Card>

				<Card class="animate-slide-up opacity-0 p-5">
					<div class="flex items-center gap-3">
						<div class="flex size-12 items-center justify-center rounded-lg bg-blue-500/10">
							<Users class="size-6 text-blue-500" />
						</div>
						<div>
							<p class="text-2xl font-bold">{stats.surveillants}</p>
							<p class="text-xs text-muted-foreground">Surveillants</p>
						</div>
					</div>
				</Card>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card class="animate-slide-up opacity-0 p-5">
					<div class="flex items-center gap-2 mb-4">
						<AlertCircle class="size-5 text-primary" />
						<h2 class="font-semibold">Incidents récents</h2>
					</div>
					{#if stats.recentIncidents.length === 0}
						<p class="text-sm text-muted-foreground">Aucun incident récent</p>
					{:else}
						<div class="space-y-3">
							{#each stats.recentIncidents as incident (incident.id)}
								<div class="flex items-start gap-3 p-3 rounded-lg border border-sidebar-border">
									<div class="size-8 rounded-full bg-muted/50 flex items-center justify-center">
										<Badge variant="outline" class="text-xs">
											{incident.type === 'note' ? 'N' : incident.type === 'erreur' ? 'E' : incident.type === 'info' ? 'I' : 'A'}
										</Badge>
									</div>
									<div class="flex-1 min-w-0">
										<p class="text-sm font-medium truncate">{incident.elevePrenom} {incident.eleveNom}</p>
										<p class="text-xs text-muted-foreground truncate">{incident.message}</p>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</Card>

				<Card class="animate-slide-up opacity-0 p-5">
					<div class="flex items-center gap-2 mb-4">
						<Bell class="size-5 text-primary" />
						<h2 class="font-semibold">Notifications</h2>
					</div>
					{#if stats.recentNotifications.length === 0}
						<p class="text-sm text-muted-foreground">Aucune notification</p>
					{:else}
						<div class="space-y-3">
							{#each stats.recentNotifications as notif (notif.id)}
								<div class="flex items-start gap-3 p-3 rounded-lg border border-sidebar-border">
									<div class="size-8 rounded-full bg-muted/50 flex items-center justify-center">
										<Bell class="size-4 text-muted-foreground" />
									</div>
									<div class="flex-1 min-w-0">
										<p class="text-sm font-medium">{notif.title}</p>
										<p class="text-xs text-muted-foreground">{notif.description}</p>
										<p class="text-xs text-muted-foreground mt-1">{notif.time}</p>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</Card>
			</div>

			<Card class="animate-slide-up opacity-0 p-5">
				<div class="flex items-center gap-2 mb-4">
					<BookOpen class="size-5 text-primary" />
					<h2 class="font-semibold">Classes</h2>
				</div>
				{#if classes.length === 0}
					<p class="text-sm text-muted-foreground">Aucune classe configurée</p>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
						{#each classes as classe (classe.id)}
							<div class="p-4 rounded-lg border border-sidebar-border">
								<p class="font-medium">{classe.nom}</p>
								<p class="text-xs text-muted-foreground">{classe.serie ? `Série ${classe.serie}` : ''}</p>
							</div>
						{/each}
					</div>
				{/if}
			</Card>
		</div>
	</div>
</div>