<script lang="ts">
  import Navbar from "../../components/Navbar.svelte";
  import Drawer from "../../components/Drawer.svelte";
  import { store } from "../../store.svelte";
  import { flattenHierarchy } from "../../utils/utils";

  let { children, data } = $props();

  // Initialize the global store with data from the server
  store.customerID = data.customerID ?? "";
  store.tableData = data.tableData;
  store.selectedNode = data.tableData[0];
  store.flattenedHierarchy = flattenHierarchy(data.tableData);
</script>

<Navbar />
<Drawer />

{@render children()}
