<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { ActionResult } from '@sveltejs/kit';
	import { Spinner } from '$lib/components/ui/spinner';

	let submitting = $state(false);
	let success = $state(false);
	let errors = $state<Record<string, string>>({});

	let form = $state({
		nom: '',
		prenom: '',
		dateNaissance: '',
		lieuNaissance: '',
		communeNaissance: '',
		regionNaissance: '',
		provinceNaissance: '',
		domicile: '',
		fokontany: '',
		communeResidence: '',
		regionResidence: '',
		provinceResidence: '',
		telephoneEleve: '',
		emailEleve: '',
		cin: '',
		nomPere: '',
		prenomPere: '',
		telephonePere: '',
		nomMere: '',
		prenomMere: '',
		telephoneMere: ''
	});

	function resetForm() {
		form = {
			nom: '',
			prenom: '',
			dateNaissance: '',
			lieuNaissance: '',
			communeNaissance: '',
			regionNaissance: '',
			provinceNaissance: '',
			domicile: '',
			fokontany: '',
			communeResidence: '',
			regionResidence: '',
			provinceResidence: '',
			telephoneEleve: '',
			emailEleve: '',
			cin: '',
			nomPere: '',
			prenomPere: '',
			telephonePere: '',
			nomMere: '',
			prenomMere: '',
			telephoneMere: ''
		};
		errors = {};
		success = false;
	}
</script>

<main class="min-h-full bg-sidebar p-4 text-sidebar-foreground">
	<div class="mx-auto max-w-4xl">
		<div class="mb-6 space-y-2">
			<h1 class="text-2xl font-bold">Nouvel élève</h1>
			<p class="text-sm text-muted-foreground">
				Tous les champs sont obligatoires sauf les téléphones des parents, les informations du
				tuteur et le contact de l'élève.
			</p>
		</div>

		{#if success}
			<div class="mb-6 rounded-md border border-emerald-500 bg-emerald-500/10 p-4 text-center">
				<p class="text-sm font-medium text-emerald-500">Élève créé avec succès !</p>
			</div>
		{/if}

		{#if errors._form}
			<div class="mb-6 rounded-md border border-destructive bg-destructive/10 p-3">
				<p class="text-sm text-destructive">{errors._form}</p>
			</div>
		{/if}

		<form
			method="POST"
			action="?/create"
			use:enhance={() => {
				submitting = true;
				errors = {};
				return async ({ result }: { result: ActionResult }) => {
					submitting = false;
					if (result.type === 'success') {
						success = true;
						setTimeout(() => {
							resetForm();
							goto('/eleves');
						}, 800);
					} else if (result.type === 'failure') {
						errors = result.data?.errors || {};
					}
				};
			}}
			class="space-y-6"
		>
			<div class="grid gap-4 md:grid-cols-3">
				<div class="grid gap-2">
					<Label for="nom">Nom *</Label>
					<Input
						id="nom"
						name="nom"
						bind:value={form.nom}
						placeholder="Entrer le nom"
						class={errors.nom ? 'border-destructive' : ''}
						oninput={(e) => (form.nom = (e.target as HTMLInputElement).value.toUpperCase())}
					/>
					{#if errors.nom}
						<span class="text-xs text-destructive">{errors.nom}</span>
					{/if}
				</div>
				<div class="grid gap-2">
					<Label for="prenom">Prénom *</Label>
					<Input
						id="prenom"
						name="prenom"
						bind:value={form.prenom}
						placeholder="Entrer le prénom"
						class={errors.prenom ? 'border-destructive' : ''}
						oninput={(e) =>
							(form.prenom = (e.target as HTMLInputElement).value
								.toLowerCase()
								.replace(/\b\w/g, (c) => c.toUpperCase()))}
					/>
					{#if errors.prenom}
						<span class="text-xs text-destructive">{errors.prenom}</span>
					{/if}
				</div>
				<div class="grid gap-2">
					<Label for="dateNaissance">Date de naissance *</Label>
					<Input
						id="dateNaissance"
						name="dateNaissance"
						type="date"
						bind:value={form.dateNaissance}
						class={errors.dateNaissance ? 'border-destructive' : ''}
					/>
					{#if errors.dateNaissance}
						<span class="text-xs text-destructive">{errors.dateNaissance}</span>
					{/if}
				</div>
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<div class="grid gap-2">
					<Label for="lieuNaissance">Lieu de naissance *</Label>
					<Input
						id="lieuNaissance"
						name="lieuNaissance"
						bind:value={form.lieuNaissance}
						placeholder="Ex: Antananarivo"
						class={errors.lieuNaissance ? 'border-destructive' : ''}
						oninput={(e) => (form.lieuNaissance = (e.target as HTMLInputElement).value.toUpperCase())}
					/>
					{#if errors.lieuNaissance}
						<span class="text-xs text-destructive">{errors.lieuNaissance}</span>
					{/if}
				</div>
				<div class="grid gap-2">
					<Label for="communeNaissance">Commune de naissance</Label>
					<Input
						id="communeNaissance"
						name="communeNaissance"
						bind:value={form.communeNaissance}
						placeholder="Ex: Isoraka"
						oninput={(e) => (form.communeNaissance = (e.target as HTMLInputElement).value.toUpperCase())}
					/>
				</div>
				<div class="grid gap-2">
					<Label for="regionNaissance">Région de naissance</Label>
					<Input
						id="regionNaissance"
						name="regionNaissance"
						bind:value={form.regionNaissance}
						placeholder="Ex: Analamanga"
						oninput={(e) => (form.regionNaissance = (e.target as HTMLInputElement).value.toUpperCase())}
					/>
					{#if errors.regionNaissance}
						<span class="text-xs text-destructive">{errors.regionNaissance}</span>
					{/if}
				</div>
				<div class="grid gap-2">
					<Label for="provinceNaissance">Province *</Label>
					<select
						id="provinceNaissance"
						name="provinceNaissance"
						bind:value={form.provinceNaissance}
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					>
						<option value="">Sélectionner</option>
						<option value="antananarivo">Antananarivo</option>
						<option value="antsiranana">Antsiranana</option>
						<option value="fianarantsoa">Fianarantsoa</option>
						<option value="mahajanga">Mahajanga</option>
						<option value="toamasina">Toamasina</option>
						<option value="toliara">Toliara</option>
					</select>
					{#if errors.provinceNaissance}
						<span class="text-xs text-destructive">{errors.provinceNaissance}</span>
					{/if}
				</div>
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<div class="grid gap-2">
					<Label for="domicile">Domicile *</Label>
					<Input
						id="domicile"
						name="domicile"
						bind:value={form.domicile}
						placeholder="Ex: Lot C234 Ambatonakanga"
						class={errors.domicile ? 'border-destructive' : ''}
						oninput={(e) => (form.domicile = (e.target as HTMLInputElement).value.toUpperCase())}
					/>
					{#if errors.domicile}
						<span class="text-xs text-destructive">{errors.domicile}</span>
					{/if}
				</div>
				<div class="grid gap-2">
					<Label for="fokontany">Fokontany *</Label>
					<Input
						id="fokontany"
						name="fokontany"
						bind:value={form.fokontany}
						placeholder="Ex: Ambatonakanga"
						class={errors.fokontany ? 'border-destructive' : ''}
						oninput={(e) => (form.fokontany = (e.target as HTMLInputElement).value.toUpperCase())}
					/>
					{#if errors.fokontany}
						<span class="text-xs text-destructive">{errors.fokontany}</span>
					{/if}
				</div>
				<div class="grid gap-2">
					<Label for="communeResidence">Commune de résidence *</Label>
					<Input
						id="communeResidence"
						name="communeResidence"
						bind:value={form.communeResidence}
						placeholder="Ex: Toamasina"
						class={errors.communeResidence ? 'border-destructive' : ''}
						oninput={(e) => (form.communeResidence = (e.target as HTMLInputElement).value.toUpperCase())}
					/>
					{#if errors.communeResidence}
						<span class="text-xs text-destructive">{errors.communeResidence}</span>
					{/if}
				</div>
				<div class="grid gap-2">
					<Label for="regionResidence">Région de résidence *</Label>
					<Input
						id="regionResidence"
						name="regionResidence"
						bind:value={form.regionResidence}
						placeholder="Ex: Toamasina"
						class={errors.regionResidence ? 'border-destructive' : ''}
						oninput={(e) => (form.regionResidence = (e.target as HTMLInputElement).value.toUpperCase())}
					/>
					{#if errors.regionResidence}
						<span class="text-xs text-destructive">{errors.regionResidence}</span>
					{/if}
				</div>
			</div>

			<div class="grid gap-4 md:grid-cols-3">
				<div class="grid gap-2">
					<Label for="telephoneEleve">Téléphone élève</Label>
					<Input
						id="telephoneEleve"
						name="telephoneEleve"
						bind:value={form.telephoneEleve}
						type="tel"
						placeholder="+261xxxxxxxx"
						class={errors.telephoneEleve ? 'border-destructive' : ''}
					/>
					{#if errors.telephoneEleve}
						<span class="text-xs text-destructive">{errors.telephoneEleve}</span>
					{/if}
				</div>
				<div class="grid gap-2">
					<Label for="emailEleve">Email élève</Label>
					<Input
						id="emailEleve"
						name="emailEleve"
						bind:value={form.emailEleve}
						type="email"
						placeholder="exemple@email.com"
						class={errors.emailEleve ? 'border-destructive' : ''}
					/>
					{#if errors.emailEleve}
						<span class="text-xs text-destructive">{errors.emailEleve}</span>
					{/if}
				</div>
				<div class="grid gap-2">
					<Label for="cin">CIN *</Label>
					<Input
						id="cin"
						name="cin"
						bind:value={form.cin}
						placeholder="Entrer le CIN"
						maxlength={12}
						class={errors.cin ? 'border-destructive' : ''}
					/>
					{#if errors.cin}
						<span class="text-xs text-destructive">{errors.cin}</span>
					{/if}
				</div>
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<div class="grid gap-2">
					<Label for="nomPere">Nom du père *</Label>
					<Input
						id="nomPere"
						name="nomPere"
						bind:value={form.nomPere}
						placeholder="Entrer le nom"
						class={errors.nomPere ? 'border-destructive' : ''}
						oninput={(e) => (form.nomPere = (e.target as HTMLInputElement).value.toUpperCase())}
					/>
					{#if errors.nomPere}
						<span class="text-xs text-destructive">{errors.nomPere}</span>
					{/if}
				</div>
				<div class="grid gap-2">
					<Label for="prenomPere">Prénom du père *</Label>
					<Input
						id="prenomPere"
						name="prenomPere"
						bind:value={form.prenomPere}
						placeholder="Entrer le prénom"
						class={errors.prenomPere ? 'border-destructive' : ''}
						oninput={(e) =>
							(form.prenomPere = (e.target as HTMLInputElement).value
								.toLowerCase()
								.replace(/\b\w/g, (c) => c.toUpperCase()))}
					/>
					{#if errors.prenomPere}
						<span class="text-xs text-destructive">{errors.prenomPere}</span>
					{/if}
				</div>
				<div class="grid gap-2">
					<Label for="telephonePere">Téléphone du père</Label>
					<Input
						id="telephonePere"
						name="telephonePere"
						bind:value={form.telephonePere}
						type="tel"
						placeholder="+261...."
					/>
				</div>
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<div class="grid gap-2">
					<Label for="nomMere">Nom de la mère *</Label>
					<Input
						id="nomMere"
						name="nomMere"
						bind:value={form.nomMere}
						placeholder="Entrer le nom"
						class={errors.nomMere ? 'border-destructive' : ''}
						oninput={(e) => (form.nomMere = (e.target as HTMLInputElement).value.toUpperCase())}
					/>
					{#if errors.nomMere}
						<span class="text-xs text-destructive">{errors.nomMere}</span>
					{/if}
				</div>
				<div class="grid gap-2">
					<Label for="prenomMere">Prénom de la mère *</Label>
					<Input
						id="prenomMere"
						name="prenomMere"
						bind:value={form.prenomMere}
						placeholder="Entrer le prénom"
						class={errors.prenomMere ? 'border-destructive' : ''}
						oninput={(e) =>
							(form.prenomMere = (e.target as HTMLInputElement).value
								.toLowerCase()
								.replace(/\b\w/g, (c) => c.toUpperCase()))}
					/>
					{#if errors.prenomMere}
						<span class="text-xs text-destructive">{errors.prenomMere}</span>
					{/if}
				</div>
				<div class="grid gap-2">
					<Label for="telephoneMere">Téléphone de la mère</Label>
					<Input
						id="telephoneMere"
						name="telephoneMere"
						bind:value={form.telephoneMere}
						type="tel"
						placeholder="+261...."
					/>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<Button type="submit" disabled={submitting || success}>
					{#if submitting}
						<Spinner class="mr-2 size-4" />
						Création...
					{:else if success}
						Créé !
					{:else}
						Créer l'élève
					{/if}
				</Button>
				<Button type="button" variant="outline" onclick={resetForm} disabled={submitting || success}>
					Effacer
				</Button>
			</div>
		</form>
	</div>
</main>
