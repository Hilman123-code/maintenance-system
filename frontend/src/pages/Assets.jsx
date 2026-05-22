import { useEffect, useState } from "react";
import { canManageAssets, canDeleteAssets } from "../utils/roles";
import api from "../api/api";

function Assets() {
  const [assets, setAssets] = useState([]);
  const [formData, setFormData] = useState({
    asset_code: "",
    asset_name: "",
    category: "",
    location: "",
    status: "Active",
  });

  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchAssets = async () => {
    try {
      const response = await api.get("/assets");
      setAssets(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load assets");
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setFormData({
      asset_code: "",
      asset_name: "",
      category: "",
      location: "",
      status: "Active",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      if (editingId) {
        await api.put(`/assets/${editingId}`, formData);
        setMessage("Asset updated successfully");
      } else {
        await api.post("/assets", formData);
        setMessage("Asset created successfully");
      }

      resetForm();
      fetchAssets();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save asset");
    }
  };

  const handleEdit = (asset) => {
    setEditingId(asset.id);
    setFormData({
      asset_code: asset.asset_code,
      asset_name: asset.asset_name,
      category: asset.category || "",
      location: asset.location || "",
      status: asset.status || "Active",
    });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this asset?");

    if (!confirmDelete) return;

    setMessage("");
    setError("");

    try {
      await api.delete(`/assets/${id}`);
      setMessage("Asset deleted successfully");
      fetchAssets();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete asset");
    }
  };

  return (
    <div className="page">
      <h1>Assets</h1>
      <p>Manage factory assets, machines, and equipment.</p>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {canManageAssets() && (
      <div className="form-card">
        <h2>{editingId ? "Edit Asset" : "Add New Asset"}</h2>

        <form onSubmit={handleSubmit} className="asset-form">
          <div>
            <label>Asset Code</label>
            <input
              type="text"
              name="asset_code"
              value={formData.asset_code}
              onChange={handleChange}
              placeholder="CMP-001"
            />
          </div>

          <div>
            <label>Asset Name</label>
            <input
              type="text"
              name="asset_name"
              value={formData.asset_name}
              onChange={handleChange}
              placeholder="Air Compressor 1"
            />
          </div>

          <div>
            <label>Category</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Compressor"
            />
          </div>

          <div>
            <label>Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Utility Room"
            />
          </div>

          <div>
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Inactive">Inactive</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="submit">
              {editingId ? "Update Asset" : "Add Asset"}
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
        <h2>Asset List</h2>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Asset Code</th>
              <th>Asset Name</th>
              <th>Category</th>
              <th>Location</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {assets.length === 0 ? (
              <tr>
                <td colSpan="7">No assets found</td>
              </tr>
            ) : (
              assets.map((asset) => (
                <tr key={asset.id}>
                  <td>{asset.id}</td>
                  <td>{asset.asset_code}</td>
                  <td>{asset.asset_name}</td>
                  <td>{asset.category}</td>
                  <td>{asset.location}</td>
                  <td>{asset.status}</td>
                  <td>
                    {canManageAssets() && (
                      <button className="small-btn" onClick={() => handleEdit(asset)}>
                        Edit
                      </button>
                    )}

                    {canDeleteAssets() && (
                      <button
                    className="small-btn danger-btn"
                    onClick={() => handleDelete(asset.id)}
                    >
                    Delete
                      </button>
                    )}

                    {!canManageAssets() && !canDeleteAssets() && "-"}
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

export default Assets;