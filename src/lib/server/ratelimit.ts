const WINDOW_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function isRateLimited(key: string): boolean {
	const now = Date.now();
	const bucket = buckets.get(key);

	if (!bucket || now >= bucket.resetAt) {
		buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
		return false;
	}

	if (bucket.count >= MAX_ATTEMPTS) {
		return true;
	}

	bucket.count += 1;
	return false;
}

export function getRateLimitReset(key: string): number {
	const bucket = buckets.get(key);
	if (!bucket) return 0;
	return Math.max(0, bucket.resetAt - Date.now());
}

if (import.meta.env?.MODE !== 'production') {
	setInterval(() => {
		const now = Date.now();
		for (const [key, bucket] of buckets) {
			if (now >= bucket.resetAt) buckets.delete(key);
		}
	}, WINDOW_MS).unref();
}
