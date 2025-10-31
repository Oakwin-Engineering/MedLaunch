<script lang="ts">
  import { store } from "../store.svelte";
  import { goto } from "$app/navigation";
  import { Drawer } from "flowbite-svelte";
  import {
    GlobeSolid,
    ChartPieSolid,
    ChartMixedDollarOutline,
    ShieldSolid,
    FileLinesSolid,
    DatabaseSolid,
  } from "flowbite-svelte-icons";

  const dashboardItems = [
    {
      name: "Provider Rankings",
      route: "provider-rankings",
      icon: GlobeSolid,
      key: "ProviderRankings",
    },
    {
      name: "Provider Performance",
      route: "provider-performance",
      icon: FileLinesSolid,
      key: "ProviderPerformance",
    },
    {
      name: "Financial Dashboard",
      route: "financial",
      icon: ChartMixedDollarOutline,
      key: "FinancialDashboard",
    },
    {
      name: "Operational Dashboard",
      route: "operational",
      icon: ChartPieSolid,
      key: "OperationalDashboard",
    },
    {
      name: "Clinical Dashboard",
      route: "clinical",
      icon: ShieldSolid,
      key: "ClinicalDashboard",
    },
  ];

  const dataItems = [
    {
      name: "Data Sources",
      route: "data-sources",
      icon: DatabaseSolid,
      key: "DataSources",
    },
  ];

  const navigateToDashboard = (item: any) => {
    store.currentDashboard = item.key;
    store.isDrawerOpen = false;
    goto(`/${store.customerID}/${item.route}`);
  };
</script>

<Drawer bind:open={store.isDrawerOpen} placement="left">
  <div class="pt-6 h-full">
    <img
      src="/images/{store.customerID}-logo.png"
      alt=""
      class="h-12 object-contain ml-4 mb-4"
    />
    <nav class="space-y-1">
      <!-- Dashboards Section -->
      <div class="px-4 py-2">
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dashboards</h3>
      </div>
      {#each dashboardItems as item}
        <button
          onclick={() => navigateToDashboard(item)}
          class="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-left text-gray-900 {store.currentDashboard ===
          item.key
            ? 'bg-blue-50 text-blue-600'
            : ''}"
        >
          <svelte:component
            this={item.icon}
            class="w-5 h-5 text-gray-500"
          />
          <span class="text-base">{item.name}</span>
        </button>
      {/each}

      <!-- Divider -->
      <div class="px-4 py-3">
        <div class="border-t border-gray-200"></div>
      </div>

      <!-- Data Section -->
      <div class="px-4 py-2">
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Data & Reports</h3>
      </div>
      {#each dataItems as item}
        <button
          onclick={() => navigateToDashboard(item)}
          class="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-left text-gray-900 {store.currentDashboard ===
          item.key
            ? 'bg-blue-50 text-blue-600'
            : ''}"
        >
          <svelte:component
            this={item.icon}
            class="w-5 h-5 text-gray-500"
          />
          <span class="text-base">{item.name}</span>
        </button>
      {/each}
    </nav>
  </div>
</Drawer>
