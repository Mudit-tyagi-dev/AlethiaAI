const BASE_URL = 'https://factify-backend-tcup.onrender.com';

export const checkHealth = async () => {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error('Network response was not ok');
    return await res.json();
  } catch (error) {
    throw error;
  }
};

export const fetchReport = async (reportId, apiKey) => {
  const headers = {};
  if (apiKey) headers['x-api-key'] = apiKey;

  const res = await fetch(`${BASE_URL}/reports/${reportId}`, {
    method: 'GET',
    headers
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch report');
  }
  return res.json();
};

export const destroyReport = async (reportId, apiKey) => {
  const headers = {};
  if (apiKey) headers['x-api-key'] = apiKey;

  const res = await fetch(`${BASE_URL}/reports/${reportId}`, {
    method: 'DELETE',
    headers
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to delete report');
  }
  return res.json();
};

export const detectText = async (text, apiKey) => {
  const res = await fetch(`${BASE_URL}/detect/text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify({ text, api_key: apiKey })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to analyze text');
  }
  return res.json();
};

export const detectImage = async (file, apiKey) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);

  const res = await fetch(`${BASE_URL}/detect/image`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey
    },
    body: formData
  });
  if (!res.ok) {
    if (res.status === 422) throw new Error('Invalid file format');
    if (res.status >= 500) throw new Error('Server error, try again');
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to analyze image');
  }
  return res.json();
};

export const detectPdf = async (file, apiKey) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);

  const res = await fetch(`${BASE_URL}/detect/pdf`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey
    },
    body: formData
  });
  if (!res.ok) {
    if (res.status === 422) throw new Error('Invalid file format');
    if (res.status >= 500) throw new Error('Server error, try again');
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to analyze pdf');
  }
  return res.json();
};
