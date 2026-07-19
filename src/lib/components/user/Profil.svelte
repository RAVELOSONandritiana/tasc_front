<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	import { Bell, Sun, Moon, X, Check } from '@lucide/svelte/icons';
	import * as Drawer from '$lib/components/ui/drawer';
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';
	import PersonAvatar from '$lib/components/user/PersonAvatar.svelte';

	type NotificationItem = {
		id: string;
		title: string;
		description: string;
		time: string;
		read: boolean;
		actionType?: string | null;
		matricule?: string | null;
		createdAt?: string;
	};

	let {
		imageUrl = null,
		nom = '',
		prenom = '',
		notifications: initialNotifications = []
	}: {
		imageUrl?: string | null;
		nom?: string;
		prenom?: string;
		notifications?: NotificationItem[];
	} = $props();

	let checked = $state(true);
	let notificationOpen = $state(false);
	let resettingId = $state<string | null>(null);

	let notifications = $state<NotificationItem[]>([...initialNotifications]);

	let selectedNotification = $state<string | null>(null);

	const THEME_KEY = 'theme-mode';

	function applyTheme(dark: boolean) {
		document.documentElement.classList.toggle('dark', dark);
	}

	function persistTheme(dark: boolean) {
		try {
			localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
		} catch (e) {
			// ignore
		}
	}

	if (browser) {
		try {
			const saved = localStorage.getItem(THEME_KEY);
			checked = saved ? saved === 'dark' : true;
		} catch (e) {
			checked = true;
		}
		applyTheme(checked);
	}

	$effect(() => {
		if (!browser) return;
		applyTheme(checked);
		persistTheme(checked);
	});

	// --- Real-time notifications via Server-Sent Events ---
	let eventSource: EventSource | null = null;

	if (browser) {
		eventSource = new EventSource('/api/notifications/stream');
		eventSource.addEventListener('notification', (event) => {
			try {
				const notif = JSON.parse((event as MessageEvent).data) as NotificationItem;
				const index = notifications.findIndex((n) => n.id === notif.id);
				if (index !== -1) {
					// Mise à jour d'une notification existante (ex: après réinitialisation).
					notifications[index] = notif;
				} else {
					notifications = [notif, ...notifications];
				}
			} catch {
				// ignore malformed payloads
			}
		});
	}

	onDestroy(() => {
		eventSource?.close();
	});

	async function deleteNotification(id: string) {
		notifications = notifications.filter((n) => n.id !== id);
		if (selectedNotification === id) selectedNotification = null;
		if (browser) {
			await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(
				() => {}
			);
		}
	}

	async function markAsRead(id: string) {
		const index = notifications.findIndex((n) => n.id === id);
		if (index !== -1 && !notifications[index].read) {
			notifications[index].read = true;
			if (browser) {
				await fetch('/api/notifications', {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id })
				}).catch(() => {});
			}
		}
	}

	async function markAllAsRead() {
		notifications = notifications.map((n) => ({ ...n, read: true }));
		if (browser) {
			await fetch('/api/notifications', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ all: true })
			}).catch(() => {});
		}
	}

	function selectNotification(id: string) {
		selectedNotification = id;
		markAsRead(id);
	}

	async function resetPassword(id: string) {
		if (!browser || resettingId) return;
		resettingId = id;
		try {
			const res = await fetch('/api/notifications', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});
			const result = await res.json().catch(() => null);
			if (result?.success && result.notification) {
				const index = notifications.findIndex((n) => n.id === id);
				if (index !== -1) {
					notifications[index] = result.notification;
				}
			}
		} catch {
			// ignore network errors
		} finally {
			resettingId = null;
		}
	}

	function closeDrawer() {
		notificationOpen = false;
		selectedNotification = null;
	}

	$effect(() => {
		if (!notificationOpen) selectedNotification = null;
	});

	let unreadCount = $derived(notifications.filter((n) => !n.read).length);
	let selectedNotif = $derived(notifications.find((n) => n.id === selectedNotification));
</script>

<div class="flex items-center gap-3">
	<button
		class="relative rounded-md p-2 hover:bg-accent hover:text-accent-foreground"
		onclick={() => (notificationOpen = true)}
	>
		<Bell class="size-5" />
		{#if unreadCount > 0}
			<span
				class="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-xs text-white"
				>{unreadCount}</span
			>
		{:else}
			<span class="absolute top-1 right-1 size-2 rounded-full bg-red-500 opacity-50"></span>
		{/if}
	</button>

	<Switch {checked} onCheckedChange={(details) => (checked = details.checked)}>
		<Switch.Label class="sr-only">Toggle theme</Switch.Label>
		<Switch.Control>
			<Switch.Thumb class="transition-transform duration-200">
				{#if checked}
					<Moon class="size-3" />
				{:else}
					<Sun class="size-3" />
				{/if}
			</Switch.Thumb>
		</Switch.Control>
		<Switch.HiddenInput />
	</Switch>

	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			<PersonAvatar {imageUrl} name={prenom} lastname={nom} sizeClass="size-9" />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="z-[100] w-56">
			<DropdownMenu.Label>Mon Compte</DropdownMenu.Label>
			<DropdownMenu.Separator />
			<DropdownMenu.Item>
				{#snippet child({ props })}
					<a href="/profil" {...props}>Profil</a>
				{/snippet}
			</DropdownMenu.Item>
			<DropdownMenu.Item>
				{#snippet child({ props })}
					<a href="/parametre" {...props}>Parametres</a>
				{/snippet}
			</DropdownMenu.Item>
			<DropdownMenu.Item>
				{#snippet child({ props })}
					<a href="/" {...props}>Deconnexion</a>
				{/snippet}
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>

<Drawer.Root bind:open={notificationOpen} direction="right">
	<Drawer.Portal>
		<Drawer.Overlay />
		<Drawer.Content class="flex h-screen w-3/4 flex-col sm:max-w-sm">
			<Drawer.Header>
				<div class="flex items-center justify-between">
					<div>
						<Drawer.Title>Notifications</Drawer.Title>
						{#if unreadCount > 0}
							<span class="text-xs text-muted-foreground"
								>{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</span
							>
						{/if}
					</div>
					<div class="flex gap-2">
						<button onclick={markAllAsRead} class="text-xs text-blue-600 hover:underline"
							>Tout marquer lu</button
						>
						<button
							onclick={closeDrawer}
							class="text-xs text-muted-foreground hover:text-foreground">Fermer</button
						>
					</div>
				</div>
			</Drawer.Header>
			<div class="flex-1 overflow-y-auto">
				<div class="flex flex-col gap-2 p-4 pt-0">
					{#if notifications.length === 0}
						<div class="py-8 text-center text-muted-foreground">
							<p>Aucune notification</p>
						</div>
					{:else}
						{#each notifications as notification (notification.id)}
							<div
								class="flex items-start gap-3 rounded-lg border p-3 {notification.read
									? 'bg-muted/50'
									: 'bg-background'}"
								role="button"
								tabindex="0"
								onclick={() => selectNotification(notification.id)}
								onkeydown={(e) =>
									e.key === 'Enter' || e.key === ' ' ? selectNotification(notification.id) : null}
							>
								<div class="flex-1">
									<p class="text-sm font-medium">{notification.title}</p>
									<p class="text-xs text-muted-foreground">{notification.description}</p>
									<p class="mt-1 text-xs text-muted-foreground">{notification.time}</p>
									{#if notification.actionType === 'PASSWORD_RESET'}
										<button
											type="button"
											class="mt-2 inline-flex items-center rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
											disabled={resettingId === notification.id}
											onclick={(e) => {
												e.stopPropagation();
												resetPassword(notification.id);
											}}
										>
											{resettingId === notification.id
												? 'Réinitialisation...'
												: 'Réinitialiser le mot de passe'}
										</button>
									{/if}
								</div>
								<div class="flex items-center gap-1">
									{#if !notification.read}
										<span class="mt-1.5 size-2 rounded-full bg-blue-500"></span>
									{/if}
									<button
										onclick={() => deleteNotification(notification.id)}
										class="text-muted-foreground hover:text-destructive"
									>
										<X class="size-4" />
									</button>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>

{#if selectedNotif}
	<div class="fixed right-4 bottom-4 w-80 max-w-sm rounded-lg border bg-card p-4 shadow-lg">
		<button
			onclick={() => (selectedNotification = null)}
			class="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
		>
			<X class="size-4" />
		</button>
		<p class="font-semibold">{selectedNotif.title}</p>
		<p class="mt-2 text-sm text-muted-foreground">{selectedNotif.description}</p>
		<p class="mt-1 text-xs text-muted-foreground">{selectedNotif.time}</p>
		<button
			onclick={() => markAsRead(selectedNotif.id)}
			class="mt-3 text-xs text-blue-600 hover:underline"
		>
			Marquer comme lu
		</button>
	</div>
{/if}
