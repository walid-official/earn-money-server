require("dotenv").config();
// import { PaymentIntents } from './node_modules/stripe/esm/resources/PaymentIntents';
const express = require("express");
var jwt = require("jsonwebtoken");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 9000;

// earnMoney
// FgFpDElX87Xan2RT

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

//custom middleware for verify
const verifyToken = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = req.headers.authorization.split(" ")[1];
  console.log(token);
  jwt.verify(token, process.env.ACCESS_KEY_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pxdhv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const earnMoneyUsersCollection = client
      .db("earn_db")
      .collection("earnMoneyUser");
    const newTaskCollection = client.db("earn_db").collection("newTasks");
    const taskSubmissionCollection = client
      .db("earn_db")
      .collection("taskSubmission");

    // jwt related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_KEY_SECRET, {
        expiresIn: "10d",
      });
      console.log(token);
      res.send({ token });
    });

    // Users Management related API Start

    app.post("/earning-users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const isExist = await earnMoneyUsersCollection.findOne(query);
      console.log(isExist);
      if (isExist) {
        return res.send({ message: "User Already Exist" });
      }
      const result = await earnMoneyUsersCollection.insertOne(user);
      res.send(result);
    });

    // just For Admin
    app.get("/allUsers/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { email: { $ne: email } };
      const result = await earnMoneyUsersCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/users/role/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.user.email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const query = { email: email };
      const result = await earnMoneyUsersCollection.findOne(query);
      res.send({ role: result?.role });
    });

    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await earnMoneyUsersCollection.deleteOne(query);
      res.send(result);
    });

    // Users Management related API End
    // Buyer Task Management Related API start
    app.post("/new-tasks", verifyToken, async (req, res) => {
      const newTasks = req.body;
      const result = await newTaskCollection.insertOne(newTasks);
      res.send(result);
    });

    app.get("/loggedUser/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { email: email };
      const result = await earnMoneyUsersCollection.findOne(query);
      res.send(result);
    });

    // TODO:
    app.get("/my-tasks/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { "buyerInfo.email": email };
      try {
        const result = await newTaskCollection
          .find(query)
          .sort({
            completionDate: -1,
          })
          .toArray();

        res.send(result);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    app.delete("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await newTaskCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await newTaskCollection.findOne(query);
      res.send(result);
    });

    app.patch("/taskUpdate/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const task = req.body;
      const updateDoc = {
        $set: {
          ...task,
        },
      };
      const result = await newTaskCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.patch("/submissionStatus/:id", async (req, res) => {
      const submitStatus = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      console.log(submitStatus);
      const updatedDoc = {
        $set: {
          status: submitStatus.status,
        },
      };
      const result = await taskSubmissionCollection.updateOne(
        filter,
        updatedDoc
      );
      // if(submitStatus.status === "Reject"){

      // }
      res.send(result);
    });

    // Worker API Routes
    app.get("/postedTasks", verifyToken, async (req, res) => {
      try {
        const result = await newTaskCollection.find().toArray();

        res.send(result);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    app.post("/taskSubmissions/:email", verifyToken, async (req, res) => {
      const submission = req.body;
      const email = req.params.email;
      const query = { "worker_detail.email": email };
      const alreadyExist = await taskSubmissionCollection.findOne(query);
      if (alreadyExist) {
        return res.send({ message: "User is Already Exist" });
      }
      try {
        // Insert the new submission
        const result = await taskSubmissionCollection.insertOne(submission);

        // Update the worker count for the related task
        const taskId = submission.task_id; // Assuming the task ID is included in the submission
        const filter = { _id: new ObjectId(taskId) };
        const updateDoc = {
          $inc: { worker: -1 }, // Decrease worker count by 1
        };

        await newTaskCollection.updateOne(filter, updateDoc);

        res.send(result);
      } catch (err) {
        res
          .status(500)
          .send({ error: "An error occurred", details: err.message });
      }
    });

    app.get("/mySubmissions/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { "worker_detail.email": email };
      const result = await taskSubmissionCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/review-tasks", verifyToken, async (req, res) => {
      const result = await taskSubmissionCollection.find().toArray();
      res.send(result);
    });

    // payment Intent
    // app.post("/create-payment-intent",async(req,res) =>{
    //   const {coin} = req.body;
    //   const amount = parseInt(coin);

    // })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
