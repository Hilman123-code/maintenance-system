const pool = require("../db");

// Get all spare parts
const getSpareParts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM spare_parts
      ORDER BY id ASC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get spare parts",
      error: error.message,
    });
  }
};

// Get one spare part by ID
const getSparePartById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM spare_parts
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Spare part not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get spare part",
      error: error.message,
    });
  }
};

// Create spare part
const createSparePart = async (req, res) => {
  try {
    const { part_code, part_name, category, stock_qty, min_stock, location } =
      req.body;

    if (!part_code || !part_name) {
      return res.status(400).json({
        message: "Part code and part name are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO spare_parts
      (part_code, part_name, category, stock_qty, min_stock, location)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        part_code,
        part_name,
        category || null,
        stock_qty || 0,
        min_stock || 0,
        location || null,
      ]
    );

    res.status(201).json({
      message: "Spare part created successfully",
      spare_part: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create spare part",
      error: error.message,
    });
  }
};

// Update spare part
const updateSparePart = async (req, res) => {
  try {
    const { id } = req.params;

    const { part_code, part_name, category, stock_qty, min_stock, location } =
      req.body;

    const result = await pool.query(
      `
      UPDATE spare_parts
      SET
        part_code = $1,
        part_name = $2,
        category = $3,
        stock_qty = $4,
        min_stock = $5,
        location = $6
      WHERE id = $7
      RETURNING *
      `,
      [part_code, part_name, category, stock_qty, min_stock, location, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Spare part not found",
      });
    }

    res.json({
      message: "Spare part updated successfully",
      spare_part: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update spare part",
      error: error.message,
    });
  }
};

// Delete spare part
const deleteSparePart = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM spare_parts
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Spare part not found",
      });
    }

    res.json({
      message: "Spare part deleted successfully",
      spare_part: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(400).json({
        message:
          "Cannot delete this spare part because it already has usage history.",
      });
    }

    res.status(500).json({
      message: "Failed to delete spare part",
      error: error.message,
    });
  }
};

// Get spare part usage history
const getSparePartUsage = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        spu.id,
        spu.request_id,
        spu.spare_part_id,
        spu.quantity_used,
        spu.used_by,
        spu.usage_note,
        spu.used_at,

        sp.part_code,
        sp.part_name,

        mr.request_no,
        mr.problem_title,

        u.full_name AS used_by_name
      FROM spare_part_usage spu
      LEFT JOIN spare_parts sp ON spu.spare_part_id = sp.id
      LEFT JOIN maintenance_requests mr ON spu.request_id = mr.id
      LEFT JOIN users u ON spu.used_by = u.id
      ORDER BY spu.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get spare part usage",
      error: error.message,
    });
  }
};

// Create spare part usage and reduce stock
const createSparePartUsage = async (req, res) => {
  const client = await pool.connect();

  try {
    const { request_id, spare_part_id, quantity_used, used_by, usage_note } =
      req.body;

    if (!request_id || !spare_part_id || !quantity_used || !used_by) {
      return res.status(400).json({
        message:
          "Request ID, spare part ID, quantity used, and used by are required",
      });
    }

    await client.query("BEGIN");

    const sparePartResult = await client.query(
      `
      SELECT *
      FROM spare_parts
      WHERE id = $1
      FOR UPDATE
      `,
      [spare_part_id]
    );

    if (sparePartResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Spare part not found",
      });
    }

    const sparePart = sparePartResult.rows[0];

    if (sparePart.stock_qty < quantity_used) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Not enough spare part stock",
      });
    }

    const usageResult = await client.query(
      `
      INSERT INTO spare_part_usage
      (request_id, spare_part_id, quantity_used, used_by, usage_note)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        request_id,
        spare_part_id,
        quantity_used,
        used_by,
        usage_note || null,
      ]
    );

    const updatedStockResult = await client.query(
      `
      UPDATE spare_parts
      SET stock_qty = stock_qty - $1
      WHERE id = $2
      RETURNING *
      `,
      [quantity_used, spare_part_id]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Spare part usage recorded successfully",
      usage: usageResult.rows[0],
      updated_spare_part: updatedStockResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    res.status(500).json({
      message: "Failed to record spare part usage",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getSpareParts,
  getSparePartById,
  createSparePart,
  updateSparePart,
  deleteSparePart,
  getSparePartUsage,
  createSparePartUsage,
};