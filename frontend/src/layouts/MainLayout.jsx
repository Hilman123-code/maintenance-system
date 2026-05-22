import { Link, Outlet, useNavigate } from "react-router-dom";
import { canViewDashboard, isAdmin } from "../utils/roles";

function MainLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2>Maintenance</h2>

        <nav>
          {canViewDashboard() && <Link to="/dashboard">Dashboard</Link>}

          <Link to="/assets">Assets</Link>
          <Link to="/requests">Requests</Link>
          <Link to="/actions">Actions</Link>
          <Link to="/reports">Reports</Link>
          <Link to="/spare-parts">Spare Parts</Link>

          {isAdmin() && <Link to="/users">Users</Link>}
        </nav>

        <div className="sidebar-user">
          <p>{user?.full_name}</p>
          <small>{user?.role_name}</small>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;