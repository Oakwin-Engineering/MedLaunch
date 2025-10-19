import { FilterMode } from "./constants";

// Type for year-keyed dashboard data
type YearData = {
  [year: string]: any[];
};

// Type for all dashboards structure
type AllDashboards = {
  providerRankings: Record<string, any>;
  providerPerformance: YearData;
  financial: Record<string, any>;
  operational: Record<string, any>;
  clinical: Record<string, any>;
};

export const store = $state({
  customerID: "",
  selectedNode: null as any,
  sidebarCategory: FilterMode.LocationOnly,
  allDashboards: {} as AllDashboards,
  isDrawerOpen: false,
  currentDashboard: "", // Initialized dynamically based on current route
});
