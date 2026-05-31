<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import Profil from '$lib/components/user/Profil.svelte';
	let { children } = $props();
	import Icon from '@iconify/svelte';
	const path = [
		{ path: '/dashboard', label: 'Dashboard' },
		{ path: '/surveillant', label: 'Surveillant' },
		{ path: '/prof', label: 'Professeurs' },
		{ path: '/personne', label: 'Personnels' },
		{ path: '/eleves', label: 'Eleves' },
		{ path: '/classe', label: 'Classe' },
		{ path: '/edt', label: 'Emploi Du Temps' },
		{ path: '/cours', label: 'Cours' },
		{ path: '/examen', label: 'Examen' },
		{ path: '/incidents', label: 'Incidents' },
		{ path: '/parametre', label: 'Paramere' },
		{ path: '/profil', label: 'Profil' },
		{ path: '/salle', label: 'Salle' },
	];
	
	const isActive = (linkPath: string) => {
		if (linkPath === '/') {
			return $page.url.pathname === '/';
		}
		return $page.url.pathname == linkPath;
	};
</script>

<Sidebar.Provider>
	<div class="flex min-h-screen w-full">
		<Sidebar.Root>
			<Sidebar.Header class="p-6">Tasc</Sidebar.Header>
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
				<Button variant="outline" onclick={() => {goto('/')}}>Deconnexion</Button>
			</Sidebar.Footer>
		</Sidebar.Root>
		<div class="flex flex-1 flex-col bg-sidebar text-sidebar-foreground">
			<header class="flex items-center justify-between gap-4 border-b border-sidebar-border bg-sidebar p-4 text-sidebar-foreground sticky top-0 z-50 h-16">
				<div class="flex items-center space-x-2">
					<Sidebar.Trigger />
				</div>
				<div class="flex items-center justify-center">
					<Icon icon="tabler:rocket"/>
					<Profil />
				</div>
			</header>
			<div class="flex-1 flex flex-col">
				{@render children()}
			</div>
		</div>
	</div>
</Sidebar.Provider>
