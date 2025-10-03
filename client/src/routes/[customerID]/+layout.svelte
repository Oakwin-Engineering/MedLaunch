<script lang="ts">
  import Navbar from "../../components/Navbar.svelte";
  import Drawer from "../../components/Drawer.svelte";
  import { store } from "../../store.svelte";
  import { flattenHierarchy } from "../../utils/utils";

  let { children, data } = $props();

  // Initialize the global store with data from the server
  store.customerID = data.customerID ?? "";
  store.allDashboards = data.allDashboards;
  store.selectedNode =
    data.allDashboards.providerPerformance[store.activeYear][0];
  store.flattenedHierarchy = flattenHierarchy(
    data.allDashboards.providerPerformance[store.activeYear]
  );
</script>

<Navbar />
<Drawer />

{@render children()}
