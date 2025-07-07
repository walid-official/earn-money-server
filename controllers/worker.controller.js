const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

//  Get available tasks for workers
const getAvailableTasks = async (req, res) => {
  const db = getDB();
  const sortOrder = req.query.sort === "Low to high" ? 1 : -1;

  try {
    const result = await db.tasks
      .find({ worker: { $gt: 0 } })
      .sort({ worker: sortOrder })
      .toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send("Error fetching tasks");
  }
};

//  Get top tasks for homepage
const getHomeTasks = async (req, res) => {
  const db = getDB();
  try {
    const result = await db.tasks
      .find({ worker: { $gt: 0 } })
      .sort({ PaymentCoin: -1 })
      .limit(8)
      .toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send("Error loading home tasks");
  }
};

//  Submit a task
const submitTask = async (req, res) => {
  const db = getDB();
  const submission = req.body;

  try {
    const result = await db.submissions.insertOne(submission);

    // Decrease worker count in task
    await db.tasks.updateOne(
      { _id: new ObjectId(submission.task_id) },
      { $inc: { worker: -1 } }
    );

    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to submit task", details: err.message });
  }
};

//  Get paginated submissions for a worker
const getMySubmissions = async (req, res) => {
  const db = getDB();
  const email = req.params.email;
  const page = parseInt(req.query.page) || 0;
  const size = parseInt(req.query.size) || 5;

  try {
    const query = { "worker_detail.email": email };
    const total = await db.submissions.countDocuments(query);
    const result = await db.submissions
      .find(query)
      .limit(size)
      .skip(page * size)
      .toArray();

    res.send({ result, total });
  } catch (err) {
    res.status(500).send("Failed to fetch submissions");
  }
};

//  Get all submissions that are pending
const getPendingSubmissions = async (req, res) => {
  const db = getDB();
  const email = req.params.email;

  try {
    const result = await db.submissions
      .find({ "worker_detail.email": email, status: "pending" })
      .toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send("Failed to get pending submissions");
  }
};

//  Get tasks submitted to a buyer for review
const getReviewTasks = async (req, res) => {
  const db = getDB();
  const email = req.params.email;

  try {
    const result = await db.submissions
      .find({ "buyer_detail.email": email })
      .toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send("Failed to get review tasks");
  }
};

// Reward coin after submission approved
const updateWorkerCoinAfterApproval = async (req, res) => {
  const db = getDB();
  const { approvedCoin } = req.body;

  try {
    const result = await db.users.updateOne(
      { email: approvedCoin.workerEmail },
      { $inc: { coin: approvedCoin.PaymentCoin } }
    );

    res.send(result);
  } catch (err) {
    res.status(500).send("Failed to update worker coin");
  }
};

module.exports = {
  getAvailableTasks,
  getHomeTasks,
  submitTask,
  getMySubmissions,
  getPendingSubmissions,
  getReviewTasks,
  updateWorkerCoinAfterApproval,
};
