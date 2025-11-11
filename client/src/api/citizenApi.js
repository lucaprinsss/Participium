const API_BASE_URL = 'http://localhost:3001';

// POST /api/users
export async function registerCitizen(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json().catch(() => null);
    return data; // expected: created user object
  } catch (error) {
    console.error('Error registering citizen:', error);
    throw error;
  }
}

export default { registerCitizen };
