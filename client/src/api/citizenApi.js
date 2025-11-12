// POST /api/users
export async function registerCitizen(payload) {
  try {
    const response = await fetch(`/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errMsg = errorData.error || `Internal server error: ${response.status}`;
      const err = new Error(errMsg);
      err.status = response.status;
      err.data = errorData;
      throw err;
    }

    const data = await response.json().catch(() => null);
    return data; // expected: created user object
  } catch (error) {
    console.error('Error registering citizen:', error);
    throw error;
  }
}

export default { registerCitizen };
