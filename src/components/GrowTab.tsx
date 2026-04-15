"use client";

import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Button,
  TextField,
  IconButton,
  CircularProgress,
  MenuItem,
  Alert,
  Card,
  CardContent,
  Stack,
  Chip,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Category as CategoryIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import apiClient from "../lib/api-client";
import { useAuth } from "../lib/auth-context";

interface GrowCategory {
  id: number;
  name: string;
  created_at: string;
}

const ManageCategory = () => {
  const { isAuthenticated, isModerator, isAdmin } = useAuth();
  const [categories, setCategories] = useState<GrowCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch categories
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await apiClient.getGrowCategories(1, 100);
        setCategories(response.categories || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
      setLoading(false);
    };
    fetchCategories();
  }, [isAuthenticated]);

  // Add category
  const handleAdd = async () => {
    if (!newCategory.trim() || !isModerator) return;
    setAdding(true);
    try {
      const response = await apiClient.createGrowCategory({
        name: newCategory.trim(),
      });
      if (response.category) {
        setCategories((prev) => [response.category, ...prev]);
      }
      setNewCategory("");
    } catch (error) {
      console.error("Failed to add category:", error);
    }
    setAdding(false);
  };

  // Delete category
  const handleDelete = async (id: number) => {
    if (!isAdmin) return;
    setDeletingId(id);
    try {
      await apiClient.deleteGrowCategory(id.toString());
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
    setDeletingId(null);
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="h6" sx={{ color: "text.secondary" }}>
          Please log in to access grow management
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Card sx={{ borderRadius: 2, boxShadow: 1, mb: 3 }}>
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

          <Stack direction="row" spacing={2}>
            <TextField
              label="Category Name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              fullWidth
              disabled={!isModerator}
              sx={{ borderRadius: 2 }}
            />
            <Button
              variant="contained"
              startIcon={adding ? <CircularProgress size={16} /> : <AddIcon />}
              onClick={handleAdd}
              disabled={adding || !newCategory.trim() || !isModerator}
              sx={{ minWidth: 120, borderRadius: 2 }}
            >
              {adding ? "Adding..." : "Add"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" mb={3}>
            Categories ({categories.length})
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : categories.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                No categories yet. Add your first category above.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 2,
              }}
            >
              {categories.map((cat) => (
                <Card key={cat.id} variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {cat.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(cat.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                      {isAdmin && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(cat.id)}
                          disabled={deletingId === cat.id}
                        >
                          {deletingId === cat.id ? (
                            <CircularProgress size={16} />
                          ) : (
                            <DeleteIcon />
                          )}
                        </IconButton>
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

interface GrowPoster {
  id: number;
  title: string;
  image_url: string;
  category_id: number;
  created_at: string;
  category?: GrowCategory;
}

const AddPoster = () => {
  const { isAuthenticated, isModerator, isAdmin } = useAuth();
  const [categories, setCategories] = useState<GrowCategory[]>([]);
  const [posters, setPosters] = useState<GrowPoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchData = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const [categoriesRes, postersRes] = await Promise.all([
        apiClient.getGrowCategories(1, 100),
        apiClient.getGrowPosters(1, 100),
      ]);
      setCategories(categoriesRes.categories || []);
      setPosters(postersRes.posters || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  const handleAdd = async () => {
    if (!title.trim() || !selectedCategory || !isModerator) return;
    setAdding(true);
    try {
      const response = await apiClient.createGrowPoster({
        title: title.trim(),
        image_url: imageUrl.trim() || undefined,
        category_id: parseInt(selectedCategory),
      });
      if (response.poster) {
        setPosters((prev) => [response.poster, ...prev]);
      }
      setTitle("");
      setImageUrl("");
      setSelectedCategory("");
    } catch (error) {
      console.error("Failed to add poster:", error);
    }
    setAdding(false);
  };

  const handleDelete = async (poster: GrowPoster) => {
    if (!isAdmin) return;
    setDeletingId(poster.id);
    try {
      await apiClient.deleteGrowPoster(poster.id.toString());
      setPosters((prev) => prev.filter((p) => p.id !== poster.id));
    } catch (error) {
      console.error("Failed to delete poster:", error);
    }
    setDeletingId(null);
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="h6" sx={{ color: "text.secondary" }}>
          Please log in to access grow management
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Card sx={{ borderRadius: 2, boxShadow: 1, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <ImageIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Add New Poster
            </Typography>
          </Stack>

          {!isModerator && (
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
              Moderator access required to add posters
            </Alert>
          )}

          <Stack spacing={3}>
            <TextField
              label="Poster Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              disabled={!isModerator}
            />
            <TextField
              label="Image URL (Optional)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              fullWidth
              disabled={!isModerator}
              placeholder="https://example.com/image.jpg"
            />
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
            <Button
              variant="contained"
              startIcon={adding ? <CircularProgress size={16} /> : <AddIcon />}
              onClick={handleAdd}
              disabled={
                adding || !title.trim() || !selectedCategory || !isModerator
              }
              sx={{ alignSelf: "flex-start", minWidth: 140, borderRadius: 2 }}
            >
              {adding ? "Adding..." : "Add Poster"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" mb={3}>
            Posters ({posters.length})
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : posters.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                No posters yet. Add your first poster above.
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
              {posters.map((poster) => (
                <Card
                  key={poster.id}
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
                            {poster.title}
                          </Typography>
                          <Chip
                            label={poster.category?.name || "No category"}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                        {isAdmin && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(poster)}
                            disabled={deletingId === poster.id}
                          >
                            {deletingId === poster.id ? (
                              <CircularProgress size={16} />
                            ) : (
                              <DeleteIcon />
                            )}
                          </IconButton>
                        )}
                      </Stack>

                      {poster.image_url && (
                        <Box
                          component="img"
                          src={poster.image_url}
                          alt={poster.title}
                          sx={{
                            width: "100%",
                            height: 150,
                            objectFit: "cover",
                            borderRadius: 1,
                            bgcolor: "grey.100",
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}

                      <Typography variant="caption" color="text.secondary">
                        Created:{" "}
                        {new Date(poster.created_at).toLocaleDateString()}
                      </Typography>
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

const GrowTab: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("categories");

  if (!isAuthenticated) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Please log in to access grow management
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} mb={4}>
        <TrendingUpIcon sx={{ fontSize: 32, color: "primary.main" }} />
        <Typography variant="h4" fontWeight="bold">
          Grow Management
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
          variant={activeTab === "posters" ? "contained" : "outlined"}
          startIcon={<ImageIcon />}
          onClick={() => setActiveTab("posters")}
          sx={{
            borderRadius: 2,
            color: activeTab === "posters" ? "white" : "inherit",
            "& .MuiButton-startIcon": {
              color: activeTab === "posters" ? "white" : "inherit",
            },
          }}
        >
          Posters
        </Button>
      </Box>

      {activeTab === "categories" && <ManageCategory />}
      {activeTab === "posters" && <AddPoster />}
    </Box>
  );
};

export default GrowTab;
