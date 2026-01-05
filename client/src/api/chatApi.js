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


export async function getMessages(reportId) {
    const response = await fetch(`/api/reports/${reportId}/messages`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });

    return await handleResponse(response);
}   

export async function sendMessage(reportId, message) {
    const response = await fetch(`/api/reports/${reportId}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(message),
    });

    return await handleResponse(response);
}

