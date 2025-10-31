import { FilterMode } from "./constants";

// Type for year-keyed dashboard data
type YearData = {
  [year: string]: any[];
};

// Type for single dashboard structure
type DashboardData = {
  providerRankings: Record<string, any>;
  providerPerformance: YearData;
  financial: Record<string, any>;
  operational: Record<string, any>;
  clinical: Record<string, any>;
};

// Type for all dashboards structure (Athelas + AllScripts)
type AllDashboards = {
  providerRankings: Record<string, any>;
  providerPerformance: YearData;
  financial: Record<string, any>;
  operational: Record<string, any>;
  clinical: Record<string, any>;
  allscripts?: DashboardData;
};

export type DataSource = "athelas" | "allscripts";

export const store = $state({
  customerID: "",
  selectedNode: null as any,
  sidebarCategory: FilterMode.LocationOnly,
  allDashboards: {} as AllDashboards,
  isDrawerOpen: false,
  currentDashboard: "", // Initialized dynamically based on current route
  dataSource: "athelas" as DataSource, // Toggle between "athelas" and "allscripts"
});
