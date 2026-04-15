"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Container,
  ThemeProvider,
  createTheme,
  Avatar,
  Stack,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Drawer,
  CssBaseline,
  AppBar,
  Toolbar,
} from "@mui/material";

import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Image as ImageIcon,
  People as PeopleIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { LineChart, BarChart } from "@mui/x-charts";
import { useAuth } from "../../lib/auth-context";
import ProductsTab from "../../components/ProductsTab";
import GrowTab from "../../components/GrowTab";
import TrainingsTab from "../../components/TrainingsTab";
import BannersTab from "../../components/BannersTab";
import LeadsManagement from "./manage/leads";
import apiClient from "../../lib/api-client";

const drawerWidth = 280;

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { id: "products", label: "Products", icon: <InventoryIcon /> },
  { id: "grow", label: "Grow", icon: <TrendingUpIcon /> },
  { id: "trainings", label: "Trainings", icon: <SchoolIcon /> },
  { id: "banners", label: "Banners", icon: <ImageIcon /> },
  { id: "leads", label: "Leads", icon: <PeopleIcon /> },
];

interface DashboardStats {
  totalLeads: number;
  pendingLeads: number;
  contactedLeads: number;
  appliedLeads: number;
  rejectedLeads: number;
  totalProducts: number;
  recentLeads: Array<{
    id: string;
    user_name: string;
    product_name: string;
    status: string;
    created_at: string;
  }>;
  leadsByDate: Array<{ date: string; count: number }>;
}

export default function AdminDashboard() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const [activeView, setActiveView] = useState("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [analytics, setAnalytics] = useState<any>(null);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          primary: { main: "#C89116" },
          secondary: { main: "#a21caf" },
        },
        typography: {
          fontFamily: [
            "Inter",
            "Roboto",
            "Helvetica",
            "Arial",
            "sans-serif",
          ].join(","),
        },
      }),
    [darkMode]
  );

  const calculateLeadsByDate = (leads: any[], start: string, end: string) => {
    const dateCounts: { [key: string]: number } = {};

    leads.forEach((lead) => {
      const leadDate = new Date(lead.created_at).toISOString().split("T")[0];

      if (start && end) {
        if (leadDate >= start && leadDate <= end) {
          dateCounts[leadDate] = (dateCounts[leadDate] || 0) + 1;
        }
      } else {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const leadDateObj = new Date(leadDate);

        if (leadDateObj >= thirtyDaysAgo) {
          dateCounts[leadDate] = (dateCounts[leadDate] || 0) + 1;
        }
      }
    });

    return Object.entries(dateCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const [allLeadsData, setAllLeadsData] = useState<any[]>([]);

  const fetchAllLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const [leadsResponse, analyticsData] = await Promise.all([
        fetch("/api/shared-products/leads?page=1&limit=1000"),
        apiClient.getAnalyticsOverview(),
      ]);

      const allLeadsData = await leadsResponse.json();

      setAllLeadsData(allLeadsData.leads || []);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const updateDashboardStats = useMemo(() => {
    if (allLeadsData.length === 0) return null;

    const leadsByDate = calculateLeadsByDate(allLeadsData, startDate, endDate);

    return {
      totalLeads: allLeadsData.length,
      pendingLeads: allLeadsData.filter(
        (lead: any) => lead.status === "pending"
      ).length,
      contactedLeads: allLeadsData.filter(
        (lead: any) => lead.status === "contacted"
      ).length,
      appliedLeads: allLeadsData.filter(
        (lead: any) => lead.status === "applied"
      ).length,
      rejectedLeads: allLeadsData.filter(
        (lead: any) => lead.status === "rejected"
      ).length,
      totalProducts: 0,
      recentLeads: allLeadsData.slice(0, 5),
      leadsByDate,
    };
  }, [allLeadsData, startDate, endDate]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchAllLeads();

      const timeout = setTimeout(() => {
        setLoading(false);
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    if (updateDashboardStats) {
      setStats(updateDashboardStats);
      setLoading(false);
    }
  }, [updateDashboardStats]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const renderStatsCard = (
    title: string,
    value: string | number,
    icon: React.ReactNode,
    color: string
  ) => (
    <Card sx={{ height: "100%", borderRadius: 2, boxShadow: 1 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h4" fontWeight="bold" color={color}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {title}
            </Typography>
          </Box>
          <Box sx={{ color, opacity: 0.8 }}>{icon}</Box>
        </Stack>
      </CardContent>
    </Card>
  );

  const renderChart = (data: any[], type: "line" | "bar" = "line") => {
    if (!data || data.length === 0)
      return <Typography color="text.secondary">No data available</Typography>;

    const chartData = data.map((item) => item.leads || item.count || 0);
    const labels = data.map((item) => item.month || item.date || "");

    if (Math.max(...chartData) === 0)
      return <Typography color="text.secondary">No data to display</Typography>;

    return (
      <Box sx={{ height: 300, width: "100%" }}>
        {type === "line" ? (
          <LineChart
            xAxis={[{ scaleType: "point", data: labels }]}
            series={[{ data: chartData, color: "#1976d2" }]}
            height={300}
          />
        ) : (
          <BarChart
            xAxis={[{ scaleType: "band", data: labels }]}
            series={[{ data: chartData, color: "#1976d2" }]}
            height={300}
          />
        )}
      </Box>
    );
  };

  const renderQuickLinks = () => (
    <Card sx={{ borderRadius: 2, boxShadow: 1, mb: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Quick Actions
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
            gap: 2,
          }}
        >
          <Button
            fullWidth
            variant="outlined"
            startIcon={<InventoryIcon />}
            onClick={() => setActiveView("products")}
            sx={{ py: 1.5, borderRadius: 2 }}
          >
            Products
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<PeopleIcon />}
            onClick={() => setActiveView("leads")}
            sx={{ py: 1.5, borderRadius: 2 }}
          >
            Leads
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ImageIcon />}
            onClick={() => setActiveView("banners")}
            sx={{ py: 1.5, borderRadius: 2 }}
          >
            Banners
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const renderDashboard = () => (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Dashboard Overview
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <>
          {renderQuickLinks()}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 3,
              mb: 4,
            }}
          >
            {renderStatsCard(
              "Total Leads",
              analytics?.totalLeads || stats?.totalLeads || 0,
              <PeopleIcon fontSize="large" />,
              "#1976d2"
            )}
            {renderStatsCard(
              "Revenue",
              `₹${(analytics?.totalRevenue || 0).toLocaleString()}`,
              <span>₹</span>,
              "#2e7d32"
            )}
            {renderStatsCard(
              "Products",
              analytics?.totalProducts || 0,
              <InventoryIcon fontSize="large" />,
              "#ed6c02"
            )}
            {renderStatsCard(
              "Conversion",
              `${analytics?.conversionRate || 0}%`,
              <TrendingUpIcon fontSize="large" />,
              "#9c27b0"
            )}
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "7fr 5fr" },
              gap: 3,
              mb: 4,
            }}
          >
            <Card sx={{ borderRadius: 2, boxShadow: 1, height: 400 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Leads Trend
                </Typography>
                {analytics?.leadsByMonth &&
                  renderChart(analytics.leadsByMonth, "line")}
                <Box
                  sx={{
                    mt: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.75rem",
                    color: "text.secondary",
                  }}
                >
                  {analytics?.leadsByMonth?.map((item: any, index: number) => (
                    <span key={index}>{item.month}</span>
                  ))}
                </Box>
              </CardContent>
            </Card>
            <Card sx={{ borderRadius: 2, boxShadow: 1, height: 400 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Live Status Distribution
                </Typography>
                {analytics?.statusDistribution?.map((item: any) => (
                  <Box key={item.status} sx={{ mb: 2 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      mb={0.5}
                    >
                      <Typography variant="body2" textTransform="capitalize">
                        {item.status}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {item.count} ({item.percentage}%)
                      </Typography>
                    </Stack>
                    <Box
                      sx={{ bgcolor: "#f5f5f5", borderRadius: 1, height: 8 }}
                    >
                      <Box
                        sx={{
                          bgcolor:
                            item.status === "pending"
                              ? "#ed6c02"
                              : item.status === "contacted"
                              ? "#1976d2"
                              : item.status === "applied"
                              ? "#2e7d32"
                              : "#d32f2f",
                          height: "100%",
                          borderRadius: 1,
                          width: `${item.percentage}%`,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>

          {stats?.recentLeads && (
            <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Recent Leads
                </Typography>
                <List>
                  {stats.recentLeads.map((lead, index) => (
                    <ListItem
                      key={lead.id}
                      divider={index < stats.recentLeads.length - 1}
                    >
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: "primary.main",
                          }}
                        >
                          {lead.user_name.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={lead.user_name}
                        secondary={`${lead.product_name} • ${new Date(
                          lead.created_at
                        ).toLocaleDateString()}`}
                      />
                      <Chip
                        label={lead.status}
                        size="small"
                        color={
                          lead.status === "pending"
                            ? "warning"
                            : lead.status === "contacted"
                            ? "info"
                            : lead.status === "applied"
                            ? "success"
                            : "error"
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return renderDashboard();
      case "products":
        return <ProductsTab />;
      case "grow":
        return <GrowTab />;
      case "trainings":
        return <TrainingsTab />;
      case "banners":
        return <BannersTab />;
      case "leads":
        return <LeadsManagement />;

      default:
        return renderDashboard();
    }
  };

  const drawer = (
    <Box>
      <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="h6" fontWeight="bold" color="primary">
          Finsang Admin
        </Typography>
      </Box>

      <List sx={{ px: 2, py: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            key={item.id}
            onClick={() => setActiveView(item.id)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              cursor: "pointer",
              bgcolor: activeView === item.id ? "primary.main" : "transparent",
              color: activeView === item.id ? "white" : "text.primary",
              "&:hover": {
                bgcolor:
                  activeView === item.id ? "primary.dark" : "action.hover",
              },
            }}
          >
            <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Please log in to access the admin dashboard.
        </Alert>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Access denied. Admin privileges required.
        </Alert>
      </Container>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />

        {/* App Bar */}
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            bgcolor: "background.paper",
            color: "text.primary",
            boxShadow: 1,
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: "none" } }}
            >
              <MenuIcon />
            </IconButton>

            <Box sx={{ flexGrow: 1 }} />

            <Stack direction="row" alignItems="center" spacing={2}>
              {user && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar
                    sx={{ width: 32, height: 32, bgcolor: "primary.main" }}
                  >
                    {user.name
                      ? user.name.charAt(0).toUpperCase()
                      : user.email.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ display: { xs: "none", md: "block" } }}>
                    <Typography variant="body2" fontWeight="medium">
                      {user.name || user.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.role}
                    </Typography>
                  </Box>
                </Stack>
              )}

              <IconButton
                onClick={() => setDarkMode(!darkMode)}
                color="inherit"
              >
                {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>

              <IconButton onClick={handleLogout} color="inherit">
                <LogoutIcon />
              </IconButton>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Drawer */}
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
              },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", sm: "block" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            mt: 8,
            bgcolor: "background.default",
            minHeight: "100vh",
          }}
        >
          {renderContent()}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
