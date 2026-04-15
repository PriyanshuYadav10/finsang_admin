const express = require('express');
const QRCode = require('qrcode');
const { supabase } = require('../config/supabase');
const router = express.Router();

// Helper function to generate QR code
async function generateQRCode(url) {
  try {
    return await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    return null;
  }
}

// Create or update user website
router.post('/create', async (req, res) => {
  try {
    const { name, shopName, phone, email } = req.body;

    // Validate required fields
    if (!name || !shopName || !phone || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Generate unique identifier: shopname + last 5 digits of phone
    const lastFiveDigits = phone.slice(-5);
    const websiteId = `${shopName.toLowerCase().replace(/\s+/g, '-')}-${lastFiveDigits}`;

    // Check if website already exists
    const { data: existingWebsite } = await supabase
      .from('user_websites')
      .select('*')
      .eq('website_id', websiteId)
      .single();

    if (existingWebsite) {
      // Update existing website
      const { data, error } = await supabase
        .from('user_websites')
        .update({
          name,
          shop_name: shopName,
          phone,
          email,
          updated_at: new Date().toISOString()
        })
        .eq('website_id', websiteId)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      const websiteUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/website/${websiteId}`;
      const qrCode = await generateQRCode(websiteUrl);

      return res.json({
        message: 'Website updated successfully',
        website: data,
        websiteUrl: websiteUrl,
        qrCode: qrCode
      });
    } else {
      // Create new website
      const { data, error } = await supabase
        .from('user_websites')
        .insert({
          website_id: websiteId,
          name,
          shop_name: shopName,
          phone,
          email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      const websiteUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/website/${websiteId}`;
      const qrCode = await generateQRCode(websiteUrl);

      return res.status(201).json({
        message: 'Website created successfully',
        website: data,
        websiteUrl: websiteUrl,
        qrCode: qrCode
      });
    }
  } catch (error) {
    console.error('Website creation error:', error);
    res.status(500).json({ error: 'Failed to create website' });
  }
});

// Get website by ID (public endpoint)
router.get('/:websiteId', async (req, res) => {
  try {
    const { websiteId } = req.params;

    const { data, error } = await supabase
      .from('user_websites')
      .select('*')
      .eq('website_id', websiteId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Website not found' });
    }

    res.json({ website: data });
  } catch (error) {
    console.error('Website retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve website' });
  }
});

// Check if user has existing website by phone number
router.get('/check/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    console.log(phone)

    const { data, error } = await supabase
      .from('user_websites')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return res.status(404).json({ error: 'Website not found' });
      }
      return res.status(500).json({ error: error.message });
    }

    const websiteUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://172.24.132.187:3000'}/website/${data.website_id}`;
    const qrCode = await generateQRCode(websiteUrl);

    res.json({ 
      website: data,
      websiteUrl: websiteUrl,
      qrCode: qrCode
    });
  } catch (error) {
    console.error('Website check error:', error);
    res.status(500).json({ error: 'Failed to check website' });
  }
});

// Get all websites (admin only)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_websites')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ websites: data });
  } catch (error) {
    console.error('Websites retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve websites' });
  }
});

module.exports = router; 