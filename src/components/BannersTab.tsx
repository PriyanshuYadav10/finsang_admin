"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  CardMedia,
  Stack,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  position: string;
  status: "active" | "inactive";
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export default function BannersTab() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    link_url: "",
    status: "active" as "active" | "inactive",
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/banners");
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);
      setBanners(data.banners || []);
    } catch (err) {
      setError("Failed to fetch banners");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      setUploading(true);

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("subtitle", formData.subtitle);
      formDataToSend.append("link_url", formData.link_url);
      formDataToSend.append("status", formData.status);

      if (selectedFile) {
        formDataToSend.append("image", selectedFile);
      } else {
        formDataToSend.append("image_url", formData.image_url);
      }

      if (editingBanner) {
        const response = await fetch(`/api/banners?id=${editingBanner.id}`, {
          method: "PUT",
          body: formDataToSend,
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setSuccess("Banner updated successfully");
      } else {
        const response = await fetch("/api/banners", {
          method: "POST",
          body: formDataToSend,
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setSuccess("Banner created successfully");
      }

      setDialogOpen(false);
      resetForm();
      fetchBanners();
    } catch (err) {
      setError("Failed to save banner");
      console.log("error", err);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;

    try {
      const response = await fetch(`/api/banners?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSuccess("Banner deleted successfully");
      fetchBanners();
    } catch (err) {
      setError("Failed to delete banner");
      console.error(err);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || "",
      image_url: banner.image_url,
      link_url: banner.link_url || "",
      status: banner.status,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFormData({
      title: "",
      subtitle: "",
      image_url: "",
      link_url: "",
      status: "active",
    });
    setEditingBanner(null);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const newPreviewUrl = URL.createObjectURL(file);
      setSelectedFile(file);
      setPreviewUrl(newPreviewUrl);
      setFormData({ ...formData, image_url: "" });
    }
  };

  const handleOpenDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" fontWeight={600}>
          Banner Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          sx={{
            borderRadius: 2,
            color: "white",
            "& .MuiButton-startIcon": { color: "white" },
          }}
        >
          Add Banner
        </Button>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ padding: "20px" }}>
        {banners.map((banner) => (
          <Grid key={banner.id}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                width: "300px",
              }}
            >
              <CardMedia
                component="img"
                height="120px"
                image={banner.image_url}
                alt={banner.title}
                sx={{ objectFit: "cover", height: 220 }}
              />
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {banner.title}
                </Typography>
                {banner.subtitle && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {banner.subtitle}
                  </Typography>
                )}

                <Stack direction="row" spacing={1} mb={2}>
                  <Chip
                    icon={
                      banner.status === "active" ? (
                        <VisibilityIcon />
                      ) : (
                        <VisibilityOffIcon />
                      )
                    }
                    label={banner.status}
                    size="small"
                    color={banner.status === "active" ? "success" : "default"}
                  />
                </Stack>

                {banner.link_url && (
                  <Box display="flex" alignItems="center" mb={1}>
                    <LinkIcon
                      sx={{ fontSize: 16, mr: 1, color: "text.secondary" }}
                    />
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {banner.link_url}
                    </Typography>
                  </Box>
                )}

                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  mb={2}
                >
                  Created: {new Date(banner.created_at).toLocaleDateString()}
                </Typography>

                <Box display="flex" justifyContent="space-between">
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEdit(banner)}
                  >
                    Edit
                  </Button>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(banner.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {banners.length === 0 && (
        <Box textAlign="center" py={8}>
          <ImageIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No banners found
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Create your first banner to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            sx={{
              color: "white",
              "& .MuiButton-startIcon": { color: "white" },
            }}
          >
            Add Banner
          </Button>
        </Box>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingBanner ? "Edit Banner" : "Add New Banner"}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Subtitle"
              value={formData.subtitle}
              onChange={(e) =>
                setFormData({ ...formData, subtitle: e.target.value })
              }
              margin="normal"
            />

            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Banner Image *
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<ImageIcon />}
                fullWidth
                sx={{ mb: 2, py: 1.5 }}
              >
                {selectedFile ? selectedFile.name : "Upload Image"}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </Button>

              {(previewUrl || formData.image_url) && (
                <Box sx={{ mb: 2, textAlign: "center" }}>
                  <img
                    src={previewUrl || formData.image_url}
                    alt="Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "200px",
                      borderRadius: "8px",
                      border: "1px solid #e0e0e0",
                    }}
                  />
                </Box>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Or enter image URL:
              </Typography>
              <TextField
                fullWidth
                label="Image URL"
                value={formData.image_url}
                onChange={(e) => {
                  setFormData({ ...formData, image_url: e.target.value });
                  setSelectedFile(null);
                }}
                disabled={!!selectedFile}
                helperText={
                  selectedFile
                    ? "File selected for upload"
                    : "Enter the URL of the banner image"
                }
              />
            </Box>

            <TextField
              fullWidth
              label="Link URL (Optional)"
              value={formData.link_url}
              onChange={(e) =>
                setFormData({ ...formData, link_url: e.target.value })
              }
              margin="normal"
              helperText="URL to redirect when banner is clicked"
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "active" | "inactive",
                  })
                }
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              uploading ||
              !formData.title ||
              (!formData.image_url && !selectedFile)
            }
            sx={{ color: "white" }}
          >
            {uploading ? (
              <CircularProgress size={20} />
            ) : editingBanner ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
