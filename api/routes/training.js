const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken, authenticateAdmin, authenticateRole } = require('../middleware/auth');
const { validateTrainingCategory, validateTrainingVideo, validateUUID, validateCategoryId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get all training categories
router.get('/categories', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
      .from('training_categories')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('name');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ categories: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch training categories' });
  }
});

// Create training category (Admin/Moderator only)
router.post('/categories', authenticateRole('moderator'), validateTrainingCategory, async (req, res) => {
  try {
    const { name, description, banner_url } = req.body;

    const { data, error } = await supabase
      .from('training_categories')
      .insert({
        name,
        banner_url
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Training category created successfully',
      category: data
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create training category' });
  }
});

// Delete training category (Admin only)
router.delete('/categories/:id', authenticateAdmin, validateUUID, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('training_categories')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Training category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete training category' });
  }
});

// Get training videos by category
router.get('/videos/:categoryId', validateCategoryId, validatePagination, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
      .from('training_videos')
      .select('*')
      .eq('category_id', categoryId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ videos: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch training videos' });
  }
});

// Get all training videos
router.get('/videos', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
      .from('training_videos')
      .select('*, training_categories(name)')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ videos: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch training videos' });
  }
});

// Create training video (Admin/Moderator only)
router.post('/videos', authenticateRole('moderator'), validateTrainingVideo, async (req, res) => {
  try {
    const { title, description, youtube_url, category_id, duration, thumbnail_url, is_featured, sort_order } = req.body;

    const { data, error } = await supabase
      .from('training_videos')
      .insert({
        title,
        youtube_url,
        category_id,
        thumbnail_url,
        is_featured: is_featured || false,
        sort_order: sort_order || 0
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Training video created successfully',
      video: data
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create training video' });
  }
});

// Update training video (Admin/Moderator only)
router.put('/videos/:id', authenticateRole('moderator'), validateUUID, validateTrainingVideo, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, youtube_url, category_id, duration, thumbnail_url, is_featured, sort_order } = req.body;

    const { data, error } = await supabase
      .from('training_videos')
      .update({
        title,
        youtube_url,
        category_id,
        thumbnail_url,
        is_featured,
        sort_order
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Training video updated successfully',
      video: data
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update training video' });
  }
});

// Delete training video (Admin only)
router.delete('/videos/:id', authenticateAdmin, validateUUID, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('training_videos')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Training video deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete training video' });
  }
});

// Get training video by ID
router.get('/videos/single/:id', validateUUID, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('training_videos')
      .select('*, training_categories(name)')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Training video not found' });
    }

    res.json({ video: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch training video' });
  }
});

module.exports = router; 