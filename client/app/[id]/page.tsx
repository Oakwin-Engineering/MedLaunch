"use client";

import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import AppBar from "@mui/material/AppBar";
import CssBaseline from "@mui/material/CssBaseline";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import FinancialKpiTable from "../../component/Table";
import NavTreeView from "../../component/NavTreeView";
import { flat } from "../../utils";

interface TableData {
  id: string;
  label: string;
  data: any[];
}

const drawerWidth = 280;

export default function Page({ params }: { params: { id: string } }) {
  const [lastClickedItem, setLastClickedItem] = useState<string | null>(null);
  const [mergedTableAndNav, setMergedTableAndNav] = useState([]);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [providersOnly, setProvidersOnly] = useState(false);

  const flatData = useMemo(() => {
    if (mergedTableAndNav?.length > 0) return flat(mergedTableAndNav);
  }, [mergedTableAndNav]);

  useEffect(() => {
    const id = params.id;
    if (!id) {
      setError("No ID found in URL");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/table-data/${id}`)
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText);
        }
        return response.json();
      })
      .then((data) => {
        setMergedTableAndNav(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching table data:", error);
        setError(error.message);
        setIsLoading(false);
      });
  }, [params.id]);

  useEffect(() => {
    const tableData = flatData?.find((item) => item.id === lastClickedItem) as
      | TableData
      | undefined;
    setSelectedTable(tableData || null);
  }, [lastClickedItem, flatData]);

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, background: "white" }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h5" color="primary">
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
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", m: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ overflow: "auto", margin: 1 }}>
            {error && (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}

            <Box sx={{ m: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder={
                  providersOnly ? "Search providers..." : "Search clinics..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControlLabel
                sx={{ m: 1 }}
                control={
                  <Switch
                    checked={providersOnly}
                    onChange={(e) => setProvidersOnly(e.target.checked)}
                    size="small"
                  />
                }
                label="Providers only"
              />
            </Box>

            <NavTreeView
              setLastClickedItem={setLastClickedItem}
              hierarchy={
                providersOnly
                  ? // Flatten the tree and show only providers with unique labels
                    Array.from(
                      new Map(
                        flatData
                          ?.filter((item: any) => item.iconType === "person")
                          .map((item) => [
                            item.label,
                            { ...item, children: [] },
                          ])
                      ).values()
                    ).filter(
                      (item: any) =>
                        !searchQuery ||
                        item.label
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())
                    )
                  : // Show full hierarchy with search filter
                    mergedTableAndNav.filter((item: any) => {
                      const searchLower = searchQuery.toLowerCase();

                      const matchesSearch = (node: any): boolean => {
                        if (!searchLower) return true;

                        if (node.label.toLowerCase().includes(searchLower)) {
                          return true;
                        }

                        if (node.children) {
                          return node.children.some(matchesSearch);
                        }

                        return false;
                      };

                      return matchesSearch(item);
                    })
              }
            />
          </Box>
        )}
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Typography variant="h4">{selectedTable?.label}</Typography>
        <FinancialKpiTable tableData={selectedTable?.data || []} />
      </Box>
    </Box>
  );
}
