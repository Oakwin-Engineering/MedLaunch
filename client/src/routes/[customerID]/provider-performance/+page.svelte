<script lang="ts">
  import Table from "../../../components/Table.svelte";
  import TableAnnual from "../../../components/TableAnnual.svelte";
  import Sidebar from "../../../components/Sidebar.svelte";
  import YearSelector from "../../../components/YearSelector.svelte";
  import { Button, ButtonGroup } from "flowbite-svelte";
  import { store } from "../../../store.svelte";
  import { flattenHierarchy } from "../../../utils/utils";
  import { FilterMode } from "../../../constants";

  // Set current dashboard
  store.currentDashboard = "ProviderPerformance";

  const availableYears = Object.keys(store.allDashboards.providerPerformance);

  // Get current year
  const currentYear = String(new Date().getFullYear());

  // Local state for active year
  let activeYear = $state(currentYear);

  // View mode state
  let viewMode = $state<"monthly" | "annual">("monthly");

  // Callback function to handle year changes
  function handleYearChange(year: string) {
    activeYear = year;
    store.selectedNode = store.allDashboards.providerPerformance[year][0];
  }

  // Initialize All Providers to show first
  store.selectedNode = store.allDashboards.providerPerformance[activeYear][0];
</script>

<Sidebar {activeYear} />

<div id="container" class="p-4 ml-64 mt-16">
  <div class="flex justify-between items-center mb-6">
    <YearSelector
      {availableYears}
      {activeYear}
      onYearChange={handleYearChange}
      disabled={viewMode === "annual"}
    />

    <ButtonGroup>
      <Button
        color={viewMode === "monthly" ? "blue" : "light"}
        onclick={() => (viewMode = "monthly")}
      >
        View Monthly
      </Button>
      <Button
        color={viewMode === "annual" ? "blue" : "light"}
        onclick={() => (viewMode = "annual")}
      >
        View Annually
      </Button>
    </ButtonGroup>
  </div>

  {#if viewMode === "monthly"}
    {#if store.sidebarCategory === FilterMode.Hierarchial}
      {#each flattenHierarchy(store.allDashboards.providerPerformance[activeYear]) as node (node.id)}
        <Table tableData={node} />
      {/each}
    {:else}
      <Table tableData={store.selectedNode} />
    {/if}
  {:else if store.sidebarCategory === FilterMode.Hierarchial}
    {#each flattenHierarchy(store.allDashboards.providerPerformance[activeYear]) as node (node.id)}
      <TableAnnual
        tableData={node}
        allYearsData={store.allDashboards.providerPerformance}
      />
    {/each}
  {:else}
    <TableAnnual
      tableData={store.selectedNode}
      allYearsData={store.allDashboards.providerPerformance}
    />
  {/if}
</div>
