const express = require("express");

const {
  getRequests,
  getRequestById,
  createRequest,
  updateRequestStatus,
  assignTechnician,
  deleteRequest,
  getRequestStatusLogs,
} = require("../controllers/requestController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getRequests);
router.get("/:id/logs", protect, getRequestStatusLogs);
router.get("/:id", protect, getRequestById);

router.post(
  "/",
  protect,
  allowRoles("Admin", "Requester", "Supervisor"),
  createRequest
);

router.put(
  "/:id/status",
  protect,
  allowRoles("Admin", "Supervisor", "Technician"),
  updateRequestStatus
);

router.put(
  "/:id/assign",
  protect,
  allowRoles("Admin", "Supervisor"),
  assignTechnician
);

router.delete(
  "/:id",
  protect,
  allowRoles("Admin"),
  deleteRequest
);

module.exports = router;