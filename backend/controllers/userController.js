const pool = require("../db");

// Get all users
const getUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.role_id,
        r.role_name,
        u.created_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.id ASC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get users",
      error: error.message,
    });
  }
};

// Get technicians only
const getTechnicians = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.role_id,
        r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE r.role_name = 'Technician'
      ORDER BY u.full_name ASC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get technicians",
      error: error.message,
    });
  }
};

// Get all roles
const getRoles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM roles
      ORDER BY id ASC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get roles",
      error: error.message,
    });
  }
};

module.exports = {
  getUsers,
  getTechnicians,
  getRoles,
};