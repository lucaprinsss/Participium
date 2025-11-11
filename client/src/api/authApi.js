const BASE = `/api/sessions`;

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
export async function login(arg1, arg2) {
  // support login({ username, password }) or login(username, password)
  const payload = (typeof arg1 === 'object' && arg1 !== null)
    ? arg1
    : { username: arg1, password: arg2 };

  try {
    const response = await fetch(`${BASE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    return await handleResponse(response);
  } catch (error) {
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
      credentials: 'include',
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
      credentials: 'include',
    });

    return await handleResponse(response);
  } catch (error) {
    throw error;
  }
}

export default { login, getCurrentUser, logout };
