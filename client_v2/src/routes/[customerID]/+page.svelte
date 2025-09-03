<script lang="ts">
  import Table from "../../components/Table.svelte";
  import Sidebar from "../../components/Sidebar.svelte";
  import Navbar from "../../components/Navbar.svelte";

  let { data } = $props();
</script>

<Navbar customerID={data.customerID} />

<div class="flex mt-16">
  <Sidebar tableData={data.tableData} />
  <div class="flex-1 p-4 ml-64 border-box w-full">
    <Table tableData={data.tableData} />
  </div>
</div>
