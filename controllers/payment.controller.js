const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

// Create Stripe payment intent
const createPaymentIntent = async (req, res) => {
  const { price } = req.body;

  if (typeof price !== "number" || isNaN(price)) {
    return res.status(400).send({ error: "Invalid price value" });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(price * 100),
      currency: "usd",
      payment_method_types: ["card"],
    });

    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Get all payment details (like plans or packages)
const getAllPaymentDetails = async (req, res) => {
  const db = getDB();

  try {
    const result = await db.paymentDetails.find().toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch payment details" });
  }
};

// Get a specific payment package by ID
const getPaymentDetailById = async (req, res) => {
  const db = getDB();
  const id = req.params.id;

  try {
    const result = await db.paymentDetails.findOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch payment detail" });
  }
};

// Save payment history (after success)
const savePaymentHistory = async (req, res) => {
  const db = getDB();
  const email = req.params.email;
  const history = req.body;

  if (!history.email || !history.coin) {
    return res.status(400).send({ message: "Invalid payment data" });
  }

  try {
    const insertResult = await db.paymentHistory.insertOne(history);

    // Update user's coin
    await db.users.updateOne(
      { email },
      { $inc: { coin: history.coin } }
    );

    res.send(insertResult);
  } catch (err) {
    res.status(500).send({ message: "Failed to record payment history" });
  }
};

// Get a user's payment history
const getPaymentHistoryByUser = async (req, res) => {
  const db = getDB();
  const email = req.params.email;

  try {
    const result = await db.paymentHistory.find({ email }).toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch payment history" });
  }
};

// Admin gets all payment histories
const getAllPaymentHistories = async (req, res) => {
  const db = getDB();

  try {
    const result = await db.paymentHistory.find().toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch all payment histories" });
  }
};

module.exports = {
  createPaymentIntent,
  getAllPaymentDetails,
  getPaymentDetailById,
  savePaymentHistory,
  getPaymentHistoryByUser,
  getAllPaymentHistories,
};