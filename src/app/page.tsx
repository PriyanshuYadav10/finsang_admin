"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Tabs, Tab, CircularProgress } from "@mui/material";
import ProductsTab from "../components/ProductsTab";
import GrowTab from "../components/GrowTab";
import TrainingsTab from "../components/TrainingsTab";
import LoginForm from "../components/LoginForm";
import { useAuth } from "../lib/auth-context";

export default function Dashboard() {
  const router = useRouter();
  // Main tab state
  const [activeTab, setActiveTab] = useState(0); // 0: Products, 1: Grow, 2: Trainings

  // Authentication
  const { isAuthenticated, loading, isAdmin } = useAuth();

  // Redirect authenticated admins to /admin route
  useEffect(() => {
    if (!loading && isAuthenticated && isAdmin) {
      router.push("/admin");
    }
  }, [isAuthenticated, isAdmin, loading, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // If user is authenticated but not admin, show the regular dashboard
  // (This handles the case where a regular user is authenticated)
  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: "background.default",
        minHeight: "100vh",
        py: 4,
      }}
    >
      <Box
        sx={{
          maxWidth: 1400,
          mx: "auto",
          bgcolor: "background.paper",
          borderRadius: 3,
          boxShadow: 3,
          p: { xs: 2, md: 4 },
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab label="Products" />
          <Tab label="Grow" />
          <Tab label="Trainings" />
        </Tabs>
        {/* Tab Content */}
        {activeTab === 0 && (
          <Box>
            <ProductsTab />
          </Box>
        )}
        {activeTab === 1 && (
          <Box>
            <GrowTab />
          </Box>
        )}
        {activeTab === 2 && (
          <Box>
            <TrainingsTab />
          </Box>
        )}
      </Box>
    </Box>
  );
}
