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
  } from "flowbite-svelte-icons";

  const dashboards = [
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

  const navigateToDashboard = (dashboard: any) => {
    store.currentDashboard = dashboard.key;
    store.isDrawerOpen = false;
    goto(`/${store.customerID}/${dashboard.route}`);
  };
</script>

<Drawer bind:open={store.isDrawerOpen} placement="left">
  <div class="pt-6 h-full">
    <nav class="space-y-1">
      {#each dashboards as dashboard}
        <button
          onclick={() => navigateToDashboard(dashboard)}
          class="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-left text-gray-900 {store.currentDashboard ===
          dashboard.key
            ? 'bg-blue-50 text-blue-600'
            : ''}"
        >
          <svelte:component
            this={dashboard.icon}
            class="w-5 h-5 text-gray-500"
          />
          <span class="text-base">{dashboard.name}</span>
        </button>
      {/each}
    </nav>
  </div>
</Drawer>
