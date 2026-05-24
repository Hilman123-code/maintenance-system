const express = require("express");

const {
  getPmSchedules,
  createPmSchedule,
  updatePmSchedule,
  deletePmSchedule,
  completePmSchedule,
  getPmSummary,
} = require("../controllers/pmController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getPmSchedules);
router.get("/summary", protect, allowRoles("Admin", "Supervisor"), getPmSummary);

router.post(
  "/",
  protect,
  allowRoles("Admin", "Supervisor"),
  createPmSchedule
);

router.put(
  "/:id",
  protect,
  allowRoles("Admin", "Supervisor"),
  updatePmSchedule
);

router.put(
  "/:id/complete",
  protect,
  allowRoles("Admin", "Supervisor", "Technician"),
  completePmSchedule
);

router.delete(
  "/:id",
  protect,
  allowRoles("Admin"),
  deletePmSchedule
);

module.exports = router;