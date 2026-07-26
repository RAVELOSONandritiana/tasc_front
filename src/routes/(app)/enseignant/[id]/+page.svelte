<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Mail,
		Phone,
		Shield,
		Calendar,
		MapPin,
		Building,
		Clock,
		CheckCircle2,
		CalendarDays,
		Users,
		X
	} from '@lucide/svelte/icons';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import ProfileImage from '$lib/components/user/ProfileImage.svelte';

	const { data }: PageProps = $props();
	const prof = data.professeur;

	const initial = prof.name.charAt(0) + prof.lastname.charAt(0);
	let photo = $state<string | null>(prof.imageUrl ?? null);

	const stats = prof.stats;
</script>

<main class="flex flex-1 flex-col bg-sidebar p-4 text-sidebar-foreground">
	<div class="flex-1 overflow-y-auto">
		<div class="space-y-6">
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold">Profil de l'enseignant</h1>
			<Button variant="outline" onclick={() => goto('/enseignant')}>Retour</Button>
		</div>

		<Card class="p-6">
			<div class="flex items-center gap-4">
				<ProfileImage
					personneId={prof.personneId}
					imageUrl={photo}
					initials={initial}
					onChange={(url) => (photo = url)}
				/>
				<div>
					<h2 class="text-2xl font-semibold">{prof.name} {prof.lastname}</h2>
					<Badge variant="outline" class="text-xs">Enseignant</Badge>
				</div>
			</div>
		</Card>

		<div class="grid gap-4 md:grid-cols-2">
			<Card class="space-y-3 p-4">
				<h3 class="font-semibold">Informations</h3>
				<div class="flex items-center gap-3">
					<Mail class="size-4 text-muted-foreground" />
					<div>
						<p class="text-xs text-muted-foreground">Email</p>
						<p class="text-sm font-medium">{prof.email}</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<Phone class="size-4 text-muted-foreground" />
					<div>
						<p class="text-xs text-muted-foreground">Téléphone</p>
						<p class="text-sm font-medium">{prof.phone}</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<MapPin class="size-4 text-muted-foreground" />
					<div>
						<p class="text-xs text-muted-foreground">Adresse</p>
						<p class="text-sm font-medium">{prof.domicile}, {prof.commune}</p>
					</div>
				</div>
			</Card>

			<Card class="space-y-3 p-4">
				<h3 class="font-semibold">Statut professionnel</h3>
				<div class="flex items-center gap-3">
					<Shield class="size-4 text-muted-foreground" />
					<div>
						<p class="text-xs text-muted-foreground">Rôle</p>
						<p class="text-sm font-medium">Enseignant</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<Calendar class="size-4 text-muted-foreground" />
					<div>
						<p class="text-xs text-muted-foreground">Matières</p>
						<p class="text-sm font-medium">{prof.matiere.join(', ')}</p>
					</div>
				</div>
			</Card>
		</div>

		{#if stats}
			<Card class="space-y-4 p-5">
				<h3 class="font-semibold">Statistiques de travail</h3>
				<div class="grid grid-cols-2 gap-4 md:grid-cols-3">
					<div class="rounded-lg bg-muted/30 p-3 text-center">
						<CalendarDays class="mx-auto mb-1 size-5 text-blue-500" />
				<p class="text-xs text-muted-foreground">Cours</p>
					<p class="text-2xl font-bold text-blue-500">{stats.nbCours}</p>
					</div>
					<div class="rounded-lg bg-muted/30 p-3 text-center">
						<Clock class="mx-auto mb-1 size-5 text-amber-500" />
						<p class="text-xs text-muted-foreground">Retards</p>
						<p class="text-2xl font-bold {stats.retards > 2 ? 'text-red-500' : 'text-amber-500'}">
							{stats.retards}
						</p>
					</div>
					<div class="rounded-lg bg-muted/30 p-3 text-center">
						<Users class="mx-auto mb-1 size-5 text-red-500" />
						<p class="text-xs text-muted-foreground">Absences</p>
						<p class="text-2xl font-bold {stats.absences > 1 ? 'text-red-500' : 'text-amber-500'}">
							{stats.absences}
						</p>
					</div>
					<div class="rounded-lg bg-muted/30 p-3 text-center">
						<Shield class="mx-auto mb-1 size-5 text-red-500" />
						<p class="text-xs text-muted-foreground">Incidents</p>
						<p
							class="text-2xl font-bold {stats.incidents > 2
								? 'text-red-500'
								: stats.incidents > 0
									? 'text-amber-500'
									: 'text-emerald-500'}"
						>
							{stats.incidents}
						</p>
					</div>
					<div class="rounded-lg bg-muted/30 p-3 text-center">
						<CheckCircle2 class="mx-auto mb-1 size-5 text-emerald-500" />
						<p class="text-xs text-muted-foreground">Notes positives</p>
						<p class="text-2xl font-bold text-emerald-500">{stats.notesPositives}</p>
					</div>
					<div class="rounded-lg bg-muted/30 p-3 text-center">
						<X class="mx-auto mb-1 size-5 text-red-500" />
						<p class="text-xs text-muted-foreground">Notes négatives</p>
						<p
							class="text-2xl font-bold {stats.notesNegatives > 2
								? 'text-red-500'
								: stats.notesNegatives > 0
									? 'text-amber-500'
									: 'text-emerald-500'}"
						>
							{stats.notesNegatives}
						</p>
					</div>
				</div>
			</Card>
		{/if}
		</div>
	</div>
</main>
