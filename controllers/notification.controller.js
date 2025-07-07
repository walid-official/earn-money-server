const { getDB } = require("../config/db");

// Add a new notification
const createNotification = async (req, res) => {
  const db = getDB();
  const notification = req.body;

  try {
    const result = await db.notifications.insertOne(notification);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to create notification" });
  }
};

// Get notifications for a user (sorted by time descending)
const getUserNotifications = async (req, res) => {
  const db = getDB();
  const email = req.params.email;

  try {
    const result = await db.notifications
      .find({ email })
      .sort({ time: -1 })
      .toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to retrieve notifications" });
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
};