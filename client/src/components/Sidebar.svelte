<script lang="ts">
  import { Search, Button, Dropdown, DropdownItem } from "flowbite-svelte";
  import { ChevronDownOutline } from "flowbite-svelte-icons";
  import SidebarNode from "./SidebarNode.svelte";
  import { filterEntity } from "../utils/utils";
  import { DropdownItems } from "../constants/index";
  import { store } from "../store.svelte";

  let { activeYear } = $props();

  let searchTerm = $state("");
  let isOpen = $state(false);

  // filtered data reacts to changes in state
  let filteredData = $derived(
    filterEntity(
      store.allDashboards.providerPerformance[activeYear],
      searchTerm,
      store.sidebarCategory
    )
  );
</script>

<aside
  class="fixed top-0 left-0 z-40 w-64 h-screen pt-20 bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700 overflow-y-auto"
>
  <div class="pl-3 pr-3">
    <form class="flex items-center">
      <div class="relative">
        <Button color="blue" class="rounded-e-none p-2">
          {store.sidebarCategory}
          <ChevronDownOutline class="h-6 w-6" />
        </Button>
        <Dropdown bind:isOpen simple class="w-40 ">
          {#each DropdownItems as { label, mode }}
            <DropdownItem
              onclick={() => {
                store.sidebarCategory = mode;
                isOpen = false;
              }}
              class={`w-full ${store.sidebarCategory === mode ? "bg-blue-100 dark:bg-blue-600" : ""}`}
            >
              {label}
            </DropdownItem>
          {/each}
        </Dropdown>
      </div>
      <Search
        size="md"
        bind:value={searchTerm}
        classes={{ input: "rounded-s-none py-2.5 focus:ring-0 pr-0" }}
        placeholder="Search"
      />
    </form>
  </div>

  <div class="mt-2">
    {#if filteredData}
      {#each filteredData as node}
        <SidebarNode {node} depth={0} />
      {/each}
    {/if}
  </div>
</aside>
