// API client that communicates with Express server
// This enables shared data across all devices

// Use environment variable for API URL, or construct dynamically for local development
const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : typeof window !== 'undefined' 
    ? `http://${window.location.hostname}:5000/api`
    : 'http://localhost:5000/api';

console.log('🔌 API Base URL:', API_BASE);

// Helper: Make API requests
const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }
    
    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Helper: Manage current user in localStorage
const getStoredUser = () => {
  try {
    const stored = localStorage.getItem('currentUser');
    if (!stored) return null;
    
    const user = JSON.parse(stored);
    
    // Validate that the user has required fields
    if (!user.id || !user.email || !user.role) {
      console.warn('⚠️ Stored user missing required fields:', { hasId: !!user.id, hasEmail: !!user.email, hasRole: !!user.role });
      // Clear invalid user data
      localStorage.removeItem('currentUser');
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('❌ Error parsing stored user:', error);
    localStorage.removeItem('currentUser');
    return null;
  }
};

const setStoredUser = (user) => {
  if (user) {
    // Validate user has required fields
    if (!user.id || !user.email || !user.role) {
      console.error('❌ Cannot store user - missing required fields:', { hasId: !!user.id, hasEmail: !!user.email, hasRole: !!user.role, keys: Object.keys(user) });
      throw new Error('User object missing required fields (id, email, role)');
    }
    
    console.log('💾 Storing user in localStorage:', { id: user.id, email: user.email, role: user.role });
    localStorage.setItem('currentUser', JSON.stringify(user));
    console.log('✅ User stored successfully');
  } else {
    console.log('🗑️ Clearing localStorage user');
    localStorage.removeItem('currentUser');
  }
};

export const api = {
  // Auth methods
  auth: {
    isAuthenticated: async () => {
      return !!getStoredUser();
    },
    
    me: async () => {
      const user = getStoredUser();
      if (!user) {
        throw new Error('Not authenticated');
      }
      console.log('📋 User from localStorage:', { id: user.id, email: user.email, role: user.role });
      if (!user.role) {
        console.error('❌ ERROR: Stored user missing role field!', Object.keys(user));
        throw new Error('User object missing required role field');
      }
      // Return the cached user - it should have all correct fields from login
      return JSON.parse(JSON.stringify(user));
    },
    
    login: async (email, password) => {
      const user = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      console.log('🔐 Login successful - User:', user);
      
      // VALIDATE: email must match what was submitted
      if (!user.email || user.email.toLowerCase() !== email.toLowerCase()) {
        console.error('❌ ERROR: Server returned wrong user! Email mismatch. Expected:', email, 'Got:', user?.email);
        throw new Error('Server returned incorrect user');
      }
      
      if (!user.id) {
        console.error('❌ ERROR: Server response missing id!');
        throw new Error('Invalid server response - missing id');
      }
      
      if (!user.role) {
        console.error('❌ ERROR: Server response missing role!', Object.keys(user));
        throw new Error('User object missing required role field');
      }
      
      console.log('🔐 SERVER RESPONSE VALIDATED ✅ Role:', user.role);

      // Remove password before storing in localStorage
      const userToStore = { ...user };
      delete userToStore.password;
      
      console.log('💾 Storing user in localStorage:', { id: userToStore.id, email: userToStore.email, role: userToStore.role });
      setStoredUser(userToStore);

      // Verify localStorage consistency
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        console.log('✅ User stored in localStorage successfully');
        console.log('✅ Stored user role:', parsed.role);
      } else {
        console.error('⚠️ Failed to store user in localStorage');
      }

      console.log('🔐 ====== ABOUT TO RETURN FROM LOGIN ======');
      console.log('🔐 userToStore object:', userToStore);
      console.log('🔐 userToStore.role:', userToStore.role);
      console.log('🔐 userToStore.email:', userToStore.email);
      console.log('🔐 userToStore.id:', userToStore.id);
      console.log('🔐 typeof role:', typeof userToStore.role);
      
      return userToStore;
    },
    
    logout: async () => {
      try {
        console.log('🔒 Starting logout process...');
        
        // Clear user data from localStorage
        setStoredUser(null);

        // Invalidate the session on the server (gracefully handle if endpoint doesn't exist)
        try {
          await apiRequest('/auth/logout', { method: 'POST' });
          console.log('✅ Server logout completed');
        } catch (serverError) {
          console.warn('⚠️ Server logout failed (continuing anyway):', serverError.message);
        }

        // Verify localStorage is cleared
        if (localStorage.getItem('currentUser')) {
          console.error('⚠️ Failed to clear localStorage user');
          localStorage.removeItem('currentUser');
        } else {
          console.log('✅ localStorage user cleared successfully');
        }

        console.log('🔒 Logout process completed successfully');
        return { success: true };
      } catch (error) {
        console.error('❌ Logout failed:', error);
        // Even on error, try to clear localStorage
        setStoredUser(null);
        throw error;
      }
    },
    
    redirectToLogin: () => {
      setStoredUser(null);
      window.location.href = '/';
    },
    
    updateMe: async (data) => {
      const user = getStoredUser();
      if (!user) {
        throw new Error('Not authenticated');
      }
      const updated = { ...user, ...data };
      setStoredUser(updated);
      return JSON.parse(JSON.stringify(updated));
    }
  },

  // Entities
  entities: {
    User: {
      list: async () => {
        return await apiRequest('/users');
      },
      update: async (id, data) => {
        return await apiRequest(`/users/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      }
    },
    Product: {
      list: async (order) => {
        return await apiRequest('/products');
      },
      filter: async (filters) => {
        const params = new URLSearchParams();
        if (filters.product_id) params.append('product_id', filters.product_id);
        return await apiRequest(`/products/filter?${params.toString()}`);
      },
      create: async (data) => {
        return await apiRequest('/products', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      },
      update: async (id, data) => {
        return await apiRequest(`/products/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      },
      delete: async (id) => {
        return await apiRequest(`/products/${id}`, {
          method: 'DELETE'
        });
      }
    },
    Event: {
      list: async (order, limit) => {
        const params = new URLSearchParams();
        if (order) params.append('order', order);
        if (limit) params.append('limit', limit);
        return await apiRequest(`/events?${params.toString()}`);
      },
      create: async (data) => {
        return await apiRequest('/events', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      },
      delete: async (id) => {
        return await apiRequest(`/events/${id}`, {
          method: 'DELETE'
        });
      }
    },
    LoanRequest: {
      list: async (order, limit) => {
        const params = new URLSearchParams();
        if (order) params.append('order', order);
        if (limit) params.append('limit', limit);
        return await apiRequest(`/loans?${params.toString()}`);
      },
      filter: async (filters) => {
        return await apiRequest('/loans/filter', {
          method: 'POST',
          body: JSON.stringify(filters)
        });
      },
      create: async (data) => {
        return await apiRequest('/loans', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      },
      update: async (id, data) => {
        return await apiRequest(`/loans/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      }
    },
    Transaction: {
      list: async (order, limit) => {
        const params = new URLSearchParams();
        if (order) params.append('order', order);
        if (limit) params.append('limit', limit);
        return await apiRequest(`/transactions?${params.toString()}`);
      },
      filter: async (filters) => {
        return await apiRequest('/transactions/filter', {
          method: 'POST',
          body: JSON.stringify(filters)
        });
      },
      create: async (data) => {
        return await apiRequest('/transactions', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }
    }
  },

  // Example: fetch a list of events
  getEvents: async () => {
    return await api.entities.Event.list('-event_date', 10);
  },

  // Example: fetch loans
  getLoans: async () => {
    return await api.entities.LoanRequest.list('-created_date');
  },

  // Example: create a loan
  createLoan: async (loan) => {
    return await api.entities.LoanRequest.create(loan);
  },
};
