"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  Divider,
  Tooltip,
  Stack,
  InputAdornment,
  LinearProgress,
  Fab,
} from "@mui/material";

import {
  Edit as EditIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Cancel as CancelIcon,
  Download as DownloadIcon,
  DateRange as DateRangeIcon,
} from "@mui/icons-material";

interface Lead {
  id: string;
  finsang_id?: number;
  product_name: string;
  user_name: string;
  user_mobile: string;
  user_email: string;
  user_income: number | null;
  user_pincode: string;
  user_age: number;
  sender_name: string | null;
  sender_phone: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  product_application_url: string;
}

interface UserDetailsUpdate {
  leadId: string;
  user_name: string;
  user_mobile: string;
  user_email: string;
  user_income: number | null;
  user_pincode: string;
  user_age: number;
}

export default function LeadsManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    lead: Lead | null;
  }>({ open: false, lead: null });
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");

  // User details editing state
  const [userDetailsDialog, setUserDetailsDialog] = useState<{
    open: boolean;
    lead: Lead | null;
  }>({ open: false, lead: null });
  const [editingUserDetails, setEditingUserDetails] =
    useState<UserDetailsUpdate>({
      leadId: "",
      user_name: "",
      user_mobile: "",
      user_email: "",
      user_income: null,
      user_pincode: "",
      user_age: 0,
    });

  // Download report modal state
  const [downloadDialog, setDownloadDialog] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Debounced search state
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        status: statusFilter,
        search: debouncedSearch,
      });

      const response = await fetch(`/api/shared-products/leads?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch leads");
      }

      const data = await response.json();
      setLeads(data.leads);
      setTotal(data.pagination.total);
    } catch (err) {
      setError("Failed to fetch leads");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, debouncedSearch]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch leads when dependencies change
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleEditLead = (lead: Lead) => {
    setEditDialog({ open: true, lead });
    setEditNotes(lead.notes || "");
    setEditStatus(lead.status);
  };

  const handleEditUserDetails = (lead: Lead) => {
    setEditingUserDetails({
      leadId: lead.id,
      user_name: lead.user_name,
      user_mobile: lead.user_mobile,
      user_email: lead.user_email,
      user_income: lead.user_income,
      user_pincode: lead.user_pincode,
      user_age: lead.user_age,
    });
    setUserDetailsDialog({ open: true, lead });
  };

  const handleSaveEdit = async () => {
    if (!editDialog.lead) return;

    try {
      const response = await fetch("/api/shared-products/leads", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId: editDialog.lead.id,
          status: editStatus,
          notes: editNotes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update lead");
      }

      setEditDialog({ open: false, lead: null });
      fetchLeads(); // Refresh the list
    } catch (err) {
      setError("Failed to update lead");
      console.error(err);
    }
  };

  const handleSaveUserDetails = async () => {
    try {
      const response = await fetch("/api/shared-products/leads", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingUserDetails),
      });

      if (!response.ok) {
        throw new Error("Failed to update user details");
      }

      setUserDetailsDialog({ open: false, lead: null });
      fetchLeads(); // Refresh the list
    } catch (err) {
      setError("Failed to update user details");
      console.error(err);
    }
  };

  const setQuickDateRange = (range: "week" | "month") => {
    const today = new Date();
    const endDate = today.toISOString().split("T")[0];

    if (range === "week") {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(weekAgo.toISOString().split("T")[0]);
    } else {
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(monthAgo.toISOString().split("T")[0]);
    }

    setEndDate(endDate);
  };

  const downloadReport = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 31) {
      setError("Maximum date range is 31 days");
      return;
    }

    try {
      setDownloadLoading(true);

      // Fetch leads data for the selected date range
      const params = new URLSearchParams({
        page: "1",
        limit: "1000",
        status: "all",
        search: "",
        startDate: startDate,
        endDate: endDate,
      });

      const response = await fetch(`/api/shared-products/leads?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch leads for download");
      }

      const data = await response.json();

      // Create CSV content
      const csvHeaders = [
        "Finsang ID",
        "User Name",
        "Mobile",
        "Email",
        "Age",
        "Pincode",
        "Income",
        "Product Name",
        "Status",
        "Created Date",
        "Sender Name",
        "Notes",
      ].join(",");

      const csvRows = data.leads.map((lead: Lead) =>
        [
          lead.finsang_id || "N/A",
          `"${lead.user_name}"`,
          lead.user_mobile,
          `"${lead.user_email}"`,
          lead.user_age,
          lead.user_pincode,
          lead.user_income || "",
          `"${lead.product_name}"`,
          lead.status,
          new Date(lead.created_at).toLocaleDateString("en-IN"),
          `"${lead.sender_name || ""}"`,
          `"${lead.notes || ""}"`,
        ].join(",")
      );

      const csvContent = [csvHeaders, ...csvRows].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `leads_report_${startDate}_to_${endDate}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadDialog(false);
      setStartDate("");
      setEndDate("");
      setError(null);
    } catch (err) {
      setError("Failed to download report");
      console.error(err);
    } finally {
      setDownloadLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return { bg: "#FFF3E0", color: "#E65100", border: "#FFB74D" };
      case "contacted":
        return { bg: "#E3F2FD", color: "#1565C0", border: "#64B5F6" };
      case "applied":
        return { bg: "#E8F5E8", color: "#2E7D32", border: "#81C784" };
      case "rejected":
        return { bg: "#FFEBEE", color: "#C62828", border: "#E57373" };
      default:
        return { bg: "#F5F5F5", color: "#757575", border: "#BDBDBD" };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <AssignmentIcon sx={{ fontSize: 16 }} />;
      case "contacted":
        return <PhoneIcon sx={{ fontSize: 16 }} />;
      case "applied":
        return <TrendingUpIcon sx={{ fontSize: 16 }} />;
      case "rejected":
        return <AssignmentIcon sx={{ fontSize: 16 }} />;
      default:
        return <AssignmentIcon sx={{ fontSize: 16 }} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Box sx={{ width: "100%" }}>
        <LinearProgress />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress size={60} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            color: "#C89116",
            mb: 1,
          }}
        >
          Leads Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Manage and track all product leads with comprehensive user details and
          status updates
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(5, 1fr)",
          },
          gap: 3,
          mb: 4,
        }}
      >
        <Card
          sx={{
            bgcolor: "#C89116",
            color: "white",
            borderRadius: 3,
            border: 1,
            borderColor: "divider",
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {total}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Leads
                </Typography>
              </Box>
              <Avatar
                sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 56, height: 56 }}
              >
                <PeopleIcon sx={{ fontSize: 28 }} />
              </Avatar>
            </Box>
          </CardContent>
        </Card>

        <Card
          sx={{
            bgcolor: "#C89116",
            color: "white",
            borderRadius: 3,
            border: 1,
            borderColor: "divider",
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {leads.filter((l) => l.status === "pending").length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Pending
                </Typography>
              </Box>
              <Avatar
                sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 56, height: 56 }}
              >
                <AssignmentIcon sx={{ fontSize: 28 }} />
              </Avatar>
            </Box>
          </CardContent>
        </Card>

        <Card
          sx={{
            bgcolor: "#C89116",
            color: "white",
            borderRadius: 3,
            border: 1,
            borderColor: "divider",
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {leads.filter((l) => l.status === "contacted").length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Contacted
                </Typography>
              </Box>
              <Avatar
                sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 56, height: 56 }}
              >
                <PhoneIcon sx={{ fontSize: 28 }} />
              </Avatar>
            </Box>
          </CardContent>
        </Card>

        <Card
          sx={{
            bgcolor: "#C89116",
            color: "white",
            borderRadius: 3,
            border: 1,
            borderColor: "divider",
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {leads.filter((l) => l.status === "applied").length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Applied
                </Typography>
              </Box>
              <Avatar
                sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 56, height: 56 }}
              >
                <TrendingUpIcon sx={{ fontSize: 28 }} />
              </Avatar>
            </Box>
          </CardContent>
        </Card>

        <Card
          sx={{
            bgcolor: "#C89116",
            color: "white",
            borderRadius: 3,
            border: 1,
            borderColor: "divider",
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {leads.filter((l) => l.status === "rejected").length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Rejected
                </Typography>
              </Box>
              <Avatar
                sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 56, height: 56 }}
              >
                <CancelIcon sx={{ fontSize: 28 }} />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Search and Filter Section */}
      <Card sx={{ mb: 3, borderRadius: 3, border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <Box
            component="form"
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
            }}
            onSubmit={(e) => e.preventDefault()}
            noValidate
          >
            <TextField
              label="Search leads"
              variant="outlined"
              size="small"
              value={search}
              onChange={(e) => {
                e.preventDefault();
                setSearch(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                }
              }}
              sx={{
                minWidth: 300,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "&:hover fieldset": {
                    borderColor: "#C89116",
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={(e) => {
                  e.preventDefault();
                  setStatusFilter(e.target.value);
                }}
                sx={{
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e0e0e0",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#C89116",
                  },
                }}
                startAdornment={
                  <InputAdornment position="start">
                    <FilterIcon color="action" />
                  </InputAdornment>
                }
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="contacted">Contacted</MenuItem>
                <MenuItem value="applied">Applied</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Desktop Table / Mobile Cards */}
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <Card
          sx={{
            borderRadius: 3,
            border: 1,
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "action.selected" }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    User Details
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Finsang ID
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Product
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Contact Info
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Date
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.map((lead) => {
                  const statusColors = getStatusColor(lead.status);
                  return (
                    <TableRow
                      key={lead.id}
                      sx={{ "&:hover": { backgroundColor: "action.hover" } }}
                    >
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: "#C89116",
                              width: 48,
                              height: 48,
                              fontSize: "1rem",
                              fontWeight: 600,
                            }}
                          >
                            {getInitials(lead.user_name)}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="subtitle1"
                              fontWeight="600"
                              color="text.primary"
                            >
                              {lead.user_name}
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              sx={{ mt: 0.5 }}
                            >
                              <LocationIcon
                                sx={{ fontSize: 14, color: "text.secondary" }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {lead.user_pincode}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                •
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {lead.user_age} years
                              </Typography>
                            </Stack>
                            {lead.user_income && (
                              <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                                sx={{ mt: 0.5 }}
                              >
                                <MoneyIcon
                                  sx={{ fontSize: 14, color: "text.secondary" }}
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  ₹{lead.user_income.toLocaleString()}/month
                                </Typography>
                              </Stack>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={lead.finsang_id || "N/A"}
                          size="small"
                          sx={{
                            backgroundColor: "#E3F2FD",
                            color: "#1565C0",
                            fontWeight: 600,
                            borderRadius: 2,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight="500"
                          color="text.primary"
                        >
                          {lead.product_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <PhoneIcon
                              sx={{ fontSize: 16, color: "text.secondary" }}
                            />
                            <Typography variant="body2" color="text.primary">
                              {lead.user_mobile}
                            </Typography>
                          </Stack>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <EmailIcon
                              sx={{ fontSize: 16, color: "text.secondary" }}
                            />
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                maxWidth: 200,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {lead.user_email}
                            </Typography>
                          </Stack>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(lead.status)}
                          label={
                            lead.status.charAt(0).toUpperCase() +
                            lead.status.slice(1)
                          }
                          sx={{
                            backgroundColor: statusColors.bg,
                            color: statusColors.color,
                            border: `1px solid ${statusColors.border}`,
                            fontWeight: 600,
                            borderRadius: 2,
                            "& .MuiChip-icon": {
                              color: statusColors.color,
                            },
                          }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CalendarIcon
                            sx={{ fontSize: 16, color: "text.secondary" }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(lead.created_at)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Edit User Details" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleEditUserDetails(lead)}
                              sx={{
                                bgcolor: "#e8f5e8",
                                color: "#2e7d32",
                                "&:hover": {
                                  bgcolor: "success.light",
                                },
                              }}
                            >
                              <PersonIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Lead Status" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleEditLead(lead)}
                              sx={{
                                bgcolor: "#e3f2fd",
                                color: "#1565c0",
                                "&:hover": {
                                  bgcolor: "primary.light",
                                },
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <Stack spacing={2}>
          {leads.map((lead) => {
            const statusColors = getStatusColor(lead.status);
            return (
              <Card
                key={lead.id}
                sx={{ borderRadius: 3, border: 1, borderColor: "divider" }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: "#C89116",
                        width: 40,
                        height: 40,
                        fontSize: "0.875rem",
                        fontWeight: 600,
                      }}
                    >
                      {getInitials(lead.user_name)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="600"
                        color="text.primary"
                        noWrap
                      >
                        {lead.user_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {lead.product_name}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          icon={getStatusIcon(lead.status)}
                          label={
                            lead.status.charAt(0).toUpperCase() +
                            lead.status.slice(1)
                          }
                          sx={{
                            backgroundColor: statusColors.bg,
                            color: statusColors.color,
                            border: `1px solid ${statusColors.border}`,
                            fontWeight: 600,
                            borderRadius: 2,
                            fontSize: "0.75rem",
                            height: 24,
                            "& .MuiChip-icon": {
                              color: statusColors.color,
                              fontSize: 14,
                            },
                          }}
                          size="small"
                        />
                      </Box>
                    </Box>
                    <Chip
                      label={lead.finsang_id || "N/A"}
                      size="small"
                      sx={{
                        backgroundColor: "#E3F2FD",
                        color: "#1565C0",
                        fontWeight: 600,
                        borderRadius: 2,
                        fontSize: "0.75rem",
                      }}
                    />
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PhoneIcon
                        sx={{ fontSize: 16, color: "text.secondary" }}
                      />
                      <Typography variant="body2" color="text.primary">
                        {lead.user_mobile}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <EmailIcon
                        sx={{ fontSize: 16, color: "text.secondary" }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {lead.user_email}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <LocationIcon
                          sx={{ fontSize: 14, color: "text.secondary" }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {lead.user_pincode}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {lead.user_age} years
                      </Typography>
                      {lead.user_income && (
                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                        >
                          <MoneyIcon
                            sx={{ fontSize: 14, color: "text.secondary" }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            ₹{lead.user_income.toLocaleString()}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CalendarIcon
                        sx={{ fontSize: 14, color: "text.secondary" }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(lead.created_at)}
                      </Typography>
                    </Stack>
                  </Stack>

                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      mt: 2,
                      justifyContent: "flex-end",
                    }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PersonIcon />}
                      onClick={() => handleEditUserDetails(lead)}
                      sx={{
                        borderColor: "#2e7d32",
                        color: "#2e7d32",
                        borderRadius: 2,
                        fontSize: "0.75rem",
                        "&:hover": {
                          bgcolor: "success.light",
                          borderColor: "success.main",
                        },
                      }}
                    >
                      Edit User
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleEditLead(lead)}
                      sx={{
                        borderColor: "#1565c0",
                        color: "#1565c0",
                        borderRadius: 2,
                        fontSize: "0.75rem",
                        "&:hover": {
                          bgcolor: "primary.light",
                          borderColor: "primary.main",
                        },
                      }}
                    >
                      Edit Status
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      </Box>

      {/* Pagination */}
      <Card sx={{ borderRadius: 3, border: 1, borderColor: "divider", mt: 2 }}>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50]}
          sx={{
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
              {
                fontWeight: 500,
              },
          }}
        />
      </Card>

      {/* Download Report FAB */}
      <Fab
        color="primary"
        aria-label="download report"
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          bgcolor: "#C89116",
          "&:hover": {
            bgcolor: "#b8820f",
          },
        }}
        onClick={() => setDownloadDialog(true)}
      >
        <DownloadIcon />
      </Fab>

      {/* Edit Lead Dialog */}
      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, lead: null })}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "#C89116",
            color: "white",
          }}
        >
          Edit Lead Status
        </DialogTitle>
        <DialogContent sx={{ mt: 4 }}>
          {editDialog.lead && (
            <Box>
              <Card
                sx={{
                  mb: 3,
                  bgcolor: "background.default",
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    gutterBottom
                  >
                    <strong>Product:</strong> {editDialog.lead.product_name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>User:</strong> {editDialog.lead.user_name} (
                    {editDialog.lead.user_mobile})
                  </Typography>
                </CardContent>
              </Card>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editStatus}
                  label="Status"
                  onChange={(e) => setEditStatus(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="contacted">Contacted</MenuItem>
                  <MenuItem value="applied">Applied</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={4}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add notes about this lead..."
                sx={{
                  borderRadius: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setEditDialog({ open: false, lead: null })}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            sx={{
              borderRadius: 2,
              bgcolor: "#C89116",
              "&:hover": {
                bgcolor: "#b8820f",
              },
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Details Dialog */}
      <Dialog
        open={userDetailsDialog.open}
        onClose={() => setUserDetailsDialog({ open: false, lead: null })}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle
          sx={{
            pb: 2,
            bgcolor: "#C89116",
            color: "white",
          }}
        >
          Edit User Details
        </DialogTitle>
        <DialogContent sx={{ mt: 4 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            <TextField
              fullWidth
              label="Full Name"
              value={editingUserDetails.user_name}
              onChange={(e) =>
                setEditingUserDetails((prev) => ({
                  ...prev,
                  user_name: e.target.value,
                }))
              }
              sx={{
                minWidth: "calc(50% - 12px)",
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
            <TextField
              fullWidth
              label="Mobile Number"
              value={editingUserDetails.user_mobile}
              onChange={(e) =>
                setEditingUserDetails((prev) => ({
                  ...prev,
                  user_mobile: e.target.value,
                }))
              }
              sx={{
                minWidth: "calc(50% - 12px)",
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={editingUserDetails.user_email}
              onChange={(e) =>
                setEditingUserDetails((prev) => ({
                  ...prev,
                  user_email: e.target.value,
                }))
              }
              sx={{
                minWidth: "calc(50% - 12px)",
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
            <TextField
              fullWidth
              label="Age"
              type="number"
              value={editingUserDetails.user_age}
              onChange={(e) =>
                setEditingUserDetails((prev) => ({
                  ...prev,
                  user_age: parseInt(e.target.value) || 0,
                }))
              }
              sx={{
                minWidth: "calc(50% - 12px)",
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
            <TextField
              fullWidth
              label="Pincode"
              value={editingUserDetails.user_pincode}
              onChange={(e) =>
                setEditingUserDetails((prev) => ({
                  ...prev,
                  user_pincode: e.target.value,
                }))
              }
              sx={{
                minWidth: "calc(50% - 12px)",
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
            <TextField
              fullWidth
              label="Monthly Income (Optional)"
              type="number"
              value={editingUserDetails.user_income || ""}
              onChange={(e) =>
                setEditingUserDetails((prev) => ({
                  ...prev,
                  user_income: parseFloat(e.target.value) || null,
                }))
              }
              helperText="Enter monthly income in rupees"
              sx={{
                minWidth: "calc(50% - 12px)",
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setUserDetailsDialog({ open: false, lead: null })}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveUserDetails}
            variant="contained"
            sx={{
              borderRadius: 2,
              bgcolor: "#C89116",
              "&:hover": {
                bgcolor: "#b8820f",
              },
            }}
          >
            Save User Details
          </Button>
        </DialogActions>
      </Dialog>

      {/* Download Report Dialog */}
      <Dialog
        open={downloadDialog}
        onClose={() => setDownloadDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            bgcolor: "#C89116",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <DateRangeIcon />
          Download Report
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select a date range to download leads data (maximum 31 days)
          </Typography>

          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <Button
              variant="outlined"
              onClick={() => setQuickDateRange("week")}
              sx={{ borderRadius: 2 }}
            >
              Last Week
            </Button>
            <Button
              variant="outlined"
              onClick={() => setQuickDateRange("month")}
              sx={{ borderRadius: 2 }}
            >
              Last Month
            </Button>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Report will include: Finsang ID, User Details, Product Info, Status,
            Date, and Notes
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setDownloadDialog(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={downloadReport}
            variant="contained"
            disabled={downloadLoading}
            sx={{
              borderRadius: 2,
              bgcolor: "#C89116",
              "&:hover": {
                bgcolor: "#b8820f",
              },
            }}
          >
            {downloadLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <>
                <DownloadIcon sx={{ mr: 1 }} />
                Download CSV
              </>
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
