<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Calendar from '$lib/components/ui/calendar/calendar.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { getLocalTimeZone, today, type CalendarDate } from '@internationalized/date';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as NativeSelect from '$lib/components/ui/native-select';
	import { provincesVariable } from '$lib/variables/territoire';
	import { Switch } from '@skeletonlabs/skeleton-svelte';

	let checked = $state(false);

	let open = $state(false);
	let value = $state<CalendarDate | undefined>();
</script>

<main class="m-4">
	<div class="my-4 space-y-4">
		<Label class="text-xl font-bold">Creer un personnel</Label>
		<p class="text-gray-500">
			Ceci va vous permettre apres de creer de donner des roles a ces personnes
		</p>
	</div>
	<form>
		<div class="grid gap-4">
			<Accordion.Root type="single">
				<Accordion.Item value="item-1">
					<Accordion.Trigger class="text-lg font-bold">Informations personnelles</Accordion.Trigger>
					<Accordion.Content>
						<div class="grid grid-cols-1 gap-4 rounded-sm border p-4 md:grid-cols-3">
							<div class="grid gap-3">
								<Label for="name">Nom</Label>
								<Input id="name" defaultValue="RAKOTO" />
							</div>
							<div class="grid gap-3">
								<Label for="lastname">Prenom</Label>
								<Input id="lastname" defaultValue="Boay Kely" />
							</div>
							<div class="grid gap-3">
								<Label for="birth">Date de naissance</Label>
								<Popover.Root bind:open>
									<Popover.Trigger>
										{#snippet child({ props })}
											<Button {...props} variant="outline" class="w-48 justify-between font-normal">
												{value
													? value.toDate(getLocalTimeZone()).toLocaleDateString()
													: 'Selectionner la date'}
												<ChevronDownIcon />
											</Button>
										{/snippet}
									</Popover.Trigger>
									<Popover.Content class="w-auto overflow-hidden p-0" align="start">
										<Calendar
											type="single"
											bind:value
											captionLayout="dropdown"
											onValueChange={() => {
												open = false;
											}}
											maxValue={today(getLocalTimeZone())}
										/>
									</Popover.Content>
								</Popover.Root>
							</div>
						</div>
						<Accordion.Root type="single" class="mt-4 border-l border-blue-500 pl-10">
							<Accordion.Item value="item-2">
								<Accordion.Trigger>Lieu de naissance</Accordion.Trigger>
								<Accordion.Content>
									<div class="grid gap-3 rounded-sm border p-4">
										<div class="grid grid-cols-1 gap-3 md:grid-cols-3">
											<div class="grid gap-y-3">
												<Label for="lieu">Lieu</Label>
												<Input id="lieu" defaultValue="lieu" />
											</div>
											<div class="grid gap-y-3">
												<Label for="commune">Commune</Label>
												<Input id="commune" defaultValue="Alasora" />
											</div>
											<div class="grid gap-y-3">
												<Label for="region">Region</Label>
												<Input id="region" defaultValue="region" />
											</div>
											<div class="grid gap-y-3">
												<Label for="province">Province</Label>
												<NativeSelect.Root>
													{#each provincesVariable as p (p)}
														<NativeSelect.Option value={p.toLowerCase()}>{p}</NativeSelect.Option>
													{/each}
												</NativeSelect.Root>
											</div>
										</div>
									</div>
								</Accordion.Content>
							</Accordion.Item>
						</Accordion.Root>
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>

			<Accordion.Root type="single">
				<Accordion.Item value="item-3">
					<Accordion.Trigger class="text-lg font-bold">Adresse exacte</Accordion.Trigger>
					<Accordion.Content>
						<div class="grid gap-3 rounded-sm border p-4">
							<div class="grid grid-cols-1 gap-3 md:grid-cols-3">
								<div class="grid gap-y-3">
									<Label for="domicile">Domicile</Label>
									<Input id="domicile" defaultValue="Lot C234" required />
								</div>
								<div class="grid gap-y-3">
									<Label for="fokontany">Fokontany</Label>
									<Input id="fokontany" defaultValue="Ambatomalaza" required />
								</div>
								<div class="grid gap-y-3">
									<Label for="commune_res">Commune</Label>
									<Input id="commune_res" defaultValue="Alasora" required />
								</div>
								<div class="grid gap-y-3">
									<Label for="region_res">Region</Label>
									<Input id="region_res" defaultValue="Analamanga" required />
								</div>
								<div class="grid gap-y-3">
									<Label for="province_res">Province</Label>
									<NativeSelect.Root>
										{#each provincesVariable as p (p)}
											<NativeSelect.Option value={p.toLowerCase()}>{p}</NativeSelect.Option>
										{/each}
									</NativeSelect.Root>
								</div>
							</div>

							<Accordion.Root type="single" class="mt-4 border-l border-blue-500 pl-10">
								<Accordion.Item value="item-3">
									<Accordion.Trigger>Contact</Accordion.Trigger>
									<Accordion.Content>
										<div class="grid gap-3 rounded-sm border p-4">
											<div class="grid grid-cols-1 gap-3 md:grid-cols-3">
												<div class="grid gap-y-3">
													<Label for="domicile">Numero telephone</Label>
													<Input
														id="domicile"
														defaultValue="Lot C234"
														type="number"
														maxlength={10}
														minlength={10}
														required
													/>
												</div>
												<div class="grid gap-y-3">
													<Label for="domicile">Email</Label>
													<Input
														id="domicile"
														defaultValue="example@gmail.com"
														type="email"
														required
													/>
												</div>
												<div class="grid gap-y-3">
													<Label for="domicile">CIN</Label>
													<Input
														id="domicile"
														placeholder="entrer votre cin ici"
														type="number"
														required
													/>
												</div>
											</div>
										</div>
									</Accordion.Content>
								</Accordion.Item>
							</Accordion.Root>
						</div>
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>

			<Accordion.Root type="single">
				<Accordion.Item value="item-1">
					<Accordion.Trigger class="text-lg font-bold">Informations Responsable</Accordion.Trigger>
					<Accordion.Content>
						<div class="space-y-4 rounded-sm border p-4">
							<div class="grid grid-cols-1 gap-4 rounded-sm border p-4 md:grid-cols-3">
								<div class="grid gap-3">
									<Label for="name_father">Nom du pere</Label>
									<Input id="name_father" defaultValue="RAKOTO" />
								</div>
								<div class="grid gap-3">
									<Label for="lastname_father">Prenom du pere</Label>
									<Input id="lastname_father" defaultValue="Boay Kely" />
								</div>

								<div class="grid gap-3">
									<Label for="contact_father">Numero du pere</Label>
									<Input id="contact_father" type="number" placeholder="+261...." />
								</div>
							</div>

							<div class="grid grid-cols-1 gap-4 rounded-sm border p-4 md:grid-cols-3">
								<div class="grid gap-3">
									<Label for="name_mother">Nom du mere</Label>
									<Input id="name_mother" defaultValue="RAKOTO" />
								</div>
								<div class="grid gap-3">
									<Label for="lastname_mother">Prenom du mere</Label>
									<Input id="lastname_mother" defaultValue="Boay Kely" />
								</div>
								<div class="grid gap-3">
									<Label for="contact_mother">Numero du mere</Label>
									<Input id="contact_mother" type="number" placeholder="+261...." />
								</div>
							</div>

							<Switch {checked} onCheckedChange={(details) => (checked = details.checked)}>
								<Switch.Label><h3 class="text-md">Ajouter tuteur</h3></Switch.Label>
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
								<Switch.HiddenInput />
							</Switch>

							{#if checked}
								<Accordion.Root type="single" class="mt-4 border-l border-blue-500 pl-10">
									<Accordion.Item value="item-2">
										<Accordion.Trigger>Informations tuteur(trice)</Accordion.Trigger>
										<Accordion.Content>
											<div class="grid grid-cols-1 gap-4 rounded-sm border p-4 md:grid-cols-3">
												<div class="grid gap-3">
													<Label for="name_tuteur">Nom du tuteur(trice)</Label>
													<Input id="name_tuteur" defaultValue="RAKOTO" />
												</div>
												<div class="grid gap-3">
													<Label for="lastname_tuteur">Prenom du tuteur(trice)</Label>
													<Input id="lastname_tuteur" defaultValue="Boay Kely" />
												</div>
												<div class="grid gap-3">
													<Label for="contact_tuteur">Numero du tuteur(trice)</Label>
													<Input id="contact_tuteur" type="number" placeholder="+261...." />
												</div>
											</div>
										</Accordion.Content>
									</Accordion.Item>
								</Accordion.Root>
							{/if}
						</div>
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>
		</div>

		<div class="flex items-center space-x-4">
			<Button type="reset">Effacer information</Button>
			<AlertDialog.Root>
				<AlertDialog.Trigger class={buttonVariants({ variant: 'outline' })}>
					Creer personnel
				</AlertDialog.Trigger>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
						<AlertDialog.Description>
							This action cannot be undone. This will permanently create a new personnel in your
							database and school.
						</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
						<AlertDialog.Action>Continue</AlertDialog.Action>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
		</div>
	</form>
</main>
