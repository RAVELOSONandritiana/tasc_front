import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const annees = ['2024-2025', '2025-2026', '2026-2027'];
	const currentYear = '2025-2026';

	const dataParAnnee: Record<string, {
		eleves: number;
		elevesParClasse: { niveau: string; count: number }[];
		classes: number;
		enseignants: number;
		surveillants: number;
		personnel: number;
		incidents: number;
		salles: number;
		incidentsParMois: { mois: string; count: number }[];
		roles: { role: string; count: number }[];
	}> = {
		'2024-2025': {
			eleves: 120,
			elevesParClasse: [
				{ niveau: '2nd', count: 40 },
				{ niveau: '1ere', count: 45 },
				{ niveau: 'Tle', count: 35 }
			],
			classes: 3,
			enseignants: 12,
			surveillants: 4,
			personnel: 5,
			incidents: 28,
			salles: 5,
			incidentsParMois: [
				{ mois: 'Sep', count: 3 }, { mois: 'Oct', count: 5 }, { mois: 'Nov', count: 2 },
				{ mois: 'Dec', count: 4 }, { mois: 'Jan', count: 6 }, { mois: 'Fev', count: 3 },
				{ mois: 'Mar', count: 2 }, { mois: 'Avr', count: 1 }, { mois: 'Mai', count: 2 },
				{ mois: 'Juin', count: 0 }
			],
			roles: [
				{ role: 'Élèves', count: 120 },
				{ role: 'Enseignants', count: 12 },
				{ role: 'Surveillants', count: 4 },
				{ role: 'Personnel', count: 5 }
			]
		},
		'2025-2026': {
			eleves: 145,
			elevesParClasse: [
				{ niveau: '2nd', count: 50 },
				{ niveau: '1ere', count: 48 },
				{ niveau: 'Tle', count: 47 }
			],
			classes: 3,
			enseignants: 14,
			surveillants: 5,
			personnel: 6,
			incidents: 35,
			salles: 5,
			incidentsParMois: [
				{ mois: 'Sep', count: 4 }, { mois: 'Oct', count: 6 }, { mois: 'Nov', count: 3 },
				{ mois: 'Dec', count: 5 }, { mois: 'Jan', count: 7 }, { mois: 'Fev', count: 4 },
				{ mois: 'Mar', count: 3 }, { mois: 'Avr', count: 2 }, { mois: 'Mai', count: 1 },
				{ mois: 'Juin', count: 0 }
			],
			roles: [
				{ role: 'Élèves', count: 145 },
				{ role: 'Enseignants', count: 14 },
				{ role: 'Surveillants', count: 5 },
				{ role: 'Personnel', count: 6 }
			]
		},
		'2026-2027': {
			eleves: 0,
			elevesParClasse: [
				{ niveau: '2nd', count: 0 },
				{ niveau: '1ere', count: 0 },
				{ niveau: 'Tle', count: 0 }
			],
			classes: 0,
			enseignants: 0,
			surveillants: 0,
			personnel: 0,
			incidents: 0,
			salles: 0,
			incidentsParMois: [
				{ mois: 'Sep', count: 0 }, { mois: 'Oct', count: 0 }, { mois: 'Nov', count: 0 },
				{ mois: 'Dec', count: 0 }, { mois: 'Jan', count: 0 }, { mois: 'Fev', count: 0 },
				{ mois: 'Mar', count: 0 }, { mois: 'Avr', count: 0 }, { mois: 'Mai', count: 0 },
				{ mois: 'Juin', count: 0 }
			],
			roles: [
				{ role: 'Élèves', count: 0 },
				{ role: 'Enseignants', count: 0 },
				{ role: 'Surveillants', count: 0 },
				{ role: 'Personnel', count: 0 }
			]
		}
	};

	return { annees, currentYear, dataParAnnee };
};
