<script lang="ts">
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from "flowbite-svelte";
  import { formatCurrency, formatNumber } from "../utils/utils";
  import { AnnualHeaders } from "../constants";

  let { tableData, allYearsData } = $props();

  const label = $derived(tableData.label);

  // Get matching nodes from all years
  const annualData = $derived.by(() => {
    if (!allYearsData) return [];

    const years = Object.keys(allYearsData).sort();
    const nodeId = tableData.id;

    return years
      .map((year) => {
        const yearNodes = allYearsData[year];
        // Find the matching node by ID in this year's data
        const findNode = (nodes: any[]): any => {
          for (const node of nodes) {
            if (node.id === nodeId) return node;
            if (node.children) {
              const found = findNode(node.children);
              if (found) return found;
            }
          }
          return null;
        };

        const node = findNode(yearNodes);
        return { year, data: node?.data };
      })
      .filter((item) => item.data);
  });

  const yearCount = $derived(annualData.length);

  // Extract years and data for cleaner template
  const years = $derived(annualData.map((item) => item.year));
  const dataByYear = $derived(annualData.map((item) => item.data));
</script>

<div class="w-full">
  <h1 class="text-2xl ibold mb-4">{label}</h1>
  <div class="overflow-x-auto shadow-md rounded-lg">
    <Table>
      <TableHead class="bg-gray-50">
        {#each AnnualHeaders as header, i}
          <TableHeadCell
            class="py-2 px-2 text-center text-sm {i >= 13 ? 'bg-gray-100' : ''}"
            >{header}</TableHeadCell
          >
        {/each}
      </TableHead>
      <TableBody>
        <!-- Total Visits -->
        {#each dataByYear as d, index}
          {#if d?.totalVisits?.values}
            <TableBodyRow>
              {#if index === 0}
                <TableBodyCell
                  class="py-2 px-2 font-bold bg-gray-100 text-sm"
                  rowspan={yearCount}
                >
                  Total Visits
                </TableBodyCell>
              {/if}
              <TableBodyCell
                class="py-2 px-2 font-bold text-center bg-gray-200 text-sm"
                >{years[index]}</TableBodyCell
              >
              {#each d.totalVisits.values as value}
                <TableBodyCell class="py-2 px-2 text-center text-sm">
                  {formatNumber(value)}
                </TableBodyCell>
              {/each}
              <TableBodyCell
                class="py-2 px-2 text-center bg-gray-200 font-medium text-sm"
              >
                {formatNumber(d.totalVisits.total)}
              </TableBodyCell>
            </TableBodyRow>
          {/if}
        {/each}

        <!-- RVUs -->
        {#each dataByYear as d, index}
          {#if d?.rvus?.values?.length}
            <TableBodyRow class="bg-green-100">
              {#if index === 0}
                <TableBodyCell
                  class="py-2 px-2 font-bold bg-green-100 text-sm"
                  rowspan={yearCount}
                >
                  RVUs
                </TableBodyCell>
              {/if}
              <TableBodyCell
                class="py-2 px-2 font-bold text-center bg-gray-200 text-sm"
                >{years[index]}</TableBodyCell
              >
              {#each d.rvus.values as value}
                <TableBodyCell class="py-2 px-2 text-center text-sm">
                  {formatNumber(value)}
                </TableBodyCell>
              {/each}
              <TableBodyCell
                class="py-2 px-2 text-center bg-gray-200 font-medium text-sm"
              >
                {formatNumber(d.rvus.total)}
              </TableBodyCell>
            </TableBodyRow>
          {/if}
        {/each}

        <!-- Charges -->
        {#each dataByYear as d, index}
          {#if d?.charges?.values?.length}
            <TableBodyRow class="bg-purple-100">
              {#if index === 0}
                <TableBodyCell
                  class="py-2 px-2 font-bold bg-purple-100 text-sm"
                  rowspan={yearCount}
                >
                  Charges
                </TableBodyCell>
              {/if}
              <TableBodyCell
                class="py-2 px-2 font-bold text-center bg-gray-200 text-sm"
                >{years[index]}</TableBodyCell
              >
              {#each d.charges.values as value}
                <TableBodyCell class="py-2 px-2 text-center text-sm">
                  {formatCurrency(value)}
                </TableBodyCell>
              {/each}
              <TableBodyCell
                class="py-2 px-2 text-center bg-gray-200 font-medium text-sm"
              >
                {formatCurrency(d.charges.total)}
              </TableBodyCell>
            </TableBodyRow>
          {/if}
        {/each}

        <!-- Payments -->
        {#each dataByYear as d, index}
          {#if d?.payments?.values?.length}
            <TableBodyRow class="bg-blue-100">
              {#if index === 0}
                <TableBodyCell
                  class="py-2 px-2 font-bold bg-blue-100 text-sm"
                  rowspan={yearCount}
                >
                  Payments
                </TableBodyCell>
              {/if}
              <TableBodyCell
                class="py-2 px-2 font-bold text-center bg-gray-200 text-sm"
                >{years[index]}</TableBodyCell
              >
              {#each d.payments.values as value}
                <TableBodyCell class="py-2 px-2 text-center text-sm">
                  {formatCurrency(value)}
                </TableBodyCell>
              {/each}
              <TableBodyCell
                class="py-2 px-2 text-center bg-gray-200 font-medium text-sm"
              >
                {formatCurrency(d.payments.total)}
              </TableBodyCell>
            </TableBodyRow>
          {/if}
        {/each}

        <!-- Adjustments -->
        {#each dataByYear as d, index}
          {#if d?.adjustments?.values?.length}
            <TableBodyRow class="bg-pink-100">
              {#if index === 0}
                <TableBodyCell
                  class="py-2 px-2 font-bold bg-pink-100 text-sm"
                  rowspan={yearCount}
                >
                  Adjustments
                </TableBodyCell>
              {/if}
              <TableBodyCell
                class="py-2 px-2 font-bold text-center bg-gray-200 text-sm"
                >{years[index]}</TableBodyCell
              >
              {#each d.adjustments.values as value}
                <TableBodyCell class="py-2 px-2 text-center text-sm">
                  {formatCurrency(value)}
                </TableBodyCell>
              {/each}
              <TableBodyCell
                class="py-2 px-2 text-center bg-gray-200 font-medium text-sm"
              >
                {formatCurrency(d.adjustments.total)}
              </TableBodyCell>
            </TableBodyRow>
          {/if}
        {/each}

        <!-- Payer Payment -->
        {#each dataByYear as d, index}
          {#if d?.payerPayment?.values?.length}
            <TableBodyRow class="bg-teal-100">
              {#if index === 0}
                <TableBodyCell
                  class="py-2 px-2 font-bold bg-teal-100 text-sm"
                  rowspan={yearCount}
                >
                  Payer Payment
                </TableBodyCell>
              {/if}
              <TableBodyCell
                class="py-2 px-2 font-bold text-center bg-gray-200 text-sm"
                >{years[index]}</TableBodyCell
              >
              {#each d.payerPayment.values as value}
                <TableBodyCell class="py-2 px-2 text-center text-sm">
                  {formatCurrency(value)}
                </TableBodyCell>
              {/each}
              <TableBodyCell
                class="py-2 px-2 text-center bg-gray-200 font-medium text-sm"
              >
                {formatCurrency(d.payerPayment.total)}
              </TableBodyCell>
            </TableBodyRow>
          {/if}
        {/each}

        <!-- Patient Payment -->
        {#each dataByYear as d, index}
          {#if d?.patientPayment?.values?.length}
            <TableBodyRow class="bg-cyan-100">
              {#if index === 0}
                <TableBodyCell
                  class="py-2 px-2 font-bold bg-cyan-100 text-sm"
                  rowspan={yearCount}
                >
                  Patient Payment
                </TableBodyCell>
              {/if}
              <TableBodyCell
                class="py-2 px-2 font-bold text-center bg-gray-200 text-sm"
                >{years[index]}</TableBodyCell
              >
              {#each d.patientPayment.values as value}
                <TableBodyCell class="py-2 px-2 text-center text-sm">
                  {formatCurrency(value)}
                </TableBodyCell>
              {/each}
              <TableBodyCell
                class="py-2 px-2 text-center bg-gray-200 font-medium text-sm"
              >
                {formatCurrency(d.patientPayment.total)}
              </TableBodyCell>
            </TableBodyRow>
          {/if}
        {/each}

        <!-- Payroll -->
        {#each dataByYear as d, index}
          {#if d?.payroll?.values?.length}
            <TableBodyRow class="bg-orange-100">
              {#if index === 0}
                <TableBodyCell
                  class="py-2 px-2 font-bold bg-orange-100 text-sm"
                  rowspan={yearCount}
                >
                  Payroll
                </TableBodyCell>
              {/if}
              <TableBodyCell
                class="py-2 px-2 font-bold text-center bg-gray-200 text-sm"
                >{years[index]}</TableBodyCell
              >
              {#each d.payroll.values as value}
                <TableBodyCell class="py-2 px-2 text-center text-sm">
                  {formatCurrency(value)}
                </TableBodyCell>
              {/each}
              <TableBodyCell
                class="py-2 px-2 text-center bg-gray-200 font-medium text-sm"
              >
                {formatCurrency(d.payroll.total)}
              </TableBodyCell>
            </TableBodyRow>
          {/if}
        {/each}

        <!-- Operating Profit -->
        {#each dataByYear as d, index}
          {#if d?.operatingProfit?.values?.length}
            <TableBodyRow>
              {#if index === 0}
                <TableBodyCell
                  class="py-2 px-2 font-bold bg-gray-100 text-sm"
                  rowspan={yearCount}
                >
                  Operating Profit
                </TableBodyCell>
              {/if}
              <TableBodyCell
                class="py-2 px-2 font-bold text-center bg-gray-200 text-sm"
                >{years[index]}</TableBodyCell
              >
              {#each d.operatingProfit.values as value}
                <TableBodyCell
                  class="py-2 px-2 text-center text-sm {value > 0
                    ? 'bg-green-100'
                    : value < 0
                      ? 'bg-red-100'
                      : ''}"
                >
                  {formatCurrency(value)}
                </TableBodyCell>
              {/each}
              <TableBodyCell
                class="py-2 px-2 text-center bg-gray-200 font-medium text-sm {d
                  .operatingProfit.total > 0
                  ? 'text-green-600'
                  : 'text-red-600'}"
              >
                {formatCurrency(d.operatingProfit.total)}
              </TableBodyCell>
            </TableBodyRow>
          {/if}
        {/each}
      </TableBody>
    </Table>
  </div>
</div>
