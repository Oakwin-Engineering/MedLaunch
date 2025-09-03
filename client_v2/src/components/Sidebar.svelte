<script lang="ts">
  import { Sidebar, SidebarGroup, Search } from "flowbite-svelte";

  import SidebarNode from "./SidebarNode.svelte";

  let { tableData } = $props();
  let searchTerm = $state("");

  function filterData(nodes: any[], term: string): any[] {
    if (!term) return nodes;

    const lowerCaseTerm = term.toLowerCase();

    return nodes
      .map((node) => {
        const children = node.children ? filterData(node.children, term) : [];
        if (
          node.label.toLowerCase().includes(lowerCaseTerm) ||
          children.length > 0
        ) {
          return { ...node, children };
        }
        return null;
      })
      .filter((node) => node !== null);
  }

  let filteredData = $derived(filterData(tableData, searchTerm));
</script>

<Sidebar backdrop={false} isOpen={true} class="h-full pt-16 overflow-y-auto">
  <Search placeholder="Search" size="md" bind:value={searchTerm} clearable />
  <SidebarGroup>
    {#each filteredData as node}
      <SidebarNode {node} />
    {/each}
  </SidebarGroup>
</Sidebar>
