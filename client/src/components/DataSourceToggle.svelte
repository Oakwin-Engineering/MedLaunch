<script lang="ts">
  import { Button, Dropdown, DropdownItem } from "flowbite-svelte";
  import { ChevronDownOutline } from "flowbite-svelte-icons";
  import { store, type DataSource } from "../store.svelte";

  // Check if AllScripts data is available
  const hasAllScripts = $derived(
    store.allDashboards.allscripts &&
      Object.keys(store.allDashboards.allscripts.providerPerformance || {})
        .length > 0
  );

  let isOpen = $state(false);

  const dataSourceLabel = $derived(
    store.dataSource === "athelas" ? "Athelas" : "AllScripts"
  );
</script>

{#if hasAllScripts}
  <div class="flex gap-2 mb-6">
    <Button color="blue">
      {dataSourceLabel}
      <ChevronDownOutline class="w-3 h-3 ms-2" />
    </Button>
    <Dropdown bind:isOpen class="w-48">
      <DropdownItem
        onclick={() => {
          store.dataSource = "athelas";
          isOpen = false; 
        }}
        class={store.dataSource === "athelas" ? "bg-blue-100 w-full" : "w-full"}
      >
        Athelas
      </DropdownItem>
      <DropdownItem
        onclick={() => {
          store.dataSource = "allscripts";
          isOpen = false;
        }}
        class={store.dataSource === "allscripts" ? "bg-blue-100 w-full" : "w-full"}
      >
        AllScripts
      </DropdownItem>
    </Dropdown>
  </div>
{/if}

<style>
  :global(li) {
    list-style: none !important;
  }
</style>