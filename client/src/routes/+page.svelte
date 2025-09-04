<script lang="ts">
  import {
    Spinner,
    Toast,
    Footer,
    FooterCopyright,
    FooterLinkGroup,
    FooterLink,
  } from "flowbite-svelte";
  import { FileCsvSolid, CheckCircleSolid } from "flowbite-svelte-icons";
  import { fly } from "svelte/transition";
  import { env } from "$env/dynamic/public";
  import { customers } from "../constants";

  const apiUrl = env.PUBLIC_API_URL;

  let files: { [key: string]: File[] | null } = $state({});
  let isLoading: { [key: string]: boolean } = $state({});
  let showSuccessToast = $state(false);
  let showErrorToast = $state(false);
  let inputRefs = $state<{ [key: string]: HTMLInputElement }>({});

  function handleFileSelect(event: Event, customerID: string) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      files[customerID] = Array.from(target.files);
    }
  }

  async function handleRunETL(customerID: string) {
    const customerFiles = files[customerID];
    if (!customerFiles) return;

    isLoading[customerID] = true;

    const formData = new FormData();
    for (const file of customerFiles) {
      // Flatten the folder structure by sending only the filename.
      formData.append("files", file, file.name);
    }

    try {
      const uploadResponse = await fetch(
        `${apiUrl}/upload-bucket/${customerID}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const etlResponse = await fetch(`${apiUrl}/trigger-etl/${customerID}`, {
        method: "POST",
      });

      if (etlResponse.ok && uploadResponse.ok) {
        files[customerID] = null;
        // Clear the input file field, this is needed to reset the file selection as input file retains the previous selection
        if (inputRefs[customerID]) {
          inputRefs[customerID].value = "";
        }
        showSuccessToast = true;
      } else {
        showErrorToast = true;
      }
    } catch (error) {
      console.error("Error during ETL process:", error);
      showErrorToast = true;
    } finally {
      isLoading[customerID] = false;
    }
  }
</script>

<svelte:head>
  <title>MedLaunch Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-100 py-12">
  <div class="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    {#if showSuccessToast}
      <div class="fixed top-5 right-5 z-50">
        <Toast transition={fly} params={{ x: 200 }} color="green" class="mb-4">
          {#snippet icon()}
            <CheckCircleSolid class="h-6 w-6" />
          {/snippet}
          ETL successful
        </Toast>
      </div>
    {/if}

    {#if showErrorToast}
      <div class="fixed top-5 right-5 z-50">
        <Toast transition={fly} params={{ x: 200 }} color="red" class="mb-4">
          {#snippet icon()}
            <CheckCircleSolid class="h-6 w-6" />
          {/snippet}
          ETL failed
        </Toast>
      </div>
    {/if}

    <header class="mb-12 text-center">
      <h1 class="text-5xl font-extrabold text-blue-900 mb-2">MedLaunch</h1>
      <p class="text-xl text-gray-500">Admin Dashboard</p>
    </header>

    <main class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {#each customers as customer (customer.customerID)}
        <div class="bg-white rounded-2xl shadow-xl p-8 flex flex-col">
          <h2 class="text-2xl font-bold text-blue-800 mb-6 truncate">
            {customer.customerName}
          </h2>

          <div class="space-y-6 flex-grow mb-6">
            <div
              role="button"
              tabindex="0"
              class="relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-300"
            >
              <input
                type="file"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isLoading[customer.customerID]}
                webkitdirectory
                onchange={(e) => handleFileSelect(e, customer.customerID)}
                bind:this={inputRefs[customer.customerID]}
              />
              <div class="flex flex-col items-center justify-center space-y-2">
                <FileCsvSolid class="shrink-0 h-6 w-6" />
                <p class="text-gray-500">
                  <span class="font-semibold text-blue-600"
                    >Click to upload</span
                  >
                </p>
                <p class="text-xs text-gray-400">
                  Follow the SOP for folder upload guidelines
                </p>
              </div>

              {#if files[customer.customerID]}
                <div class="mt-4 text-sm text-gray-600">
                  <strong
                    >{files[customer.customerID].length} files selected</strong
                  >
                </div>
              {/if}
            </div>
            <button
              onclick={() => handleRunETL(customer.customerID)}
              disabled={!files[customer.customerID] ||
                isLoading[customer.customerID]}
              class="w-full px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed hover:shadow-lg disabled:shadow-none flex items-center justify-center"
            >
              {#if isLoading[customer.customerID]}
                <Spinner color="blue" />
              {:else}
                Run ETL Process
              {/if}
            </button>
          </div>

          <div class="mt-auto">
            <a
              href={`/${customer.customerID}`}
              class="block text-center w-full px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              View Dashboard
            </a>
          </div>
        </div>
      {/each}
    </main>
  </div>
</div>

<Footer class="fixed bottom-0 left-0 right-0">
  <FooterCopyright href="/" by="MedLaunch" year={new Date().getFullYear()} />
  <FooterLinkGroup
    class="mt-3 flex flex-wrap items-center text-sm text-gray-500 sm:mt-0 dark:text-gray-400"
  >
    <FooterLink href="/">About</FooterLink>
    <FooterLink href="/">Privacy Policy</FooterLink>
    <FooterLink href="/">Licensing</FooterLink>
    <FooterLink href="/">Contact</FooterLink>
  </FooterLinkGroup>
</Footer>
