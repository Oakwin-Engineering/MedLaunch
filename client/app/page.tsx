"use client";

import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import AppBar from "@mui/material/AppBar";
import CssBaseline from "@mui/material/CssBaseline";
import RefreshIcon from "@mui/icons-material/Refresh";
import CircularProgress from "@mui/material/CircularProgress";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useDemoRouter } from "@toolpad/core/internal";
import FinancialKpiTable from "../component/Table";
import NavTreeView from "../component/NavTreeView";
import { flat } from "../utils";

const drawerWidth = 280;

export default function DashboardLayoutBasic() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useDemoRouter("");
  const [lastClickedItem, setLastClickedItem] = useState<string | null>(null);

  // Giant JSON with navigation hierarchy and tables together
  const [mergedTableAndNav, setMergedTableAndNav] = useState([]);

  // the table to show when user clicks on a navigation bar entity (clinic/provider)
  const [selectedTable, setSelectedTable] = useState<any[]>([]);

  console.log(selectedTable?.data);

  const flatData = useMemo(() => {
    if (mergedTableAndNav?.length > 0) return flat(mergedTableAndNav);
  }, [mergedTableAndNav]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/table-data`)
      .then((response) => response.json())
      .then((data) => setMergedTableAndNav(data))
      .catch((error) => console.error("Error fetching table data:", error));
  }, []);

  useEffect(() => {
    const tableData = flatData?.find((item) => item.id === lastClickedItem);
    setSelectedTable(tableData);
  }, [lastClickedItem, flatData]);

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, background: "white" }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography
            variant="h6"
            noWrap
            component="div"
            fontWeight={700}
            color="rgb(56,116,203)"
          >
            MedLaunch Admin
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ ml: 2, minWidth: 120 }}
            disabled={isLoading}
            endIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
            onClick={() => {
              setIsLoading(true);
              fetch(`${process.env.NEXT_PUBLIC_API_URL}/trigger-etl`)
                .then((response) => response.json())
                .then((data) => {
                  console.log(data);
                  setIsLoading(false);
                })
                .catch((error) => {
                  console.error("Error fetching table data:", error);
                  setIsLoading(false);
                });
            }}
          >
            {isLoading ? 'Processing...' : 'Trigger ETL'}
          </Button>
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
            hierarchy={mergedTableAndNav}
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
