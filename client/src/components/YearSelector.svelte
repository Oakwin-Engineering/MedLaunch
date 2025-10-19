<script lang="ts">
  import { ButtonGroup, Button } from "flowbite-svelte";

  let { availableYears, activeYear, onYearChange, disabled = false } = $props<{
    availableYears: string[];
    activeYear: string;
    onYearChange: (year: string) => void;
    disabled?: boolean;
  }>();
</script>

<div class="mb-6">
  <ButtonGroup>
    {#each availableYears as year}
      <Button
        color={activeYear === year ? "blue" : "light"}
        onclick={() => onYearChange(year)}
        {disabled}
      >
        {year}
      </Button>
    {/each}
  </ButtonGroup>
</div>
