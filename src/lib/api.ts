// src/utils/api.ts
// const baseURL: string = process.env.NEXT_PUBLIC_API_URL || "https://ollanbackend-jr1d3g.fly.dev";
const baseURL: string = process.env.NEXT_PUBLIC_API_URL || "https://ollanbackend.vercel.app";
// const baseURL: string = process.env.NEXT_PUBLIC_API_URL || "https://ollanbackend-jr1d3g.fly.dev/";

interface ApiError {
  message?: string;
}

// Helper function to handle responses
const handleResponse = async (response: Response): Promise<any> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Network error" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Helper function for JSON headers
const getHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

// Helper function for FormData headers (no Content-Type)
const getFormDataHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const api = {
  get: async (url: string): Promise<{ data: any }> => {
    const response = await fetch(`${baseURL}${url}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return { data: await handleResponse(response) };
  },

  post: async (url: string, data?: any): Promise<{ data: any }> => {
    const response = await fetch(`${baseURL}${url}`, {
      method: "POST",
      headers: getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return { data: await handleResponse(response) };
  },

  postFormData: async (url: string, data: FormData): Promise<{ data: any }> => {
    console.log("Sending FormData to:", `${baseURL}${url}`);
    for (const [key, value] of data.entries()) {
      console.log(`FormData entry: ${key}=`, value instanceof File ? value.name : value);
    }
    const response = await fetch(`${baseURL}${url}`, {
      method: "POST",
      headers: getFormDataHeaders(),
      body: data,
    });
    return { data: await handleResponse(response) };
  },

  put: async (url: string, data?: any): Promise<{ data: any }> => {
    const response = await fetch(`${baseURL}${url}`, {
      method: "PUT",
      headers: getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return { data: await handleResponse(response) };
  },

  delete: async (url: string): Promise<{ data: any }> => {
    const response = await fetch(`${baseURL}${url}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return { data: await handleResponse(response) };
  },

  patch: async (url: string, data?: any): Promise<{ data: any }> => {
    const response = await fetch(`${baseURL}${url}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return { data: await handleResponse(response) };
  },
};

export default api;