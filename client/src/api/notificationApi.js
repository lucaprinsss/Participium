class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnauthorizedError';
    this.status = 401;
  }
}

const handleResponse = async (response) => {
  if (!response.ok) {
    let parsedMessage;
    try {
      const data = await response.json();
      parsedMessage = data.message || data.error;
    } catch (e) {
      // ignore json parse error
    }

    const message = parsedMessage || `Request failed with status ${response.status}`;

    if (response.status === 401) {
      throw new UnauthorizedError(message);
    }

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return response.json();
};

export const getNotifications = async () => {
  const response = await fetch('/api/notifications', {
    method: 'GET',
    credentials: 'include',
  });
  return handleResponse(response);
};

export const markAsRead = async (notificationId) => {
  const response = await fetch(`/api/notifications/${notificationId}/read`, {
    method: 'PATCH',
    credentials: 'include',
  });
  return handleResponse(response);
};

export const markAllAsRead = async () => {
  const response = await fetch('/api/notifications/read-all', {
    method: 'PATCH',
    credentials: 'include',
  });
  return handleResponse(response);
};
