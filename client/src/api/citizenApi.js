/**
 * Handle API response and errors
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = new Error(` `);
    try {
      const data = await response.json();

      // Aggiorna il messaggio con il dettaglio API
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
      const errMsg = errorData.error || `! status: ${response.status}`;
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

export async function verifyEmailCode(email, otpCode) {
  try {
    const response = await fetch(`/api/sessions/verifyEmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otpCode }),
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
}

export async function resendVerificationCode(email) {
  try {
    const response = await fetch(`/api/sessions/resend-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error resending OTP:', error);
    throw error;
  }
}

export async function findUserByUsername(username) {
  try {
    const response = await fetch(`/api/users/username/${encodeURIComponent(username)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error finding user by username:', error);
    throw error;
  }
}