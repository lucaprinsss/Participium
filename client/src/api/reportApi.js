import { calculateAddress } from '../utils/retriveAddressUtils'; 

/**
 * Handle API response and errors
 */
const handleResponse = async (response) => {
  if (response.status === 204) {
    return; // No Content, nothing to parse
  }
  if (!response.ok) {
    const error = new Error(` `);
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
 * Helper per costruire la query string
 */
const buildQueryString = (status, category) => {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (category) params.append("category", category);
  return params.toString() ? `?${params.toString()}` : "";
};

/**
 * Get all Reports
 */
export const getReports = async (status, category) => {
  const queryString = buildQueryString(status, category);
  const response = await fetch(`/api/reports${queryString}`, {
    method: "GET",
    credentials: "include",
  });
  // Assumo tu abbia una funzione handleResponse importata o definita
  return handleResponse(response);
};

/**
 * Get reports created by the current user
 */
export const getMyReports = async (status, category) => {
  const queryString = buildQueryString(status, category);
  const response = await fetch(`/api/reports/me${queryString}`, {
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
  const bodyData = { newStatus: status }; 
  
  if (reason) {
    if (status === 'Rejected') {
        bodyData.rejectionReason = reason;
    } else {
        bodyData.reason = reason; // Fallback for other states if necessary
    }
  }

  const response = await fetch(`/api/reports/${reportId}/status`, {
    method: "PUT",
    credentials: "include", // Important for session cookies
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyData),
  });

  // Assumo tu abbia una funzione helper handleResponse definita da qualche parte
  return handleResponse(response);
};

/**
 * Get all reports assigned to me (officer)
 */
export const getReportsAssignedToMe = async (status, category) => {
  const queryString = buildQueryString(status, category);
  const response = await fetch(`/api/reports/assigned/me${queryString}`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse(response);
};


/**
 * Get address from coordinates using the utility function
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<string>} The formatted address or coordinates fallback
 */
export const getAddressFromCoordinates = async (latitude, longitude) => {
    // Uses the logic defined in retriveAddressUtils
    // No need for handleResponse as calculateAddress handles try/catch internally
    return await calculateAddress(latitude, longitude);
};

/**
 * Get coordinates from address (forward geocoding)
 * @param {string} address - The address to search for
 * @returns {Promise<{lat: number, lng: number, display_name: string}>}
 */
export const getCoordinatesFromAddress = async (address) => {
  const response = await fetch(`/api/proxy/coordinates?address=${encodeURIComponent(address)}`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse(response);
};

/**
 * Get reports assigned to a specific external maintainer
 * @param {string} externalMaintainerId - ID of the external maintainer
 * @param {Object} externalUserData - Data for the external maintainer assignment
 */
export const assignedToExternalUser = async (externalMaintainerId, externalUserData) => {
  const response = await fetch(`/api/reports/assigned/external/${externalMaintainerId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(externalUserData),
  });

  return handleResponse(response);
};

/**
 * Assign a report to an external user
 * @param {string|number} reportId - ID of the report to assign
 * @param {string|number} externalUserId - ID of the external user to assign the report to
 * @returns {Promise<Object>} The updated report object
 */
export const assignToExternalUser = async (reportId, externalUserId) => {
  const response = await fetch(`/api/reports/${reportId}/assign-external/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    // CHANGE HERE: Map externalUserId to the key expected by the backend
    body: JSON.stringify({ externalAssigneeId: externalUserId }), 
  }); 

  return handleResponse(response);
};


export const getAllReportComments = async (reportId) => {
  const response = await fetch(`/api/reports/${reportId}/internal-comments`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse(response);
}

export const addReportComment = async (reportId, commentData) => {
  const response = await fetch(`/api/reports/${reportId}/internal-comments`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commentData),
  });
  return handleResponse(response);
}

export const deleteReportComment = async (reportId, commentId) => {
  const response = await fetch(`/api/reports/${reportId}/internal-comments/${commentId}`, {
    method: "DELETE",
    credentials: "include",
  });
  
  return handleResponse(response);
}

/**
 * Retrieve reports located near a specific address
 * @param {string} address - The human-readable address (e.g., "Via Roma 10, Torino")
 */
export const getReportsByAddress = async (address) => {
  
  // Encode the address for the URL
  const encodedAddress = encodeURIComponent(address);
  
  // CORREZIONE: Aggiunto '/search?address='
  const response = await fetch(`/api/reports/search?address=${encodedAddress}`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse(response);
};