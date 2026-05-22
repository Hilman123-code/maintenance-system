const pool = require("../db");

// Get all assets
const getAssets = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM assets ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get assets",
      error: error.message,
    });
  }
};

// Get one asset by ID
const getAssetById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM assets WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Asset not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get asset",
      error: error.message,
    });
  }
};

// Create new asset
const createAsset = async (req, res) => {
  try {
    const { asset_code, asset_name, category, location, status } = req.body;

    if (!asset_code || !asset_name) {
      return res.status(400).json({
        message: "Asset code and asset name are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO assets 
       (asset_code, asset_name, category, location, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        asset_code,
        asset_name,
        category || null,
        location || null,
        status || "Active",
      ]
    );

    res.status(201).json({
      message: "Asset created successfully",
      asset: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create asset",
      error: error.message,
    });
  }
};

// Update asset
const updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { asset_code, asset_name, category, location, status } = req.body;

    const result = await pool.query(
      `UPDATE assets
       SET asset_code = $1,
           asset_name = $2,
           category = $3,
           location = $4,
           status = $5
       WHERE id = $6
       RETURNING *`,
      [asset_code, asset_name, category, location, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Asset not found" });
    }

    res.json({
      message: "Asset updated successfully",
      asset: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update asset",
      error: error.message,
    });
  }
};

// Delete asset
const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM assets WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Asset not found" });
    }

    res.json({
      message: "Asset deleted successfully",
      asset: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete asset",
      error: error.message,
    });
  }
};

module.exports = {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
};