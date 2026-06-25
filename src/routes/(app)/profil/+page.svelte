<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Badge } from '$lib/components/ui/badge';
	import { Avatar } from '$lib/components/ui/avatar';
	import * as Dialog from '$lib/components/ui/dialog';
	import { User, Mail, Phone, Shield, Calendar, Camera, Save, X, MapPin, Building, Clock, CheckCircle2 } from '@lucide/svelte/icons';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	let isEditing = $state(false);
	let saving = $state(false);
	let saved = $state(false);

	// Editable fields
	let editNom = $state(data.profil.nom);
	let editPrenom = $state(data.profil.prenom);
	let editEmail = $state(data.profil.email);
	let editPhone = $state(data.profil.phone);
	let editAdresse = $state(data.profil.adresse ?? '');
	let editBio = $state(data.profil.bio ?? '');

	function startEdit() {
		editNom = data.profil.nom;
		editPrenom = data.profil.prenom;
		editEmail = data.profil.email;
		editPhone = data.profil.phone;
		editAdresse = data.profil.adresse ?? '';
		editBio = data.profil.bio ?? '';
		isEditing = true;
		saved = false;
	}

	function cancelEdit() {
		isEditing = false;
		saved = false;
	}

	function saveProfile() {
		saving = true;
		setTimeout(() => {
			saving = false;
			isEditing = false;
			saved = true;
			setTimeout(() => { saved = false; }, 3000);
		}, 800);
	}

	const roleColors: Record<string, string> = {
		'Administrateur': 'bg-red-500/10 text-red-500 border-red-500/20',
		'Enseignant': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
		'Surveillant': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
		'Personnel': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
	};

	const stats = $derived([
		{ label: 'Connecté depuis', value: '2 jours', icon: Clock },
		{ label: 'Rôle', value: data.profil.role, icon: Shield },
		{ label: 'Statut', value: 'Actif', icon: CheckCircle2 }
	]);
</script>

<main class="flex-1 overflow-y-auto bg-background p-4 md:p-6 text-foreground">
	<div class="mx-auto max-w-4xl space-y-6">
		<!-- Header -->
		<div class="animate-slide-down flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Mon profil</h1>
				<p class="text-sm text-muted-foreground">Gérez vos informations personnelles</p>
			</div>
			{#if saved}
				<div class="animate-fade-in flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-500">
					<CheckCircle2 class="size-4" />
					Profil mis à jour
				</div>
			{/if}
		</div>

		<!-- Profile Header Card -->
		<Card class="animate-slide-up stagger-1 opacity-0 overflow-hidden transition-all duration-200 hover:shadow-md">
			<div class="h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20"></div>
			<div class="px-6 pb-6">
				<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between -mt-10">
					<div class="flex items-end gap-4">
						<div class="relative">
							<Avatar.Root class="size-20 ring-4 ring-background">
								<Avatar.Image src="https://github.com/vanessa.png" alt="Avatar" />
								<Avatar.Fallback class="text-lg font-bold">{data.profil.prenom[0]}{data.profil.nom[0]}</Avatar.Fallback>
							</Avatar.Root>
							<button class="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-110">
								<Camera class="size-3.5" />
							</button>
						</div>
						<div class="pb-1">
							<h2 class="text-xl font-bold">{data.profil.prenom} {data.profil.nom}</h2>
							<div class="mt-1 flex items-center gap-2">
								<Badge variant="outline" class="text-xs {roleColors[data.profil.role] || 'bg-muted text-muted-foreground'}">
									{data.profil.role}
								</Badge>
								<span class="text-xs text-muted-foreground">Inscrit le {new Date(data.profil.dateInscription).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
							</div>
						</div>
					</div>
					{#if !isEditing}
						<Button onclick={startEdit} class="gap-2">
							<User class="size-4" />
							Modifier le profil
						</Button>
					{:else}
						<div class="flex gap-2">
							<Button variant="outline" onclick={cancelEdit} class="gap-2">
								<X class="size-4" />
								Annuler
							</Button>
							<Button onclick={saveProfile} disabled={saving} class="gap-2">
								{#if saving}
									<div class="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"></div>
								{:else}
									<Save class="size-4" />
								{/if}
								Enregistrer
							</Button>
						</div>
					{/if}
				</div>
			</div>
		</Card>

		<!-- Stats -->
		<div class="grid grid-cols-3 gap-3">
			{#each stats as stat, i}
				<Card class="animate-slide-up stagger-{i + 2} opacity-0 p-4 text-center transition-all duration-200 hover:shadow-sm">
					<stat.icon class="mx-auto size-5 text-muted-foreground" />
					<p class="mt-2 text-sm font-semibold">{stat.value}</p>
					<p class="text-xs text-muted-foreground">{stat.label}</p>
				</Card>
			{/each}
		</div>

		<!-- Info Cards -->
		<div class="grid gap-4 md:grid-cols-2">
			<Card class="animate-slide-up stagger-5 opacity-0 p-5 transition-all duration-200 hover:shadow-sm">
				<h3 class="mb-4 font-semibold flex items-center gap-2">
					<User class="size-4 text-primary" />
					Informations personnelles
				</h3>
				{#if !isEditing}
					<div class="space-y-4">
						<div class="flex items-start gap-3">
							<Mail class="size-4 text-muted-foreground mt-0.5" />
							<div>
								<Label class="text-xs text-muted-foreground">Email</Label>
								<p class="text-sm font-medium">{data.profil.email}</p>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<Phone class="size-4 text-muted-foreground mt-0.5" />
							<div>
								<Label class="text-xs text-muted-foreground">Téléphone</Label>
								<p class="text-sm font-medium">{data.profil.phone}</p>
							</div>
						</div>
						{#if data.profil.adresse}
							<div class="flex items-start gap-3">
								<MapPin class="size-4 text-muted-foreground mt-0.5" />
								<div>
									<Label class="text-xs text-muted-foreground">Adresse</Label>
									<p class="text-sm font-medium">{data.profil.adresse}</p>
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<div class="grid gap-4">
						<div class="grid gap-2">
							<Label for="edit-nom">Nom</Label>
							<Input id="edit-nom" bind:value={editNom} />
						</div>
						<div class="grid gap-2">
							<Label for="edit-prenom">Prénom</Label>
							<Input id="edit-prenom" bind:value={editPrenom} />
						</div>
						<div class="grid gap-2">
							<Label for="edit-email">Email</Label>
							<Input id="edit-email" type="email" bind:value={editEmail} />
						</div>
						<div class="grid gap-2">
							<Label for="edit-phone">Téléphone</Label>
							<Input id="edit-phone" type="tel" bind:value={editPhone} />
						</div>
						<div class="grid gap-2">
							<Label for="edit-adresse">Adresse</Label>
							<Input id="edit-adresse" bind:value={editAdresse} />
						</div>
					</div>
				{/if}
			</Card>

			<Card class="animate-slide-up stagger-6 opacity-0 p-5 transition-all duration-200 hover:shadow-sm">
				<h3 class="mb-4 font-semibold flex items-center gap-2">
					<Shield class="size-4 text-primary" />
					Informations du compte
				</h3>
				<div class="space-y-4">
					<div class="flex items-start gap-3">
						<Shield class="size-4 text-muted-foreground mt-0.5" />
						<div>
							<Label class="text-xs text-muted-foreground">Rôle</Label>
							<p class="text-sm font-medium">{data.profil.role}</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<Calendar class="size-4 text-muted-foreground mt-0.5" />
						<div>
							<Label class="text-xs text-muted-foreground">Date d'inscription</Label>
							<p class="text-sm font-medium">{new Date(data.profil.dateInscription).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<Building class="size-4 text-muted-foreground mt-0.5" />
						<div>
							<Label class="text-xs text-muted-foreground">Établissement</Label>
							<p class="text-sm font-medium">TASC</p>
						</div>
					</div>
				</div>
			</Card>
		</div>

		<!-- Bio Section -->
		<Card class="animate-slide-up stagger-7 opacity-0 p-5 transition-all duration-200 hover:shadow-sm">
			<h3 class="mb-4 font-semibold">À propos</h3>
			{#if !isEditing}
				<p class="text-sm text-muted-foreground leading-relaxed">
					{data.profil.bio || 'Aucune bio renseignée. Cliquez sur "Modifier le profil" pour en ajouter une.'}
				</p>
			{:else}
				<Textarea bind:value={editBio} placeholder="Décrivez-vous en quelques mots..." rows={3} class="text-sm" />
			{/if}
		</Card>
	</div>
</main>
