const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { verifyBuyer, verifyAdmin } = require("../middleware/roleMiddleware");

const {
  createPaymentIntent,
  getAllPaymentDetails,
  getPaymentDetailById,
  savePaymentHistory,
  getPaymentHistoryByUser,
  getAllPaymentHistories,
} = require("../controllers/payment.controller");

// Stripe payment intent
router.post("/create-intent", verifyToken, verifyBuyer, createPaymentIntent);

// Buyer retrieves all available payment packages/options
router.get("/details", verifyToken, verifyBuyer, getAllPaymentDetails);

// Buyer gets a specific payment package
router.get("/details/:id", verifyToken, verifyBuyer, getPaymentDetailById);

// Buyer saves payment history after transaction success
router.post("/history/:email", verifyToken, verifyBuyer, savePaymentHistory);

// Buyer retrieves their payment history
router.get("/history/:email", verifyToken, verifyBuyer, getPaymentHistoryByUser);

// Admin: Get all user payment histories
router.get("/all-history", verifyToken, verifyAdmin, getAllPaymentHistories);

module.exports = router;