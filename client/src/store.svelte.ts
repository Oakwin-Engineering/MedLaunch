import { FilterMode } from "./constants";

export const store = $state({
  customerID: "",
  selectedNode: null as any,
  sidebarCategory: FilterMode.LocationOnly,
  tableData: [] as any[],
  flattenedHierarchy: [] as any[],
  isDrawerOpen: false,
  currentDashboard: "PhysicianPerformance",
});
