import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { tableData, tableMonths } from "../data/fakeTableData";

// Map colorGroup to background color
const colorMap: Record<string, string> = {
  yellow: "#FFF9C4",
  orange: "#FFE0B2",
  grey: "#E0E0E0",
  blue: "#B3E5FC",
  green: "#C8E6C9",
  pink: "#F8BBD0",
};

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function FinancialKpiTable() {
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
          {/* Group rows by section */}
          {(() => {
            const grouped: Record<string, any[]> = {};
            tableData.forEach((row) => {
              if (!grouped[row.section]) grouped[row.section] = [];
              grouped[row.section].push(row);
            });
            const verticalSections = [
              "Initial Visits",
              "Subsequent Visits",
              "Discharge",
            ];
            return Object.entries(grouped).flatMap(([section, rows]) => {
              if (verticalSections.includes(section)) {
                // Render with vertical section label
                return rows.map((row, rowIdx) => {
                  const showSection = rowIdx === 0;
                  const sectionColor =
                    colorMap[row.colorGroup] ||
                    colorMap[rows[0].colorGroup] ||
                    "#fff";
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
                            background: isTotal ? sectionColor : sectionColor,
                            fontWeight: 700,
                            fontSize: 15,
                            color: "#222",
                            minWidth: 32,
                            maxWidth: 32,
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
                          background: isTotal ? sectionColor : undefined,
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
                            background: isTotal ? sectionColor : undefined,
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
                  const sectionColor =
                    colorMap[row.colorGroup] ||
                    colorMap[rows[0].colorGroup] ||
                    undefined;
                  const isTotal = row.type === "total";
                  // Only use section color for isSectionHeader rows, otherwise white
                  const rowBg = row.isSectionHeader ? sectionColor : "#fff";
                  return (
                    <TableRow
                      key={(row.code || row.label || "row") + section + rowIdx}
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
                            background: rowBg,
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
            });
          })()}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
