<script lang="ts">
  import { store } from "../../../store.svelte";
  import Operational from "../../../components/Operational.svelte";
  import DataSourceToggle from "../../../components/DataSourceToggle.svelte";
  import { getActiveData } from "../../../utils/utils";

  // Set current dashboard
  store.currentDashboard = "OperationalDashboard";

  // Get active data based on selected data source
  const activeData = $derived(getActiveData(store.allDashboards, store.dataSource));
  const operationalData = $derived(activeData.operational || {});

  // Generate dynamic title based on available years
  const availableYears = $derived(Object.keys(operationalData).sort());
  const yearTitle = $derived(
    availableYears.length > 0 ? availableYears.join(" vs ") : ""
  );
</script>

<div class="mt-16 p-4 max-w-7xl mx-auto">
  <div class="mb-6">
    <DataSourceToggle />
  </div>

  <Operational
    title="Patients Seen {yearTitle}"
    data={operationalData}
    metric="patientsSeen"
  />

  <Operational
    title="New Patient Count {yearTitle}"
    data={operationalData}
    metric="newPatients"
  />

  <Operational
    title="Charges {yearTitle}"
    data={operationalData}
    metric="charges"
  />

  <Operational title="RVUs {yearTitle}" data={operationalData} metric="rvus" />

  <Operational
    title="Total Receipts {yearTitle}"
    data={operationalData}
    metric="totalReceipts"
  />

  <Operational
    title="Payer Payment {yearTitle}"
    data={operationalData}
    metric="payerPayment"
  />

  <Operational
    title="Patient Payment {yearTitle}"
    data={operationalData}
    metric="patientPayment"
  />

  <Operational
    title="Sleep Study {yearTitle}"
    data={operationalData}
    metric="sleepStudy"
  />
</div>
