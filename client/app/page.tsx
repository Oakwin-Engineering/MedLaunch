"use client";

import * as React from "react";
import { createTheme } from "@mui/material/styles";
import ApartmentIcon from "@mui/icons-material/Apartment";
import PersonIcon from "@mui/icons-material/Person";
import { AppProvider, type Navigation } from "@toolpad/core/AppProvider";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { useDemoRouter } from "@toolpad/core/internal";
import FinancialKpiTable from "../component/Table";
import tableData from "../data/fakeTableData";

const NAVIGATION: Navigation = [
  {
    segment: "broadmoor_clinic",
    title: "Broadmoor Clinic",
    icon: <ApartmentIcon />,
    children: [
      {
        segment: "daniel_oukolov",
        title: "Daniel Oukolov",
        icon: <PersonIcon />,
      },
      {
        segment: "vehbi_karaagac",
        title: "Vehbi Karaagac",
        icon: <PersonIcon />,
      },
    ],
  },
  {
    segment: "mason_clinic",
    title: "Mason Clinic",
    icon: <ApartmentIcon />,
  },
];

function flat(array) {
  var result = [];
  array.forEach(function (a) {
    result.push(a);
    if (Array.isArray(a.children)) {
      result = result.concat(flat(a.children));
    }
  });
  return result;
}

const demoTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: "data-toolpad-color-scheme",
  },
  colorSchemes: { light: true, dark: true },
});

export default function DashboardLayoutBasic() {
  const router = useDemoRouter("/broadmoor_clinic");

  const flatData = flat(tableData);

  console.log(router.pathname);

  return (
    <AppProvider
      navigation={NAVIGATION}
      router={router}
      theme={demoTheme}
      branding={{ title: "MedLaunch Admin", logo: "" }}
    >
      <DashboardLayout>
        <div style={{ padding: 20 }}>
          <FinancialKpiTable
            tableData={
              flatData.find((item) => item.segment === router.pathname.slice(1))
                .data
            }
          />
        </div>
      </DashboardLayout>
    </AppProvider>
  );
}
