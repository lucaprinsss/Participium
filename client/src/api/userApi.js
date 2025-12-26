import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance with credentials
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important:  Send cookies with requests
  headers:  {
    'Content-Type':  'application/json',
  },
});

/**
 * Update user profile
 * @param {Object} data - { personalPhoto, telegramUsername, emailNotificationsEnabled }
 * @returns {Promise} Updated user data
 */
export const updateUserProfile = async (data) => {
  try {
    const response = await apiClient.patch('/users/me', data);
    return response. data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

/**
 * Get current user profile
 * @returns {Promise} Current user data
 */
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/sessions/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

export default apiClient;