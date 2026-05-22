import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import api from "../api/api";

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [summary, setSummary] = useState(null);
  const [sparePartSummary, setSparePartSummary] = useState(null);

  const [statusData, setStatusData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [topAssets, setTopAssets] = useState([]);
  const [technicianWorkload, setTechnicianWorkload] = useState([]);
  const [mostUsedSpareParts, setMostUsedSpareParts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const COLORS = [
    "#2563eb",
    "#16a34a",
    "#f59e0b",
    "#dc2626",
    "#7c3aed",
    "#0891b2",
  ];

  const fetchDashboardData = async () => {
    try {
      const [
        summaryRes,
        statusRes,
        priorityRes,
        topAssetsRes,
        technicianRes,
        sparePartSummaryRes,
        mostUsedSparePartsRes,
      ] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/dashboard/requests-by-status"),
        api.get("/dashboard/requests-by-priority"),
        api.get("/dashboard/top-problem-assets"),
        api.get("/dashboard/technician-workload"),
        api.get("/dashboard/spare-part-summary"),
        api.get("/dashboard/most-used-spare-parts"),
      ]);

      setSummary(summaryRes.data);
      setStatusData(statusRes.data);
      setPriorityData(priorityRes.data);
      setTopAssets(topAssetsRes.data);
      setTechnicianWorkload(technicianRes.data);
      setSparePartSummary(sparePartSummaryRes.data);
      setMostUsedSpareParts(mostUsedSparePartsRes.data);
    } catch (err) {
      console.log(err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <h2 className="page">Loading dashboard...</h2>;
  }

  if (error) {
    return <h2 className="error-text">{error}</h2>;
  }

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <p>Welcome, {user?.full_name}</p>

      <div className="card-grid">
        <div className="card">
          <h3>Total Requests</h3>
          <p className="card-number">{summary.total_requests}</p>
        </div>

        <div className="card">
          <h3>Open Requests</h3>
          <p className="card-number">{summary.open_requests}</p>
        </div>

        <div className="card">
          <h3>Completed Requests</h3>
          <p className="card-number">{summary.completed_requests}</p>
        </div>

        <div className="card">
          <h3>Total Assets</h3>
          <p className="card-number">{summary.total_assets}</p>
        </div>

        <div className="card">
          <h3>Critical Requests</h3>
          <p className="card-number">{summary.critical_requests}</p>
        </div>

        <div className="card">
          <h3>Total Downtime</h3>
          <p className="card-number">{summary.total_downtime_minutes} min</p>
        </div>

        <div className="card">
          <h3>Average Repair Time</h3>
          <p className="card-number">{summary.average_repair_minutes} min</p>
        </div>

        <div className="card">
          <h3>In Progress</h3>
          <p className="card-number">{summary.in_progress_requests}</p>
        </div>
      </div>

      <h2 className="section-title">Spare Parts Summary</h2>

      <div className="card-grid">
        <div className="card">
          <h3>Total Spare Parts</h3>
          <p className="card-number">{sparePartSummary.total_spare_parts}</p>
        </div>

        <div className="card">
          <h3>Low Stock Parts</h3>
          <p className="card-number danger-number">
            {sparePartSummary.low_stock_parts}
          </p>
        </div>

        <div className="card">
          <h3>Total Usage Records</h3>
          <p className="card-number">{sparePartSummary.total_usage_records}</p>
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h2>Requests by Status</h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Requests by Priority</h2>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={priorityData}
                dataKey="total"
                nameKey="priority"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {priorityData.map((entry, index) => (
                  <Cell
                    key={entry.priority}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Top Problem Assets</h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topAssets}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="asset_code" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total_requests" fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Technician Workload</h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={technicianWorkload}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="technician_name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="assigned_requests" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Most Used Spare Parts</h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mostUsedSpareParts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="part_code" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total_used" fill="#7c3aed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;