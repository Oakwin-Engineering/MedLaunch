<script lang="ts">
  import {
    UserSolid,
    BuildingSolid,
    MapPinSolid,
    ChevronDownOutline,
  } from "flowbite-svelte-icons";
  import SidebarNode from "./SidebarNode.svelte";
  import { store } from "../store.svelte";

  const iconMap: Record<string, any> = {
    clinic: BuildingSolid,
    person: UserSolid,
    division: MapPinSolid,
    state: MapPinSolid,
  };

  let { node, depth = 0 } = $props();
  let isOpen = $state(false);

  const handleClick = () => {
    isOpen = !isOpen;
    store.selectedNode = node;
  };

  const IconComponent = $derived(iconMap[node.iconType]);
  const isParent = $derived(node.children && node.children.length > 0);
  const isSelected = $derived(
    store.selectedNode && store.selectedNode.id === node.id
  );
</script>

<div
  class="node-item flex cursor-pointer items-center rounded-lg p-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 {isSelected
    ? 'bg-gray-200 dark:bg-gray-600'
    : ''}"
  style="padding-left: {depth * 1.5 + 0.5}rem;"
  onclick={handleClick}
  onkeydown={handleClick}
  role="button"
  tabindex="0"
>
  {#if IconComponent}
    <IconComponent
      class="h-5 w-5 flex-shrink-0 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
    />
  {/if}
  <span class="ml-3 flex-1">{node.label}</span>
  {#if isParent}
    <ChevronDownOutline
      class="h-6 w-6 transform transition-transform duration-200 {isOpen
        ? 'rotate-180'
        : ''}"
    />
  {/if}
</div>

{#if isOpen && isParent}
  <div>
    {#each node.children as childNode}
      <SidebarNode node={childNode} depth={depth + 1} />
    {/each}
  </div>
{/if}
