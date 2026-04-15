const express = require('express');
const QRCode = require('qrcode');
const router = express.Router();

// Generate QR code for a URL
router.get('/generate', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.json({ 
      qrCode: qrCodeDataUrl,
      url: url
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Generate QR code for a specific website
router.get('/website/:websiteId', async (req, res) => {
  try {
    const { websiteId } = req.params;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const websiteUrl = `${baseUrl}/website/${websiteId}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(websiteUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.json({ 
      qrCode: qrCodeDataUrl,
      url: websiteUrl,
      websiteId: websiteId
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

module.exports = router; 