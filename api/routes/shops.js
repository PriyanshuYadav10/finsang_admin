const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const router = express.Router();

// Create new shop
router.post('/create', async (req, res) => {
  try {
    const { shopName, ownerName, phone, email, password, description, address } = req.body;

    // Validate required fields
    if (!shopName || !ownerName || !phone || !email || !password) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Check if shop already exists with same phone or email
    const { data: existingShop } = await supabase
      .from('user_shops')
      .select('*')
      .or(`phone.eq.${phone},email.eq.${email}`)
      .single();

    if (existingShop) {
      return res.status(400).json({ error: 'Shop already exists with this phone number or email' });
    }

    // Generate unique shop ID
    const shopId = `${shopName.toLowerCase().replace(/\s+/g, '-')}-${phone.slice(-5)}`;

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create shop
    const { data, error } = await supabase
      .from('user_shops')
      .insert({
        shop_id: shopId,
        shop_name: shopName,
        owner_name: ownerName,
        phone,
        email,
        password_hash: passwordHash,
        description,
        address,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Create JWT token
    const token = jwt.sign(
      { shopId: data.shop_id, shopName: data.shop_name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Shop created successfully',
      shop: {
        shop_id: data.shop_id,
        shop_name: data.shop_name,
        owner_name: data.owner_name,
        phone: data.phone,
        email: data.email
      },
      token,
      adminUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/shop-admin/${shopId}`
    });
  } catch (error) {
    console.error('Shop creation error:', error);
    res.status(500).json({ error: 'Failed to create shop' });
  }
});

// Shop login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    // Find shop by phone
    const { data: shop, error } = await supabase
      .from('user_shops')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error || !shop) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, shop.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { shopId: shop.shop_id, shopName: shop.shop_name },
      process.env.JWT_SECRET || 'finsangmart-super-secret-jwt-key-2024',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      shop: {
        shop_id: shop.shop_id,
        shop_name: shop.shop_name,
        owner_name: shop.owner_name,
        phone: shop.phone,
        email: shop.email
      },
      token
    });
  } catch (error) {
    console.error('Shop login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get shop by ID (public)
router.get('/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;

    const { data: shop, error } = await supabase
      .from('user_shops')
      .select('shop_id, shop_name, owner_name, phone, email, description, address, created_at')
      .eq('shop_id', shopId)
      .single();

    if (error || !shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    res.json({ shop });
  } catch (error) {
    console.error('Shop retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve shop' });
  }
});

// Get shop products (public)
router.get('/:shopId/products', async (req, res) => {
  try {
    const { shopId } = req.params;

    const { data: products, error } = await supabase
      .from('shop_products')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ products });
  } catch (error) {
    console.error('Products retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

// Get shop categories (public)
router.get('/:shopId/categories', async (req, res) => {
  try {
    const { shopId } = req.params;

    const { data: categories, error } = await supabase
      .from('product_categories')
      .select('id, name, description, created_at')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Categories query error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('Categories found for shop', shopId, ':', categories);
    res.json({ categories: categories || [] });
  } catch (error) {
    console.error('Categories retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

// Check if shop exists by phone
router.get('/check/:phone', async (req, res) => {
  try {
    const { phone } = req.params;

    const { data: shop, error } = await supabase
      .from('user_shops')
      .select('shop_id, shop_name, owner_name, phone, email')
      .eq('phone', phone)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Shop not found' });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json({ 
      shop,
      adminUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/shop-admin/${shop.shop_id}`
    });
  } catch (error) {
    console.error('Shop check error:', error);
    res.status(500).json({ error: 'Failed to check shop' });
  }
});

module.exports = router; 