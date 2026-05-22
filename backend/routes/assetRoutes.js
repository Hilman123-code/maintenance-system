const express = require("express");

const {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
} = require("../controllers/assetController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getAssets);
router.get("/:id", protect, getAssetById);

router.post(
  "/",
  protect,
  allowRoles("Admin", "Supervisor"),
  createAsset
);

router.put(
  "/:id",
  protect,
  allowRoles("Admin", "Supervisor"),
  updateAsset
);

router.delete(
  "/:id",
  protect,
  allowRoles("Admin"),
  deleteAsset
);

module.exports = router;