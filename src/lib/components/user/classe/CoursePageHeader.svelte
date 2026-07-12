<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Plus, Calendar } from '@lucide/svelte/icons';
	import type { Classe } from '$lib/types/Materiel.type';
	import { formatExamenNom } from '$lib/utils';

	let {
		classe,
		listeExamens = [],
		openCreateCours = $bindable(false),
		openCreateExamen = $bindable(false)
	}: {
		classe: Classe | undefined;
		listeExamens: { id: string; nom: string; date: string; periode?: string }[];
		openCreateCours?: boolean;
		openCreateExamen?: boolean;
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
				<Dialog.Trigger
					class={buttonVariants({ variant: 'default', size: 'sm', class: 'gap-2' })}
				>
					<Plus class="size-4" />
					Nouveau cours
				</Dialog.Trigger>
			</Dialog.Root>

			<Dialog.Root bind:open={openCreateExamen}>
				<Dialog.Trigger
					class={buttonVariants({ variant: 'outline', size: 'sm', class: 'gap-2' })}
				>
					<Calendar class="size-4" />
					Nouvel examen
				</Dialog.Trigger>
			</Dialog.Root>
		</div>
	</div>

	{#if listeExamens.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each listeExamens as examen (examen.id)}
				<span class="rounded-md bg-sidebar-accent/30 px-3 py-1 text-sm">
					{formatExamenNom(examen)} - {examen.date}
				</span>
			{/each}
		</div>
	{/if}
</div>
