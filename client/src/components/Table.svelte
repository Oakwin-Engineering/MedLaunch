<script lang="ts">
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from "flowbite-svelte";
  import { formatCurrency } from "../utils/utils";
  import { headers } from "../constants";

  let { tableData } = $props();

  const data = $derived(tableData.data);
  const label = $derived(tableData.label);
</script>

<div class="w-full">
  <h1 class="text-2xl ibold mb-4">{label}</h1>
  <div class="overflow-x-auto shadow-md rounded-lg">
    <Table class="text-sm">
      <TableHead class="bg-gray-50">
        <TableHeadCell class="py-2 px-3"></TableHeadCell>
        <TableHeadCell class="py-2 px-3">Code</TableHeadCell>
        {#each headers.slice(1) as header, i}
          <TableHeadCell
            class="py-2 px-3 text-center {i >= 12 ? 'bg-gray-100' : ''}"
            >{header}</TableHeadCell
          >
        {/each}
      </TableHead>
      <TableBody>
        {#if data.cptCodes && data.cptCodes.length > 0}
          {#each data.cptCodes as row, i}
            <TableBodyRow>
              {#if i === 0}
                <TableBodyCell
                  class="py-2 px-3 bg-yellow-100 ibold"
                  rowspan={data.cptCodes.length}
                >
                  <div class="-rotate-90">CPT Codes</div>
                </TableBodyCell>
              {/if}
              <TableBodyCell class="py-2 px-3 ibold">{row.code}</TableBodyCell>
              {#each row.values as value}
                <TableBodyCell class="py-2 px-3 text-center ibold"
                  >{value}</TableBodyCell
                >
              {/each}
              <TableBodyCell
                class="py-2 px-3 text-center bg-gray-200 font-medium"
                >{row.total}</TableBodyCell
              >
              <TableBodyCell class="py-2 px-3 text-center bg-purple-200 ibold"
                >{row.coding}</TableBodyCell
              >
            </TableBodyRow>
          {/each}
        {/if}
        {#if data.total && data.total.values}
          <TableBodyRow class="font-bold bg-yellow-200">
            <TableBodyCell class="py-2 px-3"></TableBodyCell>
            <TableBodyCell class="py-2 px-3">{data.total.label}</TableBodyCell>
            {#each data.total.values as value}
              <TableBodyCell class="py-2 px-3 text-center"
                >{value}</TableBodyCell
              >
            {/each}
            <TableBodyCell class="py-2 px-3 text-center bg-gray-200 "
              >{data.total.total}</TableBodyCell
            >
            <TableBodyCell class="py-2 px-3 text-center bg-purple-200"
              >{data.total.coding}</TableBodyCell
            >
          </TableBodyRow>
        {/if}
        {#if data.totalVisits && data.totalVisits.values}
          <TableBodyRow>
            <TableBodyCell class="py-2 px-3"></TableBodyCell>
            <TableBodyCell class="py-2 px-3"
              >{data.totalVisits.label}</TableBodyCell
            >
            {#each data.totalVisits.values as value}
              <TableBodyCell class="py-2 px-3 text-center ibold"
                >{value}</TableBodyCell
              >
            {/each}
            <TableBodyCell class="py-2 px-3 text-center bg-gray-200 font-medium"
              >{data.totalVisits.total}</TableBodyCell
            >
            <TableBodyCell class="py-2 px-3 text-center bg-purple-200"
              >{data.totalVisits.coding}</TableBodyCell
            >
          </TableBodyRow>
        {/if}
        {#if data.charges && data.charges.values}
          <TableBodyRow class="bg-purple-100">
            <TableBodyCell class="py-2 px-3"></TableBodyCell>
            <TableBodyCell class="py-2 px-3">{data.charges.label}</TableBodyCell
            >
            {#each data.charges.values as value}
              <TableBodyCell class="py-2 px-3 text-center"
                >{formatCurrency(value)}</TableBodyCell
              >
            {/each}
            <TableBodyCell class="py-2 px-3 text-center bg-gray-200"
              >{formatCurrency(data.charges.total)}</TableBodyCell
            >
            <TableBodyCell class="py-2 px-3 text-center bg-purple-200"
              >{data.charges.coding}</TableBodyCell
            >
          </TableBodyRow>
        {/if}
        {#if data.payments && data.payments.values}
          <TableBodyRow class="bg-blue-100">
            <TableBodyCell class="py-2 px-3"></TableBodyCell>
            <TableBodyCell class="py-2 px-3"
              >{data.payments.label}</TableBodyCell
            >
            {#each data.payments.values as value}
              <TableBodyCell class="py-2 px-3 text-center"
                >{formatCurrency(value)}</TableBodyCell
              >
            {/each}
            <TableBodyCell class="py-2 px-3 text-center bg-gray-200 font-medium"
              >{formatCurrency(data.payments.total)}</TableBodyCell
            >
            <TableBodyCell class="py-2 px-3 text-center bg-purple-200"
              >{data.payments.coding}</TableBodyCell
            >
          </TableBodyRow>
        {/if}
        {#if data.rvus && data.rvus.values}
          <TableBodyRow class="bg-green-100">
            <TableBodyCell class="py-2 px-3"></TableBodyCell>
            <TableBodyCell class="py-2 px-3">{data.rvus.label}</TableBodyCell>
            {#each data.rvus.values as value}
              <TableBodyCell class="py-2 px-3 text-center"
                >{value}</TableBodyCell
              >
            {/each}
            <TableBodyCell class="py-2 px-3 text-center bg-gray-200 font-medium"
              >{data.rvus.total}</TableBodyCell
            >
            <TableBodyCell class="py-2 px-3 text-center bg-purple-200"
              >{data.rvus.coding}</TableBodyCell
            >
          </TableBodyRow>
        {/if}
        {#if data.payroll && data.payroll.values}
          <TableBodyRow class="bg-orange-100">
            <TableBodyCell class="py-2 px-3"></TableBodyCell>
            <TableBodyCell class="py-2 px-3">{data.payroll.label}</TableBodyCell
            >
            {#each data.payroll.values as value}
              <TableBodyCell class="py-2 px-3 text-center"
                >{formatCurrency(value)}</TableBodyCell
              >
            {/each}
            <TableBodyCell class="py-2 px-3 text-center bg-gray-200 font-medium"
              >{formatCurrency(data.payroll.total)}</TableBodyCell
            >
            <TableBodyCell class="py-2 px-3 text-center bg-purple-200"
              >{data.payroll.coding}</TableBodyCell
            >
          </TableBodyRow>
        {/if}
        {#if data.operatingProfit && data.operatingProfit.values}
          <TableBodyRow>
            <TableBodyCell class="py-2 px-3"></TableBodyCell>
            <TableBodyCell class="py-2 px-3"
              >{data.operatingProfit.label}</TableBodyCell
            >
            {#each data.operatingProfit.values as value}
              <TableBodyCell
                class="py-2 px-3 text-center ibold {value > 0
                  ? 'bg-green-100'
                  : value < 0
                    ? 'bg-red-100'
                    : ''}">{formatCurrency(value)}</TableBodyCell
              >
            {/each}
            <TableBodyCell
              class="py-2 px-3 text-center bg-gray-200 ibold {data
                .operatingProfit.total > 0
                ? 'text-green-600'
                : 'text-red-600'}"
              >{formatCurrency(data.operatingProfit.total)}</TableBodyCell
            >
            <TableBodyCell class="py-2 px-3 text-center bg-purple-200"
              >{data.operatingProfit.coding}</TableBodyCell
            >
          </TableBodyRow>
        {/if}
      </TableBody>
    </Table>
  </div>
</div>
