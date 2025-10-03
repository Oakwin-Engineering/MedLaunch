<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { store } from "../../store.svelte";

  onMount(() => {
    // Redirect to the ppm dashboard by default
    goto(`/${store.customerID}/provider-performance`);
  });
</script>

<div class="flex items-center justify-center h-screen">
  <p class="text-gray-600">Redirecting to dashboard...</p>
</div>
