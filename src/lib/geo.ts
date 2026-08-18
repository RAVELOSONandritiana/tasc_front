// Capture la position géographique du navigateur et la stocke dans un cookie
// non HttpOnly, lu côté serveur pour être associé à l'historique d'activité
// (mesure de sécurité : géolocalisation de l'appareil ayant fait la requête).

export type GeoPoint = {
	latitude: number;
	longitude: number;
	accuracy: number;
	timestamp: number;
};

export const GEO_COOKIE = 'tasc_geo';

function writeCookie(point: GeoPoint) {
	try {
		const value = encodeURIComponent(JSON.stringify(point));
		// Cookie accessible côté serveur, expire après 1 heure.
		document.cookie = `${GEO_COOKIE}=${value}; path=/; max-age=3600; samesite=lax`;
	} catch {
		// stockage impossible : on ignore silencieusement
	}
}

// Demande la géolocalisation au navigateur (nécessite la permission de
// l'utilisateur) et l'enregistre dans un cookie. Fonction idempotente : si une
// position récente (< 10 min) est déjà connue, on ne redemande pas.
export function captureGeo(): void {
	if (typeof navigator === 'undefined' || !navigator.geolocation) return;

	try {
		const existing = readGeoCookie();
		if (existing && Date.now() - existing.timestamp < 10 * 60 * 1000) return;
	} catch {
		// ignore
	}

	navigator.geolocation.getCurrentPosition(
		(pos) => {
			writeCookie({
				latitude: pos.coords.latitude,
				longitude: pos.coords.longitude,
				accuracy: pos.coords.accuracy,
				timestamp: Date.now()
			});
		},
		() => {
			// permission refusée ou erreur : aucune position n'est enregistrée
		},
		{ enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 }
	);
}

export function readGeoCookie(): GeoPoint | null {
	if (typeof document === 'undefined') return null;
	const match = document.cookie
		.split(';')
		.map((c) => c.trim())
		.find((c) => c.startsWith(`${GEO_COOKIE}=`));
	if (!match) return null;
	try {
		return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('='))) as GeoPoint;
	} catch {
		return null;
	}
}
