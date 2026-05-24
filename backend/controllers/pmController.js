const pool = require("../db");

// Get all preventive maintenance schedules
const getPmSchedules = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        pm.id,
        pm.asset_id,
        pm.pm_title,
        pm.pm_description,
        pm.frequency,
        pm.next_due_date,
        pm.last_completed_date,
        pm.status,
        pm.assigned_to,
        pm.created_at,

        a.asset_code,
        a.asset_name,
        a.location,

        u.full_name AS assigned_to_name
      FROM preventive_maintenance pm
      LEFT JOIN assets a ON pm.asset_id = a.id
      LEFT JOIN users u ON pm.assigned_to = u.id
      ORDER BY pm.next_due_date ASC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get preventive maintenance schedules",
      error: error.message,
    });
  }
};

// Create PM schedule
const createPmSchedule = async (req, res) => {
  try {
    const {
      asset_id,
      pm_title,
      pm_description,
      frequency,
      next_due_date,
      assigned_to,
    } = req.body;

    if (!asset_id || !pm_title || !frequency || !next_due_date) {
      return res.status(400).json({
        message: "Asset, PM title, frequency, and next due date are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO preventive_maintenance
      (
        asset_id,
        pm_title,
        pm_description,
        frequency,
        next_due_date,
        assigned_to,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'Upcoming')
      RETURNING *
      `,
      [
        asset_id,
        pm_title,
        pm_description || null,
        frequency,
        next_due_date,
        assigned_to || null,
      ]
    );

    res.status(201).json({
      message: "Preventive maintenance schedule created successfully",
      pm: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create preventive maintenance schedule",
      error: error.message,
    });
  }
};

// Update PM schedule
const updatePmSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      asset_id,
      pm_title,
      pm_description,
      frequency,
      next_due_date,
      assigned_to,
      status,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE preventive_maintenance
      SET
        asset_id = $1,
        pm_title = $2,
        pm_description = $3,
        frequency = $4,
        next_due_date = $5,
        assigned_to = $6,
        status = $7
      WHERE id = $8
      RETURNING *
      `,
      [
        asset_id,
        pm_title,
        pm_description || null,
        frequency,
        next_due_date,
        assigned_to || null,
        status || "Upcoming",
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Preventive maintenance schedule not found",
      });
    }

    res.json({
      message: "Preventive maintenance schedule updated successfully",
      pm: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update preventive maintenance schedule",
      error: error.message,
    });
  }
};

// Delete PM schedule
const deletePmSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM preventive_maintenance
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Preventive maintenance schedule not found",
      });
    }

    res.json({
      message: "Preventive maintenance schedule deleted successfully",
      pm: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete preventive maintenance schedule",
      error: error.message,
    });
  }
};

// Mark PM as completed and calculate next due date
const completePmSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { completed_date } = req.body;

    const pmResult = await pool.query(
      "SELECT * FROM preventive_maintenance WHERE id = $1",
      [id]
    );

    if (pmResult.rows.length === 0) {
      return res.status(404).json({
        message: "Preventive maintenance schedule not found",
      });
    }

    const pm = pmResult.rows[0];

    const completedDate = completed_date
      ? new Date(completed_date)
      : new Date();

    const nextDueDate = new Date(completedDate);

    if (pm.frequency === "Daily") {
      nextDueDate.setDate(nextDueDate.getDate() + 1);
    } else if (pm.frequency === "Weekly") {
      nextDueDate.setDate(nextDueDate.getDate() + 7);
    } else if (pm.frequency === "Monthly") {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    } else if (pm.frequency === "Quarterly") {
      nextDueDate.setMonth(nextDueDate.getMonth() + 3);
    } else if (pm.frequency === "Yearly") {
      nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
    } else {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    }

    const result = await pool.query(
      `
      UPDATE preventive_maintenance
      SET
        last_completed_date = $1,
        next_due_date = $2,
        status = 'Upcoming'
      WHERE id = $3
      RETURNING *
      `,
      [
        completedDate.toISOString().slice(0, 10),
        nextDueDate.toISOString().slice(0, 10),
        id,
      ]
    );

    res.json({
      message: "Preventive maintenance marked as completed",
      pm: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to complete preventive maintenance",
      error: error.message,
    });
  }
};

// Get PM summary
const getPmSummary = async (req, res) => {
  try {
    const totalPm = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM preventive_maintenance
    `);

    const upcomingPm = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM preventive_maintenance
      WHERE next_due_date >= CURRENT_DATE
    `);

    const overduePm = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM preventive_maintenance
      WHERE next_due_date < CURRENT_DATE
    `);

    const dueSoonPm = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM preventive_maintenance
      WHERE next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    `);

    res.json({
      total_pm: totalPm.rows[0].total,
      upcoming_pm: upcomingPm.rows[0].total,
      overdue_pm: overduePm.rows[0].total,
      due_soon_pm: dueSoonPm.rows[0].total,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get PM summary",
      error: error.message,
    });
  }
};

module.exports = {
  getPmSchedules,
  createPmSchedule,
  updatePmSchedule,
  deletePmSchedule,
  completePmSchedule,
  getPmSummary,
};