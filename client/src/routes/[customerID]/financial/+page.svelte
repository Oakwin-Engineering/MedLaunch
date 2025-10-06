<script lang="ts">
  import { store } from "../../../store.svelte";
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from "flowbite-svelte";

  const financialData = store.allDashboards.financial || {};

  // Define the aging buckets in order
  const agingBuckets = [
    "0-30 Days",
    "31-60 Days",
    "61-90 Days",
    "91-120 Days",
    "121 - 150 Days",
    "151 - 180 Days",
    "> 180 Days",
    "Total Balance",
    "Total Balance %",
  ];

  // Define the balance types
  const balanceTypes = [
    "Overall - Sum",
    "Patient Balance",
    "Payer Balance",
    "Self Pay Balance",
    "% Subtotal",
  ];

  // Helper function to format currency
  function formatCurrency(value: string | number): string {
    if (value === "" || value === null || value === undefined) return "-";
    const numValue =
      typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;
    if (isNaN(numValue)) return value.toString();
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numValue);
  }

  // Helper function to format percentage
  function formatPercentage(value: string | number): string {
    if (value === "" || value === null || value === undefined) return "-";
    if (typeof value === "string" && value.includes("%")) return value;
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return value.toString();
    return (numValue * 100).toFixed(2) + "%";
  }

  // Helper function to format cell value based on balance type
  function formatValue(
    balanceType: string,
    bucket: string,
    value: any
  ): string {
    if (value === "" || value === null || value === undefined) return "-";

    if (balanceType === "% Subtotal" || bucket === "Total Balance %") {
      return formatPercentage(value);
    }

    if (bucket === "Total Balance" && balanceType === "% Subtotal") {
      return "-";
    }

    return formatCurrency(value);
  }
</script>

<div class="mt-32 pl-32 pr-32">
  <div class="overflow-x-auto">
    <Table striped={false} noborder={false}>
      <TableHead class="bg-blue-400">
        <TableHeadCell
          class="font-bold text-white border border-gray-400 py-2 px-3"
          >Balance Type</TableHeadCell
        >
        {#each agingBuckets as bucket}
          <TableHeadCell
            class="font-bold text-white border border-gray-400 py-2 px-3"
            >{bucket}</TableHeadCell
          >
        {/each}
      </TableHead>
      <TableBody>
        {#each balanceTypes as balanceType}
          <TableBodyRow
            class={balanceType === "Overall - Sum"
              ? "bg-gray-300 font-bold"
              : balanceType === "% Subtotal"
                ? "bg-gray-300 font-bold"
                : ""}
          >
            <TableBodyCell
              class="font-semibold border border-gray-400 py-1.5 px-3"
              >{balanceType}</TableBodyCell
            >
            {#each agingBuckets as bucket}
              <TableBodyCell class="border border-gray-400 py-1.5 px-3">
                {formatValue(
                  balanceType,
                  bucket,
                  financialData[balanceType]?.[bucket]
                )}
              </TableBodyCell>
            {/each}
          </TableBodyRow>
        {/each}
      </TableBody>
    </Table>
  </div>
</div>
