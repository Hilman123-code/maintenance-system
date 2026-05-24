import { useEffect, useState } from "react";
import api from "../api/api";
import {
  canAssignTechnician,
  canUpdateRequestStatus,
  isAdmin,
} from "../utils/roles";

function PreventiveMaintenance() {
  const [pmSchedules, setPmSchedules] = useState([]);
  const [assets, setAssets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [summary, setSummary] = useState(null);

  const [formData, setFormData] = useState({
    asset_id: "",
    pm_title: "",
    pm_description: "",
    frequency: "Monthly",
    next_due_date: "",
    assigned_to: "",
    status: "Upcoming",
  });

  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchPmSchedules = async () => {
    try {
      const response = await api.get("/pm");
      setPmSchedules(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load PM schedules");
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await api.get("/assets");
      setAssets(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load assets");
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await api.get("/users/technicians");
      setTechnicians(response.data);
    } catch (err) {
      console.log("Technician load error:", err.response?.data || err.message);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get("/pm/summary");
      setSummary(response.data);
    } catch (err) {
      console.log("PM summary error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchPmSchedules();
    fetchAssets();
    fetchTechnicians();
    fetchSummary();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setFormData({
      asset_id: "",
      pm_title: "",
      pm_description: "",
      frequency: "Monthly",
      next_due_date: "",
      assigned_to: "",
      status: "Upcoming",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const payload = {
      ...formData,
      asset_id: Number(formData.asset_id),
      assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
    };

    try {
      if (editingId) {
        await api.put(`/pm/${editingId}`, payload);
        setMessage("PM schedule updated successfully");
      } else {
        await api.post("/pm", payload);
        setMessage("PM schedule created successfully");
      }

      resetForm();
      fetchPmSchedules();
      fetchSummary();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save PM schedule");
    }
  };

  const handleEdit = (pm) => {
    setEditingId(pm.id);

    setFormData({
      asset_id: pm.asset_id || "",
      pm_title: pm.pm_title || "",
      pm_description: pm.pm_description || "",
      frequency: pm.frequency || "Monthly",
      next_due_date: pm.next_due_date ? pm.next_due_date.slice(0, 10) : "",
      assigned_to: pm.assigned_to || "",
      status: pm.status || "Upcoming",
    });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this PM schedule?"
    );

    if (!confirmDelete) return;

    setMessage("");
    setError("");

    try {
      await api.delete(`/pm/${id}`);
      setMessage("PM schedule deleted successfully");
      fetchPmSchedules();
      fetchSummary();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete PM schedule");
    }
  };

  const handleComplete = async (id) => {
    const today = new Date().toISOString().slice(0, 10);

    setMessage("");
    setError("");

    try {
      await api.put(`/pm/${id}/complete`, {
        completed_date: today,
      });

      setMessage("PM marked as completed. Next due date updated.");
      fetchPmSchedules();
      fetchSummary();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete PM");
    }
  };

  const getPmStatus = (nextDueDate) => {
    if (!nextDueDate) return "Unknown";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(nextDueDate);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Overdue";
    if (diffDays <= 7) return "Due Soon";
    return "Upcoming";
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString();
  };

  return (
    <div className="page">
      <h1>Preventive Maintenance</h1>
      <p>Plan and track scheduled maintenance activities for factory assets.</p>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {summary && (
        <div className="card-grid">
          <div className="card">
            <h3>Total PM</h3>
            <p className="card-number">{summary.total_pm}</p>
          </div>

          <div className="card">
            <h3>Upcoming</h3>
            <p className="card-number">{summary.upcoming_pm}</p>
          </div>

          <div className="card">
            <h3>Due Soon</h3>
            <p className="card-number">{summary.due_soon_pm}</p>
          </div>

          <div className="card">
            <h3>Overdue</h3>
            <p className="card-number danger-number">{summary.overdue_pm}</p>
          </div>
        </div>
      )}

      {canAssignTechnician() && (
        <div className="form-card">
          <h2>{editingId ? "Edit PM Schedule" : "Create PM Schedule"}</h2>

          <form onSubmit={handleSubmit} className="pm-form">
            <div>
              <label>Asset</label>
              <select
                name="asset_id"
                value={formData.asset_id}
                onChange={handleChange}
                required
              >
                <option value="">Select asset</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.asset_code} - {asset.asset_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Frequency</label>
              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label>PM Title</label>
              <input
                type="text"
                name="pm_title"
                value={formData.pm_title}
                onChange={handleChange}
                placeholder="Monthly compressor inspection"
                required
              />
            </div>

            <div>
              <label>Next Due Date</label>
              <input
                type="date"
                name="next_due_date"
                value={formData.next_due_date}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label>Assigned Technician</label>
              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
              >
                <option value="">Not assigned</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Due Soon">Due Soon</option>
                <option value="Overdue">Overdue</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="full-width">
              <label>Description</label>
              <textarea
                name="pm_description"
                value={formData.pm_description}
                onChange={handleChange}
                rows="3"
                placeholder="Describe PM checklist..."
              />
            </div>

            <div className="form-actions">
              <button type="submit">
                {editingId ? "Update PM" : "Create PM"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={resetForm}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="table-card">
        <h2>PM Schedule List</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Asset</th>
                <th>PM Title</th>
                <th>Frequency</th>
                <th>Next Due Date</th>
                <th>Last Completed</th>
                <th>Due Status</th>
                <th>Assigned To</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {pmSchedules.length === 0 ? (
                <tr>
                  <td colSpan="9">No PM schedules found</td>
                </tr>
              ) : (
                pmSchedules.map((pm) => {
                  const dueStatus = getPmStatus(pm.next_due_date);

                  return (
                    <tr key={pm.id}>
                      <td>{pm.id}</td>
                      <td>
                        {pm.asset_code} - {pm.asset_name}
                      </td>
                      <td>
                        <strong>{pm.pm_title}</strong>
                        <br />
                        <small>{pm.pm_description || "-"}</small>
                      </td>
                      <td>{pm.frequency}</td>
                      <td>{formatDate(pm.next_due_date)}</td>
                      <td>{formatDate(pm.last_completed_date)}</td>
                      <td>
                        {dueStatus === "Overdue" && (
                          <span className="badge-danger">Overdue</span>
                        )}
                        {dueStatus === "Due Soon" && (
                          <span className="badge-warning">Due Soon</span>
                        )}
                        {dueStatus === "Upcoming" && (
                          <span className="badge-success">Upcoming</span>
                        )}
                      </td>
                      <td>{pm.assigned_to_name || "-"}</td>
                      <td>
                        {canAssignTechnician() && (
                          <button
                            className="small-btn"
                            onClick={() => handleEdit(pm)}
                          >
                            Edit
                          </button>
                        )}

                        {canUpdateRequestStatus() && (
                          <button
                            className="small-btn secondary-btn"
                            onClick={() => handleComplete(pm.id)}
                          >
                            Complete
                          </button>
                        )}

                        {isAdmin() && (
                          <button
                            className="small-btn danger-btn"
                            onClick={() => handleDelete(pm.id)}
                          >
                            Delete
                          </button>
                        )}

                        {!canAssignTechnician() &&
                          !canUpdateRequestStatus() &&
                          !isAdmin() &&
                          "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PreventiveMaintenance;