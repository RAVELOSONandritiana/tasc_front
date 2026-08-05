<script lang="ts">
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import {
		Image as ImageIcon,
		Pencil,
		Users,
		BookOpen,
		Trash2,
		CalendarDays,
		Clock,
		UserX
	} from '@lucide/svelte/icons';
	import type { Cours } from '$lib/types/Materiel.type';

	let {
		cours,
		matiere,
		classeId,
		estTitulaire = true,
		peutModifierParticipants = true,
		peutSupprimer = true,
		peutCommencer = true,
		onEditCoefficient,
		onEditParticipants,
		onOpenNotes,
		onOpenImageDialog,
		onDeleteCours,
		formatParticipants,
		defaultMatiereColor
	}: {
		cours: Cours;
		matiere?: { id: string; nom: string; couleur?: string };
		classeId: string;
		estTitulaire?: boolean;
		peutModifierParticipants?: boolean;
		peutSupprimer?: boolean;
		peutCommencer?: boolean;
		onEditCoefficient: (cours: Cours) => void;
		onEditParticipants: (cours: Cours) => void;
		onOpenNotes: (cours: Cours) => void;
		onOpenImageDialog: (cours: Cours) => void;
		onDeleteCours: (cours: Cours) => void;
		formatParticipants: (cours: Cours) => string;
		defaultMatiereColor: string;
	} = $props();

	const stats = $derived(
		cours.stats ?? {
			nbSeances: 0,
			heuresEffectuees: 0,
			absences: 0,
			retards: 0,
			derniereSeance: null
		}
	);
</script>

<CardUI>
	<div class="flex h-full flex-col">
		<div class="relative h-44 w-full overflow-hidden">
			{#if cours.url}
				<img
					src={cours.url}
					alt="illustration cours"
					class="h-full w-full object-cover transition-all duration-300 hover:scale-105 hover:grayscale-75"
				/>
			{:else}
				<div
					class="flex h-full w-full items-center justify-center"
					style="background-color: {matiere?.couleur || defaultMatiereColor}15"
				>
					<span
						class="text-lg font-bold tracking-wider uppercase"
						style="color: {matiere?.couleur || defaultMatiereColor}">{cours.nom}</span
					>
				</div>
			{/if}
			<div class="absolute top-2 right-2 flex gap-1">
				<button
					type="button"
					class={buttonVariants({
						variant: 'secondary',
						size: 'icon-sm',
						class: 'size-8 rounded-full bg-black/40 text-white hover:bg-black/60'
					})}
					onclick={() => onOpenImageDialog(cours)}
				>
					<ImageIcon class="size-4" />
				</button>
				<Button
					onclick={() => onEditCoefficient(cours)}
					class={buttonVariants({
						variant: 'ghost',
						size: 'icon-sm',
						class: 'size-8 rounded-full bg-black/40 text-white hover:bg-black/60'
					})}
					aria-label="Modifier le coefficient"
				>
					<Pencil class="size-4" />
				</Button>
				<button
					type="button"
					class={buttonVariants({
						variant: 'secondary',
						size: 'icon-sm',
						class:
							'size-8 rounded-full bg-black/40 text-white hover:bg-black/60 hover:bg-red-600/80'
					})}
					onclick={() => onDeleteCours(cours)}
					disabled={!peutSupprimer}
					title={peutSupprimer ? 'Supprimer le cours' : 'Réservé aux surveillants'}
					aria-label="Supprimer le cours"
				>
					<Trash2 class="size-4" />
				</button>
			</div>
		</div>
		<div
			class="h-2 w-full"
			style="background-color: {matiere?.couleur || defaultMatiereColor}"
		></div>
		<div class="flex flex-1 flex-col gap-1.5 bg-white/5 p-2">
			<div class="flex items-center gap-2">
				<span class="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
					>COURS -</span
				>
				<span class="text-sm font-bold">{matiere?.nom || 'Matiere'}</span>
			</div>
			<div>
				<span class="text-xs text-muted-foreground">Coefficient</span>
				<p class="text-sm font-bold">{cours.coefficient}</p>
			</div>
			<div>
				<span class="text-xs text-muted-foreground">Participants</span>
				<p class="text-sm font-bold">{formatParticipants(cours)}</p>
			</div>
			{#if cours.professeur}
				<p class="text-xs text-muted-foreground">
					{cours.professeur}
				</p>
			{/if}

			<a
				href={`/classe/${classeId}/cours/${cours.id}/seances`}
				class="mt-1 grid grid-cols-3 gap-1 rounded-lg border border-sidebar-border bg-background/40 p-1.5 text-center transition-colors hover:bg-background/70"
				title="Voir toutes les séances de cette matière"
			>
				<div>
					<p class="flex items-center justify-center gap-1 text-sm font-bold">
						<CalendarDays class="size-3 text-muted-foreground" />
						{stats.nbSeances}
					</p>
					<p class="text-[10px] text-muted-foreground">séances</p>
				</div>
				<div>
					<p class="flex items-center justify-center gap-1 text-sm font-bold text-red-500">
						<UserX class="size-3" />
						{stats.absences}
					</p>
					<p class="text-[10px] text-muted-foreground">absences</p>
				</div>
				<div>
					<p class="flex items-center justify-center gap-1 text-sm font-bold text-amber-500">
						<Clock class="size-3" />
						{stats.retards}
					</p>
					<p class="text-[10px] text-muted-foreground">retards</p>
				</div>
			</a>

			<div class="mt-auto flex w-full flex-col gap-2">
				<div class="flex w-full items-center justify-between gap-2">
					<Button
						variant="outline"
						size="sm"
						class="h-8 flex-1 rounded-lg px-3 text-xs"
						onclick={() => onEditParticipants(cours)}
						disabled={!peutModifierParticipants}
						title={peutModifierParticipants ? undefined : 'Réservé aux surveillants'}
					>
						<Users class="mr-1 size-3" />
						Participants
					</Button>
					<Button
						size="sm"
						variant="default"
						class="h-8 flex-1 rounded-lg px-3 text-xs"
						onclick={() => onOpenNotes(cours)}
						disabled={!peutCommencer}
						title={peutCommencer ? undefined : 'Réservé au professeur titulaire du cours'}
					>
						<BookOpen class="mr-1 size-3" />
						Notes
					</Button>
				</div>
				<Button
					size="sm"
					variant="secondary"
					class="h-8 w-full rounded-lg px-3 text-xs"
					href={`/classe/${classeId}/cours/${cours.id}/seances`}
				>
					<CalendarDays class="mr-1 size-3" />
					Séances & assiduité
				</Button>
			</div>
		</div>
	</div>
</CardUI>
