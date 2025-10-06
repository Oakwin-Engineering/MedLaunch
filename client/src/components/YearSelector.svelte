<script lang="ts">
  let { availableYears, activeYear, onYearChange } = $props<{
    availableYears: string[];
    activeYear: string;
    onYearChange: (year: string) => void;
  }>();
</script>

<div class="mb-6 flex gap-2">
  {#each availableYears as year}
    <button
      class="px-4 py-2 rounded-lg font-medium transition-colors {activeYear ===
      year
        ? 'bg-blue-600 text-white'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
      onclick={() => onYearChange(year)}
    >
      {year}
    </button>
  {/each}
</div>
