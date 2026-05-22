const pool = require("../db");

// Get all maintenance actions
const getActions = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ma.id,
        ma.request_id,
        ma.technician_id,
        ma.problem_found,
        ma.action_taken,
        ma.result_status,
        ma.action_date,

        mr.request_no,
        mr.problem_title,
        mr.status AS request_status,

        u.full_name AS technician_name
      FROM maintenance_actions ma
      LEFT JOIN maintenance_requests mr ON ma.request_id = mr.id
      LEFT JOIN users u ON ma.technician_id = u.id
      ORDER BY ma.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get maintenance actions",
      error: error.message,
    });
  }
};

// Get actions by request ID
const getActionsByRequestId = async (req, res) => {
  try {
    const { request_id } = req.params;

    const result = await pool.query(
      `
      SELECT
        ma.id,
        ma.request_id,
        ma.technician_id,
        ma.problem_found,
        ma.action_taken,
        ma.result_status,
        ma.action_date,
        u.full_name AS technician_name
      FROM maintenance_actions ma
      LEFT JOIN users u ON ma.technician_id = u.id
      WHERE ma.request_id = $1
      ORDER BY ma.id DESC
      `,
      [request_id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get actions by request ID",
      error: error.message,
    });
  }
};

// Create maintenance action
const createAction = async (req, res) => {
  try {
    const {
      request_id,
      technician_id,
      problem_found,
      action_taken,
      result_status,
    } = req.body;

    if (!request_id || !technician_id || !action_taken) {
      return res.status(400).json({
        message: "Request ID, technician ID, and action taken are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO maintenance_actions
      (
        request_id,
        technician_id,
        problem_found,
        action_taken,
        result_status
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        request_id,
        technician_id,
        problem_found || null,
        action_taken,
        result_status || "Completed",
      ]
    );

    res.status(201).json({
      message: "Maintenance action created successfully",
      action: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create maintenance action",
      error: error.message,
    });
  }
};

// Update maintenance action
const updateAction = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      technician_id,
      problem_found,
      action_taken,
      result_status,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE maintenance_actions
      SET
        technician_id = $1,
        problem_found = $2,
        action_taken = $3,
        result_status = $4
      WHERE id = $5
      RETURNING *
      `,
      [
        technician_id,
        problem_found || null,
        action_taken,
        result_status || "Completed",
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Maintenance action not found",
      });
    }

    res.json({
      message: "Maintenance action updated successfully",
      action: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update maintenance action",
      error: error.message,
    });
  }
};

// Delete maintenance action
const deleteAction = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM maintenance_actions WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Maintenance action not found",
      });
    }

    res.json({
      message: "Maintenance action deleted successfully",
      action: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete maintenance action",
      error: error.message,
    });
  }
};

module.exports = {
  getActions,
  getActionsByRequestId,
  createAction,
  updateAction,
  deleteAction,
};