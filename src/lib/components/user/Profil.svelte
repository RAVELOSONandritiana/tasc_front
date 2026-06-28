<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	import { Bell, Sun, Moon, X, Check } from '@lucide/svelte/icons';
	import * as Drawer from '$lib/components/ui/drawer';

	let checked = $state(true);
	let notificationOpen = $state(false);

	let notifications = $state([
		{ id: 1, title: 'Nouveau message', description: 'Vous avez reçu un nouveau message', time: '2 min', read: false },
		{ id: 2, title: 'Rappel de réunion', description: 'Réunion dans 30 minutes', time: '30 min', read: false },
		{ id: 3, title: 'Nouveau devoir', description: 'Un devoir a été assigné', time: '1 heure', read: true },
		{ id: 4, title: 'Absence signalée', description: 'Un élève a été marqué absent', time: '2 heures', read: true },
		{ id: 5, title: 'Mise à jour système', description: 'Maintenance prévue ce soir', time: '3 heures', read: true },
	]);

	let selectedNotification = $state<number | null>(null);

	$effect(() => {
		document.documentElement.classList.toggle('dark', checked);
	});

	function deleteNotification(id: number) {
		notifications = notifications.filter(n => n.id !== id);
		if (selectedNotification === id) selectedNotification = null;
	}

	function markAsRead(id: number) {
		const index = notifications.findIndex(n => n.id === id);
		if (index !== -1) {
			notifications[index].read = true;
		}
	}

	function markAllAsRead() {
		notifications = notifications.map(n => ({ ...n, read: true }));
	}

	function selectNotification(id: number) {
		selectedNotification = id;
		markAsRead(id);
	}

	function closeDrawer() {
		notificationOpen = false;
		selectedNotification = null;
	}

	let unreadCount = $derived(notifications.filter(n => !n.read).length);
	let selectedNotif = $derived(notifications.find(n => n.id === selectedNotification));
</script>

<div class="flex items-center gap-3">
	<button
		class="relative rounded-md p-2 hover:bg-accent hover:text-accent-foreground"
		onclick={() => (notificationOpen = true)}
	>
		<Bell class="size-5" />
		{#if unreadCount > 0}
			<span class="absolute right-1 top-1 flex items-center justify-center size-4 rounded-full bg-red-500 text-white text-xs">{unreadCount}</span>
		{:else}
			<span class="absolute right-1 top-1 size-2 rounded-full bg-red-500 opacity-50"></span>
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
			<Avatar.Root>
				<Avatar.Image src="https://github.com/vanessa.png" alt="Vanessa" />
				<Avatar.Fallback>VA</Avatar.Fallback>
			</Avatar.Root>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content>
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
		<Drawer.Content class="w-3/4 sm:max-w-sm flex flex-col h-screen">
			<Drawer.Header>
				<div class="flex items-center justify-between">
					<div>
						<Drawer.Title>Notifications</Drawer.Title>
						{#if unreadCount > 0}
							<span class="text-xs text-muted-foreground">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</span>
						{/if}
					</div>
					<div class="flex gap-2">
						<button onclick={markAllAsRead} class="text-xs text-blue-600 hover:underline">Tout marquer lu</button>
						<button onclick={closeDrawer} class="text-xs text-muted-foreground hover:text-foreground">Fermer</button>
					</div>
				</div>
			</Drawer.Header>
			<div class="flex-1 overflow-y-auto">
				<div class="flex flex-col gap-2 p-4 pt-0">
					{#if notifications.length === 0}
						<div class="text-center py-8 text-muted-foreground">
							<p>Aucune notification</p>
						</div>
					{:else}
						{#each notifications as notification (notification.id)}
							<div class="flex items-start gap-3 rounded-lg border p-3 {notification.read ? 'bg-muted/50' : 'bg-background'}" role="button" tabindex="0" onclick={() => selectNotification(notification.id)} onkeydown={(e) => e.key === 'Enter' || e.key === ' ' ? selectNotification(notification.id) : null}>
								<div class="flex-1">
									<p class="text-sm font-medium">{notification.title}</p>
									<p class="text-xs text-muted-foreground">{notification.description}</p>
									<p class="text-xs text-muted-foreground mt-1">{notification.time}</p>
								</div>
								<div class="flex items-center gap-1">
									{#if !notification.read}
										<span class="size-2 rounded-full bg-blue-500 mt-1.5"></span>
									{/if}
									<button onclick={() => deleteNotification(notification.id)} class="text-muted-foreground hover:text-destructive">
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
	<div class="fixed bottom-4 right-4 w-80 bg-card border rounded-lg shadow-lg p-4 max-w-sm">
		<button onclick={() => selectedNotification = null} class="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
			<X class="size-4" />
		</button>
		<p class="font-semibold">{selectedNotif.title}</p>
		<p class="text-sm text-muted-foreground mt-2">{selectedNotif.description}</p>
		<p class="text-xs text-muted-foreground mt-1">{selectedNotif.time}</p>
		<button onclick={() => markAsRead(selectedNotif.id)} class="mt-3 text-xs text-blue-600 hover:underline">
			Marquer comme lu
		</button>
	</div>
{/if}