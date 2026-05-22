import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || user.role_name !== "Admin") {
    return <Navigate to="/requests" replace />;
  }

  return children;
}

export default AdminRoute;