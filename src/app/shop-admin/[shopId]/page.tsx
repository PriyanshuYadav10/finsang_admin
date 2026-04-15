"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Fab,
  Drawer,
  AppBar,
  Toolbar,
  ListItemIcon,
  ListItemButton,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Category,
  Inventory,
  Visibility,
  Logout,
  Dashboard,
  ShoppingCart,
  People,
  Analytics,
  Settings,
  Notifications,
  Search,
  FilterList,
  TrendingUp,
  AttachMoney,
  LocalShipping,
  PhotoCamera,
  Share,
  Person,
  Email,
  ArrowUpward,
  ArrowDownward,
  CheckCircle,
  Cancel,
  Pending,
  Refresh,
  ViewList,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

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
  views?: number;
  sales?: number;
}

interface Category {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  product_count?: number;
}

interface ShopData {
  shop_id: string;
  shop_name: string;
  owner_name: string;
  phone: string;
  email: string;
  description: string | null;
  address: string | null;
}

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  shop_id: string;
  total_amount: number;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  shipping_address: any;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
  user?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image_url?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Notification {
  id: string;
  shop_id: string;
  order_id: string;
  notification_type: "new_order" | "order_update" | "payment_received";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  order?: {
    order_number: string;
    total_amount: number;
    status: string;
  };
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
}

interface Analytics {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  total_products: number;
  revenue_growth: number;
  orders_growth: number;
  top_products: Product[];
  recent_orders: Order[];
}

export default function ShopAdminPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const router = useRouter();
  const { shopId } = React.use(params);
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  // Helper function to get category name by ID
  const getCategoryName = (categoryId: number | null): string => {
    if (!categoryId) return "No Category";
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "No Category";
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Enhanced state for product preview
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Product form state
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    stockQuantity: "",
    categoryId: "",
    imageUrl: "",
  });

  // Category form state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });

  // Notification and Order Dialog State
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("shopToken");
    if (!storedToken) {
      router.push(`/shop-admin/${shopId}/login`);
      return;
    }
    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchShopData(),
        fetchProducts(),
        fetchCategories(),
        fetchOrders(),
        fetchNotifications(),
        fetchCustomers(),
        fetchAnalytics(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchShopData = async () => {
    try {
      const response = await fetch(`/api/shops/${shopId}`);
      if (!response.ok) throw new Error("Failed to fetch shop data");
      const data = await response.json();
      setShopData(data.shop);
    } catch (error) {
      console.error("Error fetching shop data:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/shop-products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/shop-products/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (*)
        `
        )
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user details separately since orders.user_id references auth.users
      const ordersWithUserDetails = await Promise.all(
        (data || []).map(async (order) => {
          try {
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("name, email, phone")
              .eq("id", order.user_id)
              .single();

            if (userError) {
              console.error("Error fetching user details:", userError);
              return {
                ...order,
                user: {
                  name: "Unknown User",
                  email: "N/A",
                  phone: "N/A",
                },
              };
            }

            return {
              ...order,
              user: userData,
            };
          } catch (error) {
            console.error("Error fetching user details for order:", error);
            return {
              ...order,
              user: {
                name: "Unknown User",
                email: "N/A",
                phone: "N/A",
              },
            };
          }
        })
      );

      setOrders(ordersWithUserDetails);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("shop_notifications")
        .select(
          `
          *,
          orders (
            order_number,
            total_amount,
            status
          )
        `
        )
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const fetchCustomers = async () => {
    // Mock data for now - replace with actual API call
    const mockCustomers: Customer[] = [
      {
        id: "CUST001",
        name: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        total_orders: 5,
        total_spent: 7500,
        last_order_date: "2024-01-15T10:30:00Z",
      },
      {
        id: "CUST002",
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "+1234567891",
        total_orders: 3,
        total_spent: 4500,
        last_order_date: "2024-01-14T15:45:00Z",
      },
    ];
    setCustomers(mockCustomers);
  };

  const fetchAnalytics = async () => {
    // Mock analytics data - replace with actual API call
    const mockAnalytics: Analytics = {
      total_revenue: 25000,
      total_orders: 45,
      total_customers: 23,
      total_products: products.length,
      revenue_growth: 12.5,
      orders_growth: 8.3,
      top_products: products.slice(0, 5),
      recent_orders: [],
    };
    setAnalytics(mockAnalytics);
  };

  const handleProductSubmit = async () => {
    if (!productForm.name || !productForm.description || !productForm.price) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const productData = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        original_price: productForm.originalPrice
          ? parseFloat(productForm.originalPrice)
          : null,
        stock_quantity: parseInt(productForm.stockQuantity) || 0,
        category_id: productForm.categoryId
          ? parseInt(productForm.categoryId)
          : null,
        image_url: productForm.imageUrl || null,
      };

      let response;
      if (editingProduct) {
        response = await fetch(
          `/api/shop-products/${editingProduct.product_id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(productData),
          }
        );
      } else {
        response = await fetch("/api/shop-products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(productData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save product");
      }

      setProductDialogOpen(false);
      setEditingProduct(null);
      resetProductForm();
      await fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      alert(error instanceof Error ? error.message : "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit = async () => {
    if (!categoryForm.name.trim()) {
      alert("Category name is required");
      return;
    }

    setLoading(true);
    try {
      const categoryData = {
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
      };

      let response;
      if (editingCategory) {
        response = await fetch(
          `/api/shop-products/categories/${editingCategory.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(categoryData),
          }
        );
      } else {
        response = await fetch("/api/shop-products/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(categoryData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save category");
      }

      setCategoryDialogOpen(false);
      setEditingCategory(null);
      resetCategoryForm();
      await fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      alert(error instanceof Error ? error.message : "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this product? This action cannot be undone."
      )
    )
      return;

    setLoading(true);
    try {
      const response = await fetch(`/api/shop-products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete product");
      }

      await fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete product"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProductStatus = async (productId: string) => {
    const confirm = window.confirm(
      "Are you sure you want to Deactivate the product?"
    );
    if (!confirm) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/shop-products/${productId}/toggle-status`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to toggle product status");
      }

      const result = await response.json();
      await fetchProducts();
      alert(result.message);
    } catch (error) {
      console.error("Error toggling product status:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to toggle product status"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/shop-products/categories/${categoryId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete category");
      }

      await fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete category"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: "",
      description: "",
    });
  };

  const resetProductForm = () => {
    setProductForm({
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      stockQuantity: "",
      categoryId: "",
      imageUrl: "",
    });
  };

  // Product preview functions
  const openProductPreview = (product: Product) => {
    setSelectedProduct(product);
    setPreviewDialogOpen(true);
  };

  const closeProductPreview = () => {
    setSelectedProduct(null);
    setPreviewDialogOpen(false);
  };

  const openProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        originalPrice: product.original_price?.toString() || "",
        stockQuantity: product.stock_quantity.toString(),
        categoryId: product.category_id?.toString() || "",
        imageUrl: product.image_url || "",
      });
    } else {
      setEditingProduct(null);
      resetProductForm();
    }
    setProductDialogOpen(true);
  };

  const openCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || "",
      });
    } else {
      setEditingCategory(null);
      resetCategoryForm();
    }
    setCategoryDialogOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("shopToken");
    localStorage.removeItem("shopId");
    router.push(`/shop-admin/${shopId}/login`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "confirmed":
        return "info";
      case "shipped":
        return "primary";
      case "delivered":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Pending />;
      case "confirmed":
        return <CheckCircle />;
      case "shipped":
        return <LocalShipping />;
      case "delivered":
        return <CheckCircle />;
      case "cancelled":
        return <Cancel />;
      default:
        return <Pending />;
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      case "stock":
        aValue = a.stock_quantity;
        bValue = b.stock_quantity;
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

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const renderDashboard = () => (
    <Box>
      {/* Analytics Cards */}
      <Box display="flex" flexWrap="wrap" gap={3} mb={4}>
        <Box sx={{ flex: "1 1 250px", minWidth: 0 }}>
          <Card sx={{ bgcolor: "primary.main", color: "white" }}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    ₹{analytics?.total_revenue?.toLocaleString() || "0"}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Total Revenue
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                    <Typography variant="body2">
                      +{analytics?.revenue_growth || 0}%
                    </Typography>
                  </Box>
                </Box>
                <AttachMoney sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 250px", minWidth: 0 }}>
          <Card sx={{ bgcolor: "secondary.main", color: "white" }}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {analytics?.total_orders || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Total Orders
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                    <Typography variant="body2">
                      +{analytics?.orders_growth || 0}%
                    </Typography>
                  </Box>
                </Box>
                <ShoppingCart sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 250px", minWidth: 0 }}>
          <Card sx={{ bgcolor: "success.main", color: "white" }}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {analytics?.total_customers || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Customers
                  </Typography>
                </Box>
                <People sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 250px", minWidth: 0 }}>
          <Card sx={{ bgcolor: "info.main", color: "white" }}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {products.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Products
                  </Typography>
                </Box>
                <Inventory sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Recent Orders */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Orders
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.slice(0, 5).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.user?.name || "Unknown"}</TableCell>
                    <TableCell>₹{order.total_amount}</TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(order.status)}
                        label={order.status}
                        color={getStatusColor(order.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Box display="flex" flexWrap="wrap" gap={3}>
        <Box sx={{ flex: "1 1 400px", minWidth: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Products
              </Typography>
              <List>
                {products.slice(0, 5).map((product, index) => (
                  <ListItem key={product.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={product.name}
                      secondary={`₹${product.price} • ${product.stock_quantity} in stock`}
                    />
                    <Chip
                      label={getCategoryName(product.category_id)}
                      size="small"
                      color="secondary"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 400px", minWidth: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Customers
              </Typography>
              <List>
                {customers.slice(0, 5).map((customer) => (
                  <ListItem key={customer.id}>
                    <ListItemAvatar>
                      <Avatar>
                        <Person />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={customer.name}
                      secondary={`${customer.total_orders} orders • ₹${customer.total_spent}`}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {new Date(customer.last_order_date).toLocaleDateString()}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );

  const renderProducts = () => (
    <Box>
      {/* Enhanced Search and Filter Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
            <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
              <TextField
                fullWidth
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Search sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Box>
            <Box sx={{ flex: "0 1 200px", minWidth: 0 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.name}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: "0 1 200px", minWidth: 0 }}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="price">Price</MenuItem>
                  <MenuItem value="stock">Stock</MenuItem>
                  <MenuItem value="created">Date Created</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: "0 1 150px", minWidth: 0 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                startIcon={
                  sortOrder === "asc" ? <ArrowUpward /> : <ArrowDownward />
                }
              >
                {sortOrder.toUpperCase()}
              </Button>
            </Box>
            <Box sx={{ flex: "0 1 150px", minWidth: 0 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
                startIcon={viewMode === "grid" ? <ViewList /> : <FilterList />}
              >
                {viewMode === "grid" ? "List" : "Grid"}
              </Button>
            </Box>
            <Box sx={{ flex: "0 1 100px", minWidth: 0 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Add />}
                onClick={() => openProductDialog()}
              >
                Add
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Enhanced Products Grid/List */}
      {viewMode === "grid" ? (
        <Box display="flex" flexWrap="wrap" gap={3}>
          {sortedProducts.map((product) => (
            <Box
              sx={{ flex: "1 1 300px", maxWidth: "400px", minWidth: "280px" }}
              key={product.id}
            >
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                  },
                }}
              >
                {/* Product Image */}
                <Box sx={{ position: "relative" }}>
                  {product.image_url ? (
                    <Box
                      sx={{
                        height: 200,
                        backgroundImage: `url(${product.image_url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 200,
                        bgcolor: "grey.100",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                      }}
                    >
                      <PhotoCamera sx={{ fontSize: 48, color: "grey.400" }} />
                    </Box>
                  )}

                  {/* Status Badge */}
                  <Box sx={{ position: "absolute", top: 8, left: 8 }}>
                    <Chip
                      label={product.is_active ? "Active" : "Inactive"}
                      size="small"
                      color={product.is_active ? "success" : "default"}
                      sx={{ fontWeight: "bold" }}
                    />
                  </Box>
                </Box>

                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                  {/* Product Header */}
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    mb={1}
                  >
                    <Typography
                      variant="h6"
                      noWrap
                      sx={{ maxWidth: "70%", fontWeight: "bold" }}
                    >
                      {product.name}
                    </Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => openProductPreview(product)}
                        sx={{ color: "primary.main" }}
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => openProductDialog(product)}
                        sx={{ color: "info.main" }}
                      >
                        <Edit />
                      </IconButton>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          handleToggleProductStatus(product.product_id)
                        }
                        sx={{
                          color: product.is_active
                            ? "warning.main"
                            : "success.main",
                          borderColor: product.is_active
                            ? "warning.main"
                            : "success.main",
                          "&:hover": {
                            borderColor: product.is_active
                              ? "warning.dark"
                              : "success.dark",
                            backgroundColor: product.is_active
                              ? "warning.light"
                              : "success.light",
                          },
                        }}
                      >
                        {product.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteProduct(product.product_id)}
                        sx={{ color: "error.main" }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Description */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    mb={2}
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      lineHeight: 1.4,
                    }}
                  >
                    {product.description}
                  </Typography>

                  {/* Price Section */}
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Box>
                      <Typography
                        variant="h6"
                        color="primary"
                        fontWeight="bold"
                      >
                        ₹{product.price.toLocaleString()}
                      </Typography>
                      {product.original_price && (
                        <Typography
                          variant="body2"
                          sx={{
                            textDecoration: "line-through",
                            color: "text.secondary",
                          }}
                        >
                          ₹{product.original_price.toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Category and Stock */}
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
                      variant="outlined"
                    />
                    <Box display="flex" alignItems="center">
                      <Inventory
                        sx={{ fontSize: 16, mr: 0.5, color: "text.secondary" }}
                      />
                      <Typography
                        variant="body2"
                        color={
                          product.stock_quantity > 0
                            ? "success.main"
                            : "error.main"
                        }
                      >
                        {product.stock_quantity} in stock
                      </Typography>
                    </Box>
                  </Box>

                  {/* Additional Info */}
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    {product.views && (
                      <Typography variant="caption" color="text.secondary">
                        {product.views} views
                      </Typography>
                    )}
                  </Box>

                  {/* Action Buttons */}
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mt={2}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => openProductPreview(product)}
                      fullWidth
                      sx={{ mr: 1 }}
                    >
                      Preview
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Share />}
                      onClick={() =>
                        window.open(`/website/${shopId}`, "_blank")
                      }
                      fullWidth
                    >
                      View Shop
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      ) : (
        /* List View */
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar
                          src={product.image_url || undefined}
                          sx={{ mr: 2, width: 40, height: 40 }}
                        >
                          <PhotoCamera />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {product.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getCategoryName(product.category_id)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getCategoryName(product.category_id)}
                        size="small"
                        color="secondary"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ₹{product.price.toLocaleString()}
                      </Typography>
                      {product.original_price && (
                        <Typography
                          variant="caption"
                          sx={{ textDecoration: "line-through" }}
                        >
                          ₹{product.original_price.toLocaleString()}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={
                          product.stock_quantity > 0
                            ? "success.main"
                            : "error.main"
                        }
                      >
                        {product.stock_quantity}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={product.is_active ? "Active" : "Inactive"}
                        size="small"
                        color={product.is_active ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton
                          size="small"
                          onClick={() => openProductPreview(product)}
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => openProductDialog(product)}
                        >
                          <Edit />
                        </IconButton>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            handleToggleProductStatus(product.product_id)
                          }
                          sx={{
                            color: product.is_active
                              ? "warning.main"
                              : "success.main",
                            borderColor: product.is_active
                              ? "warning.main"
                              : "success.main",
                            "&:hover": {
                              borderColor: product.is_active
                                ? "warning.dark"
                                : "success.dark",
                              backgroundColor: product.is_active
                                ? "warning.light"
                                : "success.light",
                            },
                          }}
                        >
                          {product.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleDeleteProduct(product.product_id)
                          }
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );

  const renderOrders = () => (
    <Box>
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h6" gutterBottom>
              Order Management
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchOrders}
            >
              Refresh
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Box py={4}>
                        <ShoppingCart
                          sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
                        />
                        <Typography
                          variant="h6"
                          color="text.secondary"
                          gutterBottom
                        >
                          No orders found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          You haven't received any orders yet.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {order.order_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {order.user?.name || "Unknown"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.user?.email || "No email"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {order.order_items.length} item
                          {order.order_items.length !== 1 ? "s" : ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">
                          ₹{order.total_amount}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.status}
                          color={getStatusColor(order.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.payment_status}
                          color={
                            order.payment_status === "paid"
                              ? "success"
                              : "warning"
                          }
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {formatDate(order.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedOrder(order);
                            setOrderDialogOpen(true);
                          }}
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedOrder(order);
                            setOrderDialogOpen(true);
                          }}
                        >
                          <Edit />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderCustomers = () => (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Customer Management
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Orders</TableCell>
                  <TableCell>Total Spent</TableCell>
                  <TableCell>Last Order</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2 }}>
                          <Person />
                        </Avatar>
                        <Typography variant="body2" fontWeight="bold">
                          {customer.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {customer.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {customer.phone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{customer.total_orders}</TableCell>
                    <TableCell>₹{customer.total_spent}</TableCell>
                    <TableCell>
                      {new Date(customer.last_order_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <Visibility />
                      </IconButton>
                      <IconButton size="small">
                        <Email />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderCategories = () => (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              <Category sx={{ mr: 1, verticalAlign: "middle" }} />
              Product Categories
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => openCategoryDialog()}
            >
              Add Category
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box display="flex" flexWrap="wrap" gap={3}>
        {categories.map((category) => (
          <Box sx={{ flex: "1 1 300px", minWidth: 0 }} key={category.id}>
            <Card>
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="h6">{category.name}</Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => openCategoryDialog(category)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
                {category.description && (
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {category.description}
                  </Typography>
                )}
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Chip
                    label={`${category.product_count || 0} products`}
                    size="small"
                    color="primary"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Created:{" "}
                    {new Date(category.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("shop_notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("shop_notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId)
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status: status as Order["status"] }
            : order
        )
      );

      setOrderDialogOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_order":
        return <ShoppingCart color="primary" />;
      case "order_update":
        return <Notifications color="warning" />;
      case "payment_received":
        return <CheckCircle color="success" />;
      default:
        return <Notifications />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "new_order":
        return "primary";
      case "order_update":
        return "warning";
      case "payment_received":
        return "success";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unreadNotificationsCount = notifications.filter(
    (n) => !n.is_read
  ).length;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: 280,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 280,
            boxSizing: "border-box",
            bgcolor: "white",
            borderRight: "1px solid #e0e0e0",
          },
        }}
      >
        <Box sx={{ p: 3, borderBottom: "1px solid #e0e0e0" }}>
          <Typography variant="h6" fontWeight="bold" color="primary">
            {shopData?.shop_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Admin Panel
          </Typography>
        </Box>

        <List sx={{ pt: 2 }}>
          <ListItemButton
            selected={activeTab === 0}
            onClick={() => setActiveTab(0)}
          >
            <ListItemIcon>
              <Dashboard />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>

          <ListItemButton
            selected={activeTab === 1}
            onClick={() => setActiveTab(1)}
          >
            <ListItemIcon>
              <Inventory />
            </ListItemIcon>
            <ListItemText primary="Products" />
          </ListItemButton>

          <ListItemButton
            selected={activeTab === 2}
            onClick={() => setActiveTab(2)}
          >
            <ListItemIcon>
              <ShoppingCart />
            </ListItemIcon>
            <ListItemText primary="Orders" />
          </ListItemButton>

          <ListItemButton
            selected={activeTab === 3}
            onClick={() => setActiveTab(3)}
          >
            <ListItemIcon>
              <People />
            </ListItemIcon>
            <ListItemText primary="Customers" />
          </ListItemButton>

          <ListItemButton
            selected={activeTab === 4}
            onClick={() => setActiveTab(4)}
          >
            <ListItemIcon>
              <Category />
            </ListItemIcon>
            <ListItemText primary="Categories" />
          </ListItemButton>
        </List>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {/* Top Bar */}
        <AppBar
          position="static"
          elevation={0}
          sx={{ bgcolor: "white", borderBottom: "1px solid #e0e0e0" }}
        >
          <Toolbar>
            <Typography variant="h6" color="text.primary" sx={{ flexGrow: 1 }}>
              {activeTab === 0 && "Dashboard"}
              {activeTab === 1 && "Products"}
              {activeTab === 2 && "Orders"}
              {activeTab === 3 && "Customers"}
              {activeTab === 4 && "Categories"}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton onClick={() => setNotificationDialogOpen(true)}>
                <Badge badgeContent={unreadNotificationsCount} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
              <IconButton>
                <Settings />
              </IconButton>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Logout />}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Content Area */}
        <Box sx={{ flexGrow: 1, p: 3 }}>
          {activeTab === 0 && renderDashboard()}
          {activeTab === 1 && renderProducts()}
          {activeTab === 2 && renderOrders()}
          {activeTab === 3 && renderCustomers()}
          {activeTab === 4 && renderCategories()}
        </Box>
      </Box>

      {/* Product Dialog */}
      <Dialog
        open={productDialogOpen}
        onClose={() => setProductDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </Typography>
            <IconButton onClick={() => setProductDialogOpen(false)}>
              <Cancel />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
            {/* Basic Information */}
            <Box sx={{ width: "100%" }}>
              <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
                Basic Information
              </Typography>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={2}>
              <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
                <TextField
                  fullWidth
                  label="Product Name"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  margin="normal"
                  required
                />
              </Box>
              <Box sx={{ flex: "0 1 200px", minWidth: 0 }}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm({ ...productForm, price: e.target.value })
                  }
                  margin="normal"
                  required
                />
              </Box>
            </Box>
            <Box sx={{ width: "100%" }}>
              <TextField
                fullWidth
                label="Description"
                value={productForm.description}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    description: e.target.value,
                  })
                }
                margin="normal"
                multiline
                rows={3}
              />
            </Box>
            <Box display="flex" flexWrap="wrap" gap={2}>
              <Box sx={{ flex: "1 1 200px", minWidth: 0 }}>
                <TextField
                  fullWidth
                  label="Original Price (Optional)"
                  type="number"
                  value={productForm.originalPrice}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      originalPrice: e.target.value,
                    })
                  }
                  margin="normal"
                />
              </Box>
              <Box sx={{ flex: "1 1 200px", minWidth: 0 }}>
                <TextField
                  fullWidth
                  label="Stock Quantity"
                  type="number"
                  value={productForm.stockQuantity}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      stockQuantity: e.target.value,
                    })
                  }
                  margin="normal"
                />
              </Box>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={2}>
              <Box sx={{ flex: "1 1 200px", minWidth: 0 }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={productForm.categoryId}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        categoryId: e.target.value,
                      })
                    }
                    label="Category"
                  >
                    <MenuItem value="">No Category</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: "1 1 200px", minWidth: 0 }}>
                <TextField
                  fullWidth
                  label="Image URL (Optional)"
                  value={productForm.imageUrl}
                  onChange={(e) =>
                    setProductForm({ ...productForm, imageUrl: e.target.value })
                  }
                  margin="normal"
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setProductDialogOpen(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button onClick={handleProductSubmit} variant="contained">
            {editingProduct ? "Update Product" : "Create Product"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={closeProductPreview}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h5" fontWeight="bold">
              Product Preview
            </Typography>
            <IconButton onClick={closeProductPreview}>
              <Cancel />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Box display="flex" flexWrap="wrap" gap={3}>
              {/* Product Image */}
              <Box sx={{ flex: "1 1 400px", minWidth: 0 }}>
                <Box sx={{ position: "relative" }}>
                  {selectedProduct.image_url ? (
                    <Box
                      sx={{
                        height: 400,
                        backgroundImage: `url(${selectedProduct.image_url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 400,
                        bgcolor: "grey.100",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <PhotoCamera sx={{ fontSize: 80, color: "grey.400" }} />
                    </Box>
                  )}

                  {/* Status Badges */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 16,
                      left: 16,
                      display: "flex",
                      gap: 1,
                    }}
                  >
                    <Chip
                      label={selectedProduct.is_active ? "Active" : "Inactive"}
                      color={selectedProduct.is_active ? "success" : "default"}
                      sx={{ fontWeight: "bold" }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Product Details */}
              <Box sx={{ flex: "1 1 400px", minWidth: 0 }}>
                <Box>
                  {/* Basic Info */}
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {selectedProduct.name}
                  </Typography>

                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Chip
                      label={getCategoryName(selectedProduct.category_id)}
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>

                  {/* Price Section */}
                  <Box mb={3}>
                    <Typography variant="h3" color="primary" fontWeight="bold">
                      ₹{selectedProduct.price.toLocaleString()}
                    </Typography>
                    {selectedProduct.original_price && (
                      <Typography
                        variant="h6"
                        sx={{
                          textDecoration: "line-through",
                          color: "text.secondary",
                        }}
                      >
                        ₹{selectedProduct.original_price.toLocaleString()}
                      </Typography>
                    )}
                  </Box>

                  {/* Description */}
                  <Typography variant="body1" paragraph>
                    {selectedProduct.description}
                  </Typography>

                  {/* Key Details */}
                  <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
                    <Box sx={{ flex: "1 1 200px", minWidth: 0 }}>
                      <Typography variant="body2" color="text.secondary">
                        Stock: {selectedProduct.stock_quantity} units
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={closeProductPreview} variant="outlined">
            Close
          </Button>
          <Button
            onClick={() => {
              closeProductPreview();
              openProductDialog(selectedProduct || undefined);
            }}
            variant="contained"
            startIcon={<Edit />}
          >
            Edit Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Dialog */}
      <Dialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              {editingCategory ? "Edit Category" : "Add New Category"}
            </Typography>
            <IconButton onClick={() => setCategoryDialogOpen(false)}>
              <Cancel />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Category Name"
            value={categoryForm.name}
            onChange={(e) =>
              setCategoryForm({ ...categoryForm, name: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description (Optional)"
            value={categoryForm.description}
            onChange={(e) =>
              setCategoryForm({ ...categoryForm, description: e.target.value })
            }
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setCategoryDialogOpen(false)}
            variant="outlined"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCategorySubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : undefined}
          >
            {loading
              ? "Saving..."
              : editingCategory
              ? "Update Category"
              : "Create Category"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog
        open={notificationDialogOpen}
        onClose={() => setNotificationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              Notifications
              {unreadNotificationsCount > 0 && (
                <Badge
                  badgeContent={unreadNotificationsCount}
                  color="error"
                  sx={{ ml: 2 }}
                >
                  <Notifications />
                </Badge>
              )}
            </Typography>
            <IconButton onClick={() => setNotificationDialogOpen(false)}>
              <Cancel />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {notifications.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Notifications
                sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You'll see notifications here when you receive new orders or
                updates.
              </Typography>
            </Box>
          ) : (
            <List>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      backgroundColor: notification.is_read
                        ? "transparent"
                        : "action.hover",
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemIcon>
                      {getNotificationIcon(notification.notification_type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography
                            variant="subtitle1"
                            fontWeight={
                              notification.is_read ? "normal" : "bold"
                            }
                          >
                            {notification.title}
                          </Typography>
                          <Chip
                            label={notification.notification_type.replace(
                              "_",
                              " "
                            )}
                            color={
                              getNotificationColor(
                                notification.notification_type
                              ) as any
                            }
                            size="small"
                          />
                          {!notification.is_read && (
                            <Chip label="New" color="error" size="small" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            {notification.message}
                          </Typography>
                          {notification.order && (
                            <Box display="flex" gap={2} alignItems="center">
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Order: {notification.order.order_number}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Amount: ₹{notification.order.total_amount}
                              </Typography>
                              <Chip
                                label={notification.order.status}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          )}
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 1, display: "block" }}
                          >
                            {formatDate(notification.created_at)}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box>
                      {!notification.is_read && (
                        <IconButton
                          size="small"
                          onClick={() =>
                            markNotificationAsRead(notification.id)
                          }
                          sx={{ mr: 1 }}
                        >
                          <CheckCircle />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setNotificationDialogOpen(false)}
            variant="outlined"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog
        open={orderDialogOpen}
        onClose={() => setOrderDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              Order Details - {selectedOrder?.order_number}
            </Typography>
            <IconButton onClick={() => setOrderDialogOpen(false)}>
              <Cancel />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              {/* Customer Information */}
              <Typography variant="h6" gutterBottom>
                Customer Information
              </Typography>
              <Box mb={3}>
                <Typography variant="body2">
                  <strong>Name:</strong> {selectedOrder.user?.name || "Unknown"}
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong>{" "}
                  {selectedOrder.user?.email || "No email"}
                </Typography>
                <Typography variant="body2">
                  <strong>Phone:</strong>{" "}
                  {selectedOrder.user?.phone || "No phone"}
                </Typography>
              </Box>

              {/* Order Items */}
              <Typography variant="h6" gutterBottom>
                Order Items
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.order_items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            {item.product_image_url && (
                              <Avatar
                                src={item.product_image_url}
                                sx={{ mr: 2, width: 40, height: 40 }}
                              />
                            )}
                            <Typography variant="body2">
                              {item.product_name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>₹{item.unit_price}</TableCell>
                        <TableCell>₹{item.total_price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Order Summary */}
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              <Box mb={3}>
                <Typography variant="body2">
                  <strong>Order Number:</strong> {selectedOrder.order_number}
                </Typography>
                <Typography variant="body2">
                  <strong>Total Amount:</strong> ₹{selectedOrder.total_amount}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong>
                  <Chip
                    label={selectedOrder.status}
                    color={getStatusColor(selectedOrder.status) as any}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography variant="body2">
                  <strong>Payment Status:</strong>
                  <Chip
                    label={selectedOrder.payment_status}
                    color={
                      selectedOrder.payment_status === "paid"
                        ? "success"
                        : "warning"
                    }
                    size="small"
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography variant="body2">
                  <strong>Order Date:</strong>{" "}
                  {formatDate(selectedOrder.created_at)}
                </Typography>
              </Box>

              {/* Update Status */}
              <Typography variant="h6" gutterBottom>
                Update Order Status
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedOrder.status}
                  onChange={(e) =>
                    updateOrderStatus(selectedOrder.id, e.target.value)
                  }
                  label="Status"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="shipped">Shipped</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOrderDialogOpen(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: "fixed", bottom: 16, right: 16 }}
        onClick={() => {
          if (activeTab === 1) openProductDialog();
          else if (activeTab === 4) openCategoryDialog();
        }}
      >
        <Add />
      </Fab>
    </Box>
  );
}
