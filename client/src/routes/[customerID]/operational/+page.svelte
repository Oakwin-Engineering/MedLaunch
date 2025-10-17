<script lang="ts">
  import { store } from "../../../store.svelte";
  import Operational from "../../../components/Operational.svelte";

  // Get operational data from store
  const operationalData = store.allDashboards.operational || {};

  // Generate dynamic title based on available years
  const availableYears = Object.keys(operationalData).sort();
  const yearTitle = availableYears.length > 0 
    ? availableYears.join(" vs ") 
    : "";
</script>

<div class="mt-16 p-4 max-w-7xl mx-auto">
  <Operational
    title="Patients Seen {yearTitle}"
    data={operationalData}
    metric="totalVisits"
  />

  <Operational
    title="Charges {yearTitle}"
    data={operationalData}
    metric="charges"
  />

  <Operational
    title="RVUs {yearTitle}"
    data={operationalData}
    metric="rvus"
  />

  <Operational
    title="Sleep Study {yearTitle}"
    data={operationalData}
    metric="sleepStudy"
  />
</div>
