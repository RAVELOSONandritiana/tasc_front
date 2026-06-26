<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Avatar } from '$lib/components/ui/avatar';
	import { User, Mail, Phone, Shield, Calendar, MapPin, Building, Clock, CheckCircle2, CalendarDays, Users, X } from '@lucide/svelte/icons';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
	const surv = data.surveillant;

	const initial = surv.name.charAt(0) + surv.lastname.charAt(0);

	const stats = surv.stats;
</script>

<main class="min-h-full bg-sidebar p-6 text-sidebar-foreground">
	<div class="mx-auto max-w-3xl space-y-6">
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold">Profil du surveillant</h1>
			<Button variant="outline" onclick={() => goto('/surveillant')}>Retour</Button>
		</div>

		<Card class="p-6">
			<div class="flex items-center gap-4">
				<Avatar class="h-20 w-20">
					<Avatar.Fallback class="text-xl font-bold text-primary bg-primary/10">
						{initial}
					</Avatar.Fallback>
				</Avatar>
				<div>
					<h2 class="text-2xl font-semibold">{surv.name} {surv.lastname}</h2>
					<Badge variant="outline" class="text-xs">Surveillant</Badge>
				</div>
			</div>
		</Card>

		<div class="grid gap-4 md:grid-cols-2">
			<Card class="p-4 space-y-3">
				<h3 class="font-semibold">Informations</h3>
				<div class="flex items-center gap-3">
					<Mail class="size-4 text-muted-foreground" />
					<div>
						<p class="text-xs text-muted-foreground">Email</p>
						<p class="text-sm font-medium">{surv.email}</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<Phone class="size-4 text-muted-foreground" />
					<div>
						<p class="text-xs text-muted-foreground">Téléphone</p>
						<p class="text-sm font-medium">{surv.phone}</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<MapPin class="size-4 text-muted-foreground" />
					<div>
						<p class="text-xs text-muted-foreground">Adresse</p>
						<p class="text-sm font-medium">{surv.domicile}, {surv.commune}</p>
					</div>
				</div>
			</Card>

			<Card class="p-4 space-y-3">
				<h3 class="font-semibold">Statut professionnel</h3>
				<div class="flex items-center gap-3">
					<Shield class="size-4 text-muted-foreground" />
					<div>
						<p class="text-xs text-muted-foreground">Poste</p>
						<p class="text-sm font-medium">{surv.poste}</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<Calendar class="size-4 text-muted-foreground" />
					<div>
						<p class="text-xs text-muted-foreground">Rôle</p>
						<p class="text-sm font-medium">Surveillant</p>
					</div>
				</div>
			</Card>
		</div>

		{#if stats}
			<Card class="p-5 space-y-4">
				<h3 class="font-semibold">Statistiques de travail</h3>
				<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
					<div class="text-center p-3 bg-muted/30 rounded-lg">
						<CalendarDays class="size-5 text-blue-500 mx-auto mb-1" />
						<p class="text-xs text-muted-foreground">Heures de cours</p>
						<p class="text-2xl font-bold text-blue-500">{stats.heuresCours}h</p>
					</div>
					<div class="text-center p-3 bg-muted/30 rounded-lg">
						<Clock class="size-5 text-amber-500 mx-auto mb-1" />
						<p class="text-xs text-muted-foreground">Retards</p>
						<p class="text-2xl font-bold {stats.retards > 2 ? 'text-red-500' : 'text-amber-500'}">{stats.retards}</p>
					</div>
					<div class="text-center p-3 bg-muted/30 rounded-lg">
						<Users class="size-5 text-red-500 mx-auto mb-1" />
						<p class="text-xs text-muted-foreground">Absences</p>
						<p class="text-2xl font-bold {stats.absences > 1 ? 'text-red-500' : 'text-amber-500'}">{stats.absences}</p>
					</div>
					<div class="text-center p-3 bg-muted/30 rounded-lg">
						<Shield class="size-5 text-red-500 mx-auto mb-1" />
						<p class="text-xs text-muted-foreground">Incidents</p>
						<p class="text-2xl font-bold {stats.incidents > 2 ? 'text-red-500' : stats.incidents > 0 ? 'text-amber-500' : 'text-emerald-500'}">{stats.incidents}</p>
					</div>
					<div class="text-center p-3 bg-muted/30 rounded-lg">
						<CheckCircle2 class="size-5 text-emerald-500 mx-auto mb-1" />
						<p class="text-xs text-muted-foreground">Notes positives</p>
						<p class="text-2xl font-bold text-emerald-500">{stats.notesPositives}</p>
					</div>
					<div class="text-center p-3 bg-muted/30 rounded-lg">
						<X class="size-5 text-red-500 mx-auto mb-1" />
						<p class="text-xs text-muted-foreground">Notes négatives</p>
						<p class="text-2xl font-bold {stats.notesNegatives > 2 ? 'text-red-500' : stats.notesNegatives > 0 ? 'text-amber-500' : 'text-emerald-500'}">{stats.notesNegatives}</p>
					</div>
				</div>
			</Card>
		{/if}
	</div>
</main>