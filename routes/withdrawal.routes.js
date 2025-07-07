const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { verifyWorker, verifyAdmin } = require("../middleware/roleMiddleware");

const {
  createWithdrawalRequest,
  getAllWithdrawalRequests,
  updateWithdrawalStatus,
  updateUserCoinAfterWithdrawal,
} = require("../controllers/withdrawal.controller");

// Worker submits withdrawal request
router.post("/:email", verifyToken, verifyWorker, createWithdrawalRequest);

// Admin fetches all withdrawal requests
router.get("/admin/:email", verifyToken, verifyAdmin, getAllWithdrawalRequests);

// Admin updates withdrawal status
router.patch("/status/:email/:id", verifyToken, verifyAdmin, updateWithdrawalStatus);

// Admin deducts coins after approval
router.patch("/deduct/:email", verifyToken, verifyAdmin, updateUserCoinAfterWithdrawal);

module.exports = router;