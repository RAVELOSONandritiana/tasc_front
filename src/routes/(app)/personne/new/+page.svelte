<script lang="ts">
	import { enhance } from '$app/forms';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button/index.js';
	import { goto } from '$app/navigation';
	import type { ActionResult } from '@sveltejs/kit';
	import { Spinner } from '$lib/components/ui/spinner';

	interface PersonnelForm {
		nom: string;
		prenom: string;
		dateNaissance: string;
		lieuNaissance: string;
		communeNaissance: string;
		regionNaissance: string;
		provinceNaissance: string;
		domicile: string;
		fokontany: string;
		communeResidence: string;
		regionResidence: string;
		provinceResidence: string;
		telephone: string;
		email: string;
		cin: string;
	}

	let form = $state<PersonnelForm>({
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
		telephone: '',
		email: '',
		cin: ''
	});

	let submitting = $state(false);
	let success = $state(false);
	let errors = $state<Record<string, string>>({});

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
			telephone: '',
			email: '',
			cin: ''
		};
		errors = {};
		success = false;
	}
</script>

<main class="min-h-full bg-sidebar p-4 text-sidebar-foreground">
	<div class="mx-auto max-w-4xl">
		<div class="mb-6 space-y-2">
			<h1 class="text-2xl font-bold">Nouveau personnel</h1>
			<p class="text-sm text-muted-foreground">Tous les champs sont obligatoires sauf l'email.</p>
		</div>

		{#if success}
			<div class="mb-6 rounded-md border border-emerald-500 bg-emerald-500/10 p-4 text-center">
				<p class="text-sm font-medium text-emerald-500">Personnel créé avec succès !</p>
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
							goto('/personne');
						}, 800);
					} else if (result.type === 'failure') {
						errors = result.data?.errors || {};
					}
				};
			}}
			class="space-y-6"
		>
			<div class="space-y-4">
				<div class="grid gap-4 md:grid-cols-3">
					<div class="grid gap-2">
						<Label for="nom">Nom *</Label>
						<Input
							id="nom"
							name="nom"
							bind:value={form.nom}
							placeholder="Entrer le nom"
							class={errors.nom ? 'border-destructive' : ''}
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
							oninput={(e) => form.lieuNaissance = (e.target as HTMLInputElement).value.toUpperCase()}
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
							oninput={(e) => form.communeNaissance = (e.target as HTMLInputElement).value.toUpperCase()}
						/>
					</div>
					<div class="grid gap-2">
						<Label for="regionNaissance">Région de naissance</Label>
						<Input
							id="regionNaissance"
							name="regionNaissance"
							bind:value={form.regionNaissance}
							placeholder="Ex: Analamanga"
							oninput={(e) => form.regionNaissance = (e.target as HTMLInputElement).value.toUpperCase()}
						/>
					</div>
					<div class="grid gap-2">
						<Label for="provinceNaissance">Province de naissance</Label>
						<Input
							id="provinceNaissance"
							name="provinceNaissance"
							bind:value={form.provinceNaissance}
							placeholder="Ex: Antananarivo"
						/>
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
							oninput={(e) => form.domicile = (e.target as HTMLInputElement).value.toUpperCase()}
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
							oninput={(e) => form.fokontany = (e.target as HTMLInputElement).value.toUpperCase()}
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
							oninput={(e) => form.communeResidence = (e.target as HTMLInputElement).value.toUpperCase()}
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
							oninput={(e) => form.regionResidence = (e.target as HTMLInputElement).value.toUpperCase()}
						/>
						{#if errors.regionResidence}
							<span class="text-xs text-destructive">{errors.regionResidence}</span>
						{/if}
					</div>
				</div>

				<div class="grid gap-4 md:grid-cols-3">
					<div class="grid gap-2">
						<Label for="telephone">Téléphone *</Label>
						<Input
							id="telephone"
							name="telephone"
							bind:value={form.telephone}
							type="tel"
							placeholder="+261xxxxxxxx"
							class={errors.telephone ? 'border-destructive' : ''}
						/>
						{#if errors.telephone}
							<span class="text-xs text-destructive">{errors.telephone}</span>
						{/if}
					</div>
					<div class="grid gap-2">
						<Label for="email">Email</Label>
						<Input
							id="email"
							name="email"
							bind:value={form.email}
							type="email"
							placeholder="exemple@email.com"
							class={errors.email ? 'border-destructive' : ''}
						/>
						{#if errors.email}
							<span class="text-xs text-destructive">{errors.email}</span>
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
			</div>

			<div class="flex items-center gap-4 pt-4">
				<Button type="button" variant="outline" onclick={resetForm} disabled={submitting}>Effacer</Button>
				<Button type="submit" disabled={submitting}>
					{#if submitting}
						<Spinner class="mr-2 size-4" />
						Création...
					{:else}
						Créer le personnel
					{/if}
				</Button>
			</div>
		</form>
	</div>
</main>
