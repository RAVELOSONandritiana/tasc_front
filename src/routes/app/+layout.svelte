<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import Profil from '$lib/components/user/Profil.svelte';
	let { children } = $props();
	const path = [
		{ path: '/app', label: 'Dashboard' },
		{ path: '/app/classe', label: 'Classe' },
		{ path: '/app/anne-scolaire', label: 'anne-scolaire' },
		{ path: '/app/prof', label: 'Prof' },
		{ path: '/app/surveillant', label: 'Surveillant' },
		{ path: '/app/personne', label: 'Personnes' },
		{ path: '/app/parametre', label: 'Parametre' }
	];
	
	const isActive = (linkPath: string) => {
		if (linkPath === '/app') {
			return $page.url.pathname === '/app';
		}
		return $page.url.pathname.startsWith(linkPath);
	};
	
	// Déterminer le titre de la page actuelle
	const pageTitle = $derived(
		path.find(p => isActive(p.path))?.label || $page.url.pathname.split('/').slice(-2).join(' ')
	);
</script>

<Sidebar.Provider>
	<div class="flex min-h-screen w-full">
		<Sidebar.Root>
			<Sidebar.Header>Tasc</Sidebar.Header>
			<Sidebar.Content>
				<Sidebar.Group>
					<Sidebar.Menu>
						{#each path as p (p.label)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton isActive={isActive(p.path)}>
									{#snippet child({ props })}
										<a href={p.path} {...props}>{p.label}</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.Group>
			</Sidebar.Content>
			<Sidebar.Footer>
				<Button variant="outline">Deconnexion</Button>
			</Sidebar.Footer>
		</Sidebar.Root>
		<div class="flex flex-1 flex-col bg-sidebar text-sidebar-foreground">
			<header class="flex items-center justify-between gap-4 border-b border-sidebar-border bg-sidebar p-4 text-sidebar-foreground sticky top-0 z-50 h-16">
				<div class="flex items-center space-x-2">
					<Sidebar.Trigger />
					<h2 class="text-lg font-semibold">{pageTitle.toUpperCase()}</h2>
				</div>
				<div>
					<Profil />
				</div>
			</header>
			<div class="flex-1 flex flex-col">
				{@render children()}
			</div>
		</div>
	</div>
</Sidebar.Provider>
