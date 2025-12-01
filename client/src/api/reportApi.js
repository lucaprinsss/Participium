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
 * Update the status of a report
 * @param {string|number} reportId - ID of the report to update
 * @param {string} status - The new status of the report
 * @param {string} [reason] - The reason for rejection (if applicable)
 */
export const updateReportStatus = async (reportId, status, reason = null) => {
  const bodyData = { status };
  if (reason) {
    bodyData.reason = reason;
  }

  const response = await fetch(`/api/reports/${reportId}/status`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyData),
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