<script lang="ts">
	import { enhance } from '$app/forms';
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
	import type { ActionResult } from '@sveltejs/kit';
	import { goto } from '$app/navigation';
	import { Spinner } from '$lib/components/ui/spinner';

	let open = $state(false);
	let value = $state<CalendarDate | undefined>();
	let submitting = $state(false);
	let success = $state(false);

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

	let errors = $state<Record<string, string>>({});

	$effect(() => {
		if (value) {
			form.dateNaissance = value.toDate(getLocalTimeZone()).toISOString().split('T')[0];
		}
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
			telephone: '',
			email: '',
			cin: ''
		};
		errors = {};
		value = undefined;
	}
</script>

<main class="min-h-full bg-sidebar p-4 text-sidebar-foreground">
	<div class="mx-auto max-w-4xl">
		<div class="mb-6 space-y-2">
			<h1 class="text-2xl font-bold">Nouveau personnel</h1>
			<p class="text-sm text-muted-foreground">Tous les champs sont obligatoires sauf l'email.</p>
		</div>

		{#if success}
			<div class="rounded-md border border-emerald-500 bg-emerald-500/10 p-4 text-center">
				<p class="text-sm font-medium text-emerald-500">Personnel créé avec succès !</p>
			</div>
		{/if}

		<form
			method="POST"
			action="?/create"
			use:enhance={() => {
				submitting = true;
				return async ({ result }: { result: ActionResult }) => {
					submitting = false;
					if (result.type === 'success') {
						success = true;
						setTimeout(() => goto('/personne'), 800);
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
								<Label for="birth">Date de naissance *</Label>
								<Popover.Root bind:open>
									<Popover.Trigger>
										{#snippet child({ props })}
											<Button
												{...props}
												variant="outline"
												class="w-full justify-between font-normal"
											>
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
								<input type="hidden" name="dateNaissance" value={form.dateNaissance} />
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
													oninput={(e) => form.lieuNaissance = (e.target as HTMLInputElement).value.toUpperCase()}
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
													oninput={(e) => form.communeNaissance = (e.target as HTMLInputElement).value.toUpperCase()}
												/>
											</div>
											<div class="grid gap-2">
												<Label for="region-naiss">Région</Label>
												<Input
													id="region-naiss"
													name="regionNaissance"
													bind:value={form.regionNaissance}
													placeholder="Ex: Analamanga"
													oninput={(e) => form.regionNaissance = (e.target as HTMLInputElement).value.toUpperCase()}
												/>
											</div>
											<div class="grid gap-2">
												<Label for="province-naiss">Province</Label>
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
									<Label for="commune_res">Commune *</Label>
								<Input
									id="commune_res"
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
									<Label for="region_res">Région *</Label>
								<Input
									id="region_res"
									name="regionResidence"
									bind:value={form.regionResidence}
									placeholder="Ex: Toamasina"
									oninput={(e) => form.regionResidence = (e.target as HTMLInputElement).value.toUpperCase()}
								/>
								</div>
							</div>

							<Accordion.Root type="single" class="mt-4 border-l border-blue-500 pl-10">
								<Accordion.Item value="contact">
									<Accordion.Trigger>Contact *</Accordion.Trigger>
									<Accordion.Content>
										<div class="grid gap-3 rounded-md border p-4">
											<div class="grid grid-cols-1 gap-3 md:grid-cols-3">
												<div class="grid gap-2">
													<Label for="telephone_personnel">Téléphone *</Label>
													<Input
														id="telephone_personnel"
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
													<Label for="email_personnel">Email</Label>
													<Input
														id="email_personnel"
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
									</Accordion.Content>
								</Accordion.Item>
							</Accordion.Root>
						</div>
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>

			<div class="flex items-center gap-4 pt-4">
				<Button type="reset" variant="outline" onclick={resetForm} disabled={submitting}>Effacer</Button>
				<AlertDialog.Root open={success}>
					<AlertDialog.Trigger type="button" class={buttonVariants({ variant: 'default' })}>
						Créer le personnel
					</AlertDialog.Trigger>
					<AlertDialog.Content>
						<AlertDialog.Header>
							<AlertDialog.Title>Confirmer la création</AlertDialog.Title>
							<AlertDialog.Description>
								Cette action créera un nouveau personnel dans votre établissement.
							</AlertDialog.Description>
						</AlertDialog.Header>
						<AlertDialog.Footer>
							<AlertDialog.Cancel disabled={submitting}>Annuler</AlertDialog.Cancel>
							<AlertDialog.Action type="submit" disabled={submitting}>
								{#if submitting}
									<Spinner class="mr-2 size-4" />
									Création...
								{:else}
									Confirmer
								{/if}
							</AlertDialog.Action>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</div>
		</form>
	</div>
</main>
