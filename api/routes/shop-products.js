const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder-key');

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'finsangmart-super-secret-jwt-key-2024';

// Middleware to authenticate shop owner
const authenticateShop = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7);
    console.log('Token:', token);
    console.log('JWT_SECRET:', JWT_SECRET);
    
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    // Verify shop exists and is active
    const { data: shop, error } = await supabase
      .from('user_shops')
      .select('*')
      .eq('shop_id', decoded.shopId)
      .single();

    if (error || !shop) {
      console.log('Shop not found:', error);
      return res.status(401).json({ error: 'Invalid shop token' });
    }

    req.shopId = decoded.shopId;
    req.shop = shop;
    next();
  } catch (error) {
    console.log('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Validation middleware
const validateProduct = [
  body('name').trim().isLength({ min: 1 }).withMessage('Product name is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Product description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Valid stock quantity is required'),
  body('category_id').optional().isInt().withMessage('Valid category ID is required'),
];

const validateCategory = [
  body('name').trim().isLength({ min: 1 }).withMessage('Category name is required'),
];

// Create product category
router.post('/categories', authenticateShop, validateCategory, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { name } = req.body;
    const shopId = req.shopId;

    // Check if category already exists for this shop
    const { data: existingCategory } = await supabase
      .from('product_categories')
      .select('*')
      .eq('shop_id', shopId)
      .eq('name', name)
      .single();

    if (existingCategory) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    // Create new category
    const { data: category, error } = await supabase
      .from('product_categories')
      .insert({
        shop_id: shopId,
        name: name,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return res.status(500).json({ error: 'Failed to create category' });
    }

    res.status(201).json({ category });
  } catch (error) {
    console.error('Error in create category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all categories for shop
router.get('/categories', authenticateShop, async (req, res) => {
  try {
    const shopId = req.shopId;
    console.log('Fetching categories for shop:', shopId);

    const { data: categories, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch categories',
        details: error.message,
        code: error.code
      });
    }

    // Calculate product count for each category
    const categoriesWithCount = await Promise.all(
      (categories || []).map(async (category) => {
        const { count: productCount } = await supabase
          .from('shop_products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id)
          .eq('is_active', true);

        return {
          ...category,
          product_count: productCount || 0
        };
      })
    );

    console.log('Categories fetched successfully:', categoriesWithCount);
    res.json({ categories: categoriesWithCount || [] });
  } catch (error) {
    console.error('Error in get categories:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Update category
router.put('/categories/:id', authenticateShop, validateCategory, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const categoryId = req.params.id;
    const shopId = req.shopId;
    const { name } = req.body;

    // Verify category belongs to this shop
    const { data: existingCategory } = await supabase
      .from('product_categories')
      .select('*')
      .eq('id', categoryId)
      .eq('shop_id', shopId)
      .single();

    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if name already exists (excluding current category)
    const { data: duplicateCategory } = await supabase
      .from('product_categories')
      .select('*')
      .eq('shop_id', shopId)
      .eq('name', name)
      .neq('id', categoryId)
      .single();

    if (duplicateCategory) {
      return res.status(400).json({ error: 'Category name already exists' });
    }

    // Update category
    const { data: category, error } = await supabase
      .from('product_categories')
      .update({ name })
      .eq('id', categoryId)
      .eq('shop_id', shopId)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return res.status(500).json({ error: 'Failed to update category' });
    }

    res.json({ category });
  } catch (error) {
    console.error('Error in update category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete category
router.delete('/categories/:id', authenticateShop, async (req, res) => {
  try {
    const categoryId = req.params.id;
    const shopId = req.shopId;

    // Check if category has products
    const { data: products } = await supabase
      .from('shop_products')
      .select('id')
      .eq('category_id', categoryId)
      .limit(1);

    if (products && products.length > 0) {
      return res.status(400).json({ error: 'Cannot delete category with existing products' });
    }

    // Soft delete category
    const { error } = await supabase
      .from('product_categories')
      .update({ is_active: false })
      .eq('id', categoryId)
      .eq('shop_id', shopId);

    if (error) {
      console.error('Error deleting category:', error);
      return res.status(500).json({ error: 'Failed to delete category' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error in delete category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create product
router.post('/', authenticateShop, validateProduct, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const shopId = req.shopId;
    const {
      name,
      description,
      price,
      original_price,
      stock_quantity,
      image_url,
      category_id
    } = req.body;

    // Verify category belongs to this shop if provided
    if (category_id) {
      const { data: category } = await supabase
        .from('product_categories')
        .select('*')
        .eq('id', category_id)
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .single();

      if (!category) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    // Generate unique product ID
    const productId = `${shopId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create product
    const { data: product, error } = await supabase
      .from('shop_products')
      .insert({
        shop_id: shopId,
        product_id: productId,
        name,
        description,
        price,
        original_price: original_price || null,
        stock_quantity,
        image_url: image_url || null,
        category_id: category_id || null,
        is_active: true
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return res.status(500).json({ error: 'Failed to create product' });
    }

    res.status(201).json({ product });
  } catch (error) {
    console.error('Error in create product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all products for shop
router.get('/', authenticateShop, async (req, res) => {
  try {
    const shopId = req.shopId;
    console.log('Fetching products for shop:', shopId);

    const { data: products, error } = await supabase
      .from('shop_products')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch products',
        details: error.message,
        code: error.code
      });
    }

    console.log('Products fetched successfully:', products);
    res.json({ products: products || [] });
  } catch (error) {
    console.error('Error in get products:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Update product
router.put('/:productId', authenticateShop, validateProduct, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const productId = req.params.productId;
    const shopId = req.shopId;
    const {
      name,
      description,
      price,
      original_price,
      stock_quantity,
      image_url,
      category_id
    } = req.body;

    // Verify product belongs to this shop
    const { data: existingProduct } = await supabase
      .from('shop_products')
      .select('*')
      .eq('product_id', productId)
      .eq('shop_id', shopId)
      .single();

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Verify category belongs to this shop if provided
    if (category_id) {
      const { data: category } = await supabase
        .from('product_categories')
        .select('*')
        .eq('id', category_id)
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .single();

      if (!category) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    // Update product
    const { data: product, error } = await supabase
      .from('shop_products')
      .update({
        name,
        description,
        price,
        original_price: original_price || null,
        stock_quantity,
        image_url: image_url || null,
        category_id: category_id || null
      })
      .eq('product_id', productId)
      .eq('shop_id', shopId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return res.status(500).json({ error: 'Failed to update product' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Error in update product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product
router.delete('/:productId', authenticateShop, async (req, res) => {
  try {
    const productId = req.params.productId;
    const shopId = req.shopId;

    // Hard delete product
    const { error } = await supabase
      .from('shop_products')
      .delete()
      .eq('product_id', productId)
      .eq('shop_id', shopId);

    if (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json({ error: 'Failed to delete product' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error in delete product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle product active status
router.patch('/:productId/toggle-status', authenticateShop, async (req, res) => {
  try {
    const productId = req.params.productId;
    const shopId = req.shopId;

    // Get current product status
    const { data: product, error: fetchError } = await supabase
      .from('shop_products')
      .select('is_active')
      .eq('product_id', productId)
      .eq('shop_id', shopId)
      .single();

    if (fetchError || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Toggle the status
    const { data: updatedProduct, error: updateError } = await supabase
      .from('shop_products')
      .update({ is_active: !product.is_active })
      .eq('product_id', productId)
      .eq('shop_id', shopId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error toggling product status:', updateError);
      return res.status(500).json({ error: 'Failed to toggle product status' });
    }

    res.json({ 
      product: updatedProduct,
      message: `Product ${updatedProduct.is_active ? 'activated' : 'deactivated'} successfully` 
    });
  } catch (error) {
    console.error('Error in toggle product status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 