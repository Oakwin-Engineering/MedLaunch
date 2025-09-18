<script lang="ts">
  import { Button } from "flowbite-svelte";
  import { FilePdfOutline } from "flowbite-svelte-icons";
  import { Spinner } from "flowbite-svelte";
  import { env } from "$env/dynamic/public";
  import { customers } from "../constants";

  const apiUrl = env.PUBLIC_API_URL;
  let { customerID } = $props();

  let loading = $state(false);

  // Ugly solution to trigger a download for the user, initially went with a simple form submit
  // but that way it is harder to intercept track loading to put a spinner.
  async function handlePrint(e: Event) {
    e.preventDefault();
    loading = true;

    try {
      const res = await fetch(`${apiUrl}/print-pdf/${customerID}`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to fetch PDF");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // Trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = `${customerID}-report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF");
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
        Generating PDF...
      {:else}
        <FilePdfOutline class="h-6 w-6 mr-1" /> Print
      {/if}
    </Button>
  </form>
</nav>
