<script lang="ts">
  import { Button } from "flowbite-svelte";
  import { FilePdfOutline } from "flowbite-svelte-icons";
  import { store } from "../store.svelte";

  const dashboardNames: Record<string, string> = {
    ProviderRankings: "Provider Rankings",
    ProviderPerformance: "Provider Performance Dashboard",
    FinancialDashboard: "Financial Dashboard",
    OperationalDashboard: "Operational Dashboard",
    ClinicalDashboard: "Clinical Dashboard",
  };

  const currentDashboardName = $derived(
    dashboardNames[store.currentDashboard] || "Dashboard"
  );
</script>

<nav
  class="fixed top-0 left-0 right-0 bg-white shadow-md z-100 h-16 flex items-center px-4"
>
  <img
    src="/images/{store.customerID}-logo.png"
    alt=""
    class="h-12 object-contain mr-4"
  />

  <span class="text-xl font-bold text-blue-600">
    {currentDashboardName}
  </span>

  <div class="ml-auto flex items-center gap-2">
    <Button
      type="button"
      color="blue"
      onclick={() => (store.isDrawerOpen = !store.isDrawerOpen)}
    >
      All Dashboards
    </Button>
    <Button type="button" color="blue" onclick={() => window.print()}>
      <FilePdfOutline class="h-6 w-6 mr-1" /> Print
    </Button>
  </div>
</nav>

<style>
  :global {
    @media print {
      @page {
        size: A3 landscape;
      }

      #container {
        margin: 0px;
      }

      nav,
      footer,
      aside {
        display: none;
      }
    }
  }
</style>
