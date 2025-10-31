<script lang="ts">
  import { Button } from "flowbite-svelte";
  import { FilePdfOutline, BarsOutline } from "flowbite-svelte-icons";
  import { store } from "../store.svelte";

  const pageNames: Record<string, string> = {
    ProviderRankings: "Provider Rankings",
    ProviderPerformance: "Provider Performance Dashboard",
    FinancialDashboard: "Financial Dashboard",
    OperationalDashboard: "Operational Dashboard",
    ClinicalDashboard: "Clinical Dashboard",
    DataSources: "Data Sources",
  };

  const currentPageName = $derived(
    pageNames[store.currentDashboard] || "Dashboard"
  );
</script>

<nav
  class="fixed top-0 left-0 right-0 bg-white shadow-md z-100 h-16 flex items-center px-4"
>
  <button
    type="button"
    class="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
    onclick={() => (store.isDrawerOpen = !store.isDrawerOpen)}
  >
    <BarsOutline class="h-6 w-6" />
  </button>

  <span class="text-xl font-bold text-blue-600">
    {currentPageName}
  </span>

  <div class="ml-auto flex items-center gap-2">
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
