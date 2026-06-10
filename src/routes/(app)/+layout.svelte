<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import Profil from '$lib/components/user/Profil.svelte';
	import {
		LayoutDashboard,
		UserSquare2,
		UserCog,
		Users,
		GraduationCap,
		ClipboardList,
		AlertTriangle,
		CalendarRange,
		Building2,
		UserRoundSearch,
		Settings,
		LogOut
	} from '@lucide/svelte/icons';
	import { goto } from '$app/navigation';

	let { children } = $props();

	const path = [
		{ path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
		{ path: '/surveillant', label: 'Surveillants', icon: UserSquare2 },
		{ path: '/enseignant', label: 'Enseignants', icon: UserCog },
		{ path: '/personne', label: 'Personnels', icon: Users },
		{ path: '/eleves', label: 'Élèves', icon: GraduationCap },
		{ path: '/classe', label: 'Classes', icon: ClipboardList },
		{ path: '/incidents', label: 'Incidents', icon: AlertTriangle },
		{ path: '/parametre', label: 'Paramètres', icon: Settings },
		{ path: '/salle', label: 'Salles', icon: Building2 },
		{ path: '/profil', label: 'Mon profil', icon: UserRoundSearch },
	];

	const isActive = (linkPath: string) => $page.url.pathname.startsWith(linkPath);
</script>

<Sidebar.Provider>
	<div class="flex min-h-screen w-full">
		<Sidebar.Root>
			<Sidebar.Header class="p-6 text-lg font-bold">Tasc</Sidebar.Header>
			<Sidebar.Content>
				<Sidebar.Group>
					<Sidebar.Menu>
						{#each path as p (p.path)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton isActive={isActive(p.path)} class="gap-3">
									{#snippet child({ props })}
										<a href={p.path} {...props}>
											<span class="inline-flex items-center gap-3">
												<p.icon class="size-4" />
												<span>{p.label}</span>
											</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.Group>
			</Sidebar.Content>
			<Sidebar.Footer>
				<Button variant="outline" class="w-full gap-2" onclick={() => goto('/')}>
					<LogOut class="size-4" />
					Déconnexion
				</Button>
			</Sidebar.Footer>
		</Sidebar.Root>

		<div class="flex flex-1 flex-col bg-sidebar text-sidebar-foreground">
			<header class="flex items-center justify-between gap-4 border-sidebar-border bg-sidebar p-4 h-16 text-sidebar-foreground sticky top-0 z-50">
				<div class="flex items-center space-x-2">
					<Sidebar.Trigger />
				</div>
				<div class="flex items-center justify-center">
					<Profil />
				</div>
			</header>
			<div class="flex-1 flex flex-col">
				{@render children()}
			</div>
		</div>
	</div>
</Sidebar.Provider>
