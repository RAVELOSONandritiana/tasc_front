<script lang="ts">
	import { loadingForm } from '$lib/actions/loadingForm';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Badge } from '$lib/components/ui/badge';
	import ProfileImage from '$lib/components/user/ProfileImage.svelte';
	import {
		User,
		Mail,
		Phone,
		Shield,
		Calendar,
		Save,
		X,
		MapPin,
		Building,
		Clock,
		CheckCircle2,
		CalendarDays,
		Users,
		TrendingUp,
		History
	} from '@lucide/svelte/icons';
	import type { PageProps } from './$types';
	import { hasAdminPower } from '$lib/permissions';

	const { data, form }: PageProps = $props();
	const isAdmin = $derived(hasAdminPower(data.user));

	let isEditing = $state(false);
	let saving = $state(false);
	let saved = $state(false);
	let matriculeSaved = $state(false);
	let matriculeError = $state('');
	let editMatricule = $state(data.profil.matricule);

	let editNom = $state(data.profil.nom);
	let editPrenom = $state(data.profil.prenom);
	let editEmail = $state(data.profil.email);
	let editPhone = $state(data.profil.phone);
	let editAdresse = $state(data.profil.adresse ?? '');
	let editBio = $state(data.profil.bio ?? '');
	let photo = $state<string | null>(data.profil.imageUrl ?? null);

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

	const roleColors: Record<string, string> = {
		Administrateur: 'bg-red-500/10 text-red-500 border-red-500/20',
		Enseignant: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
		Surveillant: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
		Personnel: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
	};

	const stats = $derived([
		{ label: 'Connecté depuis', value: '2 jours', icon: Clock },
		{ label: 'Rôle', value: data.profil.role, icon: Shield },
		{ label: 'Statut', value: 'Actif', icon: CheckCircle2 }
	]);

	const isEmployee = $derived(
		data.profil.role === 'Enseignant' || data.profil.role === 'Surveillant'
	);
	const employeeStats = $derived(data.profil.stats);

	const statCards = $derived.by(() => {
		if (!isEmployee || !employeeStats) return [];
		return [
			{
				label: 'Cours',
				value: `${employeeStats.nbCours}`,
				icon: CalendarDays,
				color: 'text-blue-500'
			},
			{
				label: 'Retards',
				value: employeeStats.retards.toString(),
				icon: TrendingUp,
				color: employeeStats.retards > 2 ? 'text-red-500' : 'text-amber-500'
			},
			{
				label: 'Absences',
				value: employeeStats.absences.toString(),
				icon: Users,
				color: employeeStats.absences > 1 ? 'text-red-500' : 'text-amber-500'
			},
			{
				label: 'Incidents',
				value: employeeStats.incidents.toString(),
				icon: Shield,
				color:
					employeeStats.incidents > 2
						? 'text-red-500'
						: employeeStats.incidents > 0
							? 'text-amber-500'
							: 'text-emerald-500'
			},
			{
				label: 'Notes positives',
				value: employeeStats.notesPositives.toString(),
				icon: CheckCircle2,
				color: 'text-emerald-500'
			},
			{
				label: 'Notes négatives',
				value: employeeStats.notesNegatives.toString(),
				icon: X,
				color:
					employeeStats.notesNegatives > 2
						? 'text-red-500'
						: employeeStats.notesNegatives > 0
							? 'text-amber-500'
							: 'text-emerald-500'
			}
		];
	});
</script>

<main class="flex-1 overflow-y-auto bg-background p-4 text-foreground md:p-6">
	<div class="space-y-6">
		<!-- Header -->
		<div
			class="animate-slide-down flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
		>
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Mon profil</h1>
				<p class="text-sm text-muted-foreground">Gérez vos informations personnelles</p>
			</div>
			{#if saved}
				<div
					class="animate-fade-in flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-500"
				>
					<CheckCircle2 class="size-4" />
					Profil mis à jour
				</div>
			{/if}
		</div>

		<!-- Profile Header Card -->
		<Card
			class="animate-slide-up stagger-1 overflow-hidden opacity-0 transition-all duration-200 hover:shadow-md"
		>
			<div class="h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20"></div>
			<div class="px-6 pb-6">
				<div class="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div class="flex items-end gap-4">
						<div class="relative">
							<ProfileImage
								personneId={data.profil.personneId}
								imageUrl={photo}
								initials={`${data.profil.nom[0] ?? ''}${data.profil.prenom[0] ?? ''}`}
								sizeClass="size-20"
							/>
						</div>
						<div class="pb-1">
							<h2 class="text-xl font-bold">{data.profil.nom} {data.profil.prenom}</h2>
							<div class="mt-1 flex items-center gap-2">
								<Badge
									variant="outline"
									class="text-xs {roleColors[data.profil.role] || 'bg-muted text-muted-foreground'}"
								>
									{data.profil.role}
								</Badge>
								<span class="text-xs text-muted-foreground"
									>Inscrit le {new Date(data.profil.dateInscription).toLocaleDateString('fr-FR', {
										day: 'numeric',
										month: 'long',
										year: 'numeric'
									})}</span
								>
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
							<Button type="submit" form="profile-form" disabled={saving} class="gap-2">
								{#if saving}
									<div
										class="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
									></div>
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
		<div class="grid grid-cols-2 gap-3 md:grid-cols-3">
			{#each stats as stat, i (stat.label)}
				<Card
					class="animate-slide-up stagger-{i +
						2} p-4 text-center opacity-0 transition-all duration-200 hover:shadow-sm"
				>
					<stat.icon class="mx-auto size-5 text-muted-foreground" />
					<p class="mt-2 text-sm font-semibold">{stat.value}</p>
					<p class="text-xs text-muted-foreground">{stat.label}</p>
				</Card>
			{/each}
		</div>

		<!-- Employee Stats -->
		{#if isEmployee && employeeStats}
			<div class="space-y-3">
				<h3 class="text-lg font-semibold">Statistiques de travail</h3>
				<div class="grid grid-cols-2 gap-3 md:grid-cols-3">
					{#each statCards as stat, i (stat.label)}
						<Card
							class="animate-slide-up stagger-{i +
								2} p-4 opacity-0 transition-all duration-200 hover:shadow-sm"
						>
							<div class="flex items-center gap-2">
								<stat.icon class="size-4 {stat.color}" />
								<div>
									<p class="text-xs text-muted-foreground">{stat.label}</p>
									<p class="text-lg font-bold">{stat.value}</p>
								</div>
							</div>
						</Card>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Info Cards -->
		<form
			id="profile-form"
			method="POST"
			action="?/update"
			class="grid gap-4 md:grid-cols-2"
			use:enhance={() => {
				saving = true;
				return async ({ result, update }) => {
					saving = false;
					if (result.type === 'success') {
						await update({ invalidateAll: true });
						isEditing = false;
						saved = true;
						setTimeout(() => (saved = false), 3000);
					} else if (result.type === 'failure') {
						alert((result.data as { error?: string })?.error ?? 'Mise à jour impossible');
					}
				};
			}}
		>
			<Card
				class="animate-slide-up stagger-5 p-5 opacity-0 transition-all duration-200 hover:shadow-sm"
			>
				<h3 class="mb-4 flex items-center gap-2 font-semibold">
					<User class="size-4 text-primary" />
					Informations personnelles
				</h3>
				{#if !isEditing}
					<div class="space-y-4">
						<div class="flex items-start gap-3">
							<User class="mt-0.5 size-4 text-muted-foreground" />
							<div>
								<Label class="text-xs text-muted-foreground">Nom</Label>
								<p class="text-sm font-medium">{data.profil.nom}</p>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<User class="mt-0.5 size-4 text-muted-foreground" />
							<div>
								<Label class="text-xs text-muted-foreground">Prénom</Label>
								<p class="text-sm font-medium">{data.profil.prenom}</p>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<Mail class="mt-0.5 size-4 text-muted-foreground" />
							<div>
								<Label class="text-xs text-muted-foreground">Email</Label>
								<p class="text-sm font-medium">{data.profil.email}</p>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<Phone class="mt-0.5 size-4 text-muted-foreground" />
							<div>
								<Label class="text-xs text-muted-foreground">Téléphone</Label>
								<p class="text-sm font-medium">{data.profil.phone}</p>
							</div>
						</div>
						{#if data.profil.adresse}
							<div class="flex items-start gap-3">
								<MapPin class="mt-0.5 size-4 text-muted-foreground" />
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
							<Input id="edit-nom" name="nom" bind:value={editNom} />
						</div>
						<div class="grid gap-2">
							<Label for="edit-prenom">Prénom</Label>
							<Input id="edit-prenom" name="prenom" bind:value={editPrenom} />
						</div>
						<div class="grid gap-2">
							<Label for="edit-email">Email</Label>
							<Input id="edit-email" type="email" name="email" bind:value={editEmail} />
						</div>
						<div class="grid gap-2">
							<Label for="edit-phone">Téléphone</Label>
							<Input id="edit-phone" type="tel" name="phone" bind:value={editPhone} />
						</div>
						<div class="grid gap-2">
							<Label for="edit-adresse">Adresse</Label>
							<Input id="edit-adresse" name="adresse" bind:value={editAdresse} />
						</div>
					</div>
				{/if}
			</Card>

			<Card
				class="animate-slide-up stagger-6 p-5 opacity-0 transition-all duration-200 hover:shadow-sm"
			>
				<h3 class="mb-4 flex items-center gap-2 font-semibold">
					<Shield class="size-4 text-primary" />
					Informations du compte
				</h3>
				<div class="space-y-4">
					<div class="flex items-start gap-3">
						<Shield class="mt-0.5 size-4 text-muted-foreground" />
						<div>
							<Label class="text-xs text-muted-foreground">Rôle</Label>
							<p class="text-sm font-medium">{data.profil.role}</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<Calendar class="mt-0.5 size-4 text-muted-foreground" />
						<div>
							<Label class="text-xs text-muted-foreground">Date d'inscription</Label>
							<p class="text-sm font-medium">
								{new Date(data.profil.dateInscription).toLocaleDateString('fr-FR', {
									day: 'numeric',
									month: 'long',
									year: 'numeric'
								})}
							</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<Building class="mt-0.5 size-4 text-muted-foreground" />
						<div>
							<Label class="text-xs text-muted-foreground">Établissement</Label>
							<p class="text-sm font-medium">TASC</p>
						</div>
					</div>
				</div>
			</Card>

			<!-- Bio Section -->
			<Card
				class="animate-slide-up stagger-7 p-5 opacity-0 transition-all duration-200 hover:shadow-sm"
			>
				<h3 class="mb-4 font-semibold">À propos</h3>
				{#if !isEditing}
					<p class="text-sm leading-relaxed text-muted-foreground">
						{data.profil.bio ||
							'Aucune bio renseignée. Cliquez sur "Modifier le profil" pour en ajouter une.'}
					</p>
				{:else}
					<Textarea
						name="bio"
						bind:value={editBio}
						placeholder="Décrivez-vous en quelques mots..."
						rows={3}
						class="text-sm"
					/>
				{/if}
			</Card>
		</form>

		<!-- Activity History -->
		{#if isAdmin}
		<Card
			class="animate-slide-up stagger-7 p-5 opacity-0 transition-all duration-200 hover:shadow-sm"
		>
			<div class="mb-4 flex items-center justify-between">
				<h3 class="flex items-center gap-2 font-semibold">
					<History class="size-4 text-primary" />
					Historique des activités
				</h3>
				<Button
					variant="ghost"
					size="sm"
					class="gap-1 text-xs"
					onclick={() => goto(`/profil/${data.profil.id}/history`)}
				>
					Voir tout
					<History class="size-3.5" />
				</Button>
			</div>
			{#if data.activities && data.activities.length > 0}
				<div class="space-y-2">
					{#each data.activities.slice(0, 5) as act (act.id)}
						<div class="flex items-start gap-3 rounded-md border border-sidebar-border p-3">
							<div
								class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10"
							>
								<Clock class="size-4 text-primary" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-sm font-medium">{act.description}</p>
								<p class="text-xs text-muted-foreground">
									{new Date(act.createdAt).toLocaleString('fr-FR', {
										day: 'numeric',
										month: 'short',
										year: 'numeric',
										hour: '2-digit',
										minute: '2-digit'
									})}
								</p>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div
					class="flex flex-col items-center justify-center py-8 text-center text-muted-foreground"
				>
					<Clock class="mb-2 size-8" />
					<p class="text-sm">Aucune activité enregistrée</p>
				</div>
			{/if}
		</Card>
		{/if}

		<!-- Password Change -->
		<Card class="animate-slide-up stagger-8 p-5 opacity-0">
			<h3 class="mb-4 flex items-center gap-2 font-semibold">
				<Shield class="size-4 text-primary" />
				Mot de passe
			</h3>
			<form method="POST" action="?/changePassword" use:loadingForm>
				<div class="grid gap-4 md:grid-cols-3">
					<div class="grid gap-2">
						<Label for="currentPassword">Mot de passe actuel</Label>
						<Input id="currentPassword" name="currentPassword" type="password" required />
					</div>
					<div class="grid gap-2">
						<Label for="newPassword">Nouveau mot de passe</Label>
						<Input id="newPassword" name="newPassword" type="password" required />
					</div>
					<div class="grid gap-2">
						<Label for="confirmPassword">Confirmer</Label>
						<Input id="confirmPassword" name="confirmPassword" type="password" required />
					</div>
				</div>
				<div class="mt-4">
					<Button type="submit" variant="default">Changer le mot de passe</Button>
				</div>
			</form>
		</Card>

		<!-- Matricule Change -->
		<Card class="animate-slide-up stagger-8 p-5 opacity-0">
			<h3 class="mb-1 flex items-center gap-2 font-semibold">
				<Shield class="size-4 text-primary" />
				Identifiant de connexion (matricule)
			</h3>
			<p class="mb-4 text-xs text-muted-foreground">
				Le matricule sert à vous connecter. Après modification, utilisez le nouveau matricule
				lors de votre prochaine connexion.
			</p>
			{#if matriculeSaved}
				<div
					class="animate-fade-in mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500"
				>
					<CheckCircle2 class="size-4" />
					Matricule mis à jour
				</div>
			{:else if matriculeError}
				<div
					class="animate-fade-in mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
				>
					{matriculeError}
				</div>
			{/if}
			<form
				method="POST"
				action="?/changeMatricule"
				class="flex flex-col gap-4 sm:flex-row sm:items-end"
				use:enhance={() => {
					matriculeError = '';
					return async ({ result }) => {
						if (result.type === 'success') {
							matriculeSaved = true;
							matriculeError = '';
							setTimeout(() => (matriculeSaved = false), 3000);
						} else if (result.type === 'failure') {
							matriculeSaved = false;
							matriculeError =
								((result.data as { error?: string })?.error ??
									'Modification impossible');
						}
					};
				}}
			>
				<div class="grid w-full gap-2 sm:max-w-xs">
					<Label for="matricule">Nouveau matricule</Label>
					<Input id="matricule" name="matricule" bind:value={editMatricule} placeholder="Ex: ADM-001" />
				</div>
				<Button type="submit" variant="default" class="gap-2">
					<Save class="size-4" />
					Enregistrer
				</Button>
			</form>
		</Card>
	</div>
</main>
