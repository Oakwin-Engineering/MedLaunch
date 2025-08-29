"use client";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Link from "next/link";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  } | null>(null);

  const handleEtlTrigger = async (source: string) => {
    setLoading((prev) => ({ ...prev, [source]: true }));
    setNotification(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/trigger-etl/${source}`,
        {
          method: "POST",
        }
      );

      const resultText = await response.text();

      if (!response.ok) {
        throw new Error(resultText || "ETL process failed");
      }

      setNotification({
        open: true,
        message:
          resultText || `ETL process for ${source} started successfully!`,
        severity: "success",
      });
    } catch (error) {
      setNotification({
        open: true,
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
        severity: "error",
      });
    } finally {
      setLoading((prev) => ({ ...prev, [source]: false }));
    }
  };

  const handleCloseNotification = () => {
    if (notification) {
      setNotification({ ...notification, open: false });
    }
  };

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
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Link
              href="/uhealth"
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
            <Button
              variant="contained"
              color="secondary"
              disabled={loading["uhealth"]}
              onClick={() => handleEtlTrigger("uhealth")}
              sx={{ minWidth: "130px" }}
            >
              {loading["uhealth"] ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Trigger Uhealth ETL"
              )}
            </Button>
          </Box>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Link
              href="/demo"
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
            <Button
              variant="contained"
              color="secondary"
              disabled={loading["demo"]}
              onClick={() => handleEtlTrigger("demo")}
              sx={{ minWidth: "130px" }}
            >
              {loading["demo"] ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Trigger Demo ETL"
              )}
            </Button>
          </Box>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Link
              href="/vitalcare"
              style={{
                textDecoration: "none",
                backgroundColor: "#673ab7",
                color: "white",
                padding: "8px 16px",
                borderRadius: "4px",
                transition: "background-color 0.3s",
              }}
            >
              VitalCare Data
            </Link>
            <Button
              variant="contained"
              color="secondary"
              disabled={loading["vitalcare"]}
              onClick={() => handleEtlTrigger("vitalcare")}
              sx={{ minWidth: "130px" }}
            >
              {loading["vitalcare"] ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Trigger VitalCare ETL"
              )}
            </Button>
          </Box>
        </Box>
      </Paper>
      {notification && (
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            sx={{ width: "100%" }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}
