const express = require("express");

const {
  getUsers,
  getTechnicians,
  getRoles,
} = require("../controllers/userController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, allowRoles("Admin", "Supervisor"), getUsers);
router.get("/technicians", protect, allowRoles("Admin", "Supervisor"), getTechnicians);
router.get("/roles", protect, allowRoles("Admin"), getRoles);

module.exports = router;