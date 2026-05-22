import { useEffect, useState } from "react";
import { canCreateMaintenanceAction, isAdmin } from "../utils/roles";
import api from "../api/api";

function Actions() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [actions, setActions] = useState([]);
  const [requests, setRequests] = useState([]);

  const [formData, setFormData] = useState({
    request_id: "",
    technician_id: user?.id || "",
    problem_found: "",
    action_taken: "",
    result_status: "Completed",
  });

  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchActions = async () => {
    try {
      const response = await api.get("/actions");
      setActions(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load actions");
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await api.get("/requests");
      setRequests(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load requests");
    }
  };

  useEffect(() => {
    fetchActions();
    fetchRequests();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setFormData({
      request_id: "",
      technician_id: user?.id || "",
      problem_found: "",
      action_taken: "",
      result_status: "Completed",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      const payload = {
        ...formData,
        request_id: Number(formData.request_id),
        technician_id: Number(formData.technician_id),
      };

      if (editingId) {
        await api.put(`/actions/${editingId}`, payload);
        setMessage("Maintenance action updated successfully");
      } else {
        await api.post("/actions", payload);
        setMessage("Maintenance action created successfully");
      }

      resetForm();
      fetchActions();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save action");
    }
  };

  const handleEdit = (action) => {
    setEditingId(action.id);
    setFormData({
      request_id: action.request_id,
      technician_id: action.technician_id,
      problem_found: action.problem_found || "",
      action_taken: action.action_taken || "",
      result_status: action.result_status || "Completed",
    });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this maintenance action?"
    );

    if (!confirmDelete) return;

    setMessage("");
    setError("");

    try {
      await api.delete(`/actions/${id}`);
      setMessage("Maintenance action deleted successfully");
      fetchActions();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete action");
    }
  };

  return (
    <div className="page">
      <h1>Maintenance Actions</h1>
      <p>Record technician findings, repair actions, and repair results.</p>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {canCreateMaintenanceAction() && (
      <div className="form-card">
        <h2>{editingId ? "Edit Maintenance Action" : "Create Maintenance Action"}</h2>

        <form onSubmit={handleSubmit} className="action-form">
          <div>
            <label>Maintenance Request</label>
            <select
              name="request_id"
              value={formData.request_id}
              onChange={handleChange}
              required
            >
              <option value="">Select request</option>
              {requests.map((request) => (
                <option key={request.id} value={request.id}>
                  {request.request_no} - {request.problem_title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Technician ID</label>
            <input
              type="number"
              name="technician_id"
              value={formData.technician_id}
              onChange={handleChange}
              placeholder="Example: 4"
              required
            />
          </div>

          <div className="full-width">
            <label>Problem Found</label>
            <textarea
              name="problem_found"
              value={formData.problem_found}
              onChange={handleChange}
              placeholder="Example: Bearing worn out due to lack of lubrication"
              rows="3"
            />
          </div>

          <div className="full-width">
            <label>Action Taken</label>
            <textarea
              name="action_taken"
              value={formData.action_taken}
              onChange={handleChange}
              placeholder="Example: Replaced bearing and applied lubrication"
              rows="3"
              required
            />
          </div>

          <div>
            <label>Result Status</label>
            <select
              name="result_status"
              value={formData.result_status}
              onChange={handleChange}
            >
              <option value="Completed">Completed</option>
              <option value="Completed and verified">Completed and verified</option>
              <option value="Temporary repair">Temporary repair</option>
              <option value="Need spare part">Need spare part</option>
              <option value="Need follow-up">Need follow-up</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="submit">
              {editingId ? "Update Action" : "Create Action"}
            </button>

            {editingId && (
              <button type="button" className="secondary-btn" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>
      )}

      <div className="table-card">
        <h2>Maintenance Action List</h2>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Request No</th>
              <th>Problem Title</th>
              <th>Technician</th>
              <th>Problem Found</th>
              <th>Action Taken</th>
              <th>Result</th>
              <th>Action Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {actions.length === 0 ? (
              <tr>
                <td colSpan="9">No maintenance actions found</td>
              </tr>
            ) : (
              actions.map((action) => (
                <tr key={action.id}>
                  <td>{action.id}</td>
                  <td>{action.request_no}</td>
                  <td>{action.problem_title}</td>
                  <td>{action.technician_name || action.technician_id}</td>
                  <td>{action.problem_found}</td>
                  <td>{action.action_taken}</td>
                  <td>{action.result_status}</td>
                  <td>
                    {action.action_date
                      ? new Date(action.action_date).toLocaleString()
                      : "-"}
                  </td>
                  <td>
                    {canCreateMaintenanceAction() && (
                    <button className="small-btn" onClick={() => handleEdit(action)}>
                      Edit
                    </button>
                    )}
                    {isAdmin() && (
                    <button
                      className="small-btn danger-btn"
                      onClick={() => handleDelete(action.id)}
                    >
                      Delete
                    </button>
                    )}
                    {!canCreateMaintenanceAction() && !isAdmin() && "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Actions;