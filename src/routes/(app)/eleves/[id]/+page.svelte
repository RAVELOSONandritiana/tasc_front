<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { User, Mail, Phone, MapPin, Calendar } from '@lucide/svelte/icons';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
</script>

<main class="min-h-full bg-sidebar p-6 text-sidebar-foreground">
	<div class="mx-auto max-w-3xl space-y-6">
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold">Profil de l'élève</h1>
			<Button variant="outline" onclick={() => goto('/eleves')}>Retour</Button>
		</div>

		<Card class="p-6">
			<div class="flex items-center gap-4">
				<div class="bg-primary/10 flex size-16 items-center justify-center rounded-full">
					<User class="size-8 text-primary" />
				</div>
				<div>
					<h2 class="text-xl font-semibold">{data.eleve.prenom} {data.eleve.nom}</h2>
					<p class="text-muted-foreground text-sm">{data.eleve.classe}</p>
				</div>
			</div>
		</Card>

		<div class="grid gap-4 md:grid-cols-2">
			<Card class="p-4 space-y-3">
				<div class="flex items-center gap-3">
					<Calendar class="size-4 text-muted-foreground" />
					<div>
						<Label class="text-xs text-muted-foreground">Date de naissance</Label>
						<p class="text-sm font-medium">
							{data.eleve.dateNaissance ? new Date(data.eleve.dateNaissance).toLocaleDateString('fr-FR') : '—'}
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

			<Card class="p-4 space-y-3">
				<h3 class="font-semibold">Statut</h3>
				<span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium {data.eleve.actif ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}">
					{data.eleve.actif ? 'Actif' : 'Inactif'}
				</span>
				<h3 class="font-semibold pt-2">Notes de cours</h3>
				<p class="text-sm text-muted-foreground">{data.eleve.notes?.length || 0} notes enregistrées</p>
			</Card>
		</div>

		<Card class="p-6">
			<h3 class="mb-4 font-semibold">Incidents associés</h3>
			<p class="text-sm text-muted-foreground">Consultez le fil d'incidents pour voir les remarques sur cet élève.</p>
			<Button variant="link" class="h-auto p-0 text-sm" onclick={() => goto('/incidents')}>
				Voir le fil d'incidents
			</Button>
		</Card>
	</div>
</main>
