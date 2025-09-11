<script lang="ts">
  import { Sidebar, SidebarGroup, Search, Toggle } from "flowbite-svelte";
  import SidebarNode from "./SidebarNode.svelte";
  import { filterEntity } from "../utils/utils";

  let { tableData } = $props();
  let searchTerm = $state("");
  let providersOnly = $state(false);

  let filteredData = $derived(
    filterEntity(tableData, searchTerm, providersOnly)
  );
</script>

<Sidebar backdrop={false} isOpen={true} class="h-full pt-16 overflow-y-auto">
  <Search placeholder="Search" size="md" bind:value={searchTerm} clearable />
  <Toggle color="blue" bind:checked={providersOnly} class="mt-2 ml-2"
    >Providers Only</Toggle
  >

  <SidebarGroup class="mt-2 ">
    {#each filteredData as node}
      <SidebarNode node={node} depth={0} />
    {/each}
  </SidebarGroup>
</Sidebar>
