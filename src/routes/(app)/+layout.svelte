<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import Profil from '$lib/components/user/Profil.svelte';
	import LoadingBar from '$lib/components/ui/loading-bar/loading-bar.svelte';
	import {
		LayoutDashboard,
		UserSquare2,
		UserCog,
		Users,
		GraduationCap,
		ClipboardList,
		AlertTriangle,
		Building2,
		UserRoundSearch,
		Settings,
		LogOut
	} from '@lucide/svelte/icons';

	let { children, data } = $props();

	const allPaths = [
		{ path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['ADMINISTRATEUR', 'ENSEIGNANT', 'SURVEILLANT', 'PERSONNEL'] },
		{ path: '/surveillant', label: 'Surveillants', icon: UserSquare2, roles: ['ADMINISTRATEUR'] },
		{ path: '/enseignant', label: 'Enseignants', icon: UserCog, roles: ['ADMINISTRATEUR'] },
		{ path: '/personne', label: 'Personnels', icon: Users, roles: ['ADMINISTRATEUR'] },
		{ path: '/eleves', label: 'Élèves', icon: GraduationCap, roles: ['ADMINISTRATEUR', 'ENSEIGNANT', 'SURVEILLANT', 'PERSONNEL'] },
		{ path: '/classe', label: 'Classes', icon: ClipboardList, roles: ['ADMINISTRATEUR', 'ENSEIGNANT', 'SURVEILLANT', 'PERSONNEL'] },
		{ path: '/incidents', label: 'Incidents', icon: AlertTriangle, roles: ['ADMINISTRATEUR', 'ENSEIGNANT', 'SURVEILLANT', 'PERSONNEL'] },
		{ path: '/parametre', label: 'Paramètres', icon: Settings, roles: ['ADMINISTRATEUR'] },
		{ path: '/salle', label: 'Salles', icon: Building2, roles: ['ADMINISTRATEUR', 'ENSEIGNANT', 'SURVEILLANT', 'PERSONNEL'] },
		{ path: '/profil', label: 'Mon profil', icon: UserRoundSearch, roles: ['ADMINISTRATEUR', 'ENSEIGNANT', 'SURVEILLANT', 'PERSONNEL'] }
	];

	const userRole = data.user?.role;
	const path = allPaths.filter(p => userRole ? p.roles.includes(userRole) : false);

	const isActive = (linkPath: string) => $page.url.pathname.startsWith(linkPath);
</script>

<Sidebar.Provider>
	<LoadingBar />
	<div class="flex min-h-screen w-full">
		<Sidebar.Root collapsible="offcanvas">
			<Sidebar.Header class="p-5">
				<div class="flex items-center gap-2.5">
					<div class="flex size-8 items-center justify-center rounded-lg bg-primary">
						<span class="text-sm font-bold text-primary-foreground">T</span>
					</div>
					<div>
						<span class="text-lg font-bold tracking-tight">Tasc</span>
						<p class="text-xs text-sidebar-foreground/60">Gestion scolaire</p>
					</div>
				</div>
			</Sidebar.Header>
			<Sidebar.Content>
				<Sidebar.Group>
					<Sidebar.GroupLabel
						class="text-xs font-medium tracking-wider text-muted-foreground uppercase"
						>Navigation</Sidebar.GroupLabel
					>
					<Sidebar.Menu>
						{#each path as p (p.path)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton isActive={isActive(p.path)} class="gap-3">
									{#snippet child({ props })}
										<a href={p.path} {...props}>
											<span class="inline-flex items-center gap-3">
												<p.icon
													class="size-4 transition-all duration-200 {isActive(p.path)
														? 'text-primary'
														: ''}"
												/>
												<span
													class="transition-all duration-200 {isActive(p.path)
														? 'font-semibold text-primary'
														: ''}">{p.label}</span
												>
											</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.Group>
			</Sidebar.Content>
		<Sidebar.Footer class="border-t border-sidebar-border p-4">
			<form method="POST" action="/signout?/logout">
				<Button
					type="submit"
					variant="outline"
					class="w-full gap-2 text-muted-foreground transition-colors hover:text-destructive"
				>
					<LogOut class="size-4" />
					Déconnexion
				</Button>
			</form>
		</Sidebar.Footer>
		</Sidebar.Root>

		<div class="flex flex-1 flex-col bg-background text-foreground">
			<header
				class="relative sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-sidebar-border bg-card/80 px-4 text-sidebar-foreground backdrop-blur-sm"
			>
				<div class="flex items-center space-x-2">
					<Sidebar.Trigger />
				</div>
				<div class="flex items-center justify-center">
					<Profil />
				</div>
			</header>
			<div class="flex flex-1 flex-col">
				{@render children()}
			</div>
		</div>
	</div>
</Sidebar.Provider>
