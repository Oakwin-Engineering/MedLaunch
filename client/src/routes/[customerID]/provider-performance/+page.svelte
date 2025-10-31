<script lang="ts">
  import Table from "../../../components/Table.svelte";
  import TableAnnual from "../../../components/TableAnnual.svelte";
  import Sidebar from "../../../components/Sidebar.svelte";
  import YearSelector from "../../../components/YearSelector.svelte";
  import DataSourceToggle from "../../../components/DataSourceToggle.svelte";
  import { Button, ButtonGroup } from "flowbite-svelte";
  import { store } from "../../../store.svelte";
  import { flattenHierarchy, getActiveData } from "../../../utils/utils";
  import { FilterMode } from "../../../constants";

  // Set current dashboard
  store.currentDashboard = "ProviderPerformance";

  // Get active data based on selected data source
  const activeData = $derived(getActiveData(store.allDashboards, store.dataSource));
  const availableYears = $derived(Object.keys(activeData.providerPerformance || {}));

  // Get current year or first available year
  const currentYear = String(new Date().getFullYear());

  // Local state for active year
  let activeYear = $state(currentYear);

  // View mode state
  let viewMode = $state<"monthly" | "annual">("monthly");

  // Callback function to handle year changes
  function handleYearChange(year: string) {
    activeYear = year;
    const performanceData = activeData.providerPerformance[year];
    if (performanceData && performanceData.length > 0) {
      store.selectedNode = performanceData[0];
    }
  }

  // Initialize All Providers to show first when data changes
  $effect(() => {
    // If current activeYear doesn't exist in available years, use first available
    if (!availableYears.includes(activeYear) && availableYears.length > 0) {
      activeYear = availableYears[0];
    }
    
    const performanceData = activeData.providerPerformance[activeYear];
    if (performanceData && performanceData.length > 0) {
      store.selectedNode = performanceData[0];
    }
  });
</script>

<Sidebar {activeYear} />

<div id="container" class="p-4 ml-64 mt-16">
  <div class="flex justify-between items-center mb-6">
    <div class="flex gap-4 items-center">
      <YearSelector
        {availableYears}
        {activeYear}
        onYearChange={handleYearChange}
        disabled={viewMode === "annual"}
      />
      <DataSourceToggle />
    </div>

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
      {#each flattenHierarchy(activeData.providerPerformance[activeYear] || []) as node (node.id)}
        <Table tableData={node} />
      {/each}
    {:else if store.selectedNode}
      <Table tableData={store.selectedNode} />
    {/if}
  {:else if store.sidebarCategory === FilterMode.Hierarchial}
    {#each flattenHierarchy(activeData.providerPerformance[activeYear] || []) as node (node.id)}
      <TableAnnual
        tableData={node}
        allYearsData={activeData.providerPerformance}
      />
    {/each}
  {:else if store.selectedNode}
    <TableAnnual
      tableData={store.selectedNode}
      allYearsData={activeData.providerPerformance}
    />
  {/if}
</div>
