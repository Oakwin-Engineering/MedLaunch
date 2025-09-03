<script lang="ts">
  import SidebarNode from "./SidebarNode.svelte";
  import { SidebarItem, SidebarDropdownWrapper } from "flowbite-svelte";
  import { selectedNode } from "../store";
  import { UserSolid, BuildingSolid } from "flowbite-svelte-icons";

  let { node } = $props();

  function handleClick(event: MouseEvent) {
    event.stopPropagation(); // Prevent event from bubbling up
    selectedNode.set(node);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.stopPropagation(); // Prevent event from bubbling up
      selectedNode.set(node);
    }
  }

  const iconMap: Record<string, any> = {
    clinic: BuildingSolid,
    person: UserSolid,
  };

  const IconComponent = iconMap[node.iconType];
</script>

{#if node.children && node.children.length > 0}
  <div
    onclick={handleClick}
    onkeydown={handleKeyDown}
    role="button"
    tabindex="0"
  >
    <SidebarDropdownWrapper label={node.label} class="sidebar-item break-words">
      {#snippet icon()}
        <IconComponent
          class="h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
        />
      {/snippet}
      {#each node.children as childNode}
        <SidebarNode node={childNode} />
      {/each}
    </SidebarDropdownWrapper>
  </div>
{:else}
  <div
    onclick={handleClick}
    onkeydown={handleKeyDown}
    role="button"
    tabindex="0"
  >
    <SidebarItem label={node.label} class="sidebar-item break-words">
      {#snippet icon()}
        <IconComponent
          class="h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
        />
      {/snippet}
    </SidebarItem>
  </div>
{/if}

<style>
  :global(.sidebar-item > button > span) {
    white-space: normal;
    margin-right: 1rem;
  }
</style>
