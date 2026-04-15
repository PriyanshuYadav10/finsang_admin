const express = require("express");
const { supabase } = require("../config/supabase");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Get all banners
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ banners: data || [] });
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({ error: "Failed to fetch banners" });
  }
});

// Create banner
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, subtitle, image_url, link_url, status } = req.body;

    if (!title || !image_url) {
      return res
        .status(400)
        .json({ error: "Title and image URL are required" });
    }

    const { data, error } = await supabase
      .from("banners")
      .insert([
        {
          title,
          subtitle,
          image_url,
          link_url,
          status: status || "active",
        },
      ])
      .select();

    if (error) throw error;

    res
      .status(201)
      .json({ message: "Banner created successfully", banner: data[0] });
  } catch (error) {
    console.error("Error creating banner:", error);
    res.status(500).json({ error: "Failed to create banner" });
  }
});

// Update banner
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, image_url, link_url, status } = req.body;

    const { data, error } = await supabase
      .from("banners")
      .update({
        title,
        subtitle,
        image_url,
        link_url,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) throw error;

    res.json({ message: "Banner updated successfully", banner: data[0] });
  } catch (error) {
    console.error("Error updating banner:", error);
    res.status(500).json({ error: "Failed to update banner" });
  }
});

// Delete banner
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("banners").delete().eq("id", id);

    if (error) throw error;

    res.json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json({ error: "Failed to delete banner" });
  }
});

module.exports = router;
