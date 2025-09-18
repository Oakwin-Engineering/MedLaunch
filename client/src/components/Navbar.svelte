<script lang="ts">
  import { Button } from "flowbite-svelte";
  import { FilePdfOutline } from "flowbite-svelte-icons";
  import { Spinner } from "flowbite-svelte";
  import { customers } from "../constants";

  let { customerID } = $props();

  let loading = $state(false);

  async function handlePrint(e: Event) {
    e.preventDefault();
    loading = true;

    try {
      // Trigger the browser print dialog
      window.print();
    } catch (err) {
      console.error(err);
      alert("Failed to trigger print");
    } finally {
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

  <form class="ml-auto flex items-center" onsubmit={handlePrint}>
    <Button type="submit" color="blue" disabled={loading}>
      {#if loading}
        <Spinner size="6" class="mr-2" />
        Preparing Print...
      {:else}
        <FilePdfOutline class="h-6 w-6 mr-1" /> Print
      {/if}
    </Button>
  </form>
</nav>

<style>
  :global {
    @media print {
      @page {
        size: A3 landscape; /* or landscape */
      }

      #table {
        margin: 0px;
      }

      /* Hide nav and footer while printing */
      nav,
      footer,
      aside {
        display: none !important;
      }

      /* Adjust scaling, fonts, etc. */
      body {
        font-size: 12pt;
      }
    }
  }
</style>
