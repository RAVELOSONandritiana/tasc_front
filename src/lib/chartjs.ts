import { Chart, registerables } from 'chart.js';

// svelte-chartjs v4 utilise le cœur de chart.js (pas 'chart.js/auto'),
// il faut donc enregistrer les composants nécessaires (échelles, contrôleurs,
// plugins) avant de monter un graphique. Ce module est importé pour ses
// effets de bord (side-effect import).
Chart.register(...registerables);
