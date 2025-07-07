const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");

const {
  createNotification,
  getUserNotifications,
} = require("../controllers/notification.controller");

// Create a new notification
router.post("/", verifyToken, createNotification);

// Get all notifications for a specific user
router.get("/:email", verifyToken, getUserNotifications);

module.exports = router;