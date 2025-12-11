/**
 * Handle API response and errors
 */
const handleResponse = async (response) => {
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
 * Get all Companies
 * @returns {Promise<Array>} List of companies
 */
export const getAllCompanies = async () => {
  const response = await fetch(`/api/companies`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse(response);
};

/**
 * Create a new Company
 * @param {Object} companyData - Company data (name, category)
 * @returns {Promise<Object>} Created company
 */
export const createCompany = async (companyData) => {
    const response = await fetch(`/api/companies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(companyData),
      });

    return handleResponse(response);
};