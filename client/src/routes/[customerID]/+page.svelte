<script lang="ts">
  import Table from "../../components/Table.svelte";
  import Sidebar from "../../components/Sidebar.svelte";
  import Navbar from "../../components/Navbar.svelte";
  import { selectedNode, showFlattenedHierarchy } from "../../store";
  import { flattenHierarchy } from "../../utils/utils";

  let { data } = $props();

  let flattenedHierarchy = $state(<any>[]);

  if (data.tableData && data.tableData.length > 0) {
    selectedNode.set(data.tableData[0]);
    flattenedHierarchy = flattenHierarchy(data.tableData);
  }
</script>

<Navbar customerID={data.customerID} />
<Sidebar tableData={data.tableData} />

<div id="container" class="flex-1 p-4 ml-64 mt-16">
  {#if $showFlattenedHierarchy}
    {#each flattenedHierarchy as node (node.id)}
      <Table tableData={node} />
    {/each}
  {:else}
    <Table tableData={$selectedNode} />
  {/if}
</div>
