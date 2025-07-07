const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { verifyWorker } = require("../middleware/roleMiddleware");

const {
  getAvailableTasks,
  getHomeTasks,
  submitTask,
  getMySubmissions,
  getPendingSubmissions,
  getReviewTasks,
  updateWorkerCoinAfterApproval,
} = require("../controllers/worker.controller");

// Get available tasks (sorted by worker count)
router.get("/tasks", verifyToken, verifyWorker, getAvailableTasks);

// Get top tasks for homepage (no auth)
router.get("/home-tasks", getHomeTasks);

// Submit a task (worker only)
router.post("/submit/:email", verifyToken, verifyWorker, submitTask);

// Get my submissions (paginated)
router.get("/submissions/:email", verifyToken, verifyWorker, getMySubmissions);

// Get pending submissions for a worker
router.get("/pending/:email", verifyToken, getPendingSubmissions);

// Get review tasks submitted to a buyer (for dashboard review)
router.get("/review/:email", verifyToken, getReviewTasks);

// Add coins to worker upon task approval
router.patch("/reward-coin", updateWorkerCoinAfterApproval);

module.exports = router;