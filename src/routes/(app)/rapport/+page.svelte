<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import {
		FileText,
		Clock,
		UserX,
		Plus,
		X,
		Search,
		Trash2,
		ShieldCheck,
		Check,
		Eye
	} from '@lucide/svelte/icons';
	import type { PageProps } from './$types';
	import { loadingForm } from '$lib/actions/loadingForm';
	import type { ActionResult } from '@sveltejs/kit';
	import type { TypeRapport, Rapport } from '$lib/types/Rapport.type';
	import ConfirmDeleteDialog from '$lib/components/user/ConfirmDeleteDialog.svelte';
	import { page } from '$app/stores';

	const { data }: PageProps = $props();

	const anneeSelectionnee = $derived(Boolean($page.data.anneeActiveId));

	const rapports = $derived(data.rapports);
	const eleves = $derived(data.eleves);
	const canEdit = $derived(data.canEdit);
	const absenceItems = $derived(data.absenceItems as AbsenceRetardItem[]);
	const retardItems = $derived(data.retardItems as AbsenceRetardItem[]);

	let dialogOpen = $state(false);
	let selectedEleveId = $state('');
	let selectedType = $state<TypeRapport>('RETARD');
	let message = $state('');
	let searchQuery = $state('');
	let selectedItems = $state<string[]>([]);
	let confirmOpen = $state(false);
	let submittingDelete = $state(false);
	let deleteForm = $state<HTMLFormElement | null>(null);
	let rapportToDelete = $state<Rapport | null>(null);

	const searchResults = $derived(
		searchQuery.trim().length > 0 && !selectedEleveId
			? eleves.filter((e) =>
					`${e.prenom}${e.nom}${e.classe}${e.dateNaissance}`
						.toLowerCase()
						.includes(searchQuery.toLowerCase())
				)
			: []
	);

	const itemsDisponibles = $derived(
		(selectedType === 'ABSENCE' ? absenceItems : retardItems).filter(
			(i) => i.eleveId === selectedEleveId
		)
	);

	const counts = $derived({
		retards: rapports.filter((r) => r.type === 'RETARD').length,
		absences: rapports.filter((r) => r.type === 'ABSENCE').length
	});

	let filtre = $state<'TOUS' | TypeRapport>('TOUS');
	let filtreClasse = $state<string>('TOUTES');

	const classesDisponibles = $derived(
		[...new Set(rapports.map((r) => r.classe).filter(Boolean))].sort((a, b) => a.localeCompare(b))
	);

	const rapportsFiltres = $derived(
		rapports.filter(
			(r) =>
				(filtre === 'TOUS' || r.type === filtre) &&
				(filtreClasse === 'TOUTES' || r.classe === filtreClasse)
		)
	);

	function resumeRapport(r: (typeof rapports)[number]) {
		const total = r.lignes.length;
		const mots = r.lignes.filter((l) => l.type === 'RETARD').length;
		const abs = r.lignes.filter((l) => l.type === 'ABSENCE').length;
		let detail = '';
		if (r.type === 'RETARD') detail = `${total} retard(s)`;
		else if (r.type === 'ABSENCE') detail = `${total} absence(s)`;
		else detail = `${mots} retard(s), ${abs} absence(s)`;
		const cause = r.message?.trim() || 'Non précisée';
		return { cause, detail };
	}

	function openNew() {
		selectedEleveId = '';
		selectedType = 'RETARD';
		message = '';
		searchQuery = '';
		selectedItems = [];
		dialogOpen = true;
	}

	function selectEleve(e: (typeof eleves)[0]) {
		selectedEleveId = e.id;
		searchQuery = `${e.nom} ${e.prenom}`;
	}

	function resetSelection() {
		selectedEleveId = '';
		searchQuery = '';
		selectedItems = [];
	}

	function toggleItem(id: string, checked: boolean) {
		if (checked) selectedItems = [...selectedItems, id];
		else selectedItems = selectedItems.filter((x) => x !== id);
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleString('fr-FR', {
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<main class="flex min-h-[calc(100dvh-4rem)] flex-col bg-background text-foreground">
	<div
		class="sticky top-16 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-sidebar-border bg-card/80 px-4 py-3 backdrop-blur-sm"
	>
		<div class="flex items-center gap-3">
			<div class="flex size-9 items-center justify-center rounded-lg bg-primary/10">
				<FileText class="size-5 text-primary" />
			</div>
			<div>
				<h1 class="text-lg font-bold">Rapports</h1>
				<p class="text-xs text-muted-foreground">
					Retards &amp; absences · {data.anneeActive ?? 'Aucune année active'}
				</p>
			</div>
		</div>
		{#if canEdit}
			<Button
				onclick={openNew}
				size="sm"
				class="gap-2"
				disabled={!anneeSelectionnee}
				title={anneeSelectionnee ? undefined : "Aucune année scolaire n'est sélectionnée"}
			>
				<Plus class="size-4" />
				Nouveau rapport
			</Button>
		{:else}
			<Badge variant="outline" class="gap-1.5 text-muted-foreground">
				<Eye class="size-3.5" /> Lecture seule
			</Badge>
		{/if}
	</div>

	<div class="flex flex-wrap items-center gap-2 border-b border-sidebar-border px-4 py-2">
		<button
			type="button"
			onclick={() => (filtre = 'TOUS')}
			class="rounded-full px-3 py-1 text-xs font-medium transition-colors {filtre === 'TOUS'
				? 'bg-primary text-primary-foreground'
				: 'bg-muted text-muted-foreground hover:bg-muted/70'}"
		>
			Tous ({rapports.length})
		</button>
		<button
			type="button"
			onclick={() => (filtre = 'RETARD')}
			class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors {filtre ===
			'RETARD'
				? 'bg-amber-500 text-white'
				: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'}"
		>
			<Clock class="size-3.5" /> Retards ({counts.retards})
		</button>
		<button
			type="button"
			onclick={() => (filtre = 'ABSENCE')}
			class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors {filtre ===
			'ABSENCE'
				? 'bg-red-500 text-white'
				: 'bg-red-500/10 text-red-600 hover:bg-red-500/20'}"
		>
			<UserX class="size-3.5" /> Absences ({counts.absences})
		</button>
		<div class="ml-auto flex flex-wrap items-center gap-2">
			<Badge
				variant={filtreClasse === 'TOUTES' ? 'default' : 'outline'}
				class="cursor-pointer transition-all hover:shadow-sm"
				onclick={() => (filtreClasse = 'TOUTES')}
			>
				Toutes les classes
			</Badge>
			{#each classesDisponibles as c (c)}
				<Badge
					variant={filtreClasse === c ? 'default' : 'outline'}
					class="cursor-pointer transition-all hover:shadow-sm"
					onclick={() => (filtreClasse = c)}
				>
					{c}
				</Badge>
			{/each}
		</div>
	</div>

	<div class="flex-1 overflow-y-auto p-4">
		{#if rapportsFiltres.length === 0}
			<div class="flex flex-col items-center justify-center py-20 text-muted-foreground">
				<div class="mb-4 flex size-20 items-center justify-center rounded-full bg-muted/30">
					<ShieldCheck class="size-10 text-muted-foreground/50" />
				</div>
				<p class="mb-1 text-sm font-medium">Aucun rapport</p>
				<p class="mb-6 max-w-xs text-center text-xs text-muted-foreground/70">
					{canEdit
						? 'Créez un rapport en sélectionnant un élève et ses absences ou retards.'
						: "Aucun rapport de retard ou d'absence n'a encore été enregistré."}
				</p>
				{#if canEdit}
					<Button
						onclick={openNew}
						variant="outline"
						size="sm"
						disabled={!anneeSelectionnee}
						title={anneeSelectionnee ? undefined : "Aucune année scolaire n'est sélectionnée"}
						>Créer un rapport</Button
					>
				{/if}
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
				{#each rapportsFiltres as r (r.id)}
					{@const resume = resumeRapport(r)}
					<div
						class="flex flex-col gap-3 rounded-xl border border-sidebar-border bg-card/60 p-4 transition-colors hover:border-primary/40"
					>
						<div class="flex items-start gap-3">
							<Avatar.Root class="size-12 shrink-0">
								<Avatar.Image src={r.eleveImageUrl || ''} alt={`${r.elevePrenom} ${r.eleveNom}`} />
								<Avatar.Fallback class="text-sm font-bold">
									{r.elevePrenom[0]}{r.eleveNom[0]}
								</Avatar.Fallback>
							</Avatar.Root>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<p class="truncate font-semibold">{r.elevePrenom} {r.eleveNom}</p>
									<Badge
										class="shrink-0 text-[10px] {r.type === 'RETARD'
											? 'bg-amber-500/15 text-amber-600'
											: 'bg-red-500/15 text-red-600'}"
									>
										{r.type === 'RETARD' ? 'Retard' : 'Absence'}
									</Badge>
								</div>
								<p class="truncate text-xs text-muted-foreground">{r.classe}</p>
							</div>
							{#if canEdit}
								<button
									type="button"
									class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
									aria-label="Supprimer"
									onclick={() => {
										rapportToDelete = r;
										confirmOpen = true;
									}}
								>
									<Trash2 class="size-4" />
								</button>
							{/if}
						</div>

						<div
							class="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2"
						>
							<span class="shrink-0 text-[11px] font-semibold tracking-wide text-primary uppercase">
								Résumé
							</span>
							<span class="text-xs font-medium text-foreground/90">{resume.detail}</span>
							<span class="text-muted-foreground">·</span>
							<span class="text-xs">
								<span class="font-semibold text-muted-foreground">Cause :</span>
								{resume.cause}
							</span>
						</div>

						{#if r.message}
							<p class="text-sm leading-relaxed text-foreground/90">{r.message}</p>
						{/if}

						<div class="space-y-1.5 rounded-lg bg-muted/30 p-2">
							{#each r.lignes as l (l.id)}
								<div class="flex items-center justify-between gap-2 text-xs">
									<span class="flex items-center gap-1.5">
										<span
											class="size-1.5 rounded-full {l.type === 'RETARD'
												? 'bg-amber-500'
												: 'bg-red-500'}"
										></span>
										{formatDate(l.date)}
									</span>
									{#if l.motif}
										<span class="truncate text-muted-foreground">{l.motif}</span>
									{/if}
								</div>
							{/each}
						</div>

						<div class="flex items-center justify-between text-xs text-muted-foreground">
							<span>{r.lignes.length} élément(s)</span>
							<span class="italic">par {r.auteur}</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	{#if canEdit}
		<Dialog.Root bind:open={dialogOpen}>
			<Dialog.Content class="sm:max-w-lg">
				<Dialog.Header>
					<Dialog.Title>Nouveau rapport</Dialog.Title>
					<Dialog.Description>
						Choisissez le type, l'élève, puis cochez les absences/retards à reporter.
					</Dialog.Description>
				</Dialog.Header>
				<form method="POST" action="?/create" use:loadingForm>
					<div class="grid gap-4 py-4">
						<div class="grid gap-2">
							<Label>Type de rapport</Label>
							<ToggleGroup.Root
								type="single"
								variant="outline"
								class="grid w-full grid-cols-2"
								value={selectedType}
								onValueChange={(v) => {
									if (v) {
										selectedType = v as TypeRapport;
										selectedItems = [];
									}
								}}
							>
								<ToggleGroup.Item value="RETARD" class="gap-2">
									<Clock class="size-4" /> Retard
								</ToggleGroup.Item>
								<ToggleGroup.Item value="ABSENCE" class="gap-2">
									<UserX class="size-4" /> Absence
								</ToggleGroup.Item>
							</ToggleGroup.Root>
							<input type="hidden" name="type" value={selectedType} />
						</div>

						<div class="grid gap-2">
							<Label>Élève concerné</Label>
							<div class="relative">
								<Search
									class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
								/>
								<Input placeholder="Rechercher un élève..." bind:value={searchQuery} class="pl-9" />
							</div>
							{#if searchResults.length > 0 && !selectedEleveId}
								<div class="max-h-64 space-y-2 overflow-y-auto rounded-md border p-2">
									{#each searchResults as e (e.id)}
										<button
											type="button"
											class="flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors hover:bg-muted"
											onclick={() => {
												selectEleve(e);
												selectedItems = [];
											}}
										>
											<Avatar.Root class="size-9 shrink-0">
												<Avatar.Image src={e.imageUrl || ''} alt={`${e.nom} ${e.prenom}`} />
												<Avatar.Fallback class="text-xs font-bold"
													>{e.nom[0]}{e.prenom[0]}</Avatar.Fallback
												>
											</Avatar.Root>
											<div class="min-w-0">
												<p class="truncate text-sm font-medium">{e.nom} {e.prenom}</p>
												<p class="truncate text-xs text-muted-foreground">{e.classe}</p>
											</div>
										</button>
									{/each}
								</div>
							{/if}
							{#if selectedEleveId}
								{@const selected = eleves.find((e) => e.id === selectedEleveId)}
								<div
									class="flex items-center justify-between gap-2 rounded-md border bg-muted/30 p-3"
								>
									<div class="flex items-center gap-3">
										<Avatar.Root class="size-10">
											<Avatar.Image
												src={selected?.imageUrl || ''}
												alt={`${selected?.nom} ${selected?.prenom}`}
											/>
											<Avatar.Fallback class="text-xs font-bold"
												>{selected?.nom[0]}{selected?.prenom[0]}</Avatar.Fallback
											>
										</Avatar.Root>
										<div>
											<p class="text-sm font-medium">{selected?.nom} {selected?.prenom}</p>
											<p class="text-xs text-muted-foreground">{selected?.classe}</p>
										</div>
									</div>
									<button
										type="button"
										class="rounded-full p-1 hover:bg-muted"
										onclick={resetSelection}
									>
										<X class="size-4 text-muted-foreground" />
									</button>
								</div>
							{/if}
							<input type="hidden" name="eleveId" value={selectedEleveId} />
						</div>

						{#if selectedEleveId}
							<div class="grid gap-2">
								<Label>
									{selectedType === 'RETARD' ? 'Retards' : 'Absences'} de l'élève à reporter
								</Label>
								{#if itemsDisponibles.length === 0}
									<p
										class="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground"
									>
										Aucun{selectedType === 'RETARD' ? ' retard' : 'e absence'} enregistré pour cet élève.
									</p>
								{:else}
									<div class="max-h-64 space-y-2 overflow-y-auto rounded-md border p-2">
										{#each itemsDisponibles as item (item.id)}
											<label
												class="flex cursor-pointer items-start gap-3 rounded-md p-2 transition-colors hover:bg-muted {selectedItems.includes(
													item.id
												)
													? 'bg-primary/5'
													: ''}"
											>
												<input
													type="checkbox"
													name="itemId"
													value={item.id}
													checked={selectedItems.includes(item.id)}
													onchange={(e) => toggleItem(item.id, e.currentTarget.checked)}
													class="mt-1"
												/>
												<div class="min-w-0 flex-1">
													<p class="text-sm">{formatDate(item.date)}</p>
													{#if item.motif}
														<p class="truncate text-xs text-muted-foreground">{item.motif}</p>
													{/if}
												</div>
												{#if item.justifie}
													<Badge class="shrink-0 bg-emerald-500/15 text-[10px] text-emerald-600">
														<Check class="mr-1 size-3" /> Justifié
													</Badge>
												{/if}
											</label>
										{/each}
									</div>
								{/if}
							</div>
						{/if}

						<div class="grid gap-2">
							<Label for="message">Note / Cause (obligatoire)</Label>
							<Textarea
								id="message"
								name="message"
								bind:value={message}
								placeholder="Précisez la cause du rapport (ex. rendez-vous médical, transport...)..."
								rows={3}
								required
							/>
						</div>
					</div>
					<Dialog.Footer>
						<Button variant="outline" type="button" onclick={() => (dialogOpen = false)}
							>Annuler</Button
						>
						<Button
							type="submit"
							disabled={!selectedEleveId || selectedItems.length === 0 || !message.trim()}
						>
							Publier le rapport ({selectedItems.length})
						</Button>
					</Dialog.Footer>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	{/if}

	<form
		bind:this={deleteForm}
		method="POST"
		action="?/delete"
		use:loadingForm={{
			handler: () => {
				submittingDelete = true;
				return async ({ result }: { result: ActionResult }) => {
					submittingDelete = false;
					if (result.type === 'success') {
						confirmOpen = false;
					} else if (result.type === 'failure') {
						alert(result.data?.error || 'Suppression impossible');
					}
				};
			}
		}}
	>
		<input type="hidden" name="rapportId" value={rapportToDelete?.id || ''} />
	</form>

	<ConfirmDeleteDialog
		bind:open={confirmOpen}
		title="Supprimer le rapport"
		description={rapportToDelete
			? `Êtes-vous sûr de vouloir supprimer le rapport de ${rapportToDelete.elevePrenom} ${rapportToDelete.eleveNom} ? Cette action est irréversible.`
			: ''}
		loading={submittingDelete}
		onConfirm={() => deleteForm?.requestSubmit()}
	/>
</main>
