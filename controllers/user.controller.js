const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const registerUser = async (req, res) => {
  const db = getDB();
  const user = req.body;

  const existing = await db.users.findOne({ email: user.email });
  if (existing) return res.send({ message: "User already exists" });

  const result = await db.users.insertOne(user);
  res.send(result);
};

const getUserCoin = async (req, res) => {
  const db = getDB();
  const email = req.params.email;
  const result = await db.users.findOne({ email });
  res.send(result);
};

const getLoggedUser = async (req, res) => {
  const db = getDB();
  const email = req.params.email;
  const result = await db.users.findOne({ email });
  res.send(result);
};

const getAllUsersExcept = async (req, res) => {
  const db = getDB();
  const email = req.params.email;
  const result = await db.users.find({ email: { $ne: email } }).toArray();
  res.send(result);
};

const getUserRole = async (req, res) => {
  const db = getDB();
  const email = req.params.email;
  if (email !== req.user.email) {
    return res.status(403).send({ message: "Forbidden access" });
  }
  const result = await db.users.findOne({ email });
  res.send({ role: result?.role });
};

const getTopWorkers = async (req, res) => {
  const db = getDB();
  const result = await db.users.find().sort({ coin: -1 }).limit(6).toArray();
  res.send(result);
};

const deleteUser = async (req, res) => {
  const db = getDB();
  const id = req.params.id;
  const result = await db.users.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
};

const updateUserRole = async (req, res) => {
  const db = getDB();
  const { email, role } = req.body;

  const result = await db.users.updateOne(
    { email },
    { $set: { role } }
  );

  res.send(result);
};

module.exports = {
  registerUser,
  getUserCoin,
  getAllUsersExcept,
  getUserRole,
  getTopWorkers,
  deleteUser,
  getLoggedUser,
  updateUserRole,
};
