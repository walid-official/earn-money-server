const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

router.post("/jwt", (req, res) => {
  const user = req.body;

  if (!user || !user.email) {
    return res.status(400).send({ message: "Invalid user payload" });
  }

  const token = jwt.sign(user, process.env.ACCESS_KEY_SECRET, {
    expiresIn: "10d",
  });

  res.send({ token });
});

module.exports = router;