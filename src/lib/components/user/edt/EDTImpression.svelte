<script lang="ts">
	import type { SeanceEDT } from '$lib/types/Materiel.type';

	const {
		jours,
		seances,
		cours = [],
		classeNom,
		annee
	}: {
		jours: string[];
		seances: SeanceEDT[];
		cours?: { id: string; professeur?: string }[];
		classeNom: string;
		annee: string;
	} = $props();

	const profParCours = $derived(
		(cours ?? []).reduce(
			(acc, c) => {
				acc[c.id] = c.professeur || '';
				return acc;
			},
			{} as Record<string, string>
		)
	);

	function prof(seance: SeanceEDT): string {
		return profParCours[seance.coursId] || '';
	}

	// Libellé précis de la salle : on privilégie le numéro (ex: « Salle 7 »),
	// puis le nom si le numéro est absent.
	function libelleSalle(seance: SeanceEDT): string {
		if (seance.salleNum != null) return `Salle ${seance.salleNum}`;
		if (seance.salleNom) return `Salle ${seance.salleNom}`;
		return '';
	}

	// Séances avec un horaire complet : seules celles-ci sont placées dans la
	// grille horaire. Les autres sont listées à part (horaires à compléter).
	const seancesCompletes = $derived(
		seances.filter((s) => !!s.heureDebut && !!s.heureFin)
	);
	const seancesIncompletes = $derived(
		seances.filter((s) => !s.heureDebut || !s.heureFin)
	);

	// Bornes horaires utilisées (début et fin de chaque séance), triées.
	const temps = $derived.by(() => {
		const set = new Set<string>();
		for (const s of seancesCompletes) {
			if (s.heureDebut) set.add(s.heureDebut);
			if (s.heureFin) set.add(s.heureFin);
		}
		return [...set].sort((a, b) => a.localeCompare(b));
	});

	// Bandes horaires réellement occupées par au moins une séance. On supprime
	// les intervalles vides (pause méridienne, trous) pour éviter les lignes
	// blanches inutiles dans le tableau imprimé.
	type Bande = { debut: string; fin: string };
	const bandes = $derived.by<Bande[]>(() => {
		const res: Bande[] = [];
		for (let i = 0; i < temps.length - 1; i++) {
			const debut = temps[i];
			const fin = temps[i + 1];
			const occupee = seancesCompletes.some(
				(s) => s.heureDebut <= debut && s.heureFin >= fin
			);
			if (occupee) res.push({ debut, fin });
		}
		return res;
	});

	// Index des bandes couvertes par une séance (pour le placement en grille).
	function bandesSeance(seance: SeanceEDT): number[] {
		const idxs: number[] = [];
		bandes.forEach((b, i) => {
			if (seance.heureDebut <= b.debut && seance.heureFin >= b.fin) idxs.push(i);
		});
		return idxs;
	}

	// Vrai si une séance du jour donné occupe la bande d'index `b` : sert à
	// savoir si on doit laisser la case vide (pour que les filets restent
	// continus sur toute la colonne).
	function couvert(jour: string, b: number): boolean {
		return seancesCompletes.some(
			(s) => s.jour === jour && bandesSeance(s).includes(b)
		);
	}

	// Cellules de séance avec leur position en grille (ligne/colonne).
	const cellules = $derived.by(() => {
		const out: { seance: SeanceEDT; col: number; rowStart: number; rowEnd: number }[] = [];
		for (const seance of seancesCompletes) {
			const col = jours.indexOf(seance.jour);
			if (col < 0) continue;
			const idxs = bandesSeance(seance);
			if (idxs.length === 0) continue;
			const rowStart = idxs[0] + 2; // la ligne 1 est l'en-tête
			const rowEnd = idxs[idxs.length - 1] + 3; // grid-row est exclusif
			out.push({ seance, col: col + 2, rowStart, rowEnd });
		}
		return out;
	});

</script>

<div class="edt-papier">
	<img src="/logos/logo-right.png" class="watermark" alt="" />

	<div class="bandeau-titre">
		<img src="/logos/logo-left.png" class="crest" alt="" />
		<div class="titre-zone">
			<h1 class="titre-oldstyle">EMPLOI DU TEMPS</h1>
			<p class="classe-nom">{classeNom || 'Classe'}</p>
			<p class="sous-titre">Année scolaire : {annee || '—'}</p>
		</div>
	</div>

	{#if bandes.length === 0}
		<p class="vide">Aucune séance planifiée.</p>
	{:else}
		<div
			class="edt-grille"
			style="grid-template-columns: 60px repeat({jours.length}, minmax(0, 1fr)); grid-template-rows: auto repeat({bandes.length}, minmax(30px, auto));"
		>
			<!-- En-tête : colonne horaire + un jour par colonne -->
			<div class="cell entete horaire-col">Horaire</div>
			{#each jours as jour, d (jour)}
				<div class="cell entete" style="grid-column: {d + 2}; grid-row: 1;">{jour}</div>
			{/each}

			<!-- Colonne des heures -->
			{#each bandes as bande, b (bande.debut + bande.fin)}
				<div class="cell heure" style="grid-column: 1; grid-row: {b + 2};">
					{bande.debut}
				</div>
			{/each}

			<!-- Séances placées selon leur créneau -->
			{#each cellules as c (c.seance.id)}
				<div
					class="cell seance"
					style="grid-column: {c.col}; grid-row: {c.rowStart} / {c.rowEnd};"
				>
					<span class="matiere">{c.seance.coursNom || c.seance.coursId}</span>
					<span class="horaire">{c.seance.heureDebut} – {c.seance.heureFin}</span>
					{#if prof(c.seance)}
						<span class="detail">{prof(c.seance)}</span>
					{/if}
					{#if libelleSalle(c.seance)}
						<span class="detail salle">{libelleSalle(c.seance)}</span>
					{/if}
				</div>
			{/each}

			<!-- Cases vides : on les remplit pour que les filets verticaux
			     restent continus sur toute la hauteur de chaque colonne. -->
			{#each bandes as bande, b (bande.debut + bande.fin)}
				{#each jours as jour, d (jour)}
					{#if !couvert(jour, b)}
						<div class="cell" style="grid-column: {d + 2}; grid-row: {b + 2};"></div>
					{/if}
				{/each}
			{/each}
		</div>
	{/if}

	{#if seancesIncompletes.length > 0}
		<div class="a-completer">
			<p class="titre-complet">Séances sans horaire complet :</p>
			<ul>
				{#each seancesIncompletes as s (s.id)}
					<li>
						<strong>{s.jour}</strong> — {s.coursNom || s.coursId}
						{#if libelleSalle(s)}· {libelleSalle(s)}{/if}
						{#if prof(s)}· {prof(s)}{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	.edt-papier {
		display: none;
	}
	@media print {
		.edt-papier {
			display: block;
			position: relative;
			color: #000;
			background: #fff;
			font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
			font-size: 11.5px;
			line-height: 1.25;
			print-color-adjust: exact;
			-webkit-print-color-adjust: exact;
		}
		/* Filigrane discret centré, forcé en niveaux de gris */
		.watermark {
			position: absolute;
			top: 50%;
			left: 50%;
			width: 360px;
			height: 360px;
			transform: translate(-50%, -50%);
			opacity: 0.05;
			filter: grayscale(1);
			pointer-events: none;
			z-index: 0;
		}
		.bandeau-titre {
			position: relative;
			z-index: 1;
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 10px 14px;
			margin-bottom: 10px;
		}
		.crest {
			height: 46px;
			width: auto;
			object-fit: contain;
			filter: grayscale(1);
		}
		.titre-zone {
			flex: 1;
			text-align: center;
		}
		.titre-oldstyle {
			font-family: Georgia, 'Times New Roman', serif;
			font-size: 20px;
			font-weight: 800;
			letter-spacing: 1px;
			margin: 0;
			text-transform: uppercase;
		}
		.classe-nom {
			margin: 2px 0 0;
			font-size: 14px;
			font-weight: 700;
		}
		.sous-titre {
			margin: 1px 0 0;
			font-size: 10.5px;
		}
		.edt-grille {
			position: relative;
			z-index: 1;
			display: grid;
			column-gap: 0;
			border-left: 1px solid #000;
		}
		.cell {
			padding: 3px 6px;
			overflow: hidden;
			vertical-align: top;
			break-inside: avoid;
			border-right: 1px solid #000;
		}
		.entete {
			font-family: Georgia, 'Times New Roman', serif;
			font-weight: 700;
			text-align: center;
			text-transform: uppercase;
			font-size: 11px;
			letter-spacing: 0.4px;
			border-bottom: 1px solid #000;
		}
		.horaire-col {
			background: transparent;
		}
		.heure {
			font-weight: 700;
			text-align: center;
			background: transparent;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.seance {
			display: flex;
			flex-direction: column;
			gap: 1px;
			border-top: 1px solid #000;
			border-bottom: 1px solid #000;
		}
		.matiere {
			font-weight: 800;
			font-size: 11px;
			line-height: 1.1;
		}
		.horaire {
			font-size: 9.5px;
			font-weight: 600;
		}
		.detail {
			font-size: 9px;
			color: #333;
		}
		.salle {
			font-style: italic;
		}
		.vide {
			position: relative;
			z-index: 1;
			text-align: center;
			font-style: italic;
			padding: 24px 0;
		}
		.a-completer {
			position: relative;
			z-index: 1;
			margin-top: 8px;
			padding-top: 5px;
			break-inside: avoid;
		}
		.titre-complet {
			font-weight: 700;
			font-size: 10px;
			margin: 0 0 2px;
		}
		.a-completer ul {
			margin: 0;
			padding-left: 18px;
			font-size: 10px;
		}
	}
</style>
