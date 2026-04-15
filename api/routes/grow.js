const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken, authenticateAdmin, authenticateRole } = require('../middleware/auth');
const { validateGrowCategory, validateGrowPoster, validateIntegerId, validateIntegerCategoryId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get all grow categories
router.get('/categories', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
      .from('grow_categories')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('name');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ categories: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch grow categories' });
  }
});

// Create grow category (Admin/Moderator only)
router.post('/categories', authenticateRole('moderator'), validateGrowCategory, async (req, res) => {
  try {
    const { name, description, image_url } = req.body;

    const { data, error } = await supabase
      .from('grow_categories')
      .insert({
        name
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Grow category created successfully',
      category: data
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create grow category' });
  }
});

// Delete grow category (Admin only)
router.delete('/categories/:id', authenticateAdmin, validateIntegerId, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('grow_categories')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Grow category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete grow category' });
  }
});

// Get all grow posters with categories
router.get('/posters', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
      .from('grow_posters')
      .select('*, grow_categories(name)')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ posters: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch grow posters' });
  }
});

// Get grow posters by category
router.get('/posters/:categoryId', validateIntegerCategoryId, validatePagination, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
      .from('grow_posters')
      .select('*, grow_categories(name)')
      .eq('category_id', categoryId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ posters: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch grow posters' });
  }
});

// Create grow poster (Admin/Moderator only)
router.post('/posters', authenticateRole('moderator'), validateGrowPoster, async (req, res) => {
  try {
    const { title, description, image_url, category_id, content, tags } = req.body;

    const insertData = {
      title,
      category_id
    };

    // Only add image_url if it's provided
    if (image_url && image_url.trim()) {
      insertData.image_url = image_url.trim();
    }

    const { data, error } = await supabase
      .from('grow_posters')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Grow poster created successfully',
      poster: data
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create grow poster' });
  }
});

// Update grow poster (Admin/Moderator only)
router.put('/posters/:id', authenticateRole('moderator'), validateIntegerId, validateGrowPoster, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image_url, category_id, content, tags } = req.body;

    const updateData = {
      title,
      category_id
    };

    // Only add image_url if it's provided
    if (image_url && image_url.trim()) {
      updateData.image_url = image_url.trim();
    }

    const { data, error } = await supabase
      .from('grow_posters')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Grow poster updated successfully',
      poster: data
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update grow poster' });
  }
});

// Delete grow poster (Admin only)
router.delete('/posters/:id', authenticateAdmin, validateIntegerId, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('grow_posters')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Grow poster deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete grow poster' });
  }
});

// Get grow poster by ID
router.get('/posters/single/:id', validateIntegerId, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('grow_posters')
      .select('*, grow_categories(name)')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Grow poster not found' });
    }

    res.json({ poster: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch grow poster' });
  }
});

module.exports = router; 