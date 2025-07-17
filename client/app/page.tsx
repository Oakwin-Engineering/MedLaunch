"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { createTheme } from "@mui/material/styles";
import ApartmentIcon from "@mui/icons-material/Apartment";
import PersonIcon from "@mui/icons-material/Person";
import { AppProvider, type Navigation } from "@toolpad/core/AppProvider";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { useDemoRouter } from "@toolpad/core/internal";
import FinancialKpiTable from "../component/Table";

const NAVIGATION: Navigation = [
  {
    segment: "reports",
    title: "Reports",
    icon: <ApartmentIcon />,
    children: [
      {
        segment: "sales",
        title: "Sales",
        icon: <PersonIcon />,
      },
      {
        segment: "traffic",
        title: "Traffic",
        icon: <PersonIcon />,
      },
    ],
  },
  {
    segment: "integrations",
    title: "Integrations",
    icon: <ApartmentIcon />,
  },
];

const demoTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: "data-toolpad-color-scheme",
  },
  colorSchemes: { light: true, dark: true },
});

function DemoPageContent({ pathname }: { pathname: string }) {
  return (
    <Box>
      <Typography>Dashboard content for {pathname}</Typography>
    </Box>
  );
}

export default function DashboardLayoutBasic() {
  const router = useDemoRouter();

  return (
    <AppProvider
      navigation={NAVIGATION}
      router={router}
      theme={demoTheme}
      branding={{ title: "MedLaunch Admin", logo: "" }}
    >
      <DashboardLayout>
        <div style={{ padding: 20 }}>
          <FinancialKpiTable />
        </div>
      </DashboardLayout>
    </AppProvider>
  );
}
