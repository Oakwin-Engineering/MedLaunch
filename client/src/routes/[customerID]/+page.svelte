<script lang="ts">
  import Table from "../../components/Table.svelte";
  import Sidebar from "../../components/Sidebar.svelte";
  import Navbar from "../../components/Navbar.svelte";
  import { selectedNode } from "../../store";

  let { data } = $props();

  if (data.tableData && data.tableData.length > 0) {
    selectedNode.set(data.tableData[0]);
  }
</script>

<Navbar customerID={data.customerID} />

<div class="flex mt-16">
  <Sidebar tableData={data.tableData} />
  <div id="table" class="flex-1 p-4 ml-64 border-box w-full">
    {#if $selectedNode}
      <Table tableData={$selectedNode} />
    {/if}
  </div>
</div>
