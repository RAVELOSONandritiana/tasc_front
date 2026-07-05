<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';
	import {
		User,
		Mail,
		Phone,
		MapPin,
		Calendar,
		Clock,
		Shield,
		Users,
		CheckCircle2,
		X
	} from '@lucide/svelte/icons';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
	const eleve = data.eleve;

	const initial = eleve.prenom.charAt(0) + eleve.nom.charAt(0);
	const stats = eleve.stats;
</script>

<main class="min-h-full bg-sidebar p-6 text-sidebar-foreground">
	<div class="mx-auto max-w-3xl space-y-6">
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold">Profil de l'élève</h1>
			<Button variant="outline" onclick={() => goto('/eleves')}>Retour</Button>
		</div>

		<Card class="p-6">
			<div class="flex items-center gap-4">
				<div class="flex size-16 items-center justify-center rounded-full bg-primary/10">
					<User class="size-8 text-primary" />
				</div>
				<div>
					<h2 class="text-2xl font-semibold">{eleve.prenom} {eleve.nom}</h2>
					<Badge variant="secondary" class="text-xs">{eleve.classe}</Badge>
				</div>
			</div>
		</Card>

		<div class="grid gap-4 md:grid-cols-2">
			<Card class="space-y-3 p-4">
				<h3 class="font-semibold">Informations</h3>
				<div class="flex items-center gap-3">
					<Calendar class="size-4 text-muted-foreground" />
					<div>
						<Label class="text-xs text-muted-foreground">Date de naissance</Label>
						<p class="text-sm font-medium">
							{eleve.dateNaissance
								? new Date(eleve.dateNaissance).toLocaleDateString('fr-FR')
								: '—'}
						</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<Mail class="size-4 text-muted-foreground" />
					<div>
						<Label class="text-xs text-muted-foreground">Email</Label>
						<p class="text-sm font-medium">eleve@example.com</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<Phone class="size-4 text-muted-foreground" />
					<div>
						<Label class="text-xs text-muted-foreground">Téléphone</Label>
						<p class="text-sm font-medium">+261 34 000 00 00</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<MapPin class="size-4 text-muted-foreground" />
					<div>
						<Label class="text-xs text-muted-foreground">Adresse</Label>
						<p class="text-sm font-medium">Antananarivo, Madagascar</p>
					</div>
				</div>
			</Card>

			<Card class="space-y-3 p-4">
				<h3 class="font-semibold">Statut</h3>
				<div class="flex items-center gap-3">
					<Shield class="size-4 text-muted-foreground" />
					<div>
						<Label class="text-xs text-muted-foreground">Rôle</Label>
						<p class="text-sm font-medium">Élève</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<Calendar class="size-4 text-muted-foreground" />
					<div>
						<Label class="text-xs text-muted-foreground">Classe</Label>
						<p class="text-sm font-medium">{eleve.classe}</p>
					</div>
				</div>
			</Card>
		</div>

		{#if stats}
			<Card class="space-y-4 p-5">
				<h3 class="font-semibold">Statistiques</h3>
				<div class="grid grid-cols-2 gap-4 md:grid-cols-3">
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
							class="text-2xl font-bold {stats.incidents > 0 ? 'text-red-500' : 'text-emerald-500'}"
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
					<div class="rounded-lg bg-muted/30 p-3 text-center">
						<Calendar class="mx-auto mb-1 size-5 text-blue-500" />
						<p class="text-xs text-muted-foreground">Heures cours</p>
						<p class="text-2xl font-bold text-blue-500">{stats.heuresCours}h</p>
					</div>
				</div>
			</Card>
		{/if}
	</div>
</main>
