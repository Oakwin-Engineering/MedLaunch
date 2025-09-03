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

  const headers = [
    "Code/Description",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Totals",
    "Coding %",
  ];

  const data = {
    cptCodes: [
      {
        code: 99305,
        values: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
        total: 1,
        coding: "0%",
      },
      {
        code: 99306,
        values: [0, 0, 0, 186, 194, 187, 186, 48, 0, 0, 0, 0],
        total: 801,
        coding: "51%",
      },
      {
        code: 99309,
        values: [0, 0, 0, 127, 183, 209, 166, 57, 0, 0, 0, 0],
        total: 742,
        coding: "48%",
      },
      {
        code: 20610,
        values: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
        total: 1,
        coding: "0%",
      },
    ],
    total: {
      label: "Total",
      values: [0, 0, 0, 313, 378, 397, 352, 105, 0, 0, 0, 0],
      total: 1545,
      coding: "-",
    },
    totalVisits: {
      label: "Total Visits",
      values: [0, 0, 0, 313, 377, 397, 352, 105, 0, 0, 0, 0],
      total: 1544,
      coding: "-",
    },
    charges: {
      label: "Charges",
      values: [0, 0, 0, 95940, 112205, 115240, 92090, 26385, 0, 0, 0, 0],
      total: 441860,
      coding: "-",
    },
    payments: {
      label: "Payments",
      values: [0, 0, 0, 23433, 39494, 33840, 42572, 14558, 0, 0, 0, 0],
      total: 153897,
      coding: "-",
    },
    payroll: {
      label: "Payroll",
      values: [
        22187, 26431, 27649, 30089, 28377, 35976, 34492, 34461, 0, 0, 0, 0,
      ],
      total: 239663,
      coding: "-",
    },
    operatingProfit: {
      label: "OPM",
      values: [0, 0, 0, -6656, 11116, -2136, 8080, -19903, 0, 0, 0, 0],
      total: -9499,
      coding: "-",
    },
  };
</script>

<div class="w-full">
  <h1 class="text-2xl ibold mb-4">Neil Schwartzman</h1>
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
            <TableBodyCell class="py-2 px-3 text-center bg-gray-200 font-medium"
              >{row.total}</TableBodyCell
            >
            <TableBodyCell class="py-2 px-3 text-center bg-purple-200 ibold"
              >{row.coding}</TableBodyCell
            >
          </TableBodyRow>
        {/each}
        <TableBodyRow class="font-bold bg-yellow-200">
          <TableBodyCell class="py-2 px-3"></TableBodyCell>
          <TableBodyCell class="py-2 px-3">{data.total.label}</TableBodyCell>
          {#each data.total.values as value}
            <TableBodyCell class="py-2 px-3 text-center">{value}</TableBodyCell>
          {/each}
          <TableBodyCell class="py-2 px-3 text-center bg-gray-200 "
            >{data.total.total}</TableBodyCell
          >
          <TableBodyCell class="py-2 px-3 text-center bg-purple-200"
            >{data.total.coding}</TableBodyCell
          >
        </TableBodyRow>
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
        <TableBodyRow class="bg-purple-100">
          <TableBodyCell class="py-2 px-3"></TableBodyCell>
          <TableBodyCell class="py-2 px-3">{data.charges.label}</TableBodyCell>
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
        <TableBodyRow class="bg-blue-100">
          <TableBodyCell class="py-2 px-3"></TableBodyCell>
          <TableBodyCell class="py-2 px-3">{data.payments.label}</TableBodyCell>
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
        <TableBodyRow class="bg-orange-100">
          <TableBodyCell class="py-2 px-3"></TableBodyCell>
          <TableBodyCell class="py-2 px-3">{data.payroll.label}</TableBodyCell>
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
            class="py-2 px-3 text-center bg-gray-200 ibold {data.operatingProfit
              .total > 0
              ? 'text-green-600'
              : 'text-red-600'}"
            >{formatCurrency(data.operatingProfit.total)}</TableBodyCell
          >
          <TableBodyCell class="py-2 px-3 text-center bg-purple-200"
            >{data.operatingProfit.coding}</TableBodyCell
          >
        </TableBodyRow>
      </TableBody>
    </Table>
  </div>
</div>
