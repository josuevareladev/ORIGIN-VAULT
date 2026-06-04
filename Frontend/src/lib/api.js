const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const fetchAPI = async (endpoint, options = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('origin_vault_token') : null;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  // Manejo defensivo en caso de que el backend no devuelva JSON puro en errores fatales
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Intercepción global: Destrucción de sesión fantasma
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('origin_vault_token');
      window.location.href = '/login';
    }
    
    throw new Error(data.error?.message || 'An unexpected error occurred during the request.');
  }

  return data;
};