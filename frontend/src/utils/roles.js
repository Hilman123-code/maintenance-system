export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.role_name === "Admin";
};

export const isSupervisor = () => {
  const user = getCurrentUser();
  return user?.role_name === "Supervisor";
};

export const isTechnician = () => {
  const user = getCurrentUser();
  return user?.role_name === "Technician";
};

export const isRequester = () => {
  const user = getCurrentUser();
  return user?.role_name === "Requester";
};

export const canManageAssets = () => {
  const user = getCurrentUser();
  return ["Admin", "Supervisor"].includes(user?.role_name);
};

export const canDeleteAssets = () => {
  const user = getCurrentUser();
  return user?.role_name === "Admin";
};

export const canAssignTechnician = () => {
  const user = getCurrentUser();
  return ["Admin", "Supervisor"].includes(user?.role_name);
};

export const canUpdateRequestStatus = () => {
  const user = getCurrentUser();
  return ["Admin", "Supervisor", "Technician"].includes(user?.role_name);
};

export const canCreateMaintenanceAction = () => {
  const user = getCurrentUser();
  return ["Admin", "Technician"].includes(user?.role_name);
};

export const canViewDashboard = () => {
  const user = getCurrentUser();
  return ["Admin", "Supervisor"].includes(user?.role_name);
};