<script lang="ts">
  import { env } from "$env/dynamic/public";
  import { customers } from "../constants";

  const apiUrl = env.PUBLIC_API_URL;

  let files: { [key: string]: File[] | null } = {};
  let isLoading: { [key: string]: boolean } = {};

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

      if (uploadResponse.ok) {
        const etlResponse = await fetch(`${apiUrl}/trigger-etl/${customerID}`, {
          method: "POST",
        });

        if (etlResponse.ok) {
          alert(
            `Successfully uploaded files and started ETL process for ${customerID}`
          );
          files[customerID] = null; // Clear files after successful upload
        } else {
          const errorText = await etlResponse.text();
          alert(
            `File upload succeeded, but failed to start ETL process: ${errorText}`
          );
        }
      } else {
        const errorText = await uploadResponse.text();
        alert(`Failed to upload files: ${errorText}`);
      }
    } catch (error) {
      console.error("Error during ETL process:", error);
      alert("An error occurred while trying to start the ETL process.");
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
              on:keydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  const input = e.currentTarget.querySelector(
                    'input[type="file"]'
                  ) as HTMLInputElement;

                  if (input) {
                    input.click();
                  }
                }
              }}
            >
              <input
                type="file"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isLoading[customer.customerID]}
                on:change={(e) => handleFileSelect(e, customer.customerID)}
                multiple
                webkitdirectory
              />
              <div class="flex flex-col items-center justify-center space-y-2">
                <svg
                  class="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v5a4 4 0 01-4 4H7z"
                  ></path></svg
                >
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
                {@const customerFiles = files[customer.customerID]}
                {#if customerFiles && customerFiles.length > 0}
                  <div class="mt-4 text-sm text-gray-600">
                    <strong>Selected files:</strong>
                    <ul class="list-disc list-inside">
                      {#each customerFiles as file}
                        <li>{file.name}</li>
                      {/each}
                    </ul>
                  </div>
                {/if}
              {/if}
            </div>
            <button
              on:click={() => handleRunETL(customer.customerID)}
              disabled={!files[customer.customerID] ||
                isLoading[customer.customerID]}
              class="w-full px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed hover:shadow-lg disabled:shadow-none flex items-center justify-center"
            >
              {#if isLoading[customer.customerID]}
                <svg
                  class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
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
