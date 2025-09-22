import { writable } from "svelte/store";

export const selectedNode = writable<any>(null);
export const showFlattenedHierarchy = writable<any>(null);
export const showRevisNetwork = writable<any>(null);
