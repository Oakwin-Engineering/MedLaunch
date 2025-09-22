<script lang="ts">
  import Table from "../../components/Table.svelte";
  import Sidebar from "../../components/Sidebar.svelte";
  import Navbar from "../../components/Navbar.svelte";
  import RevisNetwork from "../../components/RevisNetwork.svelte";
  import {
    selectedNode,
    showFlattenedHierarchy,
    showRevisNetwork,
  } from "../../store";
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

  <div id="container" class="flex-1 ml-64 mt-16 h-full overflow-hidden">
    {#if $showRevisNetwork}
      <div class="w-full h-full">
        <RevisNetwork data={data.tableData} />
      </div>
    {:else if $showFlattenedHierarchy}
      <div class="p-4 space-y-6 h-full overflow-auto">
        {#each flattenedHierarchy as node (node.id)}
          <Table tableData={node} />
        {/each}
      </div>
    {:else if $selectedNode}
      <div class="p-4 h-full overflow-auto">
        <Table tableData={$selectedNode} />
      </div>
    {/if}
  </div>
</div>
