<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import type { ActionResult } from '@sveltejs/kit';
	import { Spinner } from '$lib/components/ui/spinner';
	import * as NativeSelect from '$lib/components/ui/native-select/index.js';
	import { Switch } from '@skeletonlabs/skeleton-svelte';

	let submitting = $state(false);
	let success = $state(false);
	let errors = $state<Record<string, string>>({});
	let checked = $state(false);

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
		telephoneMere: '',
		nomTuteur: '',
		prenomTuteur: '',
		telephoneTuteur: ''
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
			telephoneMere: '',
			nomTuteur: '',
			prenomTuteur: '',
			telephoneTuteur: ''
		};
		errors = {};
		success = false;
		checked = false;
	}
</script>

<main class="min-h-full bg-sidebar p-4 text-sidebar-foreground">
	<div>
		<div class="mb-6 space-y-2">
			<h1 class="text-2xl font-bold">Nouvel élève</h1>
			<p class="text-sm text-muted-foreground">
				Tous les champs sont obligatoires sauf les téléphones des parents et le contact de l'élève.
				Au moins un responsable (père, mère ou tuteur) avec nom et prénom est obligatoire.
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
			<Accordion.Root type="single">
				<Accordion.Item value="infos-perso">
					<Accordion.Trigger class="text-lg font-semibold"
						>Informations personnelles</Accordion.Trigger
					>
					<Accordion.Content>
						<div class="grid gap-4 rounded-md border p-4 md:grid-cols-3">
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

						<Accordion.Root type="single" class="mt-4 border-l border-blue-500 pl-10">
							<Accordion.Item value="lieu-naiss">
								<Accordion.Trigger>Lieu de naissance *</Accordion.Trigger>
								<Accordion.Content>
									<div class="grid gap-3 rounded-md border p-4">
										<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
											<div class="grid gap-2">
												<Label for="lieu">Lieu *</Label>
												<Input
													id="lieu"
													name="lieuNaissance"
													bind:value={form.lieuNaissance}
													placeholder="Ex: Antananarivo"
													class={errors.lieuNaissance ? 'border-destructive' : ''}
													oninput={(e) =>
														(form.lieuNaissance = (
															e.target as HTMLInputElement
														).value.toUpperCase())}
												/>
												{#if errors.lieuNaissance}
													<span class="text-xs text-destructive">{errors.lieuNaissance}</span>
												{/if}
											</div>
											<div class="grid gap-2">
												<Label for="commune-naiss">Commune</Label>
												<Input
													id="commune-naiss"
													name="communeNaissance"
													bind:value={form.communeNaissance}
													placeholder="Ex: Isoraka"
													oninput={(e) =>
														(form.communeNaissance = (
															e.target as HTMLInputElement
														).value.toUpperCase())}
												/>
											</div>
											<div class="grid gap-2">
												<Label for="region-naiss">Région</Label>
												<Input
													id="region-naiss"
													name="regionNaissance"
													bind:value={form.regionNaissance}
													placeholder="Ex: Analamanga"
													oninput={(e) =>
														(form.regionNaissance = (
															e.target as HTMLInputElement
														).value.toUpperCase())}
												/>
												{#if errors.regionNaissance}
													<span class="text-xs text-destructive">{errors.regionNaissance}</span>
												{/if}
											</div>
											<div class="grid gap-2">
												<Label for="province-naiss">Province</Label>
												<NativeSelect.Root
													id="province-naiss"
													class="w-full"
													name="provinceNaissance"
													bind:value={form.provinceNaissance}
												>
													<NativeSelect.Option value="">Sélectionner</NativeSelect.Option>
													<NativeSelect.Option value="antananarivo"
														>Antananarivo</NativeSelect.Option
													>
													<NativeSelect.Option value="antsiranana">Antsiranana</NativeSelect.Option>
													<NativeSelect.Option value="fianarantsoa"
														>Fianarantsoa</NativeSelect.Option
													>
													<NativeSelect.Option value="mahajanga">Mahajanga</NativeSelect.Option>
													<NativeSelect.Option value="toamasina">Toamasina</NativeSelect.Option>
													<NativeSelect.Option value="toliara">Toliara</NativeSelect.Option>
												</NativeSelect.Root>
											</div>
										</div>
									</div>
								</Accordion.Content>
							</Accordion.Item>
						</Accordion.Root>
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>

			<Accordion.Root type="single">
				<Accordion.Item value="adresse">
					<Accordion.Trigger class="text-lg font-semibold">Adresse exacte *</Accordion.Trigger>
					<Accordion.Content>
						<div class="grid gap-3 rounded-md border p-4">
							<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
								<div class="grid gap-2">
									<Label for="domicile">Domicile *</Label>
									<Input
										id="domicile"
										name="domicile"
										bind:value={form.domicile}
										placeholder="Ex: Lot C234 Ambatonakanga"
										class={errors.domicile ? 'border-destructive' : ''}
										oninput={(e) =>
											(form.domicile = (e.target as HTMLInputElement).value.toUpperCase())}
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
										oninput={(e) =>
											(form.fokontany = (e.target as HTMLInputElement).value.toUpperCase())}
									/>
									{#if errors.fokontany}
										<span class="text-xs text-destructive">{errors.fokontany}</span>
									{/if}
								</div>
								<div class="grid gap-2">
									<Label for="commune_res">Commune *</Label>
									<Input
										id="commune_res"
										name="communeResidence"
										bind:value={form.communeResidence}
										placeholder="Ex: Toamasina"
										class={errors.communeResidence ? 'border-destructive' : ''}
										oninput={(e) =>
											(form.communeResidence = (e.target as HTMLInputElement).value.toUpperCase())}
									/>
									{#if errors.communeResidence}
										<span class="text-xs text-destructive">{errors.communeResidence}</span>
									{/if}
								</div>
								<div class="grid gap-2">
									<Label for="region_res">Région *</Label>
									<Input
										id="region_res"
										name="regionResidence"
										bind:value={form.regionResidence}
										placeholder="Ex: Toamasina"
										class={errors.regionResidence ? 'border-destructive' : ''}
										oninput={(e) =>
											(form.regionResidence = (e.target as HTMLInputElement).value.toUpperCase())}
									/>
									{#if errors.regionResidence}
										<span class="text-xs text-destructive">{errors.regionResidence}</span>
									{/if}
								</div>
							</div>

							<Accordion.Root type="single" class="mt-4 border-l border-blue-500 pl-10">
								<Accordion.Item value="contact">
									<Accordion.Trigger>Contact (optionnel)</Accordion.Trigger>
									<Accordion.Content>
										<div class="grid gap-3 rounded-md border p-4">
											<div class="grid grid-cols-1 gap-3 md:grid-cols-3">
												<div class="grid gap-2">
													<Label for="telephone_eleve">Téléphone élève</Label>
													<Input
														id="telephone_eleve"
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
													<Label for="email_eleve">Email élève</Label>
													<Input
														id="email_eleve"
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
													<Label for="cin">CIN</Label>
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
									</Accordion.Content>
								</Accordion.Item>
							</Accordion.Root>
						</div>
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>

			<Accordion.Root type="single">
				<Accordion.Item value="responsable">
					<Accordion.Trigger class="text-lg font-semibold"
						>Informations Responsable *</Accordion.Trigger
					>
					<Accordion.Content>
						{#if errors.responsable}
							<div class="mb-4 rounded-md border border-destructive bg-destructive/10 p-3">
								<p class="text-sm text-destructive">{errors.responsable}</p>
							</div>
						{/if}
						<div class="space-y-4 rounded-md border p-4">
							<div class="grid grid-cols-1 gap-4 rounded-md border p-4 md:grid-cols-2">
								<div class="grid gap-2">
									<Label for="name_father">Nom du père *</Label>
									<Input
										id="name_father"
										name="nomPere"
										bind:value={form.nomPere}
										placeholder="Entrer le nom"
										class={errors.nomPere ? 'border-destructive' : ''}
										oninput={(e) =>
											(form.nomPere = (e.target as HTMLInputElement).value.toUpperCase())}
									/>
									{#if errors.nomPere}
										<span class="text-xs text-destructive">{errors.nomPere}</span>
									{/if}
								</div>
								<div class="grid gap-2">
									<Label for="lastname_father">Prénom du père *</Label>
									<Input
										id="lastname_father"
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
									<Label for="contact_father">Téléphone du père</Label>
									<Input
										id="contact_father"
										name="telephonePere"
										bind:value={form.telephonePere}
										type="tel"
										placeholder="+261...."
									/>
								</div>
							</div>

							<div class="grid grid-cols-1 gap-4 rounded-md border p-4 md:grid-cols-2">
								<div class="grid gap-2">
									<Label for="name_mother">Nom de la mère *</Label>
									<Input
										id="name_mother"
										name="nomMere"
										bind:value={form.nomMere}
										placeholder="Entrer le nom"
										class={errors.nomMere ? 'border-destructive' : ''}
										oninput={(e) =>
											(form.nomMere = (e.target as HTMLInputElement).value.toUpperCase())}
									/>
									{#if errors.nomMere}
										<span class="text-xs text-destructive">{errors.nomMere}</span>
									{/if}
								</div>
								<div class="grid gap-2">
									<Label for="lastname_mother">Prénom de la mère *</Label>
									<Input
										id="lastname_mother"
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
									<Label for="contact_mother">Téléphone de la mère</Label>
									<Input
										id="contact_mother"
										name="telephoneMere"
										bind:value={form.telephoneMere}
										type="tel"
										placeholder="+261...."
									/>
								</div>
							</div>

							<div class="flex items-center gap-3">
								<Switch {checked} onCheckedChange={(details) => (checked = details.checked)}>
									<Switch.Control>
										<Switch.Thumb />
									</Switch.Control>
									<Switch.HiddenInput />
								</Switch>
								<Label>Ajouter un tuteur(trice)</Label>
							</div>

							{#if checked}
								<Accordion.Root type="single" class="mt-4 border-l border-blue-500 pl-10">
									<Accordion.Item value="tuteur">
										<Accordion.Trigger>Informations tuteur(trice)</Accordion.Trigger>
										<Accordion.Content>
											<div class="grid grid-cols-1 gap-4 rounded-md border p-4 md:grid-cols-2">
												<div class="grid gap-2">
													<Label for="name_tuteur">Nom du tuteur(trice)</Label>
													<Input
														id="name_tuteur"
														name="nomTuteur"
														bind:value={form.nomTuteur}
														placeholder="Entrer le nom"
														oninput={(e) =>
															(form.nomTuteur = (e.target as HTMLInputElement).value.toUpperCase())}
													/>
												</div>
												<div class="grid gap-2">
													<Label for="lastname_tuteur">Prénom du tuteur(trice)</Label>
													<Input
														id="lastname_tuteur"
														name="prenomTuteur"
														bind:value={form.prenomTuteur}
														placeholder="Entrer le prénom"
														oninput={(e) =>
															(form.prenomTuteur = (e.target as HTMLInputElement).value
																.toLowerCase()
																.replace(/\b\w/g, (c) => c.toUpperCase()))}
													/>
												</div>
												<div class="grid gap-2">
													<Label for="contact_tuteur">Téléphone du tuteur(trice)</Label>
													<Input
														id="contact_tuteur"
														name="telephoneTuteur"
														bind:value={form.telephoneTuteur}
														type="tel"
														placeholder="+261...."
													/>
												</div>
											</div>
										</Accordion.Content>
									</Accordion.Item>
								</Accordion.Root>
							{/if}
						</div>
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>

			<div class="flex items-center justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					onclick={resetForm}
					disabled={submitting || success}
				>
					Effacer
				</Button>
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
			</div>
		</form>
	</div>
</main>
