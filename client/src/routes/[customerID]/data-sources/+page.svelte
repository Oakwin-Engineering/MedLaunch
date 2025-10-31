<script lang="ts">
  import { store } from "../../../store.svelte";
  import { Button } from "flowbite-svelte";
  import { DownloadSolid, FileExportSolid } from "flowbite-svelte-icons";
  import type { PageData } from './$types';
  
  export let data: PageData;
  
  store.currentDashboard = "DataSources";

  let isLoading = false;
  let csvContent = data.csvData || '';
  let error = data.error;

  // Limit CSV display to first 20 lines to prevent page overflow
  const displayCsvContent = csvContent ? csvContent.split('\n').slice(0, 20).join('\n') : '';
  const totalLines = csvContent ? csvContent.split('\n').length : 0;

  // Download CSV functionality
  const downloadCsv = async () => {
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${data.customerID}-data.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };




</script>

<div class="mt-32 pl-32 pr-32">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Data Sources</h1>
    <p class="text-gray-600">View and download raw data sources for {store.customerID}</p>
  </div>

  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <FileExportSolid class="w-5 h-5 text-gray-500" />
          <h2 class="text-lg font-semibold text-gray-900">Provider Data Export</h2>
        </div>
        <div class="flex gap-2">
         
          <Button 
            onclick={downloadCsv}
            disabled={isLoading || !csvContent}
            size="sm"
            color="primary"
          >
            <DownloadSolid class="w-4 h-4 mr-2" />
            Download CSV
          </Button>
        </div>
      </div>
    </div>
    
    <div class="p-4">
      {#if error}
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-red-900 mb-2">❌ Error Loading Data</h3>
          <p class="text-sm text-red-800">{error}</p>
        </div>
      {:else if isLoading}
        <div class="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
          <div class="text-center">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p class="text-sm text-gray-600 mt-2">Loading data...</p>
          </div>
        </div>
      {:else if csvContent}
        <div class="bg-gray-50 rounded-lg p-4 overflow-x-auto">
          <pre class="text-sm text-gray-700 font-mono whitespace-pre">{displayCsvContent}</pre>
          {#if totalLines > 20}
            <div class="text-center mt-3 pt-3 border-t border-gray-200">
              <p class="text-sm text-gray-600">
                Showing first 20 of {totalLines} lines. Download CSV to view complete data.
              </p>
            </div>
          {/if}
        </div>
      {:else}
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-yellow-900 mb-2">⚠️ No Data Available</h3>
          <p class="text-sm text-yellow-800">No data found for this customer. Click refresh to try again.</p>
        </div>
      {/if}
    </div>
  </div>

  <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
    <h3 class="text-sm font-semibold text-blue-900 mb-2">📊 Data Information</h3>
    <ul class="text-sm text-blue-800 space-y-1">
      <li>• Last updated: {new Date().toLocaleDateString()}</li>
      <li>• Total records: {csvContent ? csvContent.split('\n').length - 1 : 0} nodes</li>
      <li>• Data source: {data.customerID} database</li>
      <li>• Format: CSV (Comma Separated Values)</li>
    </ul>
  </div>
</div>
