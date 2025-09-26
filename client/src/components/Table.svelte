<script lang="ts">
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from "flowbite-svelte";
  import { ChevronDownOutline } from "flowbite-svelte-icons";
  import { formatCurrency, formatNumber, groupByLabel } from "../utils/utils";
  import { Headers, CPTCodeLabelColors, LabelMapping } from "../constants";

  let { tableData } = $props();

  const data = $derived(tableData.data);
  const label = $derived(tableData.label);

  let chargesExpanded = $state(false);
  let rvusExpanded = $state(false);
  let paymentsExpanded = $state(false);
  let adjustmentsExpanded = $state(false);
  let cptCodingExpanded = $state(false); // NEW for CPT Coding toggle
</script>

<div class="w-full">
  <h1 class="text-2xl ibold mb-4">{label}</h1>
  <div class="overflow-x-auto shadow-md rounded-lg">
    <Table>
      <TableHead class="bg-gray-50">
        <TableHeadCell class="py-2 px-3"></TableHeadCell>
        <TableHeadCell class="py-2 px-3">Code</TableHeadCell>
        {#each Headers.slice(1) as header, i}
          <TableHeadCell
            class="py-2 px-3 text-center {i >= 12 ? 'bg-gray-100' : ''}"
            >{header}</TableHeadCell
          >
        {/each}
      </TableHead>
      <TableBody>
        {#if data?.cptCodes?.length > 0}
          {#each groupByLabel(data.cptCodes) as group}
            {#if group.label === "CPT Coding"}
              {#if cptCodingExpanded}
                {#each group.rows as row, i}
                  <TableBodyRow>
                    {#if i === 0}
                      <TableBodyCell
                        class="p-10 ibold relative"
                        style="background-color: {CPTCodeLabelColors[
                          group.label
                        ]}"
                        rowspan={group.rows.length}
                      >
                        <div
                          class="absolute inset-0 flex items-center justify-center"
                        >
                          <span
                            class="-rotate-90 break-words text-center leading-tight max-w-[120px] whitespace-normal"
                          >
                            {group.label}
                          </span>
                        </div>
                      </TableBodyCell>
                    {/if}
                    <TableBodyCell class="py-2 px-3 ibold"
                      >{row.code}</TableBodyCell
                    >
                    {#each row.values as value}
                      <TableBodyCell class="py-2 px-3 text-center ibold">
                        {formatNumber(value)}
                      </TableBodyCell>
                    {/each}
                    <TableBodyCell
                      class="py-2 px-3 text-center bg-gray-200 font-medium"
                    >
                      {formatNumber(row.total)}
                    </TableBodyCell>
                    <TableBodyCell
                      class="py-2 px-3 text-center bg-purple-200 ibold"
                    >
                      {row.coding}
                    </TableBodyCell>
                  </TableBodyRow>
                {/each}
              {/if}
              <!-- CPT Coding Total Row w/ caret -->
              <TableBodyRow
                class="font-bold cursor-pointer"
                style="background-color: {CPTCodeLabelColors[group.label]}"
                onclick={() => (cptCodingExpanded = !cptCodingExpanded)}
              >
                <TableBodyCell class="py-2 px-3">
                  <ChevronDownOutline
                    class="h-5 w-5 transform transition-transform duration-200 {cptCodingExpanded
                      ? 'rotate-180'
                      : ''}"
                  />
                </TableBodyCell>
                <TableBodyCell class="py-2 px-3">Total</TableBodyCell>
                {#each data.cptCodingTotal.values as value}
                  <TableBodyCell class="py-2 px-3 text-center ibold">
                    {formatNumber(value)}
                  </TableBodyCell>
                {/each}
                <TableBodyCell
                  class="py-2 px-3 text-center bg-gray-200 font-medium"
                >
                  {formatNumber(data.cptCodingTotal.total)}
                </TableBodyCell>
                <TableBodyCell
                  class="py-2 px-3 text-center bg-purple-200 ibold"
                >
                  {data.cptCodingTotal?.coding}
                </TableBodyCell>
              </TableBodyRow>
            {:else}
              <!-- all other groups  -->
              {#each group.rows as row, i}
                <TableBodyRow>
                  {#if i === 0}
                    <TableBodyCell
                      class="p-10 ibold relative"
                      style="background-color: {CPTCodeLabelColors[
                        group.label
                      ]}"
                      rowspan={group.rows.length}
                    >
                      <div
                        class="absolute inset-0 flex items-center justify-center"
                      >
                        <span
                          class="-rotate-90 break-words text-center leading-tight max-w-[120px] whitespace-normal"
                        >
                          {group.label}
                        </span>
                      </div>
                    </TableBodyCell>
                  {/if}
                  <TableBodyCell class="py-2 px-3 ibold"
                    >{row.code}</TableBodyCell
                  >
                  {#each row.values as value}
                    <TableBodyCell class="py-2 px-3 text-center ibold">
                      {formatNumber(value)}
                    </TableBodyCell>
                  {/each}
                  <TableBodyCell
                    class="py-2 px-3 text-center bg-gray-200 font-medium"
                  >
                    {formatNumber(row.total)}
                  </TableBodyCell>
                  <TableBodyCell
                    class="py-2 px-3 text-center bg-purple-200 ibold"
                  >
                    {row.coding}
                  </TableBodyCell>
                </TableBodyRow>
              {/each}
              <TableBodyRow
                class="font-bold"
                style="background-color: {CPTCodeLabelColors[group.label]}"
              >
                <TableBodyCell class="py-2 px-3"></TableBodyCell>
                <TableBodyCell class="py-2 px-3">Total</TableBodyCell>
                {#each data[LabelMapping[group.label]]?.values as value}
                  <TableBodyCell class="py-2 px-3 text-center ibold">
                    {formatNumber(value)}
                  </TableBodyCell>
                {/each}
                <TableBodyCell
                  class="py-2 px-3 text-center bg-gray-200 font-medium"
                >
                  {formatNumber(data[LabelMapping[group.label]]?.total)}
                </TableBodyCell>
                <TableBodyCell
                  class="py-2 px-3 text-center bg-purple-200 ibold"
                >
                  {data[LabelMapping[group.label]]?.coding}
                </TableBodyCell>
              </TableBodyRow>
            {/if}
          {/each}
        {/if}

        <!-- all your other blocks remain the same -->
        {#if data?.total?.values}
          <TableBodyRow class="font-bold bg-yellow-200">
            <TableBodyCell class="py-2 px-3"></TableBodyCell>
            <TableBodyCell class="py-2 px-3">{data.total.label}</TableBodyCell>
            {#each data.total.values as value}
              <TableBodyCell class="py-2 px-3 text-center">
                {formatNumber(value)}
              </TableBodyCell>
            {/each}
            <TableBodyCell class="py-2 px-3 text-center bg-gray-200">
              {formatNumber(data.total.total)}
            </TableBodyCell>
            <TableBodyCell class="py-2 px-3 text-center bg-purple-200">
              {data.total.coding}
            </TableBodyCell>
          </TableBodyRow>
        {/if}

        {#if data?.totalVisits?.values}
          <TableBodyRow>
            <TableBodyCell class="py-2 px-3"></TableBodyCell>
            <TableBodyCell class="py-2 px-3 font-bold">
              {data.totalVisits.label}
            </TableBodyCell>
            {#each data.totalVisits.values as value}
              <TableBodyCell class="py-2 px-3 text-center font-bold">
                {formatNumber(value)}
              </TableBodyCell>
            {/each}
            <TableBodyCell
              class="py-2 px-3 text-center bg-gray-200 font-medium"
            >
              {formatNumber(data.totalVisits.total)}
            </TableBodyCell>
            <TableBodyCell class="py-2 px-3 text-center bg-purple-200">
              {data.totalVisits.coding}
            </TableBodyCell>
          </TableBodyRow>
        {/if}

        <!-- rvus, charges, payments, adjustments, payroll, operatingProfit remain as you had them -->

        {#if data?.rvus?.values.length}
          <TableBodyRow
            class="bg-green-100 cursor-pointer"
            onclick={() => (rvusExpanded = !rvusExpanded)}
          >
            <TableBodyCell class="py-2 px-3">
              <ChevronDownOutline
                class="h-6 w-6 transform transition-transform duration-200 {rvusExpanded
                  ? 'rotate-180'
                  : ''}"
              />
            </TableBodyCell>
            <TableBodyCell class="py-2 px-3">{data.rvus.label}</TableBodyCell>
            {#each data.rvus.values as value}
              <TableBodyCell class="py-2 px-3 text-center">
                {formatNumber(value)}
              </TableBodyCell>
            {/each}
            <TableBodyCell
              class="py-2 px-3 text-center bg-gray-200 font-medium"
            >
              {formatNumber(data.rvus.total)}
            </TableBodyCell>
            <TableBodyCell class="py-2 px-3 text-center bg-purple-200">
              {data.rvus.coding}
            </TableBodyCell>
          </TableBodyRow>
          {#if rvusExpanded}
            <TableBodyRow class="bg-green-50">
              <TableBodyCell class="py-2 px-3"></TableBodyCell>
              <TableBodyCell class="py-2 px-3 pl-8 whitespace-normal">
                {data.rvuPerPatient.label}
              </TableBodyCell>
              {#each data.rvuPerPatient.values as value}
                <TableBodyCell class="py-2 px-3 text-center">
                  {value.toFixed(2)}
                </TableBodyCell>
              {/each}
              <TableBodyCell class="py-2 px-3 text-center bg-gray-100">
                {data.rvuPerPatient.total.toFixed(2)}
              </TableBodyCell>
              <TableBodyCell class="py-2 px-3 text-center bg-purple-100"
              ></TableBodyCell>
            </TableBodyRow>
          {/if}
        {/if}
        {#if data?.charges?.values}
          <TableBodyRow
            class="bg-purple-100 cursor-pointer"
            onclick={() => {
              chargesExpanded = !chargesExpanded;
            }}
          >
            <TableBodyCell class="py-2 px-3">
              <ChevronDownOutline
                class="h-6 w-6 transform transition-transform duration-200 {chargesExpanded
                  ? 'rotate-180'
                  : ''}"
              />
            </TableBodyCell>
            <TableBodyCell class="py-2 px-3">
              <span>{data.charges.label}</span>
            </TableBodyCell>
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
          {#if chargesExpanded}
            <TableBodyRow class="bg-purple-50">
              <TableBodyCell class="py-2 px-3"></TableBodyCell>
              <TableBodyCell class="py-2 px-3 pl-8 whitespace-normal"
                >{data.chargePerPatient.label}</TableBodyCell
              >
              {#each data.chargePerPatient.values as value}
                <TableBodyCell class="py-2 px-3 text-center"
                  >{formatCurrency(value)}</TableBodyCell
                >
              {/each}
              <TableBodyCell class="py-2 px-3 text-center bg-gray-100"
                >{formatCurrency(data.chargePerPatient.total)}</TableBodyCell
              >
              <TableBodyCell class="py-2 px-3 text-center bg-purple-100"
              ></TableBodyCell>
            </TableBodyRow>
          {/if}
        {/if}
        {#if data?.payments?.values}
          <TableBodyRow
            class="bg-blue-100 cursor-pointer"
            onclick={() => (paymentsExpanded = !paymentsExpanded)}
          >
            <TableBodyCell class="py-2 px-3">
              <ChevronDownOutline
                class="h-6 w-6 transform transition-transform duration-200 {paymentsExpanded
                  ? 'rotate-180'
                  : ''}"
              />
            </TableBodyCell>
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
          {#if paymentsExpanded}
            <TableBodyRow class="bg-blue-50">
              <TableBodyCell class="py-2 px-3"></TableBodyCell>
              <TableBodyCell class="py-2 px-3 pl-8 whitespace-normal"
                >{data.paymentPercentOfCharges.label}</TableBodyCell
              >
              {#each data.paymentPercentOfCharges.values as value}
                <TableBodyCell class="py-2 px-3 text-center"
                  >{value.toFixed(2)}%</TableBodyCell
                >
              {/each}
              <TableBodyCell class="py-2 px-3 text-center bg-gray-100"
                >{data.paymentPercentOfCharges.total.toFixed(2)}%</TableBodyCell
              >
              <TableBodyCell class="py-2 px-3 text-center bg-purple-100"
              ></TableBodyCell>
            </TableBodyRow>
            <TableBodyRow class="bg-blue-50">
              <TableBodyCell class="py-2 px-3"></TableBodyCell>
              <TableBodyCell class="py-2 px-3 pl-8 whitespace-normal"
                >{data.averageReceiptsPerPatient.label}</TableBodyCell
              >
              {#each data.averageReceiptsPerPatient.values as value}
                <TableBodyCell class="py-2 px-3 text-center"
                  >{formatCurrency(value)}</TableBodyCell
                >
              {/each}
              <TableBodyCell class="py-2 px-3 text-center bg-gray-100"
                >{formatCurrency(
                  data.averageReceiptsPerPatient.total
                )}</TableBodyCell
              >
              <TableBodyCell class="py-2 px-3 text-center bg-purple-100"
              ></TableBodyCell>
            </TableBodyRow>
          {/if}
        {/if}
        {#if data?.adjustments?.values.length}
          <TableBodyRow
            class="bg-pink-100 cursor-pointer"
            onclick={() => (adjustmentsExpanded = !adjustmentsExpanded)}
          >
            <TableBodyCell class="py-2 px-3">
              <ChevronDownOutline
                class="h-6 w-6 transform transition-transform duration-200 {adjustmentsExpanded
                  ? 'rotate-180'
                  : ''}"
              />
            </TableBodyCell>
            <TableBodyCell class="py-2 px-3"
              >{data.adjustments.label}</TableBodyCell
            >
            {#each data.adjustments.values as value}
              <TableBodyCell class="py-2 px-3 text-center"
                >{formatCurrency(value)}</TableBodyCell
              >
            {/each}
            <TableBodyCell class="py-2 px-3 text-center bg-gray-200 font-medium"
              >{formatCurrency(data.adjustments.total)}</TableBodyCell
            >
            <TableBodyCell class="py-2 px-3 text-center bg-purple-200"
              >{data.adjustments.coding}</TableBodyCell
            >
          </TableBodyRow>
          {#if adjustmentsExpanded}
            <TableBodyRow class="bg-pink-50">
              <TableBodyCell class="py-2 px-3"></TableBodyCell>
              <TableBodyCell class="py-2 px-3 pl-8 whitespace-normal"
                >{data.adjustmentPercentOfCharges.label}</TableBodyCell
              >
              {#each data.adjustmentPercentOfCharges.values as value}
                <TableBodyCell class="py-2 px-3 text-center "
                  >{value.toFixed(2)}%</TableBodyCell
                >
              {/each}
              <TableBodyCell class="py-2 px-3 text-center bg-gray-100"
                >{data.adjustmentPercentOfCharges.total.toFixed(
                  2
                )}%</TableBodyCell
              >
              <TableBodyCell class="py-2 px-3 text-center bg-purple-100"
              ></TableBodyCell>
            </TableBodyRow>
          {/if}
        {/if}
        {#if data?.payroll?.values}
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
        {#if data?.operatingProfit?.values}
          <TableBodyRow>
            <TableBodyCell class="py-2 px-3"></TableBodyCell>
            <TableBodyCell class="py-2 px-3 whitespace-normal"
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
