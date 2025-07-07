const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pxdhv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db = {};

const connectToDB = async () => {
  try {
    await client.connect();
    console.log("MongoDB Connected");

    const database = client.db("earn_db");
    db = {
      users: database.collection("earnMoneyUser"),
      tasks: database.collection("newTasks"),
      submissions: database.collection("taskSubmission"),
      withdrawals: database.collection("withdrawal"),
      notifications: database.collection("notifications"),
      paymentDetails: database.collection("paymentDetails"),
      paymentHistory: database.collection("paymentHistory"),
    };
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};

const getDB = () => db;

module.exports = { connectToDB, getDB };