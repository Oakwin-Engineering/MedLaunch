<script lang="ts">
  import { store } from "../../../store.svelte";
  import { Button } from "flowbite-svelte";
  import { DownloadSolid, FileExportSolid } from "flowbite-svelte-icons";
  import type { PageData } from './$types';
  
  export let data: PageData;
  
  store.currentDashboard = "DataSources";

  let error = data.error;
  let csvData = data.csvData;

  // Helper function to download a CSV file
  const downloadCsvFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Download all CSV files for a data source
  const downloadAllCsvs = (source: 'athelas' | 'allscripts' | 'ecw') => {
    let files;
    if (source === 'athelas') files = csvData?.athelas;
    else if (source === 'allscripts') files = csvData?.allscripts;
    else if (source === 'ecw') files = csvData?.ecw;
    
    if (!files) return;

    const prefix = `${data.customerID}_${source}`;
    
    downloadCsvFile(files.cptCodes, `${prefix}_cpt_codes.csv`);
    downloadCsvFile(files.financial, `${prefix}_financial.csv`);
    downloadCsvFile(files.payroll, `${prefix}_payroll.csv`);
    downloadCsvFile(files.rvu, `${prefix}_rvu.csv`);
  };

  // Download individual CSV file
  const downloadIndividualCsv = (source: 'athelas' | 'allscripts' | 'ecw', fileType: 'cptCodes' | 'financial' | 'payroll' | 'rvu') => {
    let files;
    if (source === 'athelas') files = csvData?.athelas;
    else if (source === 'allscripts') files = csvData?.allscripts;
    else if (source === 'ecw') files = csvData?.ecw;
    
    if (!files) return;

    const prefix = `${data.customerID}_${source}`;
    const fileNames = {
      cptCodes: 'cpt_codes',
      financial: 'financial',
      payroll: 'payroll',
      rvu: 'rvu'
    };
    
    downloadCsvFile(files[fileType], `${prefix}_${fileNames[fileType]}.csv`);
  };
</script>

<div class="mt-32 pl-32 pr-32">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Data Sources</h1>
    <p class="text-gray-600">View and download CSV exports for {store.customerID}</p>
  </div>

  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <h3 class="text-sm font-semibold text-red-900 mb-2">❌ Error Loading Data</h3>
      <p class="text-sm text-red-800">{error}</p>
    </div>
  {/if}

  <!-- Athelas Data Source -->
  {#if csvData?.athelas}
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div class="p-4 border-b border-gray-200 bg-blue-50">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <FileExportSolid class="w-5 h-5 text-blue-600" />
            <div>
              <h2 class="text-lg font-semibold text-gray-900">Athelas Data</h2>
              <p class="text-sm text-gray-600">Primary data source</p>
            </div>
          </div>
          <Button 
            onclick={() => downloadAllCsvs('athelas')}
            size="sm"
            color="blue"
          >
            <DownloadSolid class="w-4 h-4 mr-2" />
            Download All (4 files)
          </Button>
        </div>
      </div>
      
      <div class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onclick={() => downloadIndividualCsv('athelas', 'cptCodes')}
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div>
              <p class="font-medium text-gray-900">CPT Codes</p>
              <p class="text-sm text-gray-500">Provider CPT code data by month</p>
            </div>
            <DownloadSolid class="w-4 h-4 text-gray-400" />
          </button>

          <button
            onclick={() => downloadIndividualCsv('athelas', 'financial')}
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div>
              <p class="font-medium text-gray-900">Financial Metrics</p>
              <p class="text-sm text-gray-500">Charges, payments, adjustments</p>
            </div>
            <DownloadSolid class="w-4 h-4 text-gray-400" />
          </button>

          <button
            onclick={() => downloadIndividualCsv('athelas', 'payroll')}
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div>
              <p class="font-medium text-gray-900">Payroll</p>
              <p class="text-sm text-gray-500">Payroll and operating profit</p>
            </div>
            <DownloadSolid class="w-4 h-4 text-gray-400" />
          </button>

          <button
            onclick={() => downloadIndividualCsv('athelas', 'rvu')}
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div>
              <p class="font-medium text-gray-900">RVU Data</p>
              <p class="text-sm text-gray-500">Work RVUs and visits</p>
            </div>
            <DownloadSolid class="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- ECW Data Source (only for vitalcare) -->
  {#if csvData?.ecw}
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div class="p-4 border-b border-gray-200 bg-purple-50">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <FileExportSolid class="w-5 h-5 text-purple-600" />
            <div>
              <h2 class="text-lg font-semibold text-gray-900">ECW Data</h2>
              <p class="text-sm text-gray-600">Primary data source</p>
            </div>
          </div>
          <Button 
            onclick={() => downloadAllCsvs('ecw')}
            size="sm"
            color="purple"
          >
            <DownloadSolid class="w-4 h-4 mr-2" />
            Download All (4 files)
          </Button>
        </div>
      </div>
      
      <div class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onclick={() => downloadIndividualCsv('ecw', 'cptCodes')}
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div>
              <p class="font-medium text-gray-900">CPT Codes</p>
              <p class="text-sm text-gray-500">Provider CPT code data by month</p>
            </div>
            <DownloadSolid class="w-4 h-4 text-gray-400" />
          </button>

          <button
            onclick={() => downloadIndividualCsv('ecw', 'financial')}
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div>
              <p class="font-medium text-gray-900">Financial Metrics</p>
              <p class="text-sm text-gray-500">Charges, payments, adjustments</p>
            </div>
            <DownloadSolid class="w-4 h-4 text-gray-400" />
          </button>

          <button
            onclick={() => downloadIndividualCsv('ecw', 'payroll')}
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div>
              <p class="font-medium text-gray-900">Payroll</p>
              <p class="text-sm text-gray-500">Payroll and operating profit</p>
            </div>
            <DownloadSolid class="w-4 h-4 text-gray-400" />
          </button>

          <button
            onclick={() => downloadIndividualCsv('ecw', 'rvu')}
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div>
              <p class="font-medium text-gray-900">RVU Data</p>
              <p class="text-sm text-gray-500">Work RVUs and visits</p>
            </div>
            <DownloadSolid class="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- AllScripts Data Source (only for uhealth) -->
  {#if csvData?.allscripts}
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div class="p-4 border-b border-gray-200 bg-green-50">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <FileExportSolid class="w-5 h-5 text-green-600" />
            <div>
              <h2 class="text-lg font-semibold text-gray-900">AllScripts Data</h2>
              <p class="text-sm text-gray-600">Secondary data source</p>
            </div>
          </div>
          <Button 
            onclick={() => downloadAllCsvs('allscripts')}
            size="sm"
            color="green"
          >
            <DownloadSolid class="w-4 h-4 mr-2" />
            Download All (4 files)
          </Button>
        </div>
      </div>
      
      <div class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onclick={() => downloadIndividualCsv('allscripts', 'cptCodes')}
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div>
              <p class="font-medium text-gray-900">CPT Codes</p>
              <p class="text-sm text-gray-500">Provider CPT code data by month</p>
            </div>
            <DownloadSolid class="w-4 h-4 text-gray-400" />
          </button>

          <button
            onclick={() => downloadIndividualCsv('allscripts', 'financial')}
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div>
              <p class="font-medium text-gray-900">Financial Metrics</p>
              <p class="text-sm text-gray-500">Charges, payments, adjustments</p>
            </div>
            <DownloadSolid class="w-4 h-4 text-gray-400" />
          </button>

          <button
            onclick={() => downloadIndividualCsv('allscripts', 'payroll')}
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div>
              <p class="font-medium text-gray-900">Payroll</p>
              <p class="text-sm text-gray-500">Payroll and operating profit</p>
            </div>
            <DownloadSolid class="w-4 h-4 text-gray-400" />
          </button>

          <button
            onclick={() => downloadIndividualCsv('allscripts', 'rvu')}
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div>
              <p class="font-medium text-gray-900">RVU Data</p>
              <p class="text-sm text-gray-500">Work RVUs and visits</p>
            </div>
            <DownloadSolid class="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if !csvData?.athelas && !csvData?.allscripts && !csvData?.ecw && !error}
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h3 class="text-sm font-semibold text-yellow-900 mb-2">⚠️ No Data Available</h3>
      <p class="text-sm text-yellow-800">No CSV data found for this customer.</p>
    </div>
  {/if}

  <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
    <h3 class="text-sm font-semibold text-blue-900 mb-2">📊 Data Information</h3>
    <ul class="text-sm text-blue-800 space-y-1">
      <li>• Last updated: {new Date().toLocaleDateString()}</li>
      <li>• Customer: {data.customerID}</li>
      <li>• Format: CSV (Comma Separated Values)</li>
      <li>• Data sources: {[
        csvData?.athelas ? 'Athelas' : null,
        csvData?.allscripts ? 'AllScripts' : null,
        csvData?.ecw ? 'ECW' : null
      ].filter(Boolean).join(', ')}</li>
    </ul>
  </div>
</div>
