const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const postNewTask = async (req, res) => {
  const db = getDB();
  const newTask = req.body;

  try {
    const result = await db.tasks.insertOne(newTask);

    await db.users.updateOne(
      { _id: new ObjectId(newTask.coinId) },
      { $inc: { coin: -newTask.PaymentCoin } }
    );

    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Failed to post task" });
  }
};

const getMyTasks = async (req, res) => {
  const db = getDB();
  const email = req.params.email;

  try {
    const tasks = await db.tasks
      .find({ "buyerInfo.email": email })
      .sort({ completionDate: -1 })
      .toArray();
    res.send(tasks);
  } catch (error) {
    res.status(500).send("Error fetching buyer's tasks");
  }
};

const getAllTasks = async (req, res) => {
  const db = getDB();
  try {
    const tasks = await db.tasks.find().toArray();
    res.send(tasks);
  } catch (error) {
    res.status(500).send("Error fetching all tasks");
  }
};

const getSingleTask = async (req, res) => {
  const db = getDB();
  const taskId = req.params.id;

  try {
    const task = await db.tasks.findOne({ _id: new ObjectId(taskId) });
    res.send(task);
  } catch (error) {
    res.status(500).send("Failed to get task");
  }
};

const updateTask = async (req, res) => {
  const db = getDB();
  const taskId = req.params.id;
  const taskData = req.body;

  const updateFields = {
    ...taskData,
    ...(taskData.submissionImage && {
      submissionImage: taskData.submissionImage,
    }),
  };

  try {
    const result = await db.tasks.updateOne(
      { _id: new ObjectId(taskId) },
      { $set: updateFields }
    );
    res.send(result);
  } catch (err) {
    res.status(500).send("Failed to update task");
  }
};

const deleteTask = async (req, res) => {
  const db = getDB();
  const taskId = req.params.id;

  try {
    const result = await db.tasks.deleteOne({ _id: new ObjectId(taskId) });
    res.send(result);
  } catch (err) {
    res.status(500).send("Failed to delete task");
  }
};

const refillCoin = async (req, res) => {
  const db = getDB();
  const email = req.params.email;
  const { paymentCoin } = req.body;

  try {
    const result = await db.users.updateOne(
      { email },
      { $inc: { coin: paymentCoin } }
    );
    res.send(result);
  } catch (err) {
    res.status(500).send("Failed to refill coins");
  }
};

const removeTaskByAdmin = async (req, res) => {
  const db = getDB();
  const taskId = req.params.id;

  try {
    const result = await db.tasks.deleteOne({ _id: new ObjectId(taskId) });
    res.send(result);
  } catch (err) {
    res.status(500).send("Failed to remove task");
  }
};

const updateSubmissionStatus = async (req, res) => {
  const db = getDB();
  const { reviewInfo } = req.body;
  const id = req.params.id;

  try {
    // Update submission status
    await db.submissions.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: reviewInfo.status } }
    );

    // Adjust worker count in task
    let incrementValue = reviewInfo.status === "Reject" ? 1 : -1;
    if (reviewInfo.status !== "pending") {
      await db.tasks.updateOne(
        { _id: new ObjectId(reviewInfo.taskId) },
        { $inc: { worker: incrementValue } }
      );
    }

    res.send({ message: "Submission status updated" });
  } catch (error) {
    res.status(500).send("Failed to update status");
  }
};

module.exports = {
  postNewTask,
  getMyTasks,
  getAllTasks,
  getSingleTask,
  updateTask,
  deleteTask,
  refillCoin,
  removeTaskByAdmin,
  updateSubmissionStatus,
};
