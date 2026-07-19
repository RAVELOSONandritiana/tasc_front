<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Plus, Calendar, Layers, Trash2 } from '@lucide/svelte/icons';
	import type { Classe } from '$lib/types/Materiel.type';
	import { formatExamenNom } from '$lib/utils';

	let {
		classe,
		listeExamens = [],
		openCreateCours = $bindable(false),
		openCreateExamen = $bindable(false),
		onManageSousExamens,
		onDeleteExamen
	}: {
		classe: Classe | undefined;
		listeExamens: { id: string; nom: string; date: string; periode?: string }[];
		openCreateCours?: boolean;
		openCreateExamen?: boolean;
		onManageSousExamens?: (examenId: string) => void;
		onDeleteExamen?: (examenId: string) => void;
	} = $props();
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<h1 class="text-lg font-semibold">
			Configurer classe
			{#if classe}
				- {classe.name || `Niveau ${classe.niveau}`}
			{/if}
		</h1>
		<div class="flex flex-col gap-2 md:flex-row md:items-center">
			<Dialog.Root bind:open={openCreateCours}>
				<Dialog.Trigger class={buttonVariants({ variant: 'default', size: 'sm', class: 'gap-2' })}>
					<Plus class="size-4" />
					Nouveau cours
				</Dialog.Trigger>
			</Dialog.Root>

			<Dialog.Root bind:open={openCreateExamen}>
				<Dialog.Trigger class={buttonVariants({ variant: 'outline', size: 'sm', class: 'gap-2' })}>
					<Calendar class="size-4" />
					Nouvel examen
				</Dialog.Trigger>
			</Dialog.Root>
		</div>
	</div>

	{#if listeExamens.length > 0}
		<div class="flex flex-wrap items-center gap-2">
			{#each listeExamens as examen (examen.id)}
				<span class="flex items-center gap-1 rounded-md bg-sidebar-accent/30 px-3 py-1 text-sm">
					{formatExamenNom(examen)} - {examen.date}
					{#if onManageSousExamens}
						<button
							type="button"
							class="ml-1 inline-flex items-center text-muted-foreground hover:text-foreground"
							title="Gérer les sous-examens"
							onclick={() => onManageSousExamens(examen.id)}
						>
							<Layers class="size-3.5" />
						</button>
					{/if}
					{#if onDeleteExamen}
						<button
							type="button"
							class="ml-0.5 inline-flex items-center text-muted-foreground hover:text-destructive"
							title="Supprimer l'examen"
							onclick={() => onDeleteExamen(examen.id)}
						>
							<Trash2 class="size-3.5" />
						</button>
					{/if}
				</span>
			{/each}
		</div>
	{/if}
</div>
