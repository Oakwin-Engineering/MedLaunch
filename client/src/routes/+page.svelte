<script lang="ts">
  import { customers } from "../constants";
</script>

<svelte:head>
  <title>MedLaunch Admin</title>
</svelte:head>

<div class="flex items-center justify-center h-screen">
  <div class="bg-white rounded-xl shadow-lg p-12 text-center">
    <header class="mb-10">
      <h1 class="text-4xl font-bold text-blue-900 mb-2">MedLaunch</h1>
      <p class="text-lg text-gray-500">Admin Dashboard</p>
    </header>

    <main class="flex flex-col gap-4 mt-10">
      {#each customers as customer}
        <a
          href={`/${customer.customerID}`}
          class="block px-6 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-md min-w-[250px]"
        >
          {customer.customerName} Dashboard
        </a>
      {/each}
    </main>
  </div>
</div>
