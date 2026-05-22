const express = require("express");

const {
  getDashboardSummary,
  getRequestsByStatus,
  getRequestsByPriority,
  getTopProblemAssets,
  getTechnicianWorkload,
  getSparePartSummary,
  getMostUsedSpareParts,
} = require("../controllers/dashboardController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/summary",
  protect,
  allowRoles("Admin", "Supervisor"),
  getDashboardSummary
);

router.get(
  "/requests-by-status",
  protect,
  allowRoles("Admin", "Supervisor"),
  getRequestsByStatus
);

router.get(
  "/requests-by-priority",
  protect,
  allowRoles("Admin", "Supervisor"),
  getRequestsByPriority
);

router.get(
  "/top-problem-assets",
  protect,
  allowRoles("Admin", "Supervisor"),
  getTopProblemAssets
);

router.get(
  "/technician-workload",
  protect,
  allowRoles("Admin", "Supervisor"),
  getTechnicianWorkload
);

router.get(
  "/spare-part-summary",
  protect,
  allowRoles("Admin", "Supervisor"),
  getSparePartSummary
);

router.get(
  "/most-used-spare-parts",
  protect,
  allowRoles("Admin", "Supervisor"),
  getMostUsedSpareParts
);

module.exports = router;