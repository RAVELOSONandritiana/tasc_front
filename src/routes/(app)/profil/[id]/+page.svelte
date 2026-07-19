<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Avatar from '$lib/components/ui/avatar/avatar.svelte';
	import AvatarFallback from '$lib/components/ui/avatar/avatar-fallback.svelte';
	import AvatarImage from '$lib/components/ui/avatar/avatar-image.svelte';
	import {
		User,
		Mail,
		Phone,
		MapPin,
		Calendar,
		Shield,
		ArrowLeft,
		History,
		BookOpen,
		GraduationCap,
		CheckCircle2,
		Users,
		TrendingDown,
		CalendarClock,
		UserCheck,
		UserX,
		Timer
	} from '@lucide/svelte/icons';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
	const user = data.user;
	const initial = $derived((user.nom?.charAt(0) || '') + (user.prenom?.charAt(0) || ''));

	const roleColors: Record<string, string> = {
		Administrateur: 'bg-red-500/10 text-red-500 border-red-500/20',
		Enseignant: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
		Surveillant: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
		Personnel: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
	};

	const stats = $derived([
		...(user.stats?.coursTermines !== undefined
			? [
					{
						label: 'Cours terminés',
						value: user.stats.coursTermines.toString(),
						icon: GraduationCap,
						color: 'text-emerald-500'
					}
				]
			: []),
		...(user.stats?.coursCount !== undefined
			? [
					{
						label: 'Cours',
						value: user.stats.coursCount.toString(),
						icon: BookOpen,
						color: 'text-blue-500'
					}
				]
			: []),
		...(user.stats?.elevesParticipants !== undefined
			? [
					{
						label: 'Élèves participants',
						value: user.stats.elevesParticipants.toString(),
						icon: Users,
						color: 'text-blue-500'
					}
				]
			: []),
		...(user.stats?.efficacite !== undefined
			? [
					{
						label: 'Élèves ayant la moyenne',
						value: user.stats.efficacite.toString(),
						icon: CheckCircle2,
						color: 'text-emerald-500'
					}
				]
			: []),
		...(user.stats?.elevesSansMoyenne !== undefined
			? [
					{
						label: 'Élèves sans moyenne',
						value: user.stats.elevesSansMoyenne.toString(),
						icon: TrendingDown,
						color: 'text-red-500'
					}
				]
			: [])
	]);

	type PresenceRow = {
		id: string;
		date: string;
		cours: string;
		statut?: string;
		presents?: number;
		retards?: number;
		absents?: number;
	};

	const PRESENCE_PAGE_SIZE = 6;
	let presencePage = $state(1);

	const presenceItems = $derived<PresenceRow[]>(
		data.presence.statutEleve.length > 0
			? data.presence.statutEleve
			: data.presence.seancesDonnees
	);
	const presenceMode = $derived(data.presence.statutEleve.length > 0 ? 'eleve' : 'prof');

	const presenceTotals = $derived({
		presents: presenceItems.reduce((s, it) => s + (it.presents ?? (it.statut === 'PRESENT' ? 1 : 0)), 0),
		retards: presenceItems.reduce((s, it) => s + (it.retards ?? (it.statut === 'RETARD' ? 1 : 0)), 0),
		absents: presenceItems.reduce((s, it) => s + (it.absents ?? (it.statut === 'ABSENT' ? 1 : 0)), 0)
	});

	const presenceTotalPages = $derived(
		Math.max(1, Math.ceil(presenceItems.length / PRESENCE_PAGE_SIZE))
	);
	const pagedPresence = $derived(
		presenceItems.slice((presencePage - 1) * PRESENCE_PAGE_SIZE, presencePage * PRESENCE_PAGE_SIZE)
	);

	// Réinitialise la pagination lorsqu'on change de profil.
	$effect(() => {
		presenceItems;
		presencePage = 1;
	});

	function getPresencePageItems(current: number, total: number): (number | 'ellipsis')[] {
		const delta = 1;
		const range: number[] = [];
		const left = Math.max(2, current - delta);
		const right = Math.min(total - 1, current + delta);
		range.push(1);
		if (left > 2) range.push(-1);
		for (let i = left; i <= right; i++) range.push(i);
		if (right < total - 1) range.push(-2);
		if (total > 1) range.push(total);
		return range.map((n) => (n < 0 ? 'ellipsis' : n));
	}
	const presencePageItems = $derived(getPresencePageItems(presencePage, presenceTotalPages));

	function formatPresenceDate(dateStr: string) {
		return new Date(dateStr).toLocaleString('fr-FR', {
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<main class="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background text-foreground">
	<div class="space-y-6 p-4 md:p-6">
		<div class="flex items-center justify-between">
			<Button variant="ghost" class="gap-2" onclick={() => goto('/personne')}>
				<ArrowLeft class="size-4" />
				Retour
			</Button>
			<Button variant="outline" class="gap-2" onclick={() => goto(`/profil/${user.id}/history`)}>
				<History class="size-4" />
				Historique
			</Button>
		</div>

		<Card class="overflow-hidden">
			<div class="h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20"></div>
			<div class="px-6 pb-6">
				<div
					class="-mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between"
				>
					<div class="flex items-end gap-4">
						<Avatar class="size-20 border-4 border-card shadow-md">
							<AvatarImage src={user.photoUrl || ''} alt={user.prenom} />
							<AvatarFallback class="text-xl font-bold">{initial || '?'}</AvatarFallback>
						</Avatar>
						<div class="pb-1">
							<h1 class="text-2xl font-bold">{user.prenom} {user.nom}</h1>
							<div class="mt-1 flex items-center gap-2">
								<Badge
									variant="outline"
									class="text-xs {roleColors[user.role] || 'bg-muted text-muted-foreground'}"
								>
									{user.role}
								</Badge>
								<span class="text-xs text-muted-foreground">Matricule: {user.matricule}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Card>

		{#if stats.length > 0}
			<div class="grid grid-cols-2 gap-3 md:grid-cols-3">
				{#each stats as stat}
					<Card class="p-4 text-center">
						<stat.icon class="mx-auto size-5 {stat.color}" />
						<p class="mt-2 text-lg font-bold">{stat.value}</p>
						<p class="text-xs text-muted-foreground">{stat.label}</p>
					</Card>
				{/each}
			</div>
		{/if}

		<div class="grid gap-4 md:grid-cols-2">
			<Card class="space-y-3 p-4">
				<h3 class="flex items-center gap-2 font-semibold">
					<User class="size-4 text-primary" />
					Informations personnelles
				</h3>
				<div class="flex items-center gap-3">
					<Mail class="size-4 text-muted-foreground" />
					<div>
						<p class="text-xs text-muted-foreground">Email</p>
						<p class="text-sm font-medium">{user.email}</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<Phone class="size-4 text-muted-foreground" />
					<div>
						<p class="text-xs text-muted-foreground">Téléphone</p>
						<p class="text-sm font-medium">{user.phone}</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<MapPin class="size-4 text-muted-foreground" />
					<div>
						<p class="text-xs text-muted-foreground">Adresse</p>
						<p class="text-sm font-medium">
							{user.domicile}{user.commune ? `, ${user.commune}` : ''}
						</p>
					</div>
				</div>
			</Card>

			<Card class="space-y-3 p-4">
				<h3 class="flex items-center gap-2 font-semibold">
					<Shield class="size-4 text-primary" />
					Compte
				</h3>
				<div class="flex items-center gap-3">
					<Shield class="size-4 text-muted-foreground" />
					<div>
						<p class="text-xs text-muted-foreground">Rôle</p>
						<p class="text-sm font-medium">{user.role}</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<Calendar class="size-4 text-muted-foreground" />
					<div>
						<p class="text-xs text-muted-foreground">Membre depuis</p>
						<p class="text-sm font-medium">{user.dateCreation}</p>
					</div>
				</div>
			</Card>
		</div>

		{#if user.cours && user.cours.length > 0}
			<Card class="space-y-3 p-4">
				<h3 class="flex items-center gap-2 font-semibold">
					<BookOpen class="size-4 text-primary" />
					Cours ({user.cours.length})
				</h3>
				<div class="space-y-2">
					{#each user.cours as c (c.id)}
						<div class="flex items-center justify-between gap-3 rounded-md border border-sidebar-border p-3">
							<div class="min-w-0">
								<p class="truncate text-sm font-medium">{c.matiereNom}</p>
								<p class="text-xs text-muted-foreground">{c.classeNom}</p>
							</div>
							<span class="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-semibold">
								Coef. {c.coefficient}
							</span>
						</div>
					{/each}
				</div>
			</Card>
		{/if}

		{#if data.presence}
			<Card class="space-y-4 p-4">
				<div class="flex items-center justify-between gap-2">
					<h3 class="flex items-center gap-2 font-semibold">
						<CalendarClock class="size-4 text-primary" />
						Historique de présence
					</h3>
					<Badge variant="outline" class="text-xs">
						{presenceItems.length} séance{presenceItems.length > 1 ? 's' : ''}
					</Badge>
				</div>

				{#if presenceItems.length === 0}
					<div
						class="flex flex-col items-center gap-2 rounded-xl border border-dashed border-sidebar-border py-10 text-center"
					>
						<CalendarClock class="size-6 text-muted-foreground/50" />
						<p class="text-sm text-muted-foreground">Aucun historique de présence.</p>
					</div>
				{:else}
					<div class="grid grid-cols-3 gap-2">
						<div class="rounded-xl bg-emerald-500/10 p-3 text-center">
							<p class="text-lg font-bold text-emerald-500">{presenceTotals.presents}</p>
							<p class="text-xs text-muted-foreground">Présents</p>
						</div>
						<div class="rounded-xl bg-amber-500/10 p-3 text-center">
							<p class="text-lg font-bold text-amber-500">{presenceTotals.retards}</p>
							<p class="text-xs text-muted-foreground">Retards</p>
						</div>
						<div class="rounded-xl bg-red-500/10 p-3 text-center">
							<p class="text-lg font-bold text-red-500">{presenceTotals.absents}</p>
							<p class="text-xs text-muted-foreground">Absents</p>
						</div>
					</div>

					<div class="space-y-2">
						{#each pagedPresence as item (item.id)}
							{#if presenceMode === 'prof'}
								<div
									class="flex items-center justify-between gap-3 rounded-xl border border-sidebar-border bg-card/40 p-3 transition-colors hover:bg-muted/40"
								>
									<div class="flex min-w-0 items-center gap-3">
										<div
											class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10"
										>
											<BookOpen class="size-4 text-primary" />
										</div>
										<div class="min-w-0">
											<p class="truncate text-sm font-medium">{item.cours}</p>
											<p class="text-xs text-muted-foreground">{formatPresenceDate(item.date)}</p>
										</div>
									</div>
									<div class="flex shrink-0 items-center gap-2 text-xs font-medium">
										<span class="inline-flex items-center gap-1 text-emerald-500"
											><UserCheck class="size-3.5" />{item.presents ?? 0}</span
										>
										<span class="inline-flex items-center gap-1 text-amber-500"
											><Timer class="size-3.5" />{item.retards ?? 0}</span
										>
										<span class="inline-flex items-center gap-1 text-red-500"
											><UserX class="size-3.5" />{item.absents ?? 0}</span
										>
									</div>
								</div>
							{:else}
								<div
									class="flex items-center justify-between gap-3 rounded-xl border border-sidebar-border bg-card/40 p-3 transition-colors hover:bg-muted/40"
								>
									<div class="flex min-w-0 items-center gap-3">
										<div
											class="flex size-9 shrink-0 items-center justify-center rounded-lg {item.statut ===
											'PRESENT'
												? 'bg-emerald-500/10'
												: item.statut === 'RETARD'
													? 'bg-amber-500/10'
													: 'bg-red-500/10'}"
										>
											{#if item.statut === 'PRESENT'}
												<UserCheck class="size-4 text-emerald-500" />
											{:else if item.statut === 'RETARD'}
												<Timer class="size-4 text-amber-500" />
											{:else}
												<UserX class="size-4 text-red-500" />
											{/if}
										</div>
										<div class="min-w-0">
											<p class="truncate text-sm font-medium">{item.cours}</p>
											<p class="text-xs text-muted-foreground">{formatPresenceDate(item.date)}</p>
										</div>
									</div>
									<Badge
										variant="outline"
										class={item.statut === 'PRESENT'
											? 'border-emerald-500/40 text-emerald-500'
											: item.statut === 'RETARD'
												? 'border-amber-500/40 text-amber-500'
												: 'border-red-500/40 text-red-500'}
										>{item.statut === 'PRESENT'
											? 'Présent'
											: item.statut === 'RETARD'
												? 'Retard'
												: 'Absent'}</Badge
									>
								</div>
							{/if}
						{/each}
					</div>

					{#if presenceTotalPages > 1}
						<div class="flex items-center justify-center gap-1 pt-1">
							<Button
								variant="outline"
								size="sm"
								class="h-8"
								disabled={presencePage <= 1}
								onclick={() => (presencePage = Math.max(1, presencePage - 1))}>Préc.</Button
							>
							{#each presencePageItems as p}
								{#if p === 'ellipsis'}
									<span class="px-1.5 text-xs text-muted-foreground">…</span>
								{:else}
									<Button
										variant={p === presencePage ? 'default' : 'outline'}
										size="sm"
										class="h-8 min-w-8 px-2"
										onclick={() => (presencePage = p)}>{p}</Button
									>
								{/if}
							{/each}
							<Button
								variant="outline"
								size="sm"
								class="h-8"
								disabled={presencePage >= presenceTotalPages}
								onclick={() => (presencePage = Math.min(presenceTotalPages, presencePage + 1))}
								>Suiv.</Button
							>
						</div>
					{/if}
				{/if}
			</Card>
		{/if}
	</div>
</main>
