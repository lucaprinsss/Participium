/**
 * Handle API response and errors
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = new Error();
    try {
      const data = await response.json();
      error.message = data.message || data.error || `Request failed with status ${response.status}`;
      error.status = response.status;
      error.data = data;
    } catch {
      error.message = `Request failed with status ${response.status}`;
      error.status = response.status;
    }
    throw error;
  }
  return response.json();
};

/**
 * Get all Categories
 */
export const getAllCategories = async () => {
  const response = await fetch(`/api/reports/categories`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse(response);
};

/**
 * Create a new report
 */
export const createReport = async (reportData) => {
  const response = await fetch(`/api/reports`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reportData),
  });
  return handleResponse(response);
};

/**
 * Get all Reports
 */
export const getReports = async () => {
  const response = await fetch(`/api/reports`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse(response);
};

/**
 * Approve a report
 * @param {string|number} reportId - ID of the report to approve
 * @param {string} [category] - Optional new category if changing it
 */
export const approveReport = async (reportId, category = null) => {
  // Prepara il body solo se serve (es. cambio categoria)
  const bodyData = category ? { category } : {};

  const response = await fetch(`/api/reports/${reportId}/approve`, {
    method: "PUT", // <--- CORRETTO: Backend usa PUT
    credentials: "include", // <--- FONDAMENTALE: Invia il cookie di sessione
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyData), 
  });

  return handleResponse(response);
};

/**
 * Reject a report
 * @param {string|number} reportId - ID of the report to reject
 * @param {string} rejectionReason - Reason for rejection
 */
export const rejectReport = async (reportId, rejectionReason) => {
  const response = await fetch(`/api/reports/${reportId}/reject`, {
    method: "PUT", // <--- CORRETTO: Backend usa PUT
    credentials: "include", // <--- FONDAMENTALE: Invia il cookie di sessione
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rejectionReason }), // Passa la motivazione nel body
  });

  return handleResponse(response);
};

/**
 * Get all reports assigned to me (officer)
 */
export const getReportsAssignedToMe = async () => {
  const response = await fetch(`/api/reports/assigned/me`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse(response);
};