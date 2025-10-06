<script lang="ts">
  import Table from "../../../components/Table.svelte";
  import Sidebar from "../../../components/Sidebar.svelte";
  import YearSelector from "../../../components/YearSelector.svelte";
  import { store } from "../../../store.svelte";
  import { flattenHierarchy } from "../../../utils/utils";
  import { FilterMode } from "../../../constants";

  const availableYears = Object.keys(store.allDashboards.providerPerformance);

  // Get current year
  const currentYear = new Date().getFullYear();

  // Local state for active year
  let activeYear = $state(currentYear);

  // Callback function to handle year changes
  function handleYearChange(year: number) {
    activeYear = year;
    store.selectedNode = store.allDashboards.providerPerformance[year][0];
  }

  // Initialize All Providers to show first
  store.selectedNode = store.allDashboards.providerPerformance[activeYear][0];
</script>

<Sidebar {activeYear} />

<div id="container" class="p-4 ml-64 mt-16">
  <YearSelector {availableYears} {activeYear} onYearChange={handleYearChange} />

  {#if store.sidebarCategory === FilterMode.Hierarchial}
    {#each flattenHierarchy(store.allDashboards.providerPerformance[activeYear]) as node (node.id)}
      <Table tableData={node} />
    {/each}
  {:else}
    <Table tableData={store.selectedNode} />
  {/if}
</div>
