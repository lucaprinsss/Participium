const API_BASE_URL = 'http://localhost:3001';

const BASE = `${API_BASE_URL}/api/sessions`;

async function handleResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => null);
  }

  if (!response.ok) {
    const errMsg = data && data.error ? data.error : `HTTP error! status: ${response.status}`;
    const err = new Error(errMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}


// POST /api/sessions
export async function login(credentials) {
  try {
    const response = await fetch(`${BASE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    return await handleResponse(response);
  } catch (error) {
    // rethrow so callers can handle
    throw error;
  }
}

// GET /api/sessions/current
export async function getCurrentUser() {
  try {
    const response = await fetch(`${BASE}/current`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error) {
    throw error;
  }
}

// DELETE /api/sessions/current
export async function logout() {
  try {
    const response = await fetch(`${BASE}/current`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error) {
    throw error;
  }
}

export default { login, getCurrentUser, logout };
