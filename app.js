const express = require("express");
const cors = require("cors");
const { connectToDB } = require("./config/db");

// Route imports
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const taskRoutes = require("./routes/task.routes");
const workerRoutes = require("./routes/worker.routes");
const withdrawalRoutes = require("./routes/withdrawal.routes");
const paymentRoutes = require("./routes/payment.routes");
const notificationRoutes = require("./routes/notification.routes");

const app = express();

// Middlewares
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
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Database
connectToDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/worker", workerRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);

module.exports = app;