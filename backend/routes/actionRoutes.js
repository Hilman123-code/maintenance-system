const express = require("express");

const {
  getActions,
  getActionsByRequestId,
  createAction,
  updateAction,
  deleteAction,
} = require("../controllers/actionController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getActions);
router.get("/request/:request_id", protect, getActionsByRequestId);

router.post(
  "/",
  protect,
  allowRoles("Admin", "Technician"),
  createAction
);

router.put(
  "/:id",
  protect,
  allowRoles("Admin", "Technician"),
  updateAction
);

router.delete(
  "/:id",
  protect,
  allowRoles("Admin"),
  deleteAction
);

module.exports = router;