/**
 * Handle API response and errors
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = new Error();
    try {
      const data = await response.json();
      error.message = data.error || `Request failed with status ${response.status}`;
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
 * Create a new municipality user
 * @param {Object} userData - User data (username, email, password, first_name, last_name, role_name, department_name )
 * @returns {Promise<Object>} Created user
 */
export const createMunicipalityUser = async (userData) => {
  const response = await fetch(`/api/municipality/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(userData),
  });

  return handleResponse(response);
};

/**
 * Get all municipality users
 * @returns {Promise<Array>} List of municipality users
 */
export const getAllMunicipalityUsers = async () => {
  const response = await fetch(`/api/municipality/users`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse(response);
};

/**
 * Get municipality user by ID
 * @param {number} id - User ID
 * @returns {Promise<Object>} User details
 */
export const getMunicipalityUserById = async (id) => {
  const response = await fetch(`/api/municipality/users/${id}`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse(response);
};

/**
 * Update municipality user
 * @param {number} id - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object>} Updated user
 */
export const updateMunicipalityUser = async (id, userData) => {
  const response = await fetch(`/api/municipality/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(userData),
  });

  return handleResponse(response);
};

/**
 * Delete municipality user
 * @param {number} id - User ID
 * @returns {Promise<void>}
 */
export const deleteMunicipalityUser = async (id) => {
  console.log(`Calling DELETE /api/municipality/users/${id}`);
  const response = await fetch(`/api/municipality/users/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  console.log("Delete response status:", response.status);
  
  // Handle 204 No Content response
  if (response.status === 204) {
    return;
  }

  return handleResponse(response);
};

/**
 * Assign role to municipality user
 * @param {number} id - User ID
 * @param {number} roleId - Role ID
 * @returns {Promise<Object>} Updated user
 */
export const assignRole = async (id, roleId) => {
  const response = await fetch(`/api/municipality/users/${id}/role`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ role_id: roleId }),
  });

  return handleResponse(response);
};

/**
 * Get all available roles
 * @returns {Promise<Array>} List of roles
 */
export const getAllRoles = async () => {
  const response = await fetch(`/api/roles`, {
    method: "GET",
    credentials: "include",
  });


  return handleResponse(response);
};

/**
 * 
 * @returns {Promise<Array>} List of external maintainers
 */
export const getAllExternals = async (categoryId) => {
  const response = await fetch(`/api/users/external-maintainers?categoryId=${categoryId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },  
    credentials: "include",
  });

  return handleResponse(response);
};