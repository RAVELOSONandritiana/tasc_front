<script lang="ts">
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import * as Avatar from '$lib/components/ui/avatar';
</script>

<DropdownMenu.Root>
    <DropdownMenu.Trigger>
        <Avatar.Root>
            <Avatar.Image src="https://github.com/vanessa.png" alt="Vanessa"/>
            <Avatar.Fallback>VA</Avatar.Fallback>
        </Avatar.Root>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content>
        <DropdownMenu.Label>Mon Compte</DropdownMenu.Label>
        <DropdownMenu.Separator/>
        <DropdownMenu.Item>
            {#snippet child({props})}
                <a href="/profil" {...props}>Profil</a>
            {/snippet}
        </DropdownMenu.Item>
        <DropdownMenu.Item>
            {#snippet child({props})}
                <a href="/parametre" {...props}>Parametres</a>
            {/snippet}
        </DropdownMenu.Item>
        <DropdownMenu.Item>
            {#snippet child({props})}
                <a href="/" {...props}>Deconnexion</a>
            {/snippet}
        </DropdownMenu.Item>
    </DropdownMenu.Content>
</DropdownMenu.Root>