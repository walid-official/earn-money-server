const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { verifyBuyer, verifyAdmin } = require("../middleware/roleMiddleware");

const {
  postNewTask,
  getMyTasks,
  getAllTasks,
  getSingleTask,
  updateTask,
  deleteTask,
  refillCoin,
  removeTaskByAdmin,
  updateSubmissionStatus,
} = require("../controllers/task.controller");

// Post a new task (Buyer only)
router.post("/", verifyToken, verifyBuyer, postNewTask);

// Get buyer’s posted tasks
router.get("/my/:email", verifyToken, verifyBuyer, getMyTasks);

// Get all tasks (Admin only)
router.get("/all/:email", verifyToken, verifyAdmin, getAllTasks);

// Get single task details
router.get("/:id", verifyToken, getSingleTask);

// Update task by ID
router.patch("/:id", verifyToken, verifyBuyer, updateTask);

// Refill buyer coins
router.patch("/refill/:email", verifyToken, verifyBuyer, refillCoin);

// Delete task (Buyer only)
router.delete("/:id", verifyToken, verifyBuyer, deleteTask);

// Admin removes a task
router.delete("/remove/:id", verifyToken, verifyAdmin, removeTaskByAdmin);

// Update task submission status
router.patch("/submission-status/:id", verifyToken, verifyBuyer, updateSubmissionStatus);

module.exports = router;