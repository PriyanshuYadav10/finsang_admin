const express = require("express");
const { supabase } = require("../config/supabase");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Get all product types
router.get("/", async (req, res) => {
  try {
    const { data: types, error } = await supabase
      .from('productypes')
      .select('*')
      .order('type', { ascending: true });
    
    if (error) throw error;
    
    res.json({ types: types || [] });
  } catch (error) {
    console.error("Error fetching product types:", error);
    res.status(500).json({ error: "Failed to fetch product types" });
  }
});

// Create product type
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('productypes')
      .insert([req.body])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({ type: data });
  } catch (error) {
    console.error("Error creating product type:", error);
    res.status(500).json({ error: "Failed to create product type" });
  }
});

// Delete product type
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('productypes')
      .delete()
      .eq('type', decodeURIComponent(id));
    
    if (error) throw error;
    
    res.json({ message: "Product type deleted successfully" });
  } catch (error) {
    console.error("Error deleting product type:", error);
    res.status(500).json({ error: "Failed to delete product type" });
  }
});

module.exports = router;