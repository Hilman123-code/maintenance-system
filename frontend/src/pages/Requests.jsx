import { useEffect, useState } from "react";
import api from "../api/api";
import {
  canAssignTechnician,
  canUpdateRequestStatus,
} from "../utils/roles";

function Requests() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const [statusLogs, setStatusLogs] = useState([]);
  const [selectedLogRequest, setSelectedLogRequest] = useState(null);

  const [formData, setFormData] = useState({
    asset_id: "",
    problem_title: "",
    problem_description: "",
    priority: "Medium",
    breakdown_start: "",
  });

  const [statusData, setStatusData] = useState({
    status: "In Progress",
    repair_start: "",
    repair_end: "",
  });

  const [assignData, setAssignData] = useState({
    request_id: null,
    technician_id: "",
  });

  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchRequests = async () => {
    try {
      const response = await api.get("/requests");
      setRequests(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load requests");
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
      setError(err.response?.data?.message || "Failed to load technicians");
    }
  };

  const fetchStatusLogs = async (request) => {
    setMessage("");
    setError("");

    try {
      const response = await api.get(`/requests/${request.id}/logs`);
      setStatusLogs(response.data);
      setSelectedLogRequest(request);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load status logs");
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchAssets();
    fetchTechnicians();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleStatusChange = (e) => {
    setStatusData({
      ...statusData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setFormData({
      asset_id: "",
      problem_title: "",
      problem_description: "",
      priority: "Medium",
      breakdown_start: "",
    });
  };

  const resetStatusForm = () => {
    setStatusData({
      status: "In Progress",
      repair_start: "",
      repair_end: "",
    });
    setSelectedRequestId(null);
  };

  const resetAssignForm = () => {
    setAssignData({
      request_id: null,
      technician_id: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      await api.post("/requests", {
        ...formData,
        asset_id: Number(formData.asset_id),
        requested_by: user?.id,
        breakdown_start: formData.breakdown_start || null,
      });

      setMessage("Maintenance request created successfully");
      resetForm();
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create request");
    }
  };

  const openAssignForm = (request) => {
    setAssignData({
      request_id: request.id,
      technician_id: "",
    });
  };

  const handleAssignTechnician = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      await api.put(`/requests/${assignData.request_id}/assign`, {
        assigned_to: Number(assignData.technician_id),
        updated_by: user?.id,
        note: "Technician assigned from frontend",
      });

      setMessage("Technician assigned successfully");
      resetAssignForm();
      fetchRequests();

      if (selectedLogRequest?.id === assignData.request_id) {
        fetchStatusLogs(selectedLogRequest);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign technician");
    }
  };

  const openStatusForm = (request) => {
    setSelectedRequestId(request.id);
    setStatusData({
      status: request.status || "In Progress",
      repair_start: request.repair_start
        ? request.repair_start.slice(0, 16)
        : "",
      repair_end: request.repair_end ? request.repair_end.slice(0, 16) : "",
    });
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      await api.put(`/requests/${selectedRequestId}/status`, {
        status: statusData.status,
        repair_start: statusData.repair_start || null,
        repair_end: statusData.repair_end || null,
        updated_by: user?.id,
        note: `Status updated to ${statusData.status}`,
      });

      setMessage("Request status updated successfully");
      resetStatusForm();
      fetchRequests();

      if (selectedLogRequest?.id === selectedRequestId) {
        fetchStatusLogs(selectedLogRequest);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  return (
    <div className="page">
      <h1>Maintenance Requests</h1>
      <p>Create, assign, update, and track equipment maintenance requests.</p>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="form-card">
        <h2>Create Maintenance Request</h2>

        <form onSubmit={handleSubmit} className="request-form">
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
            <label>Priority</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label>Problem Title</label>
            <input
              type="text"
              name="problem_title"
              value={formData.problem_title}
              onChange={handleChange}
              placeholder="Example: Pump not running"
              required
            />
          </div>

          <div>
            <label>Breakdown Start</label>
            <input
              type="datetime-local"
              name="breakdown_start"
              value={formData.breakdown_start}
              onChange={handleChange}
            />
          </div>

          <div className="full-width">
            <label>Problem Description</label>
            <textarea
              name="problem_description"
              value={formData.problem_description}
              onChange={handleChange}
              placeholder="Describe the issue..."
              rows="4"
            />
          </div>

          <div className="form-actions">
            <button type="submit">Create Request</button>
          </div>
        </form>
      </div>

      {assignData.request_id && (
        <div className="form-card">
          <h2>Assign Technician</h2>

          <form onSubmit={handleAssignTechnician} className="request-form">
            <div>
              <label>Technician</label>
              <select
                value={assignData.technician_id}
                onChange={(e) =>
                  setAssignData({
                    ...assignData,
                    technician_id: e.target.value,
                  })
                }
                required
              >
                <option value="">Select technician</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="submit">Assign Technician</button>
              <button
                type="button"
                className="secondary-btn"
                onClick={resetAssignForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedRequestId && (
        <div className="form-card">
          <h2>Update Request Status</h2>

          <form onSubmit={handleUpdateStatus} className="request-form">
            <div>
              <label>Status</label>
              <select
                name="status"
                value={statusData.status}
                onChange={handleStatusChange}
              >
                <option value="Open">Open</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting Spare Part">Waiting Spare Part</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label>Repair Start</label>
              <input
                type="datetime-local"
                name="repair_start"
                value={statusData.repair_start}
                onChange={handleStatusChange}
              />
            </div>

            <div>
              <label>Repair End</label>
              <input
                type="datetime-local"
                name="repair_end"
                value={statusData.repair_end}
                onChange={handleStatusChange}
              />
            </div>

            <div className="form-actions">
              <button type="submit">Update Status</button>
              <button
                type="button"
                className="secondary-btn"
                onClick={resetStatusForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedLogRequest && (
        <div className="form-card">
          <h2>Status Timeline</h2>
          <p>
            Request: <strong>{selectedLogRequest.request_no}</strong> -{" "}
            {selectedLogRequest.problem_title}
          </p>

          {statusLogs.length === 0 ? (
            <p>No status logs found for this request.</p>
          ) : (
            <div className="timeline">
              {statusLogs.map((log) => (
                <div className="timeline-item" key={log.id}>
                  <div className="timeline-dot"></div>

                  <div className="timeline-content">
                    <h3>{log.status}</h3>
                    <p>{log.note || "-"}</p>
                    <small>
                      Updated by: {log.updated_by_name || "-"} |{" "}
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString()
                        : "-"}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="secondary-btn"
            onClick={() => {
              setSelectedLogRequest(null);
              setStatusLogs([]);
            }}
          >
            Close Timeline
          </button>
        </div>
      )}

      <div className="table-card">
        <h2>Request List</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Request No</th>
                <th>Asset</th>
                <th>Problem</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Requested By</th>
                <th>Assigned To</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="9">No maintenance requests found</td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.id}</td>
                    <td>{request.request_no}</td>
                    <td>
                      {request.asset_code} - {request.asset_name}
                    </td>
                    <td>{request.problem_title}</td>
                    <td>{request.priority}</td>
                    <td>{request.status}</td>
                    <td>{request.requested_by_name || "-"}</td>
                    <td>{request.assigned_to_name || "-"}</td>
                    <td>
                      {canAssignTechnician() && (
                        <button
                          className="small-btn"
                          onClick={() => openAssignForm(request)}
                        >
                          Assign
                        </button>
                      )}

                      {canUpdateRequestStatus() && (
                        <button
                          className="small-btn secondary-btn"
                          onClick={() => openStatusForm(request)}
                        >
                          Status
                        </button>
                      )}

                      <button
                        className="small-btn"
                        onClick={() => fetchStatusLogs(request)}
                      >
                        Logs
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Requests;