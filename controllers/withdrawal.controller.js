const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

// ✅ Worker submits withdrawal request
const createWithdrawalRequest = async (req, res) => {
  const db = getDB();
  const email = req.params.email;
  const withdrawal = req.body;

  try {
    const result = await db.withdrawals.insertOne(withdrawal);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Withdrawal request failed" });
  }
};

// ✅ Admin fetches all requests
const getAllWithdrawalRequests = async (req, res) => {
  const db = getDB();

  try {
    const result = await db.withdrawals.find().toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch withdrawals" });
  }
};

// ✅ Admin updates withdrawal request status
const updateWithdrawalStatus = async (req, res) => {
  const db = getDB();
  const { email, id } = req.params;
  const { approved } = req.body;

  try {
    const result = await db.withdrawals.updateOne(
      { email, _id: new ObjectId(id) },
      { $set: { status: approved } }
    );

    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to update withdrawal status" });
  }
};

// ✅ Admin deducts coins from user
const updateUserCoinAfterWithdrawal = async (req, res) => {
  const db = getDB();
  const email = req.params.email;
  const { withdrawCoin } = req.body;

  try {
    const result = await db.users.updateOne(
      { email },
      { $inc: { coin: -withdrawCoin } }
    );

    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to deduct coins" });
  }
};

module.exports = {
  createWithdrawalRequest,
  getAllWithdrawalRequests,
  updateWithdrawalStatus,
  updateUserCoinAfterWithdrawal,
};