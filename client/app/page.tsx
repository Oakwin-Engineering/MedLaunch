"use client";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Link from "next/link";

export default function Home() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          textAlign: "center",
          maxWidth: "600px",
        }}
      >
        <Typography variant="h4" gutterBottom color="primary">
          MedLaunch Admin
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Please provide a customer ID in the URL to view the dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mt: 3, mb: 2 }}>
          Available Dashboards
        </Typography>
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          <Link
            href="/1f10153b-8f03-4608-a4f7-e225efc8b4b4"
            style={{
              textDecoration: "none",
              backgroundColor: "#1976d2",
              color: "white",
              padding: "8px 16px",
              borderRadius: "4px",
              transition: "background-color 0.3s",
            }}
          >
            UHealth Data
          </Link>
          <Link
            href="/c1d17c1b-f8e3-479b-89ef-cf10bf2f1751"
            style={{
              textDecoration: "none",
              backgroundColor: "#2e7d32",
              color: "white",
              padding: "8px 16px",
              borderRadius: "4px",
              transition: "background-color 0.3s",
            }}
          >
            Demo Data
          </Link>
        </Box>
      </Paper>
    </Box>
  );
}
