<script lang="ts">
  import Table from "../../../components/Table.svelte";
  import Sidebar from "../../../components/Sidebar.svelte";
  import { store } from "../../../store.svelte";
  import { flattenHierarchy } from "../../../utils/utils";
  import { FilterMode } from "../../../constants";

  let { data } = $props();

  // Initialize the global store with data from the server
  store.customerID = data.customerID ?? "";
  store.tableData = data.tableData;
  store.selectedNode = data.tableData[0];
  store.flattenedHierarchy = flattenHierarchy(data.tableData);
</script>

<Sidebar />

<div id="container" class="p-4 ml-64 mt-16">
  {#if store.sidebarCategory === FilterMode.Hierarchial}
    {#each store.flattenedHierarchy as node (node.id)}
      <Table tableData={node} />
    {/each}
  {:else}
    <Table tableData={store.selectedNode} />
  {/if}
</div>
