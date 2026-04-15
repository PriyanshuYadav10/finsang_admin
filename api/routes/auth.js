const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { supabase } = require("../config/supabase");
const { authenticateToken, authenticateAdmin } = require("../middleware/auth");
const {
  validateUser,
  validateAdminSignup,
  validateAdminSignin,
} = require("../middleware/validation");

const router = express.Router();

// Admin sign up (only for initial admin creation)
router.post("/admin/signup", validateAdminSignup, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if admin already exists by trying to sign in
    try {
      const { data: existingUser } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (existingUser.user?.user_metadata?.role === "admin") {
        return res
          .status(403)
          .json({ error: "Admin already exists. Use signin instead." });
      }
    } catch (error) {
      // User doesn't exist, continue with signup
    }

    // Create admin user using regular signup
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: name,
          role: "admin",
        },
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Create JWT token
    const jwtToken = jwt.sign(
      {
        userId: data.user.id,
        email: data.user.email,
        role: "admin",
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.status(201).json({
      message: "Admin created successfully",
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name,
        role: data.user.user_metadata?.role,
      },
      token: jwtToken,
    });
  } catch (error) {
    console.error("Admin signup error:", error);
    res.status(500).json({ error: "Failed to create admin" });
  }
});

// Admin sign in
router.post("/admin/signin", validateAdminSignin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if user has admin role
    const userRole = data.user.user_metadata?.role;
    if (!userRole || !["admin", "moderator"].includes(userRole)) {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Create JWT token
    const jwtToken = jwt.sign(
      {
        userId: data.user.id,
        email: data.user.email,
        role: userRole,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      message: "Admin signed in successfully",
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name,
        role: userRole,
      },
      token: jwtToken,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to sign in" });
  }
});

// Get current user session
router.get("/session", authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.user_metadata?.name,
        role: req.user.user_metadata?.role || "user",
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get session" });
  }
});

// Sign out user
router.post("/signout", authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Signed out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to sign out" });
  }
});

// Create or update user profile
router.post("/user", authenticateToken, validateUser, async (req, res) => {
  try {
    const { name, profile_image_url } = req.body;
    const userId = req.user.id;

    // Update user metadata
    const { data, error } = await supabase.auth.updateUser({
      data: {
        name: name,
        profile_image_url: profile_image_url,
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: "User profile updated successfully",
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name,
        role: data.user.user_metadata?.role || "user",
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update user profile" });
  }
});

// Get user profile
router.get("/user", authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.user_metadata?.name,
        role: req.user.user_metadata?.role || "user",
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get user profile" });
  }
});

// Update user role (Admin only)
router.put("/user/:userId/role", authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !["user", "admin", "moderator"].includes(role)) {
      return res
        .status(400)
        .json({ error: "Valid role required (user, admin, moderator)" });
    }

    // Update user role in metadata
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role: role },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: "User role updated successfully",
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update user role" });
  }
});

// Get all users (Admin only)
router.get("/users", authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get users from Supabase Auth
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Apply pagination
    const paginatedUsers = data.users.slice(offset, offset + parseInt(limit));

    res.json({
      users: paginatedUsers.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name,
        role: user.user_metadata?.role || "user",
        created_at: user.created_at,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: data.users.length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get users" });
  }
});

module.exports = router;
