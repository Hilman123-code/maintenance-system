const pool = require("../db");

// Get dashboard summary
const getDashboardSummary = async (req, res) => {
  try {
    const totalRequests = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM maintenance_requests
    `);

    const openRequests = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM maintenance_requests
      WHERE status = 'Open'
    `);

    const assignedRequests = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM maintenance_requests
      WHERE status = 'Assigned'
    `);

    const inProgressRequests = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM maintenance_requests
      WHERE status = 'In Progress'
    `);

    const completedRequests = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM maintenance_requests
      WHERE status = 'Completed'
    `);

    const criticalRequests = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM maintenance_requests
      WHERE priority = 'Critical'
    `);

    const totalAssets = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM assets
    `);

    const totalDowntime = await pool.query(`
      SELECT 
        COALESCE(
          SUM(EXTRACT(EPOCH FROM (repair_end - breakdown_start)) / 60),
          0
        )::int AS total_downtime_minutes
      FROM maintenance_requests
      WHERE breakdown_start IS NOT NULL 
        AND repair_end IS NOT NULL
    `);

    const averageRepairTime = await pool.query(`
      SELECT 
        COALESCE(
          AVG(EXTRACT(EPOCH FROM (repair_end - repair_start)) / 60),
          0
        )::int AS average_repair_minutes
      FROM maintenance_requests
      WHERE repair_start IS NOT NULL 
        AND repair_end IS NOT NULL
    `);

    res.json({
      total_requests: totalRequests.rows[0].total,
      open_requests: openRequests.rows[0].total,
      assigned_requests: assignedRequests.rows[0].total,
      in_progress_requests: inProgressRequests.rows[0].total,
      completed_requests: completedRequests.rows[0].total,
      critical_requests: criticalRequests.rows[0].total,
      total_assets: totalAssets.rows[0].total,
      total_downtime_minutes: totalDowntime.rows[0].total_downtime_minutes,
      average_repair_minutes: averageRepairTime.rows[0].average_repair_minutes,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get dashboard summary",
      error: error.message,
    });
  }
};

// Get request count by status
const getRequestsByStatus = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        status,
        COUNT(*)::int AS total
      FROM maintenance_requests
      GROUP BY status
      ORDER BY total DESC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get requests by status",
      error: error.message,
    });
  }
};

// Get request count by priority
const getRequestsByPriority = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        priority,
        COUNT(*)::int AS total
      FROM maintenance_requests
      GROUP BY priority
      ORDER BY total DESC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get requests by priority",
      error: error.message,
    });
  }
};

// Get top assets with most maintenance requests
const getTopProblemAssets = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.id,
        a.asset_code,
        a.asset_name,
        a.location,
        COUNT(mr.id)::int AS total_requests
      FROM assets a
      LEFT JOIN maintenance_requests mr ON a.id = mr.asset_id
      GROUP BY a.id, a.asset_code, a.asset_name, a.location
      ORDER BY total_requests DESC
      LIMIT 5
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get top problem assets",
      error: error.message,
    });
  }
};

// Get technician workload
const getTechnicianWorkload = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.full_name AS technician_name,
        COUNT(mr.id)::int AS assigned_requests
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN maintenance_requests mr ON u.id = mr.assigned_to
      WHERE r.role_name = 'Technician'
      GROUP BY u.id, u.full_name
      ORDER BY assigned_requests DESC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get technician workload",
      error: error.message,
    });
  }
};

const getSparePartSummary = async (req, res) => {
  try {
    const totalSpareParts = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM spare_parts
    `);

    const lowStockParts = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM spare_parts
      WHERE stock_qty <= min_stock
    `);

    const totalUsageRecords = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM spare_part_usage
    `);

    res.json({
      total_spare_parts: totalSpareParts.rows[0].total,
      low_stock_parts: lowStockParts.rows[0].total,
      total_usage_records: totalUsageRecords.rows[0].total,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get spare part summary",
      error: error.message,
    });
  }
};

const getMostUsedSpareParts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        sp.id,
        sp.part_code,
        sp.part_name,
        COALESCE(SUM(spu.quantity_used), 0)::int AS total_used
      FROM spare_parts sp
      LEFT JOIN spare_part_usage spu ON sp.id = spu.spare_part_id
      GROUP BY sp.id, sp.part_code, sp.part_name
      ORDER BY total_used DESC
      LIMIT 5
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get most used spare parts",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardSummary,
  getRequestsByStatus,
  getRequestsByPriority,
  getTopProblemAssets,
  getTechnicianWorkload,
  getSparePartSummary,
  getMostUsedSpareParts,		
};