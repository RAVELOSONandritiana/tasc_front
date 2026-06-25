<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { User, Mail, Phone, Shield, Calendar } from '@lucide/svelte/icons';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
</script>

<main class="flex-1 bg-sidebar p-6 text-sidebar-foreground">
	<div class="mx-auto max-w-3xl space-y-6">
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold">Mon profil</h1>
			<Button variant="outline" size="sm">Modifier</Button>
		</div>

		<Card class="p-6">
			<div class="flex items-center gap-4">
				<div class="bg-primary/10 flex size-16 items-center justify-center rounded-full">
					<User class="size-8 text-primary" />
				</div>
				<div>
					<h2 class="text-xl font-semibold">{data.profil.prenom} {data.profil.nom}</h2>
					<p class="text-muted-foreground text-sm">{data.profil.role}</p>
				</div>
			</div>
		</Card>

		<div class="grid gap-4 md:grid-cols-2">
			<Card class="p-4 space-y-4">
				<h3 class="font-semibold">Informations personnelles</h3>
				<div class="flex items-center gap-3">
					<Mail class="size-4 text-muted-foreground" />
					<div>
						<Label class="text-xs text-muted-foreground">Email</Label>
						<p class="text-sm font-medium">{data.profil.email}</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<Phone class="size-4 text-muted-foreground" />
					<div>
						<Label class="text-xs text-muted-foreground">Téléphone</Label>
						<p class="text-sm font-medium">{data.profil.phone}</p>
					</div>
				</div>
			</Card>

			<Card class="p-4 space-y-4">
				<h3 class="font-semibold">Compte</h3>
				<div class="flex items-center gap-3">
					<Shield class="size-4 text-muted-foreground" />
					<div>
						<Label class="text-xs text-muted-foreground">Rôle</Label>
						<p class="text-sm font-medium">{data.profil.role}</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<Calendar class="size-4 text-muted-foreground" />
					<div>
						<Label class="text-xs text-muted-foreground">Date d'inscription</Label>
						<p class="text-sm font-medium">
							{new Date(data.profil.dateInscription).toLocaleDateString('fr-FR')}
						</p>
					</div>
				</div>
			</Card>
		</div>
	</div>
</main>
