require("dotenv").config();
const express = require("express");
var jwt = require("jsonwebtoken");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://micro-tasking-earn-money-platform.vercel.app/",
      "https://earn-money-742d2.web.app",
      "https://earnify-life210.surge.sh",
    ],
    credentials: true,
  })
);

// app.use(cors())

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
  // console.log(token);
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
    // await client.connect();

    const earnMoneyUsersCollection = client
      .db("earn_db")
      .collection("earnMoneyUser");
    const newTaskCollection = client.db("earn_db").collection("newTasks");
    const taskSubmissionCollection = client
      .db("earn_db")
      .collection("taskSubmission");
    const withdrawalCollection = client.db("earn_db").collection("withdrawal");
    const notificationCollection = client
      .db("earn_db")
      .collection("notifications");
    const paymentDetailsCollection = client
      .db("earn_db")
      .collection("paymentDetails");
    const paymentHistoryCollection = client
      .db("earn_db")
      .collection("paymentHistory");

    // Admin Verify middleware

    const verifyAdmin = async (req, res, next) => {
      // console.log("Data from verifyToken middleware---->", req.user);

      const email = req.user?.email;
      const query = { email: email };
      const result = await earnMoneyUsersCollection.findOne(query);
      if (!result || result?.role !== "Admin")
        return res
          .status(403)
          .send({ message: "Forbidden Action! Admin only Actions" });
      next();
    };

    const verifyBuyer = async (req, res, next) => {
      console.log("Data from verifyToken middleware---->", req.user);
      const email = req.user?.email;
      const query = { email: email };
      const result = await earnMoneyUsersCollection.findOne(query);
      if (!result || result?.role !== "Buyer")
        return res
          .status(403)
          .send({ message: "Forbidden Action! Buyer only Actions" });
      next();
    };

    const verifyWorker = async (req, res, next) => {
      console.log("Data from verifyToken middleware---->", req.user);
      const email = req.user?.email;
      const query = { email: email };
      const result = await earnMoneyUsersCollection.findOne(query);
      if (!result || result?.role !== "Worker")
        return res
          .status(403)
          .send({ message: "Forbidden Action! Worker only Actions" });
      next();
    };

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

    app.get("/userCoin/:email", async (req, res) => {
      const query = { email: req.params.email };
      console.log(query);
      const result = await earnMoneyUsersCollection.findOne(query);
      res.send(result);
    });

    // just For Admin
    app.get("/allUsers/:email", verifyToken, verifyAdmin, async (req, res) => {
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

    app.get("/users/worker", async (req, res) => {
      const result = await earnMoneyUsersCollection
        .find()
        .sort({ coin: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await earnMoneyUsersCollection.deleteOne(query);
      res.send(result);
    });

    // Users Management related API End
    // Buyer Task Management Related API start
    app.post("/new-tasks", verifyToken, verifyBuyer, async (req, res) => {
      const newTasks = req.body;
      console.log(newTasks.payment, newTasks.coinId);
      const paymentCoin = newTasks.PaymentCoin;
      console.log(paymentCoin);
      try {
        const result = await newTaskCollection.insertOne(newTasks);
        const coinId = newTasks.coinId; // Assuming the task ID is included in the submission
        const filter = { _id: new ObjectId(coinId) };
        const updateDoc = {
          $inc: { coin: -paymentCoin }, // Decrease worker count by 1
        };

        await earnMoneyUsersCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    app.get("/loggedUser/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { email: email };
      const result = await earnMoneyUsersCollection.findOne(query);
      res.send(result);
    });

    app.get("/my-tasks/:email", verifyToken, verifyBuyer, async (req, res) => {
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

    app.get("/allTasks/:email", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const result = await newTaskCollection.find().toArray();

        res.send(result);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    app.delete("/tasks/:id", verifyToken, verifyBuyer, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await newTaskCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/tasks/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await newTaskCollection.findOne(query);
      res.send(result);
    });

    app.patch("/taskUpdate/:id", verifyToken, verifyBuyer, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const task = req.body;
      const updateDoc = {
        $set: {
          ...task,
          ...(task.submissionImage && {
            submissionImage: task.submissionImage,
          }),
        },
      };
      const result = await newTaskCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.patch(
      "/refillData/:email",
      verifyToken,
      verifyBuyer,
      async (req, res) => {
        const email = req.params.email;
        const refillData = req.body;
        console.log(refillData);
        const filter = { email: email };
        const updateDoc = {
          $inc: { coin: refillData.paymentCoin },
        };
        const result = await earnMoneyUsersCollection.updateOne(
          filter,
          updateDoc
        );
        res.send(result);
      }
    );

    app.patch(
      "/submissionStatus/:id",
      verifyToken,
      verifyBuyer,
      async (req, res) => {
        const { reviewInfo } = req.body;
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        console.log(reviewInfo);
        const updatedDoc = {
          $set: {
            status: reviewInfo.status,
          },
        };
        const result = await taskSubmissionCollection.updateOne(
          filter,
          updatedDoc
        );
        try {
          const taskId = reviewInfo.taskId;
          const taskFilter = { _id: new ObjectId(taskId) };
          let incrementValue = 0;

          if (reviewInfo.status === "Reject") {
            incrementValue = 1;
          } else if (reviewInfo.status === "Approve") {
            incrementValue = -1;
          }

          if (incrementValue !== 0) {
            const incrementDoc = { $inc: { worker: incrementValue } };
            await newTaskCollection.updateOne(taskFilter, incrementDoc);
          }
        } catch (error) {
          return res.status(500).send({
            error: "Failed to update worker count",
            details: error.message,
          });
        }
        res.send(result);
      }
    );

    // Worker API Routes
    app.get("/postedTasks", verifyToken, verifyWorker, async (req, res) => {
      try {
        const sortOrder = req.query.sort === "Low to heigh" ? 1 : -1; // Determine sorting order
        const result = await newTaskCollection
          .find({ worker: { $gt: 0 } })
          .sort({ worker: sortOrder }) // Sorting based on worker count
          .toArray();

        res.send(result);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    app.get("/homePostedTasks", async (req, res) => {
      try {
        const result = await newTaskCollection
          .find({ worker: { $gt: 0 } })
          .sort({ PaymentCoin: -1 })
          .limit(8)
          .toArray();

        res.send(result);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    });

    app.post(
      "/taskSubmissions/:email",
      verifyToken,
      verifyWorker,
      async (req, res) => {
        const submission = req.body;
        // const email = req.params.email;
        // const query = { "worker_detail.email": email };
        // const alreadyExist = await taskSubmissionCollection.findOne(query);
        // if (alreadyExist) {
        //   return res.send({ message: "User is Already Exist" });
        // }
        try {
          // Insert the new submission
          const result = await taskSubmissionCollection.insertOne(submission);

          const taskId = submission.task_id;
          const filter = { _id: new ObjectId(taskId) };
          const updateDoc = {
            $inc: { worker: -1 },
          };

          await newTaskCollection.updateOne(filter, updateDoc);

          res.send(result);
        } catch (err) {
          res
            .status(500)
            .send({ error: "An error occurred", details: err.message });
        }
      }
    );

    app.patch("/paymentCoin", async (req, res) => {
      const { approvedCoin } = req.body;
      const filter = { email: approvedCoin.workerEmail };
      const updateDoc = {
        $inc: { coin: approvedCoin.PaymentCoin },
      };
      const result = await earnMoneyUsersCollection.updateOne(
        filter,
        updateDoc
      );
      res.send(result);
    });

    app.get(
      "/mySubmissions/:email",
      verifyToken,
      verifyWorker,
      async (req, res) => {
        const email = req.params.email;
        console.log(req.query);
        const page = parseInt(req.query.page);
        const size = parseInt(req.query.size);
        console.log(email);
        const query = { "worker_detail.email": email };
        const total = await taskSubmissionCollection.countDocuments(query);
        const result = await taskSubmissionCollection
          .find(query)
          .limit(size)
          .skip(page * size)
          .toArray();
        res.send({ result, total });
      }
    );

    app.get("/review-tasks/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { "buyer_detail.email": email };
      const result = await taskSubmissionCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/pendingSubmissions/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { "worker_detail.email": email, status: "pending" };
      const result = await taskSubmissionCollection.find(query).toArray();
      res.send(result);
    });

    // withdrawals route
    app.post(
      "/withdrawals/:email",
      verifyToken,
      verifyWorker,
      async (req, res) => {
        const email = req.params.email;
        const withdrawal = req.body;
        try {
          const result = await withdrawalCollection.insertOne(withdrawal);

          res.send(result);
        } catch (err) {
          console.log(err);
        }
      }
    );

    // Admin Routes
    app.get(
      "/withdrawalRequests/:email",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        try {
          const result = await withdrawalCollection.find().toArray();
          res.send(result);
        } catch (err) {
          console.log(err);
        }
      }
    );

    app.patch(
      "/withdrawalStatusUpdate/:email/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const { email, id } = req.params;
        const withdrawData = req.body;

        const filter = { email: email, _id: new ObjectId(id) };
        console.log(filter);
        const updateStatus = {
          $set: {
            status: withdrawData.approved,
          },
        };
        const result = await withdrawalCollection.updateOne(
          filter,
          updateStatus
        );
        res.send(result);
      }
    );

    app.patch(
      "/withdrawUpdate/:email",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const withdrawData = req.body;
        console.log(withdrawData);
        const filter = { email: req.params.email };

        const updateDoc = {
          $inc: { coin: -withdrawData.withdrawCoin },
        };
        const result = await earnMoneyUsersCollection.updateOne(
          filter,
          updateDoc
        );
        res.send(result);
      }
    );

    app.patch("/update-role", verifyToken, verifyAdmin, async (req, res) => {
      const roleStatus = req.body;
      console.log(roleStatus);
      const filter = { email: roleStatus.email };
      const updateDoc = {
        $set: {
          role: roleStatus.role,
        },
      };
      const result = await earnMoneyUsersCollection.updateOne(
        filter,
        updateDoc
      );
      res.send(result);
    });

    app.delete(
      "/manage-remove-task/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await newTaskCollection.deleteOne(query);
        res.send(result);
      }
    );

    // Notification Routes
    app.post("/notifications", verifyToken, async (req, res) => {
      const notification = req.body;
      const result = await notificationCollection.insertOne(notification);
      res.send(result);
    });

    app.get("/notification/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await notificationCollection
        .find(query)
        .sort({ time: -1 })
        .toArray();
      res.send(result);
    });

    app.get("/paymentDetails", verifyToken, verifyBuyer, async (req, res) => {
      const result = await paymentDetailsCollection.find().toArray();
      res.send(result);
    });
    // paymentDetails
    app.get(
      "/paymentDetails/:id",
      verifyToken,
      verifyBuyer,
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await paymentDetailsCollection.findOne(query);
        res.send(result);
      }
    );

    app.post(
      "/create-payment-intent",
      verifyToken,
      verifyBuyer,
      async (req, res) => {
        const { price } = req.body;
        console.log(req.body);
        console.log(price);
        // Validate price
        if (typeof price !== "number" || isNaN(price)) {
          return res.status(400).send({ error: "Invalid price value" });
        }

        const amount = Math.round(price * 100); // Use Math.round for better precision

        try {
          const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: "usd",
            payment_method_types: ["card"],
          });
          res.send({ clientSecret: paymentIntent.client_secret });
        } catch (error) {
          res.status(500).send({ error: error.message });
        }
      }
    );

    // paymentHistory Routes
    app.post(
      "/payment-history/:email",
      verifyToken,
      verifyBuyer,
      async (req, res) => {
        const history = req.body;
        const email = req.params.email;
        if (!history.email || !history.coin) {
          return res.status(400).send({ message: "Invalid data" });
        }

        console.log(history);
        const filter = { email: email };
        const updateDoc = {
          $inc: { coin: history.coin },
        };
        try {
          const result = await paymentHistoryCollection.insertOne(history);
          await earnMoneyUsersCollection.updateOne(filter, updateDoc);
          res.send(result);
        } catch (err) {
          console.error(err);
          res.status(500).send({ message: "Internal Server Error" });
        }
      }
    );

    app.get(
      "/payment-history/:email",
      verifyToken,
      verifyBuyer,
      async (req, res) => {
        const email = req.params.email;
        const query = { email: email };
        const result = await paymentHistoryCollection.find(query).toArray();
        res.send(result);
      }
    );

    // Admin route
    app.get(
      "/allPayments-history",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const result = await paymentHistoryCollection.find().toArray();
        res.send(result);
      }
    );

    // 1. id 2. currency 3. coin 4. amount 5. date 6. email 7. method 8. status

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
