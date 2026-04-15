const express = require("express");
const jwt = require("jsonwebtoken");
const { supabase } = require("../config/supabase");
const router = express.Router();

// Middleware to verify shop authentication
const authenticateShop = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.shopId = decoded.shopId;
    req.shopName = decoded.shopName;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Create product category
router.post("/categories", authenticateShop, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const { data, error } = await supabase
      .from("product_categories")
      .insert({
        shop_id: req.shopId,
        name,
        description,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ category: data });
  } catch (error) {
    console.error("Category creation error:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// Get shop categories
router.get("/categories", authenticateShop, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("product_categories")
      .select("*")
      .eq("shop_id", req.shopId)
      .order("name");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ categories: data });
  } catch (error) {
    console.error("Categories retrieval error:", error);
    res.status(500).json({ error: "Failed to retrieve categories" });
  }
});

// Update category
router.put("/categories/:id", authenticateShop, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const { data, error } = await supabase
      .from("product_categories")
      .update({ name, description })
      .eq("id", id)
      .eq("shop_id", req.shopId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ category: data });
  } catch (error) {
    console.error("Category update error:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
});

// Delete category
router.delete("/categories/:id", authenticateShop, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("product_categories")
      .delete()
      .eq("id", id)
      .eq("shop_id", req.shopId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Category deletion error:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

// Create product
router.post("/", authenticateShop, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      stockQuantity,
      categoryId,
      imageUrl,
    } = req.body;

    if (!name || !price) {
      return res
        .status(400)
        .json({ error: "Product name and price are required" });
    }

    // Generate unique product ID
    const productId = `${name
      .toLowerCase()
      .replace(/\s+/g, "-")}-${Date.now()}`;

    const { data, error } = await supabase
      .from("shop_products")
      .insert({
        product_id: productId,
        shop_id: req.shopId,
        category_id: categoryId,
        name,
        description,
        price: parseFloat(price),
        original_price: originalPrice ? parseFloat(originalPrice) : null,
        stock_quantity: stockQuantity || 0,
        image_url: imageUrl,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ product: data });
  } catch (error) {
    console.error("Product creation error:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Get shop products
router.get("/", authenticateShop, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("shop_products")
      .select(
        `
        *,
        product_categories(name)
      `
      )
      .eq("shop_id", req.shopId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ products: data });
  } catch (error) {
    console.error("Products retrieval error:", error);
    res.status(500).json({ error: "Failed to retrieve products" });
  }
});

// Get single product
router.get("/:productId", authenticateShop, async (req, res) => {
  try {
    const { productId } = req.params;

    const { data, error } = await supabase
      .from("shop_products")
      .select(
        `
        *,
        product_categories(name)
      `
      )
      .eq("product_id", productId)
      .eq("shop_id", req.shopId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ product: data });
  } catch (error) {
    console.error("Product retrieval error:", error);
    res.status(500).json({ error: "Failed to retrieve product" });
  }
});

// Update product
router.put("/:productId", authenticateShop, async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      name,
      description,
      price,
      originalPrice,
      stockQuantity,
      categoryId,
      imageUrl,
      isActive,
    } = req.body;

    const updateData = {
      name,
      description,
      price: price ? parseFloat(price) : undefined,
      original_price: originalPrice ? parseFloat(originalPrice) : null,
      stock_quantity: stockQuantity,
      category_id: categoryId,
      image_url: imageUrl,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const { data, error } = await supabase
      .from("shop_products")
      .update(updateData)
      .eq("product_id", productId)
      .eq("shop_id", req.shopId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ product: data });
  } catch (error) {
    console.error("Product update error:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete product
router.delete("/:productId", authenticateShop, async (req, res) => {
  try {
    const { productId } = req.params;

    const { error } = await supabase
      .from("shop_products")
      .delete()
      .eq("product_id", productId)
      .eq("shop_id", req.shopId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Product deletion error:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;
