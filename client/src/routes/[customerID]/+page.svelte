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

<div class="flex h-screen">
  <Sidebar tableData={data.tableData} />

  <div id="container" class="flex-1 ml-64 mt-16">
    {#if $showFlattenedHierarchy}
      <div class="p-4 space-y-6 h-full">
        {#each flattenedHierarchy as node (node.id)}
          <Table tableData={node} />
        {/each}
      </div>
    {:else}
      <div class="p-4 h-full">
        <Table tableData={$selectedNode} />
      </div>
    {/if}
  </div>
</div>
