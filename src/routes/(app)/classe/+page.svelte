<script lang="ts">
	import Classe from '$lib/components/user/classe/Classe.svelte';
	import { Input } from '$lib/components/ui/input';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as NativeSelect from '$lib/components/ui/native-select/index.js';
	import { Card } from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { ClipboardList, Plus, UserRound } from '@lucide/svelte/icons';
	import { Button } from '$lib/components/ui/button';
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import type { Personne } from '$lib/types/Personne.type';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import { Spinner } from '$lib/components/ui/spinner';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	let listClasse = $state(data.listClasse);
	const enseignants = $state<Personne[]>(data.enseignants || []);
	let submitting = $state(false);
	let success = $state(false);
	let errors = $state<Record<string, string>>({});
	let openDialog = $state(false);

	let nom = $state('');
	let niveau = $state('0');
	let serie = $state('');
	let searchProf = $state('');
	let selectedProf: Personne | null = $state(null);

	const searchResults = $derived(
		searchProf.trim().length > 0 && !selectedProf
			? enseignants.filter((p) =>
					`${p.name} ${p.lastname} ${p.email} ${p.phone}`
						.toLowerCase()
						.includes(searchProf.toLowerCase())
				)
			: []
	);

	function selectProf(p: Personne) {
		selectedProf = p;
		searchProf = `${p.name} ${p.lastname}`;
	}

	function resetForm() {
		nom = '';
		niveau = '0';
		serie = '';
		searchProf = '';
		selectedProf = null;
		errors = {};
		success = false;
	}
</script>

<main class="flex h-screen flex-col bg-background text-foreground">
	<div class="flex-1 overflow-y-auto">
		<div class="sticky top-0 z-10 border-b border-sidebar-border bg-background p-4 md:p-6">
			<div class="mx-auto max-w-7xl space-y-4">
				<div class="flex items-center gap-3">
					<div class="flex size-10 items-center justify-center rounded-xl bg-primary/10">
						<ClipboardList class="size-5 text-primary" />
					</div>
					<div>
						<h1 class="text-xl font-bold tracking-tight">Classes</h1>
						<p class="text-xs text-muted-foreground">
							{listClasse.length} classe{listClasse.length > 1 ? 's' : ''} enregistrée{listClasse.length >
							1
								? 's'
								: ''}
						</p>
					</div>
					<div class="ml-auto">
						<Dialog.Root bind:open={openDialog}>
							<Dialog.Trigger type="button">
								<Button variant="default" size="sm" class="gap-2">
									<Plus class="size-4" />
									Nouvelle classe
								</Button>
							</Dialog.Trigger>
							<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-sm">
								<Dialog.Header>
									<Dialog.Title>Créer une classe</Dialog.Title>
								</Dialog.Header>

								{#if success}
									<div
										class="mb-4 rounded-md border border-emerald-500 bg-emerald-500/10 p-4 text-center"
									>
										<p class="text-sm font-medium text-emerald-500">Classe créée avec succès !</p>
									</div>
								{/if}
								{#if errors._form}
									<div class="mb-4 rounded-md border border-destructive bg-destructive/10 p-3">
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
												const newClasse = result.data?.classe;
												if (newClasse) {
													const niveauLibelle =
														newClasse.niveau === 0
															? '2nd'
															: newClasse.niveau === 1
																? '1ere'
																: 'Terminale';
													listClasse = [
														...listClasse,
														{
															id: newClasse.id,
															nom:
																newClasse.nom ||
																niveauLibelle +
																	(newClasse.serie ? ' ' + newClasse.serie.toUpperCase() : ''),
															niveau: newClasse.niveau,
															series: newClasse.serie || '',
															titulaire: newClasse.titulaire
																? `${newClasse.titulaire.personne.name} ${newClasse.titulaire.personne.lastname}`
																: '',
															titulaireId: newClasse.titulaireId || null,
															eleves: newClasse.elevesCount || 0
														}
													];
												}
												success = true;
												setTimeout(() => {
													resetForm();
													openDialog = false;
												}, 800);
											} else if (result.type === 'failure') {
												errors = result.data?.errors || {};
											}
										};
									}}
									class="space-y-4"
								>
									<div class="grid gap-4">
										<div class="grid gap-2">
											<Label for="nom">Nom</Label>
											<input
												id="nom"
												name="nom"
												bind:value={nom}
												placeholder="Ex: 2nde S, 1ère L..."
												class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
											/>
										</div>

										<div class="grid gap-2">
											<Label for="niveau">Niveau *</Label>
											<NativeSelect.Root required class="w-full" bind:value={niveau} name="niveau">
												<NativeSelect.Option value="0">2nd</NativeSelect.Option>
												<NativeSelect.Option value="1">1ere</NativeSelect.Option>
												<NativeSelect.Option value="2">Terminale</NativeSelect.Option>
											</NativeSelect.Root>
										</div>

										<div class="grid gap-2">
											<Label for="serie">Série</Label>
											<NativeSelect.Root class="w-full" bind:value={serie} name="serie">
												<NativeSelect.Option value="">Aucune</NativeSelect.Option>
												<NativeSelect.Option value="ose">OSE</NativeSelect.Option>
												<NativeSelect.Option value="s">S</NativeSelect.Option>
												<NativeSelect.Option value="l">L</NativeSelect.Option>
											</NativeSelect.Root>
										</div>
									</div>

									<div class="grid gap-3">
										<Label>Prof titulaire</Label>
										<div class="relative">
											<Input
												id="prof"
												placeholder="Rechercher un professeur..."
												value={searchProf}
												oninput={(e) =>
													(searchProf = (e.target as HTMLInputElement).value
														.replace(/\s+/g, ' ')
														.trim())}
											/>
											{#if searchResults.length > 0 && !selectedProf}
												<div class="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-md border p-2">
													{#each searchResults as p (p.id)}
														<button
															type="button"
															class="flex w-full flex-col rounded-md border px-3 py-2 text-left transition-colors hover:bg-muted"
															onclick={() => selectProf(p)}
														>
															<p class="text-sm font-medium">{p.name} {p.lastname}</p>
															<p class="text-xs text-muted-foreground">{p.email || ''}</p>
															<p class="text-xs text-muted-foreground">{p.phone || ''}</p>
														</button>
													{/each}
												</div>
											{/if}
											{#if selectedProf}
												<div
													class="mt-2 flex items-center justify-between gap-2 rounded-lg bg-muted/30 p-2"
												>
													<div class="flex items-center gap-2">
														<div
															class="flex size-8 items-center justify-center rounded-full bg-primary/10"
														>
															<span class="text-sm font-bold text-primary"
																>{selectedProf.name[0]}{selectedProf.lastname[0]}</span
															>
														</div>
														<span class="text-sm font-medium"
															>{selectedProf.name} {selectedProf.lastname}</span
														>
													</div>
													<button
														type="button"
														class="rounded-full p-1 hover:bg-muted"
														onclick={() => {
															selectedProf = null;
															searchProf = '';
														}}
													>
														<UserRound class="size-4 text-muted-foreground" />
													</button>
												</div>
											{/if}
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
												<Plus class="mr-2 size-4" />
												Créer la classe
											{/if}
										</Button>
										<Button
											type="button"
											variant="outline"
											onclick={resetForm}
											disabled={submitting || success}
										>
											Effacer
										</Button>
									</div>

									<input type="hidden" name="titulaireId" value={selectedProf?.id || ''} />
								</form>
							</Dialog.Content>
						</Dialog.Root>
					</div>
				</div>
				<Card class="animate-slide-up stagger-1 p-4 opacity-0">
					<SearchInput placeholder="Rechercher une classe..." />
				</Card>
			</div>
		</div>
		<div class="p-4 md:p-6">
			<div class="mx-auto max-w-7xl">
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each listClasse as l, i (l.id)}
						<div
							class="animate-slide-up opacity-0"
							style="animation-delay: {Math.min(i * 50, 400)}ms"
						>
							<Classe classe={l} id={l.id} deleteAction="?/delete" />
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</main>
