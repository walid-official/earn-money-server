const { getDB } = require("../config/db");

const verifyRole = (requiredRole) => {
  return async (req, res, next) => {
    const email = req.user?.email;
    const db = getDB();
    const user = await db.users.findOne({ email });

    if (!user || user.role !== requiredRole) {
      return res.status(403).send({ message: `Forbidden: ${requiredRole} only` });
    }

    next();
  };
};

const verifyAdmin = verifyRole("Admin");
const verifyBuyer = verifyRole("Buyer");
const verifyWorker = verifyRole("Worker");

module.exports = {
  verifyAdmin,
  verifyBuyer,
  verifyWorker,
};
