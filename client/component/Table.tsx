import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { formatCurrency } from "../utils";
import { colorMap, tableMonths, verticalSections } from "../constants";

const collapsibleSections = ["Payroll", "RVUs", "Charges", "Payments"];

export default function FinancialKpiTable({
  tableData = [],
}: {
  tableData: any[];
}) {
  const [collapsedState, setCollapsedState] = React.useState<
    Record<string, boolean>
  >(
    collapsibleSections.reduce(
      (acc, sectionName) => ({ ...acc, [sectionName]: true }),
      {}
    )
  );

  if (tableData.length === 0) return null;

  const grouped: Record<string, any[]> = {};
  tableData.forEach((row) => {
    if (!grouped[row.section]) grouped[row.section] = [];
    grouped[row.section].push(row);
  });

  return (
    <TableContainer component={Paper} sx={{ boxShadow: 2, borderRadius: 2 }}>
      <Table aria-label="financial performance table" size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, fontSize: 15, width: 80 }}>
              &nbsp;
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: 15, width: 80 }}>
              Code/Description
            </TableCell>
            {tableMonths.map((month) => (
              <TableCell
                key={month}
                align="center"
                sx={{
                  fontWeight: 700,
                  fontSize: 15,
                  background:
                    month === "Totals"
                      ? "#D3D3D3"
                      : month === "Coding %"
                        ? "#E1A9E2"
                        : undefined,
                }}
              >
                {month}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(grouped).map(([section, rows]) => {
            if (verticalSections.includes(section)) {
              // Render with vertical section label
              return rows.map((row, rowIdx) => {
                const showSection = rowIdx === 0;
                const sectionColor = colorMap[row.colorGroup];
                const isTotal = row.type === "total";

                return (
                  <TableRow
                    key={(row.code || row.label || "row") + section + rowIdx}
                  >
                    {showSection && (
                      <TableCell
                        rowSpan={rows.length}
                        sx={{
                          writingMode: "vertical-rl",
                          textAlign: "center",
                          background: sectionColor,
                          fontWeight: 700,
                          fontSize: 15,
                          color: "#222",
                          borderRight: "2px solid #fff",
                        }}
                      >
                        {section}
                      </TableCell>
                    )}
                    <TableCell
                      sx={{
                        fontWeight: isTotal ? 700 : 500,
                        fontSize: 14,
                        background: isTotal ? sectionColor : "",
                      }}
                    >
                      {row.code ? row.code : row.label}
                    </TableCell>
                    {row.values.map((val: any, i: number) => (
                      <TableCell
                        key={i}
                        align="center"
                        sx={{
                          fontWeight: isTotal ? 700 : 400,
                          background:
                            section === "Operating Profit Margin"
                              ? val < 0
                                ? "#ffcdd2"
                                : val > 0
                                  ? "#c8e6c9"
                                  : ""
                              : isTotal
                                ? sectionColor
                                : "",
                        }}
                      >
                        {row.isCurrency && val ? formatCurrency(val) : val}
                      </TableCell>
                    ))}
                    {/* Totals column (grey) */}
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: isTotal ? 700 : 400,
                        background: "#D3D3D3", // Always grey for Totals
                      }}
                    >
                      {row.isCurrency && row.total
                        ? formatCurrency(row.total)
                        : row.total}
                    </TableCell>
                    {/* Coding % column (colored) */}
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: isTotal ? 700 : 400,
                        background: "#E1A9E2", // Always purple for Coding %
                      }}
                    >
                      {row.coding}
                    </TableCell>
                  </TableRow>
                );
              });
            } else {
              // Render with empty first cell and restore section color across the row
              return rows.map((row, rowIdx) => {
                const sectionColor = colorMap[row.colorGroup];
                const isTotal = row.type === "total";
                const rowBg = row.isSectionHeader ? sectionColor : "#fff";

                const isCollapsible = collapsibleSections.includes(section);
                const isHeader = row.isSectionHeader;
                const isCollapsed = collapsedState[section];
                const hasChildren = rows.length > 1;

                if (isCollapsible && !isHeader && isCollapsed && hasChildren) {
                  return null;
                }

                const isCollapsibleHeader = isCollapsible && isHeader && hasChildren;

                return (
                  <TableRow
                    key={(row.code || row.label || "row") + section + rowIdx}
                    onClick={() =>
                      isCollapsibleHeader &&
                      setCollapsedState((prev) => ({
                        ...prev,
                        [section]: !prev[section],
                      }))
                    }
                    sx={{ cursor: isCollapsibleHeader ? "pointer" : "default" }}
                  >
                    {/* Empty section cell for alignment */}
                    <TableCell
                      sx={{ background: rowBg, minWidth: 32, maxWidth: 32 }}
                    />
                    <TableCell
                      sx={{
                        fontWeight: isTotal ? 700 : 500,
                        fontSize: 14,
                        background: rowBg,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {isCollapsibleHeader && (
                        <IconButton size="small">
                          {isCollapsed ? (
                            <KeyboardArrowDownIcon />
                          ) : (
                            <KeyboardArrowUpIcon />
                          )}
                        </IconButton>
                      )}
                      {row.code ? row.code : row.label}
                    </TableCell>
                    {row.values.map((val: any, i: number) => (
                      <TableCell
                        key={i}
                        align="center"
                        sx={{
                          fontWeight: isTotal ? 700 : 400,
                          background:
                            section === "Operating Profit Margin"
                              ? val < 0
                                ? "#ffcdd2"
                                : val > 0
                                  ? "#c8e6c9"
                                  : rowBg
                              : rowBg,
                        }}
                      >
                        {row.isCurrency && val ? formatCurrency(val) : val}
                      </TableCell>
                    ))}
                    {/* Totals column (grey) */}
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: isTotal ? 700 : 400,
                        background: "#D3D3D3", // Always grey for Totals
                      }}
                    >
                      {row.isCurrency && row.total
                        ? formatCurrency(row.total)
                        : row.total}
                    </TableCell>
                    {/* Coding % column (colored) */}
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: isTotal ? 700 : 400,
                        background: "#E1A9E2", // Always purple for Coding %
                      }}
                    >
                      {row.coding}
                    </TableCell>
                  </TableRow>
                );
              });
            }
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
