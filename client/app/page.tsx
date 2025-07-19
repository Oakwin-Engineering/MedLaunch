"use client";

import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import AppBar from "@mui/material/AppBar";
import CssBaseline from "@mui/material/CssBaseline";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useDemoRouter } from "@toolpad/core/internal";
import FinancialKpiTable from "../component/Table";
import NavTreeView from "../component/NavTreeView";
import fakeMergedTableAndNav from "../data/fakeMergedTableAndNav";
import styles from "./page.module.css";
import { flat } from "../utils";

const drawerWidth = 280;

export default function DashboardLayoutBasic() {
  const router = useDemoRouter("");
  const [lastClickedItem, setLastClickedItem] = useState<string | null>(null);

  // Giant JSON with navigation hierarchy and tables together
  const [mergedTableAndNav, setMergedTableAndNav] = useState(
    fakeMergedTableAndNav
  );

  // the table to show when user clicks on a navigation bar entity (clinic/provider)
  const [selectedTable, setSelectedTable] = useState<any[]>([]);

  const flatData = useMemo(
    () => flat(fakeMergedTableAndNav),
    [fakeMergedTableAndNav]
  );

  useEffect(() => {
    const tableData = flatData.find((item) => item.id === lastClickedItem);
    setSelectedTable(tableData);
  }, [lastClickedItem, flatData]);

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, background: "white" }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            noWrap
            component="div"
            fontWeight={700}
            color="rgb(56,116,203)"
          >
            MedLaunch Admin
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto", margin: 1 }}>
          <NavTreeView
            setLastClickedItem={setLastClickedItem}
            hierarchy={fakeMergedTableAndNav}
          />
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Typography variant="h4">{selectedTable?.label}</Typography>
        <FinancialKpiTable tableData={selectedTable?.data} />
      </Box>
    </Box>
  );
}
