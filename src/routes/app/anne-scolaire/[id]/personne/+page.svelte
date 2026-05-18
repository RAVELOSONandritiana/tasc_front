<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';

	// Données du formulaire
	let nom = $state('');
	let prenom = $state('');
	let dateNaissance = $state('');
	let sexe = $state('');
	let nomPere = $state('');
	let nomMere = $state('');
	let adresse = $state('');
	let email = $state('');
	let telephone = $state('');
	let telephoneProche = $state('');
	let photo = $state<string | null>(null);

	// Calcul de l'âge à partir de la date de naissance
	let age = $derived(
		dateNaissance
			? Math.floor(
					(new Date().getTime() - new Date(dateNaissance).getTime()) /
						(1000 * 60 * 60 * 24 * 365.25)
				)
			: 0
	);

	// Options pour le sexe
	const sexeOptions = [
		{ value: 'M', label: 'Masculin' },
		{ value: 'F', label: 'Féminin' }
	];

	// Type pour les collaborateurs
	interface Collaborateur {
		id: number;
		nom: string;
		prenom: string;
		age: number;
		photo: string | null;
		sexe: string;
		nomPere?: string;
		nomMere?: string;
		adresse?: string;
		email?: string;
		telephone?: string;
		telephoneProche?: string;
	}

	// Liste des collaborateurs (exemple)
	let collaborateurs = $state<Collaborateur[]>([
		{
			id: 1,
			nom: 'Rakoto',
			prenom: 'Jean',
			age: 35,
			photo: null,
			sexe: 'M',
			nomPere: 'Rakoto père',
			nomMere: 'Rakoto mère',
			telephone: '0340000000',
			telephoneProche: '0330000000'
		},
		{
			id: 2,
			nom: 'Rasoa',
			prenom: 'Marie',
			age: 28,
			photo: null,
			sexe: 'F'
		}
	]);

	// Recherche
	let searchTerm = $state('');

	// Filtrer les collaborateurs
	let collaborateursFiltres = $derived(
		collaborateurs.filter(
			(c) =>
				c.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
				c.prenom.toLowerCase().includes(searchTerm.toLowerCase())
		)
	);

	// Collaborateur en cours d'édition
	let collaborateurEnEdition = $state<Collaborateur | null>(null);
	let dialogOpen = $state(false);

	// Gestion de la photo
	function handlePhotoUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const reader = new FileReader();
			reader.onload = (e) => {
				photo = e.target?.result as string;
			};
			reader.readAsDataURL(input.files[0]);
		}
	}

	function triggerCamera() {
		const input = document.getElementById('photo-upload') as HTMLInputElement;
		input?.click();
	}

	// Ouvrir le dialog pour éditer
	function ouvrirEdition(collaborateur: Collaborateur) {
		collaborateurEnEdition = { ...collaborateur };
		nom = collaborateur.nom;
		prenom = collaborateur.prenom;
		dateNaissance = '';
		sexe = collaborateur.sexe;
		nomPere = collaborateur.nomPere || '';
		nomMere = collaborateur.nomMere || '';
		adresse = collaborateur.adresse || '';
		email = collaborateur.email || '';
		telephone = collaborateur.telephone || '';
		telephoneProche = collaborateur.telephoneProche || '';
		photo = collaborateur.photo;
		dialogOpen = true;
	}

	// Ouvrir le dialog pour créer
	function ouvrirCreation() {
		collaborateurEnEdition = null;
		resetForm();
		dialogOpen = true;
	}

	function resetForm() {
		nom = '';
		prenom = '';
		dateNaissance = '';
		sexe = '';
		nomPere = '';
		nomMere = '';
		adresse = '';
		email = '';
		telephone = '';
		telephoneProche = '';
		photo = null;
	}

	function handleSubmit() {
		if (collaborateurEnEdition) {
			// Édition
			const index = collaborateurs.findIndex((c) => c.id === collaborateurEnEdition!.id);
			if (index !== -1) {
				collaborateurs[index] = {
					...collaborateurs[index],
					nom,
					prenom,
					age,
					photo,
					sexe,
					nomPere,
					nomMere,
					adresse,
					email,
					telephone,
					telephoneProche
				};
			}
		} else {
			// Création
			const nouveauCollaborateur: Collaborateur = {
				id: collaborateurs.length + 1,
				nom,
				prenom,
				age,
				photo,
				sexe,
				nomPere,
				nomMere,
				adresse,
				email,
				telephone,
				telephoneProche
			};
			collaborateurs = [...collaborateurs, nouveauCollaborateur];
		}
		dialogOpen = false;
		resetForm();
	}

	// Supprimer un collaborateur
	function supprimerCollaborateur(id: number) {
		collaborateurs = collaborateurs.filter((c) => c.id !== id);
	}
</script>

<main class="flex-1 p-6 bg-sidebar text-sidebar-foreground">
	<div class="max-w-6xl mx-auto">
		<!-- Header avec recherche et bouton créer -->
		<div class="flex items-center justify-between mb-6">
			<div class="relative w-64">
				<svg class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
				<Input
					type="text"
					placeholder="Rechercher un collaborateur..."
					bind:value={searchTerm}
					class="pl-10"
				/>
			</div>
			
			<Dialog bind:open={dialogOpen}>
				<DialogTrigger>
					<Button onclick={ouvrirCreation}>
						<svg class="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
						Créer un collaborateur
					</Button>
				</DialogTrigger>
				<DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{collaborateurEnEdition ? 'Modifier' : 'Créer'} un collaborateur</DialogTitle>
					</DialogHeader>
					
					<form onsubmit={handleSubmit} class="space-y-4 mt-4">
						<!-- Photo -->
						<div class="flex flex-col items-center space-y-2">
							<div class="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
								{#if photo}
									<img src={photo} alt="Photo" class="w-full h-full object-cover" />
								{:else}
									<svg class="w-8 h-8 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-1.5-3z"/><circle cx="12" cy="13" r="3"/><path d="M3 13l2-2 2 2-2 2-2-2zm14 0l2-2 2 2-2 2-2-2z"/></svg>
								{/if}
							</div>
							<input
								type="file"
								id="photo-upload"
								accept="image/*"
								capture="environment"
								onchange={handlePhotoUpload}
								class="hidden"
							/>
							<Button type="button" variant="outline" size="sm" onclick={triggerCamera}>
								Prendre une photo
							</Button>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div class="space-y-2">
								<Label for="nom">Nom</Label>
								<Input id="nom" bind:value={nom} placeholder="Entrez le nom" required />
							</div>
							<div class="space-y-2">
								<Label for="prenom">Prénom</Label>
								<Input id="prenom" bind:value={prenom} placeholder="Entrez le prénom" required />
							</div>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div class="space-y-2">
								<Label for="dateNaissance">Date de naissance</Label>
								<Input
									id="dateNaissance"
									type="date"
									bind:value={dateNaissance}
									required
								/>
							</div>
							<div class="space-y-2">
								<Label for="age">Âge (calculé)</Label>
								<Input id="age" type="number" value={age} readonly class="bg-muted" />
							</div>
						</div>

						<div class="space-y-2">
							<Label for="sexe">Sexe</Label>
							<select
								id="sexe"
								bind:value={sexe}
								class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
								required
							>
								<option value="">Sélectionnez le sexe</option>
								{#each sexeOptions as option (option.value)}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div class="space-y-2">
								<Label for="nomPere">Nom du père</Label>
								<Input
									id="nomPere"
									bind:value={nomPere}
									placeholder="Entrez le nom du père"
								/>
							</div>
							<div class="space-y-2">
								<Label for="nomMere">Nom de la mère</Label>
								<Input
									id="nomMere"
									bind:value={nomMere}
									placeholder="Entrez le nom de la mère"
								/>
							</div>
						</div>

						<div class="space-y-2">
							<Label for="adresse">Adresse</Label>
							<Input
								id="adresse"
								bind:value={adresse}
								placeholder="Entrez l'adresse"
							/>
						</div>

						<div class="space-y-2">
							<Label for="email">Email</Label>
							<Input
								id="email"
								type="email"
								bind:value={email}
								placeholder="Entrez l'email"
							/>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div class="space-y-2">
								<Label for="telephone">Téléphone</Label>
								<Input
									id="telephone"
									type="tel"
									bind:value={telephone}
									placeholder="Entrez le téléphone"
								/>
							</div>
							<div class="space-y-2">
								<Label for="telephoneProche">Téléphone proche</Label>
								<Input
									id="telephoneProche"
									type="tel"
									bind:value={telephoneProche}
									placeholder="Entrez le téléphone d'un proche"
								/>
							</div>
						</div>

						<Button type="submit" class="w-full">{collaborateurEnEdition ? 'Modifier' : 'Créer'} le collaborateur</Button>
					</form>
				</DialogContent>
			</Dialog>
		</div>

		<!-- Liste des collaborateurs -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each collaborateursFiltres as collaborateur (collaborateur.id)}
				<Card>
					<CardContent class="p-4">
						<div class="flex items-center space-x-4 mb-3">
							<div class="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
								{#if collaborateur.photo}
									<img src={collaborateur.photo} alt="Photo" class="w-full h-full object-cover" />
								{:else}
									<span class="text-lg font-semibold">
										{collaborateur.prenom[0]}{collaborateur.nom[0]}
									</span>
								{/if}
							</div>
							<div>
								<h3 class="font-semibold">{collaborateur.prenom} {collaborateur.nom}</h3>
								<p class="text-sm text-muted-foreground">{collaborateur.age} ans</p>
							</div>
						</div>
						
						<!-- Boutons Voir, Modifier, Supprimer -->
						<div class="flex gap-2">
							<Button variant="outline" size="sm" class="flex-1">
								Voir
							</Button>
							<Button variant="outline" size="sm" class="flex-1" onclick={() => ouvrirEdition(collaborateur)}>
								Modifier
							</Button>
							<Button variant="destructive" size="sm" class="flex-1" onclick={() => supprimerCollaborateur(collaborateur.id)}>
								Supprimer
							</Button>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	</div>
</main>