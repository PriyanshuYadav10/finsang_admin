"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  MenuItem,
  Switch,
  FormControlLabel,
  Stack,
  Chip,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  School as SchoolIcon,
  VideoLibrary as VideoIcon,
  Category as CategoryIcon,
  PlayCircle as PlayIcon,
} from "@mui/icons-material";
import apiClient from "../lib/api-client";
import { useAuth } from "../lib/auth-context";

const ManageTrainingCategories = () => {
  const { isAuthenticated, isModerator, isAdmin } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newBanner, setNewBanner] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCategories = async () => {
      try {
        const response = await apiClient.getTrainingCategories(1, 100);
        setCategories(response.categories || []);
      } catch (err) {
        setError("Failed to fetch categories");
      }
    };
    fetchCategories();
  }, [success, isAuthenticated]);

  const handleAdd = async () => {
    if (!newCategory.trim() || !isModerator) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await apiClient.createTrainingCategory({
        name: newCategory.trim(),
        banner_url: newBanner.trim() || undefined,
      });
      setSuccess("Category added successfully!");
      setNewCategory("");
      setNewBanner("");
    } catch (err) {
      setError("Failed to add category");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;

    setDeletingId(id);
    try {
      await apiClient.deleteTrainingCategory(id);
      setSuccess("Category deleted successfully!");
    } catch (err) {
      setError("Failed to delete category");
    }
    setDeletingId(null);
  };

  return (
    <Box>
      <Card sx={{ borderRadius: 2, border: 1, borderColor: "divider", mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <CategoryIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Add New Category
            </Typography>
          </Stack>

          {!isModerator && (
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
              Moderator access required to add categories
            </Alert>
          )}

          <Stack spacing={3}>
            <TextField
              label="Category Name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              fullWidth
              disabled={!isModerator}
            />
            <TextField
              label="Banner URL (Optional)"
              value={newBanner}
              onChange={(e) => setNewBanner(e.target.value)}
              fullWidth
              disabled={!isModerator}
              placeholder="https://example.com/banner.jpg"
            />
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} /> : <AddIcon />}
              onClick={handleAdd}
              disabled={loading || !newCategory.trim() || !isModerator}
              sx={{ alignSelf: "flex-start", minWidth: 140, borderRadius: 2 }}
            >
              {loading ? "Adding..." : "Add Category"}
            </Button>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
              {success}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2, border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" mb={3}>
            Categories ({categories.length})
          </Typography>

          {categories.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                No categories yet. Add your first category above.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                gap: 3,
              }}
            >
              {categories.map((category) => (
                <Card
                  key={category.id}
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Stack spacing={2}>
                      <Stack
                        direction="row"
                        alignItems="flex-start"
                        justifyContent="space-between"
                      >
                        <Box flex={1}>
                          <Typography
                            variant="subtitle1"
                            fontWeight="medium"
                            mb={1}
                          >
                            {category.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(category.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                        {isAdmin && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(category.id)}
                            disabled={deletingId === category.id}
                          >
                            {deletingId === category.id ? (
                              <CircularProgress size={16} />
                            ) : (
                              <DeleteIcon />
                            )}
                          </IconButton>
                        )}
                      </Stack>

                      {category.banner_url && (
                        <Box
                          component="img"
                          src={category.banner_url}
                          alt={category.name}
                          sx={{
                            width: "100%",
                            height: 120,
                            objectFit: "cover",
                            borderRadius: 1,
                            bgcolor: "grey.100",
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

const ManageTrainingVideos = () => {
  const { isAuthenticated, isModerator, isAdmin } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newVideo, setNewVideo] = useState({
    title: "",
    youtube_url: "",
    thumbnail_url: "",
    is_featured: false,
    sort_order: 0,
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCategories = async () => {
      try {
        const response = await apiClient.getTrainingCategories(1, 100);
        setCategories(response.categories || []);
      } catch (err) {
        setError("Failed to fetch categories");
      }
    };
    fetchCategories();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selectedCategory || !isAuthenticated) return;

    const fetchVideos = async () => {
      try {
        const response = await apiClient.getTrainingVideosByCategory(
          selectedCategory,
          1,
          100
        );
        setVideos(response.videos || []);
      } catch (err) {
        setError("Failed to fetch videos");
      }
    };
    fetchVideos();
  }, [selectedCategory, success, isAuthenticated]);

  const handleAddVideo = async () => {
    if (
      !newVideo.title.trim() ||
      !newVideo.youtube_url.trim() ||
      !selectedCategory ||
      !isModerator
    )
      return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await apiClient.createTrainingVideo({
        title: newVideo.title.trim(),
        youtube_url: newVideo.youtube_url.trim(),
        thumbnail_url: newVideo.thumbnail_url.trim() || undefined,
        category_id: selectedCategory,
        is_featured: newVideo.is_featured,
        sort_order: newVideo.sort_order,
      });
      setSuccess("Video added successfully!");
      setNewVideo({
        title: "",
        youtube_url: "",
        thumbnail_url: "",
        is_featured: false,
        sort_order: 0,
      });
    } catch (err) {
      setError("Failed to add video");
    }
    setLoading(false);
  };

  const handleDeleteVideo = async (id: string) => {
    if (!isAdmin) return;

    setDeletingId(id);
    try {
      await apiClient.deleteTrainingVideo(id);
      setSuccess("Video deleted successfully!");
    } catch (err) {
      setError("Failed to delete video");
    }
    setDeletingId(null);
  };

  return (
    <Box>
      <Card sx={{ borderRadius: 2, border: 1, borderColor: "divider", mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <VideoIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Add New Video
            </Typography>
          </Stack>

          {!isModerator && (
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
              Moderator access required to add videos
            </Alert>
          )}

          <Stack spacing={3}>
            <TextField
              select
              label="Select Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              fullWidth
              disabled={!isModerator}
            >
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </TextField>

            {selectedCategory && (
              <>
                <TextField
                  label="Video Title"
                  value={newVideo.title}
                  onChange={(e) =>
                    setNewVideo((prev) => ({ ...prev, title: e.target.value }))
                  }
                  fullWidth
                  disabled={!isModerator}
                />
                <TextField
                  label="YouTube URL"
                  value={newVideo.youtube_url}
                  onChange={(e) =>
                    setNewVideo((prev) => ({
                      ...prev,
                      youtube_url: e.target.value,
                    }))
                  }
                  fullWidth
                  disabled={!isModerator}
                  placeholder="https://youtube.com/watch?v=..."
                />
                <TextField
                  label="Thumbnail URL (Optional)"
                  value={newVideo.thumbnail_url}
                  onChange={(e) =>
                    setNewVideo((prev) => ({
                      ...prev,
                      thumbnail_url: e.target.value,
                    }))
                  }
                  fullWidth
                  disabled={!isModerator}
                />
                <TextField
                  label="Sort Order"
                  type="number"
                  value={newVideo.sort_order}
                  onChange={(e) =>
                    setNewVideo((prev) => ({
                      ...prev,
                      sort_order: parseInt(e.target.value) || 0,
                    }))
                  }
                  fullWidth
                  disabled={!isModerator}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={newVideo.is_featured}
                      onChange={(e) =>
                        setNewVideo((prev) => ({
                          ...prev,
                          is_featured: e.target.checked,
                        }))
                      }
                      disabled={!isModerator}
                    />
                  }
                  label="Featured Video"
                />
                <Button
                  variant="contained"
                  startIcon={
                    loading ? <CircularProgress size={16} /> : <AddIcon />
                  }
                  onClick={handleAddVideo}
                  disabled={
                    loading ||
                    !newVideo.title.trim() ||
                    !newVideo.youtube_url.trim() ||
                    !isModerator
                  }
                  sx={{
                    alignSelf: "flex-start",
                    minWidth: 140,
                    borderRadius: 2,
                  }}
                >
                  {loading ? "Adding..." : "Add Video"}
                </Button>
              </>
            )}
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
              {success}
            </Alert>
          )}
        </CardContent>
      </Card>

      {selectedCategory && (
        <Card sx={{ borderRadius: 2, border: 1, borderColor: "divider" }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Videos ({videos.length})
            </Typography>

            {videos.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">
                  No videos yet. Add your first video above.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, 1fr)",
                    lg: "repeat(3, 1fr)",
                  },
                  gap: 3,
                }}
              >
                {videos.map((video) => (
                  <Card
                    key={video.id}
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Stack spacing={2}>
                        <Stack
                          direction="row"
                          alignItems="flex-start"
                          justifyContent="space-between"
                        >
                          <Box flex={1}>
                            <Typography
                              variant="subtitle1"
                              fontWeight="medium"
                              mb={1}
                            >
                              {video.title}
                            </Typography>
                            <Stack direction="row" spacing={1} mb={1}>
                              {video.is_featured && (
                                <Chip
                                  label="Featured"
                                  size="small"
                                  color="primary"
                                />
                              )}
                              <Chip
                                label={`Order: ${video.sort_order}`}
                                size="small"
                                variant="outlined"
                              />
                            </Stack>
                          </Box>
                          {isAdmin && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteVideo(video.id)}
                              disabled={deletingId === video.id}
                            >
                              {deletingId === video.id ? (
                                <CircularProgress size={16} />
                              ) : (
                                <DeleteIcon />
                              )}
                            </IconButton>
                          )}
                        </Stack>

                        {video.thumbnail_url && (
                          <Box
                            component="img"
                            src={video.thumbnail_url}
                            alt={video.title}
                            sx={{
                              width: "100%",
                              height: 120,
                              objectFit: "cover",
                              borderRadius: 1,
                              bgcolor: "grey.100",
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}

                        <Button
                          variant="outlined"
                          startIcon={<PlayIcon />}
                          href={video.youtube_url}
                          target="_blank"
                          size="small"
                          sx={{ borderRadius: 2 }}
                        >
                          Watch Video
                        </Button>

                        <Typography variant="caption" color="text.secondary">
                          Created:{" "}
                          {new Date(video.created_at).toLocaleDateString()}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

const TrainingsTab: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("categories");

  if (!isAuthenticated) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Please log in to access training management
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} mb={4}>
        <SchoolIcon sx={{ fontSize: 32, color: "primary.main" }} />
        <Typography variant="h4" fontWeight="bold">
          Training Management
        </Typography>
      </Stack>

      <Box sx={{ display: "flex", gap: 1, mb: 4 }}>
        <Button
          variant={activeTab === "categories" ? "contained" : "outlined"}
          startIcon={<CategoryIcon />}
          onClick={() => setActiveTab("categories")}
          sx={{
            borderRadius: 2,
            color: activeTab === "categories" ? "white" : "inherit",
            "& .MuiButton-startIcon": {
              color: activeTab === "categories" ? "white" : "inherit",
            },
          }}
        >
          Categories
        </Button>
        <Button
          variant={activeTab === "videos" ? "contained" : "outlined"}
          startIcon={<VideoIcon />}
          onClick={() => setActiveTab("videos")}
          sx={{
            borderRadius: 2,
            color: activeTab === "videos" ? "white" : "inherit",
            "& .MuiButton-startIcon": {
              color: activeTab === "videos" ? "white" : "inherit",
            },
          }}
        >
          Videos
        </Button>
      </Box>

      {activeTab === "categories" && <ManageTrainingCategories />}
      {activeTab === "videos" && <ManageTrainingVideos />}
    </Box>
  );
};

export default TrainingsTab;
