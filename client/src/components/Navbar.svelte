<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import { Button, Spinner } from "flowbite-svelte";
  import { FilePdfOutline } from "flowbite-svelte-icons";
  import { customers } from "../constants";
  import { showFlattenedHierarchy } from "../store";

  let { customerID } = $props();

  let loading = $state(false);

  // window.print blocks the UI because its a sync browser API
  // which prevents from loading spinner to render on time.
  async function handlePrint(e: Event) {
    e.preventDefault();
    loading = true;

    try {
      // Force hierarchy mode
      showFlattenedHierarchy.set(true);

      // Wait for DOM to update
      await tick();

      // Allow DOM to paint before blocking
      window.print();
    } catch (err) {
      console.error(err);
      alert("Failed to trigger print");
    } finally {
      // Reset after print finishes
      showFlattenedHierarchy.set(false);
      loading = false;
    }
  }
</script>

<nav
  class="fixed top-0 left-0 right-0 bg-white shadow-md z-100 h-16 flex items-center px-4"
>
  <img
    src="/images/{customerID}-logo.png"
    alt=""
    class="h-12 object-contain mr-4"
  />

  <span class="text-xl font-bold text-blue-600">
    {customers.find((customer) => customer.customerID === customerID)
      ?.customerName} Financial Dashboard
  </span>

  <div class="ml-auto flex items-center">
    <Button type="button" color="blue" disabled={loading} onclick={handlePrint}>
      {#if loading}
        <Spinner size="4" class="mr-2" />
        Printing...
      {:else}
        <FilePdfOutline class="h-6 w-6 mr-1" /> Print
      {/if}
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
