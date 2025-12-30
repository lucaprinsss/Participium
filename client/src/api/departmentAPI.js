/**
 * Handle API response and errors
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = new Error(` `);
    try {
      const data = await response.json();
      // FIX: Lo Swagger restituisce errori nel formato { message: "..." },
      // so we give priority to data.message over data.error
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
 * Get all available roles in a specific Municipality Department
 * @param {number} departmentId - Department ID
 */
export const getRolesByDepartment = async (departmentId) => {
  const response = await fetch(`/api/departments/${departmentId}/roles`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse(response);
};


/**
 * Get all Municipality Departments
 * @returns {Promise<Array>} List of departments
 */
export const getAllDepartments = async () => {
  const response = await fetch(`/api/departments`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse(response);
};

/**
 * Get all Department-Role mappings
 * @returns {Promise<Array>} List of { id, department, role }
 */
export const getAllDepartmentRolesMapping = async () => {
  const response = await fetch(`/api/departments/roles/mapping`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse(response);
};