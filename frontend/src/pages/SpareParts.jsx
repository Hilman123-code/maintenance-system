import { useEffect, useState } from "react";
import api from "../api/api";
import {
  canCreateMaintenanceAction,
  canManageAssets,
  isAdmin,
} from "../utils/roles";

function SpareParts() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [spareParts, setSpareParts] = useState([]);
  const [usageHistory, setUsageHistory] = useState([]);
  const [requests, setRequests] = useState([]);

  const [partForm, setPartForm] = useState({
    part_code: "",
    part_name: "",
    category: "",
    stock_qty: 0,
    min_stock: 0,
    location: "",
  });

  const [usageForm, setUsageForm] = useState({
    request_id: "",
    spare_part_id: "",
    quantity_used: 1,
    used_by: user?.id || "",
    usage_note: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchSpareParts = async () => {
    try {
      const response = await api.get("/spare-parts");
      setSpareParts(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load spare parts");
    }
  };

  const fetchUsageHistory = async () => {
    try {
      const response = await api.get("/spare-parts/usage");
      setUsageHistory(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load usage history");
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
    fetchSpareParts();
    fetchUsageHistory();
    fetchRequests();
  }, []);

  const handlePartChange = (e) => {
    setPartForm({
      ...partForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleUsageChange = (e) => {
    setUsageForm({
      ...usageForm,
      [e.target.name]: e.target.value,
    });
  };

  const resetPartForm = () => {
    setPartForm({
      part_code: "",
      part_name: "",
      category: "",
      stock_qty: 0,
      min_stock: 0,
      location: "",
    });
    setEditingId(null);
  };

  const resetUsageForm = () => {
    setUsageForm({
      request_id: "",
      spare_part_id: "",
      quantity_used: 1,
      used_by: user?.id || "",
      usage_note: "",
    });
  };

  const handlePartSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    const payload = {
      ...partForm,
      stock_qty: Number(partForm.stock_qty),
      min_stock: Number(partForm.min_stock),
    };

    try {
      if (editingId) {
        await api.put(`/spare-parts/${editingId}`, payload);
        setMessage("Spare part updated successfully");
      } else {
        await api.post("/spare-parts", payload);
        setMessage("Spare part created successfully");
      }

      resetPartForm();
      fetchSpareParts();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save spare part");
    }
  };

  const handleEditPart = (part) => {
    setEditingId(part.id);
    setPartForm({
      part_code: part.part_code,
      part_name: part.part_name,
      category: part.category || "",
      stock_qty: part.stock_qty,
      min_stock: part.min_stock,
      location: part.location || "",
    });
  };

  const handleDeletePart = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this spare part?"
    );

    if (!confirmDelete) return;

    setMessage("");
    setError("");

    try {
      await api.delete(`/spare-parts/${id}`);
      setMessage("Spare part deleted successfully");
      fetchSpareParts();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete spare part");
    }
  };

  const handleUsageSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    const payload = {
      request_id: Number(usageForm.request_id),
      spare_part_id: Number(usageForm.spare_part_id),
      quantity_used: Number(usageForm.quantity_used),
      used_by: Number(usageForm.used_by),
      usage_note: usageForm.usage_note,
    };

    try {
      await api.post("/spare-parts/usage", payload);

      setMessage("Spare part usage recorded successfully");
      resetUsageForm();
      fetchSpareParts();
      fetchUsageHistory();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record usage");
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  };

  return (
    <div className="page">
      <h1>Spare Parts</h1>
      <p>Manage spare part stock and record usage during maintenance work.</p>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {canManageAssets() && (
        <div className="form-card">
          <h2>{editingId ? "Edit Spare Part" : "Add Spare Part"}</h2>

          <form onSubmit={handlePartSubmit} className="spare-part-form">
            <div>
              <label>Part Code</label>
              <input
                type="text"
                name="part_code"
                value={partForm.part_code}
                onChange={handlePartChange}
                placeholder="BRG-6204"
                required
              />
            </div>

            <div>
              <label>Part Name</label>
              <input
                type="text"
                name="part_name"
                value={partForm.part_name}
                onChange={handlePartChange}
                placeholder="Bearing 6204"
                required
              />
            </div>

            <div>
              <label>Category</label>
              <input
                type="text"
                name="category"
                value={partForm.category}
                onChange={handlePartChange}
                placeholder="Bearing"
              />
            </div>

            <div>
              <label>Stock Quantity</label>
              <input
                type="number"
                name="stock_qty"
                value={partForm.stock_qty}
                onChange={handlePartChange}
                min="0"
              />
            </div>

            <div>
              <label>Minimum Stock</label>
              <input
                type="number"
                name="min_stock"
                value={partForm.min_stock}
                onChange={handlePartChange}
                min="0"
              />
            </div>

            <div>
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={partForm.location}
                onChange={handlePartChange}
                placeholder="Store Rack A1"
              />
            </div>

            <div className="form-actions">
              <button type="submit">
                {editingId ? "Update Spare Part" : "Add Spare Part"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={resetPartForm}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {canCreateMaintenanceAction() && (
        <div className="form-card">
          <h2>Record Spare Part Usage</h2>

          <form onSubmit={handleUsageSubmit} className="spare-part-form">
            <div>
              <label>Maintenance Request</label>
              <select
                name="request_id"
                value={usageForm.request_id}
                onChange={handleUsageChange}
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
              <label>Spare Part</label>
              <select
                name="spare_part_id"
                value={usageForm.spare_part_id}
                onChange={handleUsageChange}
                required
              >
                <option value="">Select spare part</option>
                {spareParts.map((part) => (
                  <option key={part.id} value={part.id}>
                    {part.part_code} - {part.part_name} | Stock:{" "}
                    {part.stock_qty}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Quantity Used</label>
              <input
                type="number"
                name="quantity_used"
                value={usageForm.quantity_used}
                onChange={handleUsageChange}
                min="1"
                required
              />
            </div>

            <div>
              <label>Used By User ID</label>
              <input
                type="number"
                name="used_by"
                value={usageForm.used_by}
                onChange={handleUsageChange}
                required
              />
            </div>

            <div className="full-width">
              <label>Usage Note</label>
              <textarea
                name="usage_note"
                value={usageForm.usage_note}
                onChange={handleUsageChange}
                placeholder="Example: Used during compressor repair"
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit">Record Usage</button>
            </div>
          </form>
        </div>
      )}

      <div className="table-card">
        <h2>Spare Part Stock</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Part Code</th>
                <th>Part Name</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Min Stock</th>
                <th>Status</th>
                <th>Location</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {spareParts.length === 0 ? (
                <tr>
                  <td colSpan="9">No spare parts found</td>
                </tr>
              ) : (
                spareParts.map((part) => {
                  const isLowStock = part.stock_qty <= part.min_stock;

                  return (
                    <tr key={part.id}>
                      <td>{part.id}</td>
                      <td>{part.part_code}</td>
                      <td>{part.part_name}</td>
                      <td>{part.category}</td>
                      <td>{part.stock_qty}</td>
                      <td>{part.min_stock}</td>
                      <td>
                        {isLowStock ? (
                          <span className="badge-danger">Low Stock</span>
                        ) : (
                          <span className="badge-success">OK</span>
                        )}
                      </td>
                      <td>{part.location}</td>
                      <td>
                        {canManageAssets() && (
                          <button
                            className="small-btn"
                            onClick={() => handleEditPart(part)}
                          >
                            Edit
                          </button>
                        )}

                        {isAdmin() && (
                          <button
                            className="small-btn danger-btn"
                            onClick={() => handleDeletePart(part.id)}
                          >
                            Delete
                          </button>
                        )}

                        {!canManageAssets() && !isAdmin() && "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="table-card">
        <h2>Spare Part Usage History</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Request No</th>
                <th>Problem</th>
                <th>Part</th>
                <th>Quantity Used</th>
                <th>Used By</th>
                <th>Usage Note</th>
                <th>Used At</th>
              </tr>
            </thead>

            <tbody>
              {usageHistory.length === 0 ? (
                <tr>
                  <td colSpan="8">No usage history found</td>
                </tr>
              ) : (
                usageHistory.map((usage) => (
                  <tr key={usage.id}>
                    <td>{usage.id}</td>
                    <td>{usage.request_no}</td>
                    <td>{usage.problem_title}</td>
                    <td>
                      {usage.part_code} - {usage.part_name}
                    </td>
                    <td>{usage.quantity_used}</td>
                    <td>{usage.used_by_name || usage.used_by}</td>
                    <td>{usage.usage_note || "-"}</td>
                    <td>{formatDateTime(usage.used_at)}</td>
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

export default SpareParts;