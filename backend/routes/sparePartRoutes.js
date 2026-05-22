const express = require("express");

const {
  getSpareParts,
  getSparePartById,
  createSparePart,
  updateSparePart,
  deleteSparePart,
  getSparePartUsage,
  createSparePartUsage,
} = require("../controllers/sparePartController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getSpareParts);
router.get("/usage", protect, getSparePartUsage);
router.get("/:id", protect, getSparePartById);

router.post(
  "/",
  protect,
  allowRoles("Admin", "Supervisor"),
  createSparePart
);

router.put(
  "/:id",
  protect,
  allowRoles("Admin", "Supervisor"),
  updateSparePart
);

router.delete(
  "/:id",
  protect,
  allowRoles("Admin"),
  deleteSparePart
);

router.post(
  "/usage",
  protect,
  allowRoles("Admin", "Technician"),
  createSparePartUsage
);

module.exports = router;