const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Check if backend is available
const isBackendAvailable = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
};

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new ApiError(errorData.detail || 'Request failed', response.status);
  }
  
  // Handle 204 No Content responses
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
};

export const sequenceApi = {
  // Check if backend is available
  isBackendAvailable,

  // Get all sequences (summary view)
  async getAllSequences() {
    if (!(await isBackendAvailable())) {
      throw new ApiError('Backend service is not available', 503);
    }
    const response = await fetch(`${API_BASE_URL}/api/sequences`);
    return handleResponse(response);
  },

  // Get specific sequence by ID
  async getSequence(id) {
    const response = await fetch(`${API_BASE_URL}/api/sequences/${id}`);
    return handleResponse(response);
  },

  // Create new sequence
  async createSequence(sequenceData) {
    const response = await fetch(`${API_BASE_URL}/api/sequences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sequenceData),
    });
    return handleResponse(response);
  },

  // Update existing sequence
  async updateSequence(id, updateData) {
    const response = await fetch(`${API_BASE_URL}/api/sequences/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    return handleResponse(response);
  },

  // Delete sequence
  async deleteSequence(id) {
    const response = await fetch(`${API_BASE_URL}/api/sequences/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

export { ApiError };