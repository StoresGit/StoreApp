import axios from 'axios';
import backend_url from '../config/config';

// Create axios instance with default config
const api = axios.create({
  baseURL: backend_url,
  timeout: 30000, // 30 second timeout
});

// Request queue to manage concurrent requests
let requestQueue = [];
let isProcessingQueue = false;
const MAX_CONCURRENT_REQUESTS = 5; // Increased from 3
const REQUEST_DELAY = 100; // Reduced from 200ms

// Process request queue
const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const batch = requestQueue.splice(0, MAX_CONCURRENT_REQUESTS);
    
    try {
      await Promise.all(batch.map(({ resolve, reject, config }) => 
        api(config).then(resolve).catch(reject)
      ));
    } catch (error) {
      console.error('Batch request error:', error);
    }
    
    // Delay between batches
    if (requestQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
    }
  }
  
  isProcessingQueue = false;
};

// Add request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching issues
    config.params = {
      ...config.params,
      _t: Date.now()
    };
    // Attach token if present
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 429 rate limiting
    if (error.response?.status === 429 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Extract retry delay from headers or use default
      const retryDelay = error.response.headers['retry-after'] 
        ? parseInt(error.response.headers['retry-after']) * 1000 
        : Math.random() * 2000 + 1000; // Random delay between 1-3 seconds
      
      console.log(`Rate limited. Retrying after ${retryDelay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      return api(originalRequest);
    }

    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
      console.error('Network error:', error.message);
      return Promise.reject(new Error('Network connection failed. Please check your internet connection.'));
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.status, error.response.data);
      return Promise.reject(new Error('Server error. Please try again later.'));
    }

    return Promise.reject(error);
  }
);

// Wrapper function for making requests with queue management
const makeRequest = (config) => {
  return new Promise((resolve, reject) => {
    if (requestQueue.length < 20) { // Increased from 10
      requestQueue.push({ resolve, reject, config });
      processQueue();
    } else {
      reject(new Error('Too many requests queued. Please try again later.'));
    }
  });
};

// API methods
export const apiService = {
  get: (url, config = {}) => makeRequest({ ...config, method: 'GET', url }),
  post: (url, data, config = {}) => makeRequest({ ...config, method: 'POST', url, data }),
  put: (url, data, config = {}) => makeRequest({ ...config, method: 'PUT', url, data }),
  patch: (url, data, config = {}) => makeRequest({ ...config, method: 'PATCH', url, data }),
  delete: (url, config = {}) => makeRequest({ ...config, method: 'DELETE', url }),
  
  // Branch-specific methods
  branches: {
    create: (branchData) => apiService.post('/branch', branchData),
    getAll: () => apiService.get('/branch'),
    getById: (id) => apiService.get(`/branch/${id}`),
    update: (id, branchData) => apiService.put(`/branch/${id}`, branchData),
    delete: (id) => apiService.delete(`/branch/${id}`),
  },
  
  // Item-specific methods
  items: {
    create: (itemData) => apiService.post('/items', itemData),
    getAll: () => apiService.get('/items'),
    getById: (id) => apiService.get(`/items/${id}`),
    update: (id, itemData) => apiService.put(`/items/${id}`, itemData),
    delete: (id) => apiService.delete(`/items/${id}`),
  },
  
  // Wastage-specific methods
  wastage: {
    create: (wastageData) => apiService.post('/wastage', wastageData),
    getAll: () => apiService.get('/wastage'),
    getById: (id) => apiService.get(`/wastage/${id}`),
    update: (id, wastageData) => apiService.put(`/wastage/${id}`, wastageData),
    delete: (id) => apiService.delete(`/wastage/${id}`),
  },
  
  // Order-specific methods
  orders: {
    create: (orderData) => apiService.post('/orders', orderData),
    getAll: () => apiService.get('/orders'),
    getById: (id) => apiService.get(`/orders/${id}`),
    update: (id, orderData) => apiService.patch(`/orders/${id}`, orderData),
    delete: (id) => apiService.delete(`/orders/${id}`),
    updateStatus: (id, status) => apiService.patch(`/orders/${id}`, { status }),
  },
  
  // Section-specific methods
  sections: {
    create: (sectionData) => apiService.post('/sections', sectionData),
    getAll: () => apiService.get('/sections'),
    getActive: () => apiService.get('/sections/active'),
    getById: (id) => apiService.get(`/sections/${id}`),
    update: (id, sectionData) => apiService.put(`/sections/${id}`, sectionData),
    delete: (id) => apiService.delete(`/sections/${id}`),
  },
  
  // Purchase Category methods
  purchaseCategories: {
    create: (categoryData) => apiService.post('/purchase-categories', categoryData),
    getAll: () => apiService.get('/purchase-categories'),
    getById: (id) => apiService.get(`/purchase-categories/${id}`),
    update: (id, categoryData) => apiService.put(`/purchase-categories/${id}`, categoryData),
    delete: (id) => apiService.delete(`/purchase-categories/${id}`),
  },
  
  // Branch Category methods
  branchCategories: {
    create: (categoryData) => apiService.post('/branch-categories', categoryData),
    getAll: () => apiService.get('/branch-categories'),
    getById: (id) => apiService.get(`/branch-categories/${id}`),
    update: (id, categoryData) => apiService.put(`/branch-categories/${id}`, categoryData),
    delete: (id) => apiService.delete(`/branch-categories/${id}`),
  },

  // Item Category methods
  itemCategories: {
    create: (categoryData) => apiService.post('/item-categories', categoryData),
    getAll: () => apiService.get('/item-categories'),
    getById: (id) => apiService.get(`/item-categories/${id}`),
    update: (id, categoryData) => apiService.put(`/item-categories/${id}`, categoryData),
    delete: (id) => apiService.delete(`/item-categories/${id}`),
  },

  // Sub Category methods
  subCategories: {
    create: (subCategoryData) => apiService.post('/sub-categories', subCategoryData),
    getAll: () => apiService.get('/sub-categories'),
    getById: (id) => apiService.get(`/sub-categories/${id}`),
    update: (id, subCategoryData) => apiService.put(`/sub-categories/${id}`, subCategoryData),
    delete: (id) => apiService.delete(`/sub-categories/${id}`),
  },

  // Unit methods
  units: {
    create: (unitData) => apiService.post('/units', unitData),
    getAll: () => apiService.get('/units'),
    getById: (id) => apiService.get(`/units/${id}`),
    update: (id, unitData) => apiService.put(`/units/${id}`, unitData),
    delete: (id) => apiService.delete(`/units/${id}`),
  },

  // Tax methods
  taxes: {
    create: (taxData) => apiService.post('/taxes', taxData),
    getAll: () => apiService.get('/taxes'),
    getById: (id) => apiService.get(`/taxes/${id}`),
    update: (id, taxData) => apiService.put(`/taxes/${id}`, taxData),
    delete: (id) => apiService.delete(`/taxes/${id}`),
  },

  // Brand methods
  brands: {
    create: (brandData) => apiService.post('/brands', brandData),
    getAll: () => apiService.get('/brands'),
    getById: (id) => apiService.get(`/brands/${id}`),
    update: (id, brandData) => apiService.put(`/brands/${id}`, brandData),
    delete: (id) => apiService.delete(`/brands/${id}`),
  },

  // Department methods
  departments: {
    create: (departmentData) => apiService.post('/departments', departmentData),
    getAll: () => apiService.get('/departments'),
    getById: (id) => apiService.get(`/departments/${id}`),
    update: (id, departmentData) => apiService.put(`/departments/${id}`, departmentData),
    delete: (id) => apiService.delete(`/departments/${id}`),
  }
};

// Batch request function for multiple endpoints
export const batchRequest = async (requests, batchSize = 3, delay = 200) => {
  const results = [];
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    
    try {
      const batchResults = await Promise.allSettled(
        batch.map(request => api(request))
      );
      
      results.push(...batchResults);
      
      // Add delay between batches (except for the last batch)
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.error('Batch request failed:', error);
      // Add failed results to maintain array length
      results.push(...batch.map(() => ({ status: 'rejected', reason: error })));
    }
  }
  
  return results;
};

// Helper function to handle common data fetching patterns
export const fetchMultipleEndpoints = async (endpoints) => {
  const requests = endpoints.map(endpoint => ({
    method: 'GET',
    url: endpoint.url,
    ...endpoint.config
  }));
  
  const results = await batchRequest(requests);
  
  const data = {};
  results.forEach((result, index) => {
    const key = endpoints[index].key;
    if (result.status === 'fulfilled') {
      data[key] = result.value.data;
    } else {
      console.error(`Failed to fetch ${key}:`, result.reason);
      data[key] = [];
    }
  });
  
  return data;
};

export default api; 