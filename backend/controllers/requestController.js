const pool = require("../db");

// Generate request number like MR-20260519-001
const generateRequestNo = async () => {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, "");

  const result = await pool.query(
    "SELECT COUNT(*) FROM maintenance_requests WHERE request_no LIKE $1",
    [`MR-${datePart}-%`]
  );

  const count = parseInt(result.rows[0].count) + 1;
  const runningNo = String(count).padStart(3, "0");

  return `MR-${datePart}-${runningNo}`;
};

// Get all maintenance requests
const getRequests = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        mr.id,
        mr.request_no,
        mr.problem_title,
        mr.problem_description,
        mr.priority,
        mr.status,
        mr.breakdown_start,
        mr.repair_start,
        mr.repair_end,
        mr.created_at,

        a.asset_code,
        a.asset_name,
        a.location,

        requester.full_name AS requested_by_name,
        technician.full_name AS assigned_to_name

      FROM maintenance_requests mr
      LEFT JOIN assets a ON mr.asset_id = a.id
      LEFT JOIN users requester ON mr.requested_by = requester.id
      LEFT JOIN users technician ON mr.assigned_to = technician.id
      ORDER BY mr.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get maintenance requests",
      error: error.message,
    });
  }
};

// Get one request by ID
const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        mr.*,
        a.asset_code,
        a.asset_name,
        a.category,
        a.location,
        requester.full_name AS requested_by_name,
        technician.full_name AS assigned_to_name
      FROM maintenance_requests mr
      LEFT JOIN assets a ON mr.asset_id = a.id
      LEFT JOIN users requester ON mr.requested_by = requester.id
      LEFT JOIN users technician ON mr.assigned_to = technician.id
      WHERE mr.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Maintenance request not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get maintenance request",
      error: error.message,
    });
  }
};

// Create new maintenance request
const createRequest = async (req, res) => {
  try {
    const {
      asset_id,
      requested_by,
      problem_title,
      problem_description,
      priority,
      breakdown_start,
    } = req.body;

    if (!asset_id || !problem_title) {
      return res.status(400).json({
        message: "Asset ID and problem title are required",
      });
    }

    const request_no = await generateRequestNo();

    const result = await pool.query(
      `
      INSERT INTO maintenance_requests
      (
        request_no,
        asset_id,
        requested_by,
        problem_title,
        problem_description,
        priority,
        status,
        breakdown_start
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'Open', $7)
      RETURNING *
      `,
      [
        request_no,
        asset_id,
        requested_by || null,
        problem_title,
        problem_description || null,
        priority || "Medium",
        breakdown_start || null,
      ]
    );

    res.status(201).json({
      message: "Maintenance request created successfully",
      request: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create maintenance request",
      error: error.message,
    });
  }
};

// Update request status
const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, repair_start, repair_end, updated_by, note } = req.body;

    if (!status) {
      return res.status(400).json({
        message: "Status is required",
      });
    }

    const result = await pool.query(
      `
      UPDATE maintenance_requests
      SET 
        status = $1,
        repair_start = COALESCE($2, repair_start),
        repair_end = COALESCE($3, repair_end)
      WHERE id = $4
      RETURNING *
      `,
      [status, repair_start || null, repair_end || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Maintenance request not found" });
    }

    await pool.query(
      `
      INSERT INTO request_status_logs
      (request_id, status, updated_by, note)
      VALUES ($1, $2, $3, $4)
      `,
      [id, status, updated_by || null, note || null]
    );

    res.json({
      message: "Request status updated successfully",
      request: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update request status",
      error: error.message,
    });
  }
};

// Assign technician
const assignTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to, updated_by, note } = req.body;

    if (!assigned_to) {
      return res.status(400).json({
        message: "Assigned technician user ID is required",
      });
    }

    const result = await pool.query(
      `
      UPDATE maintenance_requests
      SET 
        assigned_to = $1,
        status = 'Assigned'
      WHERE id = $2
      RETURNING *
      `,
      [assigned_to, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Maintenance request not found" });
    }

    await pool.query(
      `
      INSERT INTO request_status_logs
      (request_id, status, updated_by, note)
      VALUES ($1, $2, $3, $4)
      `,
      [
        id,
        "Assigned",
        updated_by || null,
        note || `Technician ID ${assigned_to} assigned`,
      ]
    );

    res.json({
      message: "Technician assigned successfully",
      request: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to assign technician",
      error: error.message,
    });
  }
};

// Delete maintenance request
const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM maintenance_requests WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Maintenance request not found" });
    }

    res.json({
      message: "Maintenance request deleted successfully",
      request: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete maintenance request",
      error: error.message,
    });
  }
};

const getRequestStatusLogs = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        rsl.id,
        rsl.request_id,
        rsl.status,
        rsl.updated_by,
        rsl.note,
        rsl.created_at,
        u.full_name AS updated_by_name
      FROM request_status_logs rsl
      LEFT JOIN users u ON rsl.updated_by = u.id
      WHERE rsl.request_id = $1
      ORDER BY rsl.created_at ASC
      `,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get request status logs",
      error: error.message,
    });
  }
};

module.exports = {
  getRequests,
  getRequestById,
  createRequest,
  updateRequestStatus,
  assignTechnician,
  deleteRequest,
  getRequestStatusLogs,
};