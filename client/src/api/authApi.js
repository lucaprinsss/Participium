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
    const errMsg = data && data.error ? data.error : `Internal server error: ${response.status}`;
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

    const response = await fetch(`${BASE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    return await handleResponse(response);
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

    if (response.status === 401) {
      return null;
    }

    return await handleResponse(response);
  } catch (error) {
    if (error.status === 401) {
      return null;
    }
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
    
    // --- AGGIUNTA: Pulizia indizio ---
    localStorage.removeItem("isLoggedIn"); 

    return await handleResponse(response);
  } catch (error) {
    // Anche se la chiamata fallisce, rimuoviamo l'indizio per sicurezza lato client
    localStorage.removeItem("isLoggedIn");
    throw error;
  }
}

// POST /api/users/telegram-link-code
export async function generateTelegramLinkCode() {
  const response = await fetch(`/api/users/telegram-link-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  return await handleResponse(response);
}

// GET /api/users/telegram-status
export async function getTelegramStatus() {
  const response = await fetch(`/api/users/telegram-status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  return await handleResponse(response);
}

// DELETE /api/users/telegram-unlink
export async function unlinkTelegramAccount() {
  const response = await fetch(`/api/users/telegram-unlink`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  return await handleResponse(response);
}

export default { login, getCurrentUser, logout, generateTelegramLinkCode, getTelegramStatus, unlinkTelegramAccount };
