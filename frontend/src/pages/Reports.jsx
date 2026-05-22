import { useEffect, useMemo, useState } from "react";
import api from "../api/api";

function Reports() {
  const [requests, setRequests] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    startDate: "",
    endDate: "",
  });

  const [error, setError] = useState("");

  const fetchRequests = async () => {
    try {
      const response = await api.get("/requests");
      setRequests(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load report data");
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const calculateDowntimeMinutes = (breakdownStart, repairEnd) => {
    if (!breakdownStart || !repairEnd) return "-";

    const start = new Date(breakdownStart);
    const end = new Date(repairEnd);

    const diffMs = end - start;

    if (diffMs < 0) return "-";

    return Math.round(diffMs / 1000 / 60);
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const searchText = filters.search.toLowerCase();

      const combinedText = `
        ${request.request_no || ""}
        ${request.asset_code || ""}
        ${request.asset_name || ""}
        ${request.problem_title || ""}
        ${request.requested_by_name || ""}
        ${request.assigned_to_name || ""}
      `.toLowerCase();

      const matchesSearch = combinedText.includes(searchText);

      const matchesStatus =
        filters.status === "" || request.status === filters.status;

      const matchesPriority =
        filters.priority === "" || request.priority === filters.priority;

      let matchesDate = true;

      if (filters.startDate || filters.endDate) {
        if (!request.breakdown_start) {
          matchesDate = false;
        } else {
          const breakdownDate = new Date(request.breakdown_start);

          if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            matchesDate = matchesDate && breakdownDate >= startDate;
          }

          if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            matchesDate = matchesDate && breakdownDate <= endDate;
          }
        }
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesDate;
    });
  }, [requests, filters]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      status: "",
      priority: "",
      startDate: "",
      endDate: "",
    });
  };

  const exportToCSV = () => {
    if (filteredRequests.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = [
      "Request No",
      "Asset",
      "Problem",
      "Priority",
      "Status",
      "Requested By",
      "Assigned To",
      "Breakdown Start",
      "Repair Start",
      "Repair End",
      "Downtime Minutes",
    ];

    const rows = filteredRequests.map((request) => [
      request.request_no || "-",
      `${request.asset_code || "-"} - ${request.asset_name || "-"}`,
      request.problem_title || "-",
      request.priority || "-",
      request.status || "-",
      request.requested_by_name || "-",
      request.assigned_to_name || "-",
      formatDateTime(request.breakdown_start),
      formatDateTime(request.repair_start),
      formatDateTime(request.repair_end),
      calculateDowntimeMinutes(request.breakdown_start, request.repair_end),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", "maintenance_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <h1>Maintenance Reports</h1>
      <p>View maintenance request history and downtime summary.</p>

      {error && <div className="error-message">{error}</div>}

      <div className="form-card">
        <h2>Report Filters</h2>

        <div className="report-filter">
          <div>
            <label>Search</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search request no, asset, problem..."
            />
          </div>

          <div>
            <label>Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Status</option>
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
            <label>Priority</label>
            <select
              name="priority"
              value={filters.priority}
              onChange={handleFilterChange}
            >
              <option value="">All Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>

          <div>
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-actions">
            <button type="button" onClick={exportToCSV}>
              Export CSV
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={resetFilters}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="report-summary-grid">
        <div className="card">
          <h3>Total Records</h3>
          <p className="card-number">{filteredRequests.length}</p>
        </div>

        <div className="card">
          <h3>Completed</h3>
          <p className="card-number">
            {filteredRequests.filter((r) => r.status === "Completed").length}
          </p>
        </div>

        <div className="card">
          <h3>Open</h3>
          <p className="card-number">
            {filteredRequests.filter((r) => r.status === "Open").length}
          </p>
        </div>

        <div className="card">
          <h3>Critical</h3>
          <p className="card-number">
            {filteredRequests.filter((r) => r.priority === "Critical").length}
          </p>
        </div>
      </div>

      <div className="table-card">
        <h2>Maintenance Report Table</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Request No</th>
                <th>Asset</th>
                <th>Problem</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Requested By</th>
                <th>Assigned To</th>
                <th>Breakdown Start</th>
                <th>Repair Start</th>
                <th>Repair End</th>
                <th>Downtime</th>
              </tr>
            </thead>

            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="11">No report data found</td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.request_no}</td>
                    <td>
                      {request.asset_code} - {request.asset_name}
                    </td>
                    <td>{request.problem_title}</td>
                    <td>{request.priority}</td>
                    <td>{request.status}</td>
                    <td>{request.requested_by_name || "-"}</td>
                    <td>{request.assigned_to_name || "-"}</td>
                    <td>{formatDateTime(request.breakdown_start)}</td>
                    <td>{formatDateTime(request.repair_start)}</td>
                    <td>{formatDateTime(request.repair_end)}</td>
                    <td>
                      {calculateDowntimeMinutes(
                        request.breakdown_start,
                        request.repair_end
                      )}{" "}
                      min
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

export default Reports;