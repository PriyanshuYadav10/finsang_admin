const express = require('express');
const multer = require('multer');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Upload profile image
router.post('/profile-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const fileName = `profile-images/${userId}/${Date.now()}-${req.file.originalname}`;

    const { data, error } = await supabase.storage
      .from('finsangmart-storage')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('finsangmart-storage')
      .getPublicUrl(fileName);

    res.json({
      message: 'Profile image uploaded successfully',
      url: urlData.publicUrl,
      fileName: fileName
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload profile image' });
  }
});

// Delete profile image
router.delete('/profile-image', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fileName } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: 'File name is required' });
    }

    const { error } = await supabase.storage
      .from('finsangmart-storage')
      .remove([fileName]);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Profile image deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete profile image' });
  }
});

// Upload product image (card-images bucket)
router.post('/product-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const fileName = `${userId}/${Date.now()}-${req.file.originalname}`;

    const { data, error } = await supabase.storage
      .from('card-images')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('card-images')
      .getPublicUrl(fileName);

    res.json({
      message: 'Product image uploaded successfully',
      url: urlData.publicUrl,
      fileName: fileName
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload product image' });
  }
});

// Upload grow poster image (grow-data bucket)
router.post('/grow-poster', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const fileName = `${userId}/${Date.now()}-${req.file.originalname}`;

    const { data, error } = await supabase.storage
      .from('grow-data')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('grow-data')
      .getPublicUrl(fileName);

    res.json({
      message: 'Grow poster uploaded successfully',
      url: urlData.publicUrl,
      fileName: fileName
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload grow poster' });
  }
});

// Upload general file (for other purposes)
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const { folder = 'general' } = req.body;
    const fileName = `${folder}/${userId}/${Date.now()}-${req.file.originalname}`;

    const { data, error } = await supabase.storage
      .from('finsangmart-storage')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('finsangmart-storage')
      .getPublicUrl(fileName);

    res.json({
      message: 'File uploaded successfully',
      url: urlData.publicUrl,
      fileName: fileName
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get file info from card-images bucket
router.get('/product-image/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;

    const { data, error } = await supabase.storage
      .from('card-images')
      .list('', {
        search: fileName
      });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ files: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get product image info' });
  }
});

// Get file info from grow-data bucket
router.get('/grow-poster/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;

    const { data, error } = await supabase.storage
      .from('grow-data')
      .list('', {
        search: fileName
      });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ files: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get grow poster info' });
  }
});

// Delete product image from card-images bucket
router.delete('/product-image/:fileName', authenticateToken, async (req, res) => {
  try {
    const { fileName } = req.params;

    const { error } = await supabase.storage
      .from('card-images')
      .remove([fileName]);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Product image deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product image' });
  }
});

// Delete grow poster from grow-data bucket
router.delete('/grow-poster/:fileName', authenticateToken, async (req, res) => {
  try {
    const { fileName } = req.params;

    const { error } = await supabase.storage
      .from('grow-data')
      .remove([fileName]);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Grow poster deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete grow poster' });
  }
});

// Get file info (general)
router.get('/file/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;

    const { data, error } = await supabase.storage
      .from('finsangmart-storage')
      .list('', {
        search: fileName
      });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ files: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get file info' });
  }
});

// Delete file (general)
router.delete('/file/:fileName', authenticateToken, async (req, res) => {
  try {
    const { fileName } = req.params;

    const { error } = await supabase.storage
      .from('finsangmart-storage')
      .remove([fileName]);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router; 