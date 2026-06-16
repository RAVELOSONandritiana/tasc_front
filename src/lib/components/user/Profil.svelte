<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	import { Bell, Sun, Moon } from '@lucide/svelte/icons';
	import * as Drawer from '$lib/components/ui/drawer';

	let checked = $state(true);
	let notificationOpen = $state(false);

	const notifications = [
		{ id: 1, title: 'Nouveau message', description: 'Vous avez reçu un nouveau message', time: '2 min', read: false },
		{ id: 2, title: 'Rappel de réunion', description: 'Réunion dans 30 minutes', time: '30 min', read: false },
		{ id: 3, title: 'Nouveau devoir', description: 'Un devoir a été assigné', time: '1 heure', read: true },
		{ id: 4, title: 'Absence signalée', description: 'Un élève a été marqué absent', time: '2 heures', read: true },
		{ id: 5, title: 'Mise à jour système', description: 'Maintenance prévue ce soir', time: '3 heures', read: true },
	];

	$effect(() => {
		document.documentElement.classList.toggle('dark', checked);
	});
</script>

<div class="flex items-center gap-3">
	<button
		class="relative rounded-md p-2 hover:bg-accent hover:text-accent-foreground"
		onclick={() => (notificationOpen = true)}
	>
		<Bell class="size-5" />
		<span class="absolute right-1 top-1 size-2 rounded-full bg-red-500"></span>
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
		<Drawer.Content class="w-3/4 sm:max-w-sm">
			<Drawer.Header>
				<Drawer.Title>Notifications</Drawer.Title>
				<Drawer.Description></Drawer.Description>
			</Drawer.Header>
			<div class="flex flex-col gap-2 p-4 pt-0">
				{#each notifications as notification}
					<div class="flex items-start gap-3 rounded-lg border p-3 {notification.read ? 'bg-muted/50' : 'bg-background'}">
						<div class="flex-1">
							<p class="text-sm font-medium">{notification.title}</p>
							<p class="text-xs text-muted-foreground">{notification.description}</p>
							<p class="text-xs text-muted-foreground mt-1">{notification.time}</p>
						</div>
						{#if !notification.read}
							<span class="size-2 rounded-full bg-blue-500 mt-1.5"></span>
						{/if}
					</div>
				{/each}
			</div>
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>