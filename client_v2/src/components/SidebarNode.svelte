<script lang="ts">
  import SidebarNode from "./SidebarNode.svelte";
  import { SidebarItem, SidebarDropdownWrapper } from "flowbite-svelte";
  import { FolderSolid, UserSolid, BuildingSolid } from "flowbite-svelte-icons";

  let { node } = $props();

  const iconMap: Record<string, any> = {
    clinic: BuildingSolid,
    person: UserSolid,
    default: FolderSolid,
  };

  const IconComponent =
    (node.iconType && iconMap[node.iconType]) || iconMap.default;
</script>

{#if node.children && node.children.length > 0}
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
{:else}
  <SidebarItem label={node.label} class="sidebar-item break-words">
    {#snippet icon()}
      <IconComponent
        class="h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
      />
    {/snippet}
  </SidebarItem>
{/if}

<style>
  :global(.sidebar-item > button > span) {
    white-space: normal;
    margin-right: 1rem;
  }
</style>
