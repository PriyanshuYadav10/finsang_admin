const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://gqpopdtkvjjrpwkuzude.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcG9wZHRrdmpqcnB3a3V6dWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNjEzNTgsImV4cCI6MjA2NjgzNzM1OH0.FCpJxd3MFs_CUn';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.warn('Using hardcoded Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file for production.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Get all active shops
router.get('/shops', async (req, res) => {
  try {
    const { data: shops, error } = await supabase
      .from('user_shops')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shops:', error);
      return res.status(500).json({ error: 'Failed to fetch shops' });
    }

    res.json({ shops: shops || [] });
  } catch (error) {
    console.error('Error in /shops:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get shop details by ID
router.get('/shops/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;

    const { data: shop, error } = await supabase
      .from('user_shops')
      .select('*')
      .eq('shop_id', shopId)
      .single();

    if (error) {
      console.error('Error fetching shop:', error);
      return res.status(404).json({ error: 'Shop not found' });
    }

    res.json({ shop });
  } catch (error) {
    console.error('Error in /shops/:shopId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get shop categories
router.get('/shops/:shopId/categories', async (req, res) => {
  try {
    const { shopId } = req.params;

    const { data: categories, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }

    res.json({ categories: categories || [] });
  } catch (error) {
    console.error('Error in /shops/:shopId/categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get products by shop and category
router.get('/shops/:shopId/products', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { categoryId } = req.query;

    // First get the products
    let query = supabase
      .from('shop_products')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    // Get category names for the products
    const categoryIds = [...new Set(products.map(p => p.category_id).filter(Boolean))];
    let categoryNames = {};
    
    if (categoryIds.length > 0) {
      const { data: categories, error: catError } = await supabase
        .from('product_categories')
        .select('id, name')
        .in('id', categoryIds);
      
      if (!catError && categories) {
        categoryNames = categories.reduce((acc, cat) => {
          acc[cat.id] = cat.name;
          return acc;
        }, {});
      }
    }

    // Transform the data to match the expected format
    const transformedProducts = products.map(product => ({
      id: product.product_id,
      name: product.name,
      description: product.description,
      price: product.price,
      original_price: product.original_price,
      stock_quantity: product.stock_quantity,
      image_url: product.image_url,
      category_name: categoryNames[product.category_id] || 'General',
      shop_id: product.shop_id,
      created_at: product.created_at
    }));

    res.json({ products: transformedProducts || [] });
  } catch (error) {
    console.error('Error in /shops/:shopId/products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get featured products (products from all shops)
router.get('/products/featured', async (req, res) => {
  try {
    // First get the products
    const { data: products, error } = await supabase
      .from('shop_products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching featured products:', error);
      return res.status(500).json({ error: 'Failed to fetch featured products' });
    }

    // Get category names and shop names
    const categoryIds = [...new Set(products.map(p => p.category_id).filter(Boolean))];
    const shopIds = [...new Set(products.map(p => p.shop_id).filter(Boolean))];
    
    let categoryNames = {};
    let shopNames = {};
    
    // Get category names
    if (categoryIds.length > 0) {
      const { data: categories, error: catError } = await supabase
        .from('product_categories')
        .select('id, name')
        .in('id', categoryIds);
      
      if (!catError && categories) {
        categoryNames = categories.reduce((acc, cat) => {
          acc[cat.id] = cat.name;
          return acc;
        }, {});
      }
    }
    
    // Get shop names
    if (shopIds.length > 0) {
      const { data: shops, error: shopError } = await supabase
        .from('user_shops')
        .select('shop_id, shop_name')
        .in('shop_id', shopIds);
      
      if (!shopError && shops) {
        shopNames = shops.reduce((acc, shop) => {
          acc[shop.shop_id] = shop.shop_name;
          return acc;
        }, {});
      }
    }

    // Transform the data to match the expected format
    const transformedProducts = products.map(product => ({
      id: product.product_id,
      name: product.name,
      description: product.description,
      price: product.price,
      original_price: product.original_price,
      stock_quantity: product.stock_quantity,
      image_url: product.image_url,
      category_name: categoryNames[product.category_id] || 'General',
      shop_name: shopNames[product.shop_id] || 'Unknown Shop',
      shop_id: product.shop_id,
      created_at: product.created_at
    }));

    res.json({ products: transformedProducts || [] });
  } catch (error) {
    console.error('Error in /products/featured:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search products across all shops
router.get('/products/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // First get the products
    const { data: products, error } = await supabase
      .from('shop_products')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error searching products:', error);
      return res.status(500).json({ error: 'Failed to search products' });
    }

    // Get category names and shop names
    const categoryIds = [...new Set(products.map(p => p.category_id).filter(Boolean))];
    const shopIds = [...new Set(products.map(p => p.shop_id).filter(Boolean))];
    
    let categoryNames = {};
    let shopNames = {};
    
    // Get category names
    if (categoryIds.length > 0) {
      const { data: categories, error: catError } = await supabase
        .from('product_categories')
        .select('id, name')
        .in('id', categoryIds);
      
      if (!catError && categories) {
        categoryNames = categories.reduce((acc, cat) => {
          acc[cat.id] = cat.name;
          return acc;
        }, {});
      }
    }
    
    // Get shop names
    if (shopIds.length > 0) {
      const { data: shops, error: shopError } = await supabase
        .from('user_shops')
        .select('shop_id, shop_name')
        .in('shop_id', shopIds);
      
      if (!shopError && shops) {
        shopNames = shops.reduce((acc, shop) => {
          acc[shop.shop_id] = shop.shop_name;
          return acc;
        }, {});
      }
    }

    // Transform the data to match the expected format
    const transformedProducts = products.map(product => ({
      id: product.product_id,
      name: product.name,
      description: product.description,
      price: product.price,
      original_price: product.original_price,
      stock_quantity: product.stock_quantity,
      image_url: product.image_url,
      category_name: categoryNames[product.category_id] || 'General',
      shop_name: shopNames[product.shop_id] || 'Unknown Shop',
      shop_id: product.shop_id,
      created_at: product.created_at
    }));

    res.json({ products: transformedProducts || [] });
  } catch (error) {
    console.error('Error in /products/search:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product details
router.get('/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    // First get the product
    const { data: product, error } = await supabase
      .from('shop_products')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get category name
    let categoryName = 'General';
    if (product.category_id) {
      const { data: category, error: catError } = await supabase
        .from('product_categories')
        .select('name')
        .eq('id', product.category_id)
        .single();
      
      if (!catError && category) {
        categoryName = category.name;
      }
    }

    // Get shop details
    let shopName = 'Unknown Shop';
    let shopDescription = '';
    let shopAddress = '';
    
    if (product.shop_id) {
      const { data: shop, error: shopError } = await supabase
        .from('user_shops')
        .select('shop_name, description, address')
        .eq('shop_id', product.shop_id)
        .single();
      
      if (!shopError && shop) {
        shopName = shop.shop_name;
        shopDescription = shop.description || '';
        shopAddress = shop.address || '';
      }
    }

    // Transform the data to match the expected format
    const transformedProduct = {
      id: product.product_id,
      name: product.name,
      description: product.description,
      price: product.price,
      original_price: product.original_price,
      stock_quantity: product.stock_quantity,
      image_url: product.image_url,
      category_name: categoryName,
      shop_name: shopName,
      shop_description: shopDescription,
      shop_address: shopAddress,
      shop_id: product.shop_id,
      created_at: product.created_at
    };

    res.json({ product: transformedProduct });
  } catch (error) {
    console.error('Error in /products/:productId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 