<script lang="ts">
  import { customers } from "../constants";
  let { customerID } = $props();
</script>

<nav
  class="fixed top-0 left-0 right-0 bg-white shadow-md z-100 h-16 flex items-center px-4"
>
  <img
    src="/images/{customerID}-logo.png"
    alt=""
    class="h-12 object-contain mr-4"
  />
  <span class="text-xl font-bold text-blue-600"
    >{customers.find((customer) => customer.customerID === customerID)
      ?.customerName} Financial Dashboard</span
  >
</nav>
