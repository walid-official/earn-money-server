const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { verifyAdmin } = require("../middleware/roleMiddleware");
const {
  registerUser,
  getUserCoin,
  getAllUsersExcept,
  getUserRole,
  getTopWorkers,
  deleteUser,
  getLoggedUser,
  updateUserRole,
} = require("../controllers/user.controller");

// User registration
router.post("/", registerUser);

// Get user coin
router.get("/coin/:email", getUserCoin);

// Logged-in user data
router.get("/me/:email", verifyToken, getLoggedUser);

// Admin-only: get all users except current
router.get("/all/:email", verifyToken, verifyAdmin, getAllUsersExcept);

// Get user role
router.get("/role/:email", verifyToken, getUserRole);

// Get top workers
router.get("/top-workers", getTopWorkers);

// Delete user
router.delete("/:id", deleteUser);

// Update user role (Admin)
router.patch("/update-role", verifyToken, verifyAdmin, updateUserRole);

module.exports = router;
