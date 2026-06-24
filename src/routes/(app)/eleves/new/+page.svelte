<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Calendar from '$lib/components/ui/calendar/calendar.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { getLocalTimeZone, today, type CalendarDate } from '@internationalized/date';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as NativeSelect from '$lib/components/ui/native-select';
	import { provincesVariable } from '$lib/variables/territoire';
	import { Switch } from '@skeletonlabs/skeleton-svelte';

	let checked = $state(false);

	let open = $state(false);
	let value = $state<CalendarDate | undefined>();

	interface EleveForm {
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
		telephoneEleve: string;
		emailEleve: string;
		cin: string;
		nomPere: string;
		prenomPere: string;
		telephonePere: string;
		nomMere: string;
		prenomMere: string;
		telephoneMere: string;
		nomTuteur: string;
		prenomTuteur: string;
		telephoneTuteur: string;
	}

	let form = $state<EleveForm>({
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

	$effect(() => {
		if (value) {
			form.dateNaissance = value.toDate(getLocalTimeZone()).toISOString().split('T')[0];
		}
	});

	let errors = $state<Record<string, string>>({});

	function handleSubmit(event: Event) {
		event.preventDefault();

		const newErrors: Record<string, string> = {};

		if (!form.nom.trim()) {
			newErrors.nom = 'Le nom est obligatoire';
		} else if (form.nom.length < 2) {
			newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
		}

		if (!form.prenom.trim()) {
			newErrors.prenom = 'Le prénom est obligatoire';
		} else if (form.prenom.length < 2) {
			newErrors.prenom = 'Le prénom doit contenir au moins 2 caractères';
		}

		if (!form.dateNaissance) {
			newErrors.dateNaissance = 'La date de naissance est obligatoire';
		}

		if (!form.lieuNaissance.trim()) {
			newErrors.lieuNaissance = 'Le lieu de naissance est obligatoire';
		}

		if (!form.domicile.trim()) {
			newErrors.domicile = 'Le domicile est obligatoire';
		}

		if (!form.fokontany.trim()) {
			newErrors.fokontany = 'Le fokontany est obligatoire';
		}

		if (!form.communeResidence.trim()) {
			newErrors.communeResidence = 'La commune de résidence est obligatoire';
		}

		if (!form.regionResidence.trim()) {
			newErrors.regionResidence = 'La région de résidence est obligatoire';
		}

		if (form.telephoneEleve.trim() && !/^(\+261|0)[0-9]{9,10}$/.test(form.telephoneEleve)) {
			newErrors.telephoneEleve = 'Format de téléphone invalide (ex: +261xxxxxxxx ou 0xxxxxxxxxx)';
		}

		if (form.emailEleve.trim() && !/^[\w.-]+@[\w.-]+\.\w+$/.test(form.emailEleve)) {
			newErrors.emailEleve = 'Format d\'email invalide';
		}

		if (!form.cin.trim()) {
			newErrors.cin = 'Le CIN est obligatoire';
		} else if (!/^[0-9]{12}$/.test(form.cin.replace(/\s/g, ''))) {
			newErrors.cin = 'Le CIN doit contenir 12 chiffres';
		}

		if (!form.nomPere.trim()) {
			newErrors.nomPere = 'Le nom du père est obligatoire';
		}

		if (!form.prenomPere.trim()) {
			newErrors.prenomPere = 'Le prénom du père est obligatoire';
		}

		if (!form.nomMere.trim()) {
			newErrors.nomMere = 'Le nom de la mère est obligatoire';
		}

		if (!form.prenomMere.trim()) {
			newErrors.prenomMere = 'Le prénom de la mère est obligatoire';
		}

		errors = newErrors;

		if (Object.keys(errors).length === 0) {
			console.log('Formulaire soumis avec les données:', form);
		}
	}

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
		checked = false;
		value = undefined;
	}
</script>

<main class="min-h-full bg-sidebar p-4 text-sidebar-foreground">
	<div class="mx-auto max-w-4xl">
		<div class="mb-6 space-y-2">
			<h1 class="text-2xl font-bold">Nouvel élève</h1>
			<p class="text-sm text-muted-foreground">
				Tous les champs sont obligatoires sauf les téléphones des parents, les informations du tuteur et le contact de l'élève.
			</p>
		</div>

		<form method="POST" onsubmit={handleSubmit} class="space-y-6">
			<Accordion.Root type="single">
				<Accordion.Item value="infos-perso">
					<Accordion.Trigger class="text-lg font-semibold">Informations personnelles</Accordion.Trigger>
					<Accordion.Content>
						<div class="grid gap-4 rounded-md border p-4 md:grid-cols-3">
						<div class="grid gap-2">
							<Label for="nom">Nom *</Label>
							<Input
								id="nom"
								bind:value={form.nom}
								placeholder="Entrer le nom"
								class={errors.nom ? 'border-destructive' : ''}
								oninput={(e) => form.nom = (e.target as HTMLInputElement).value.toUpperCase()}
							/>
							{#if errors.nom}
								<span class="text-xs text-destructive">{errors.nom}</span>
							{/if}
						</div>
							<div class="grid gap-2">
								<Label for="prenom">Prénom *</Label>
								<Input
									id="prenom"
									bind:value={form.prenom}
									placeholder="Entrer le prénom"
									class={errors.prenom ? 'border-destructive' : ''}
									oninput={(e) => form.prenom = (e.target as HTMLInputElement).value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
								/>
								{#if errors.prenom}
									<span class="text-xs text-destructive">{errors.prenom}</span>
								{/if}
							</div>
							<div class="grid gap-2">
								<Label for="birth">Date de naissance *</Label>
								<Popover.Root bind:open>
									<Popover.Trigger>
										{#snippet child({ props })}
											<Button {...props} variant="outline" class="w-full justify-between font-normal">
												{value
													? value.toDate(getLocalTimeZone()).toLocaleDateString()
													: 'Sélectionner la date'}
												<ChevronDownIcon class="ml-2 size-4" />
											</Button>
										{/snippet}
									</Popover.Trigger>
									<Popover.Content class="w-auto overflow-hidden p-0" align="start">
										<Calendar
											type="single"
											bind:value
											captionLayout="dropdown"
											onValueChange={() => {
												open = false;
											}}
											maxValue={today(getLocalTimeZone())}
										/>
									</Popover.Content>
								</Popover.Root>
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
													bind:value={form.lieuNaissance}
													placeholder="Ex: Antananarivo"
													class={errors.lieuNaissance ? 'border-destructive' : ''}
												/>
												{#if errors.lieuNaissance}
													<span class="text-xs text-destructive">{errors.lieuNaissance}</span>
												{/if}
											</div>
											<div class="grid gap-2">
												<Label for="commune-naiss">Commune *</Label>
												<Input
													id="commune-naiss"
													bind:value={form.communeNaissance}
													placeholder="Ex: Isoraka"
												/>
											</div>
											<div class="grid gap-2">
												<Label for="region-naiss">Région *</Label>
												<Input
													id="region-naiss"
													bind:value={form.regionNaissance}
													placeholder="Ex: Analamanga"
												/>
											</div>
											<div class="grid gap-2">
												<Label for="province-naiss">Province *</Label>
												<NativeSelect.Root bind:value={form.provinceNaissance}>
													{#each provincesVariable as p (p)}
														<NativeSelect.Option value={p.toLowerCase()}>{p}</NativeSelect.Option>
													{/each}
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
										bind:value={form.domicile}
										placeholder="Ex: Lot C234 Ambatonakanga"
										class={errors.domicile ? 'border-destructive' : ''}
									/>
									{#if errors.domicile}
										<span class="text-xs text-destructive">{errors.domicile}</span>
									{/if}
								</div>
								<div class="grid gap-2">
									<Label for="fokontany">Fokontany *</Label>
									<Input
										id="fokontany"
										bind:value={form.fokontany}
										placeholder="Ex: Ambatonakanga"
										class={errors.fokontany ? 'border-destructive' : ''}
									/>
									{#if errors.fokontany}
										<span class="text-xs text-destructive">{errors.fokontany}</span>
									{/if}
								</div>
								<div class="grid gap-2">
									<Label for="commune_res">Commune *</Label>
									<Input
										id="commune_res"
										bind:value={form.communeResidence}
										placeholder="Ex: Toamasina"
										class={errors.communeResidence ? 'border-destructive' : ''}
									/>
									{#if errors.communeResidence}
										<span class="text-xs text-destructive">{errors.communeResidence}</span>
									{/if}
								</div>
								<div class="grid gap-2">
									<Label for="region_res">Région *</Label>
									<Input
										id="region_res"
										bind:value={form.regionResidence}
										placeholder="Ex: Toamasina"
										class={errors.regionResidence ? 'border-destructive' : ''}
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
											<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
												<div class="grid gap-2">
													<Label for="telephone_eleve">Téléphone élève</Label>
													<Input
														id="telephone_eleve"
														bind:value={form.telephoneEleve}
														type="tel"
														placeholder="+261xxxxxxxx"
													/>
													{#if errors.telephoneEleve}
														<span class="text-xs text-destructive">{errors.telephoneEleve}</span>
													{/if}
												</div>
												<div class="grid gap-2">
													<Label for="email_eleve">Email élève</Label>
													<Input
														id="email_eleve"
														bind:value={form.emailEleve}
														type="email"
														placeholder="exemple@email.com"
													/>
													{#if errors.emailEleve}
														<span class="text-xs text-destructive">{errors.emailEleve}</span>
													{/if}
												</div>
												<div class="grid gap-2">
													<Label for="cin">CIN *</Label>
													<Input
														id="cin"
														bind:value={form.cin}
														placeholder="Entrer le CIN"
														maxlength={12}
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
					<Accordion.Trigger class="text-lg font-semibold">Informations Responsable *</Accordion.Trigger>
					<Accordion.Content>
						<div class="space-y-4 rounded-md border p-4">
							<div class="grid grid-cols-1 gap-4 rounded-md border p-4 md:grid-cols-2">
								<div class="grid gap-2">
									<Label for="name_father">Nom du père *</Label>
								<Input
									id="name_father"
									bind:value={form.nomPere}
									placeholder="Entrer le nom"
									class={errors.nomPere ? 'border-destructive' : ''}
									oninput={(e) => form.nomPere = (e.target as HTMLInputElement).value.toUpperCase()}
								/>
									{#if errors.nomPere}
										<span class="text-xs text-destructive">{errors.nomPere}</span>
									{/if}
								</div>
								<div class="grid gap-2">
									<Label for="lastname_father">Prénom du père *</Label>
								<Input
									id="lastname_father"
									bind:value={form.prenomPere}
									placeholder="Entrer le prénom"
									class={errors.prenomPere ? 'border-destructive' : ''}
									oninput={(e) => form.prenomPere = (e.target as HTMLInputElement).value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
								/>
									{#if errors.prenomPere}
										<span class="text-xs text-destructive">{errors.prenomPere}</span>
									{/if}
								</div>
								<div class="grid gap-2">
									<Label for="contact_father">Téléphone du père</Label>
									<Input
										id="contact_father"
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
									bind:value={form.nomMere}
									placeholder="Entrer le nom"
									class={errors.nomMere ? 'border-destructive' : ''}
									oninput={(e) => form.nomMere = (e.target as HTMLInputElement).value.toUpperCase()}
								/>
									{#if errors.nomMere}
										<span class="text-xs text-destructive">{errors.nomMere}</span>
									{/if}
								</div>
								<div class="grid gap-2">
									<Label for="lastname_mother">Prénom de la mère *</Label>
								<Input
									id="lastname_mother"
									bind:value={form.prenomMere}
									placeholder="Entrer le prénom"
									class={errors.prenomMere ? 'border-destructive' : ''}
									oninput={(e) => form.prenomMere = (e.target as HTMLInputElement).value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
								/>
									{#if errors.prenomMere}
										<span class="text-xs text-destructive">{errors.prenomMere}</span>
									{/if}
								</div>
								<div class="grid gap-2">
									<Label for="contact_mother">Téléphone de la mère</Label>
									<Input
										id="contact_mother"
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
									bind:value={form.nomTuteur}
									placeholder="Entrer le nom"
									oninput={(e) => form.nomTuteur = (e.target as HTMLInputElement).value.toUpperCase()}
								/>
												</div>
												<div class="grid gap-2">
													<Label for="lastname_tuteur">Prénom du tuteur(trice)</Label>
									<Input id="lastname_tuteur" bind:value={form.prenomTuteur} placeholder="Entrer le prénom" oninput={(e) => form.prenomTuteur = (e.target as HTMLInputElement).value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())} />
												</div>
												<div class="grid gap-2">
													<Label for="contact_tuteur">Téléphone du tuteur(trice)</Label>
													<Input id="contact_tuteur" bind:value={form.telephoneTuteur} type="tel" placeholder="+261...." />
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

			<div class="flex items-center gap-4 pt-4">
				<Button type="reset" variant="outline" onclick={resetForm}>
					Effacer
				</Button>
				<AlertDialog.Root>
					<AlertDialog.Trigger class={buttonVariants({ variant: 'default' })}>
						Créer l'élève
					</AlertDialog.Trigger>
					<AlertDialog.Content>
						<AlertDialog.Header>
							<AlertDialog.Title>Confirmer la création</AlertDialog.Title>
							<AlertDialog.Description>
								Cette action créera un nouvel élève dans votre établissement.
							</AlertDialog.Description>
						</AlertDialog.Header>
						<AlertDialog.Footer>
							<AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
							<AlertDialog.Action type="submit" onclick={handleSubmit}>
								Confirmer
							</AlertDialog.Action>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</div>
		</form>
	</div>
</main>