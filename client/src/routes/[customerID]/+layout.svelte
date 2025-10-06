<script lang="ts">
  import Navbar from "../../components/Navbar.svelte";
  import Drawer from "../../components/Drawer.svelte";
  import { store } from "../../store.svelte";

  let { children, data } = $props();

  // Initialize the global store with data from the server
  store.customerID = data.customerID ?? "";
  store.allDashboards = data.allDashboards;
</script>

<Navbar />
<Drawer />

{@render children()}
