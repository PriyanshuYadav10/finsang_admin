"use client";

import { useEffect, useState, use } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Alert,
  Button,
  AppBar,
  Toolbar,
  TextField,
  Container,
  Rating,
  Badge,
  IconButton,
  Drawer,
  List,
  ListItemText,
  ListItemButton,
  Divider,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  Skeleton,
  CardMedia,
  CardActions,
  CardActionArea,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
} from "@mui/material";
import {
  Phone,
  ShoppingCart,
  Search,
  Favorite,
  FavoriteBorder,
  WhatsApp,
  Menu,
  Close,
  LocalShipping,
  Security,
  Support,
  VerifiedUser,
} from "@mui/icons-material";

interface WebsiteData {
  website_id: string;
  name: string;
  shop_name: string;
  phone: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: number;
  product_id: string;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  stock_quantity: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  category_id: number | null;
}

interface Category {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  product_count?: number;
}

export default function WebsitePage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryMap, setCategoryMap] = useState<Map<number, string>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([
    0, 1000000000,
  ]);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Helper function to get category name by ID
  const getCategoryName = (categoryId: number | null): string => {
    if (!categoryId) return "No Category";
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "No Category";
  };

  useEffect(() => {
    const fetchWebsiteData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/websites/${websiteId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Website not found");
          } else {
            setError("Failed to load website data");
          }
          return;
        }

        const data = await response.json();
        setWebsiteData(data.website);

        // Try to fetch shop products using the phone number from website data
        try {
          const shopCheckResponse = await fetch(
            `/api/shops/check/${data.website.phone}`
          );
          if (shopCheckResponse.ok) {
            const shopData = await shopCheckResponse.json();
            const shopId = shopData.shop.shop_id;

            // Fetch products and categories in parallel
            const [productsResponse, categoriesResponse] = await Promise.all([
              fetch(`/api/shops/${shopId}/products`),
              fetch(`/api/shops/${shopId}/categories`),
            ]);

            let productsData: any = null;
            let categoriesData: any = null;

            if (productsResponse.ok) {
              productsData = await productsResponse.json();
              setProducts(productsData.products || []);
              console.log("Products fetched:", productsData.products);
              console.log(
                "Products with categories:",
                productsData.products?.map((p: any) => ({
                  name: p.name,
                  category_id: p.category_id,
                }))
              );
            }

            if (categoriesResponse.ok) {
              categoriesData = await categoriesResponse.json();
              console.log("Categories API response:", categoriesData);
              console.log("Categories fetched:", categoriesData.categories);
              console.log(
                "Number of categories:",
                categoriesData.categories?.length || 0
              );

              // Create category map for quick lookup
              const catMap = new Map<number, string>();
              categoriesData.categories.forEach((cat: any) => {
                catMap.set(cat.id, cat.name);
              });
              setCategoryMap(catMap);

              // Calculate product count for each category if products are available
              if (productsData && productsData.products) {
                const categoriesWithCount = categoriesData.categories.map(
                  (cat: any) => {
                    const productCount = productsData.products.filter(
                      (product: Product) => product.category_id === cat.id
                    ).length;
                    return {
                      ...cat,
                      product_count: productCount,
                    };
                  }
                );

                // Add "No Category" option if there are products without categories
                const productsWithoutCategory = productsData.products.filter(
                  (product: Product) => !product.category_id
                ).length;

                if (productsWithoutCategory > 0) {
                  categoriesWithCount.push({
                    id: -1, // Special ID for "No Category"
                    name: "No Category",
                    description: null,
                    created_at: new Date().toISOString(),
                    product_count: productsWithoutCategory,
                  });
                }

                console.log("Categories with count:", categoriesWithCount);
                setCategories(categoriesWithCount || []);
              } else {
                console.log(
                  "Categories without count:",
                  categoriesData.categories
                );
                setCategories(categoriesData.categories || []);
              }
            }
          }
        } catch (err) {
          console.log("No shop products found or error:", err);
        }
      } catch (err) {
        setError("Failed to load website data");
        console.error("Error fetching website data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWebsiteData();
  }, [websiteId]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.price.toString().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      getCategoryName(product.category_id) === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aValue, bValue;
    switch (sortBy) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "price":
        aValue = a.price;
        bValue = b.price;
        break;
      case "newest":
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  console.log("Sorted products:", sortedProducts);

  const addToCart = (productId: string) => {
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
    setSnackbarMessage("Product added to cart!");
    setSnackbarOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId] -= 1;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const openProductDialog = (product: Product) => {
    setSelectedProduct(product);
    setProductDialogOpen(true);
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [productId, quantity]) => {
      const product = products.find((p) => p.product_id === productId);
      return total + (product?.price || 0) * quantity;
    }, 0);
  };

  const getCartItemCount = () => {
    return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f8f9fa" }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
              gap: 3,
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Card key={item}>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" height={32} />
                  <Skeleton variant="text" height={20} />
                  <Skeleton variant="text" height={20} />
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          bgcolor: "#f8f9fa",
          p: 3,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom>
            {error}
          </Typography>
          <Typography variant="body2">
            The website you're looking for doesn't exist or has been removed.
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (!websiteData) {
    return null;
  }

  const initials = websiteData.name.slice(0, 2).toUpperCase();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8f9fa" }}>
      {/* Header */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ bgcolor: "white", borderBottom: "1px solid #e0e0e0" }}
      >
        <Toolbar>
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <Avatar sx={{ mr: 2, bgcolor: "primary.main" }}>{initials}</Avatar>
            <Box>
              <Typography variant="h6" color="text.primary" fontWeight="bold">
                {websiteData.shop_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {websiteData.name}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              size="small"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
              sx={{ width: 300, display: { xs: "none", md: "block" } }}
            />

            <IconButton
              onClick={() => setDrawerOpen(true)}
              sx={{ display: { md: "none" } }}
            >
              <Menu />
            </IconButton>

            <Badge badgeContent={getCartItemCount()} color="primary">
              <IconButton>
                <ShoppingCart />
              </IconButton>
            </Badge>

            <IconButton>
              <Favorite />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* <Container sx={{ py: 0 }}> */}
      {/* Hero Section */}
      <Card
        sx={{
          mb: 4,
          bgcolor: "primary.main",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 4, position: "relative", zIndex: 1 }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Welcome to {websiteData.shop_name}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
            Discover amazing products and exceptional service
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              size="large"
              sx={{ bgcolor: "white", color: "primary.main" }}
            >
              Shop Now
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ color: "white", borderColor: "white" }}
            >
              Contact Us
            </Button>
          </Box>
        </Box>
        <Box
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "40%",
            height: "100%",
            background:
              "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
            clipPath: "polygon(100% 0%, 0% 100%, 100% 100%)",
          }}
        />
      </Card>

      {/* Filters and Sort */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
              gap: 2,
              alignItems: "center",
            }}
          >
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <MenuItem key={category.id} value={category.name}>
                      {category.name} ({category.product_count || 0})
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="general" disabled>
                    No categories found for this shop
                  </MenuItem>
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="price">Price</MenuItem>
                <MenuItem value="newest">Newest</MenuItem>
              </Select>
            </FormControl>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "Low to High" : "High to Low"}
            </Button>

            <Typography variant="body2" color="text.secondary">
              {sortedProducts.length} products found
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 3,
          px: 4,
        }}
      >
        {sortedProducts.map((product) => (
          <Box key={product.id}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 4,
                },
              }}
            >
              <CardActionArea onClick={() => openProductDialog(product)}>
                {product.image_url ? (
                  <CardMedia
                    component="img"
                    height="100px"
                    image={product.image_url}
                    alt={product.name}
                    sx={{ objectFit: "cover" }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 200,
                      bgcolor: "grey.100",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography color="text.secondary">No Image</Typography>
                  </Box>
                )}

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom noWrap>
                    {product.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {product.description}
                  </Typography>

                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      ₹{product.price.toLocaleString()}
                    </Typography>
                    {product.original_price && (
                      <Typography
                        variant="body2"
                        sx={{ textDecoration: "line-through" }}
                      >
                        ₹{product.original_price.toLocaleString()}
                      </Typography>
                    )}
                  </Box>

                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Chip
                      label={getCategoryName(product.category_id)}
                      size="small"
                      color="secondary"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Stock: {product.stock_quantity}
                    </Typography>
                  </Box>

                  <Rating value={4.5} readOnly size="small" />
                </CardContent>
              </CardActionArea>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<ShoppingCart />}
                  onClick={() => addToCart(product.product_id)}
                  disabled={product.stock_quantity === 0}
                >
                  {product.stock_quantity === 0
                    ? "Out of Stock"
                    : "Add to Cart"}
                </Button>
                <IconButton
                  onClick={() => toggleWishlist(product.product_id)}
                  color={
                    wishlist.includes(product.product_id) ? "error" : "default"
                  }
                >
                  {wishlist.includes(product.product_id) ? (
                    <Favorite />
                  ) : (
                    <FavoriteBorder />
                  )}
                </IconButton>
              </CardActions>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Empty State */}
      {sortedProducts.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No products found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Try adjusting your search or filter criteria
          </Typography>
        </Box>
      )}
      {/* </Container> */}

      {/* Product Detail Dialog */}
      <Dialog
        open={productDialogOpen}
        onClose={() => setProductDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedProduct && (
          <>
            <DialogTitle>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h6">{selectedProduct.name}</Typography>
                <IconButton onClick={() => setProductDialogOpen(false)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                  gap: 3,
                }}
              >
                <Box>
                  {selectedProduct.image_url ? (
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      style={{ width: "100%", height: "auto", borderRadius: 8 }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: "100%",
                        height: 300,
                        bgcolor: "grey.100",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 2,
                      }}
                    >
                      <Typography color="text.secondary">No Image</Typography>
                    </Box>
                  )}
                </Box>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {selectedProduct.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {selectedProduct.description}
                  </Typography>

                  <Box display="flex" alignItems="center" mb={2}>
                    <Typography
                      variant="h4"
                      color="primary"
                      fontWeight="bold"
                      sx={{ mr: 2 }}
                    >
                      ₹{selectedProduct.price.toLocaleString()}
                    </Typography>
                    {selectedProduct.original_price && (
                      <Typography
                        variant="h6"
                        sx={{ textDecoration: "line-through" }}
                      >
                        ₹{selectedProduct.original_price.toLocaleString()}
                      </Typography>
                    )}
                  </Box>

                  <Box display="flex" alignItems="center" mb={3}>
                    <Rating value={4.5} readOnly />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      (4.5 stars)
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" mb={3}>
                    <Chip
                      label={getCategoryName(selectedProduct.category_id)}
                      color="secondary"
                      sx={{ mr: 2 }}
                    />
                    <Typography variant="body2">
                      Stock: {selectedProduct.stock_quantity} units
                    </Typography>
                  </Box>

                  <Box display="flex" gap={2} mb={3}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<ShoppingCart />}
                      onClick={() => {
                        addToCart(selectedProduct.product_id);
                        setProductDialogOpen(false);
                      }}
                      disabled={selectedProduct.stock_quantity === 0}
                      fullWidth
                    >
                      {selectedProduct.stock_quantity === 0
                        ? "Out of Stock"
                        : "Add to Cart"}
                    </Button>
                    <IconButton
                      onClick={() => toggleWishlist(selectedProduct.product_id)}
                      color={
                        wishlist.includes(selectedProduct.product_id)
                          ? "error"
                          : "default"
                      }
                    >
                      {wishlist.includes(selectedProduct.product_id) ? (
                        <Favorite />
                      ) : (
                        <FavoriteBorder />
                      )}
                    </IconButton>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Product Features
                    </Typography>
                    <Box display="flex" alignItems="center" mb={1}>
                      <VerifiedUser sx={{ mr: 1, color: "success.main" }} />
                      <Typography variant="body2">Authentic Product</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mb={1}>
                      <LocalShipping sx={{ mr: 1, color: "primary.main" }} />
                      <Typography variant="body2">Fast Delivery</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Security sx={{ mr: 1, color: "warning.main" }} />
                      <Typography variant="body2">Secure Payment</Typography>
                    </Box>
                    <Box display="flex" alignItems="center">
                      <Support sx={{ mr: 1, color: "info.main" }} />
                      <Typography variant="body2">24/7 Support</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Filter Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 300, p: 3 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h6">Filters</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <Close />
            </IconButton>
          </Box>

          <Typography variant="subtitle1" gutterBottom>
            Price Range
          </Typography>
          <Slider
            value={priceRange}
            onChange={(_, value) => setPriceRange(value as [number, number])}
            valueLabelDisplay="auto"
            min={0}
            max={10000}
            step={100}
          />
          <Typography variant="body2" color="text.secondary">
            ₹{priceRange[0]} - ₹{priceRange[1]}
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" gutterBottom>
            Categories
          </Typography>
          <List>
            <ListItemButton
              selected={selectedCategory === "all"}
              onClick={() => setSelectedCategory("all")}
            >
              <ListItemText primary="All Categories" />
            </ListItemButton>
            {categories.map((category) => (
              <ListItemButton
                key={category.id}
                selected={selectedCategory === category.name}
                onClick={() => setSelectedCategory(category.name)}
              >
                <ListItemText
                  primary={category.name}
                  secondary={`${category.product_count || 0} products`}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />

      {/* Floating Action Buttons */}
      <Fab
        color="primary"
        aria-label="contact"
        sx={{ position: "fixed", bottom: 80, right: 16 }}
        onClick={() => window.open(`tel:${websiteData.phone}`)}
      >
        <Phone />
      </Fab>

      <Fab
        color="success"
        aria-label="whatsapp"
        sx={{ position: "fixed", bottom: 16, right: 16 }}
        onClick={() => window.open(`https://wa.me/${websiteData.phone}`)}
      >
        <WhatsApp />
      </Fab>
    </Box>
  );
}
