"use client";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";

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
      </Paper>
    </Box>
  );
}
