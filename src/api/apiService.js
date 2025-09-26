// src/api/apiService.js
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// The backend is running on http://localhost:3000
const apiClient = axios.create({
  baseURL: 'http://localhost:3000' 
});

// Use Axios interceptor to automatically append JWT Token in each request
apiClient.interceptors.request.use(config => {
  // Get token from Zustand store
  const token = useAuthStore.getState().token; 
  if (token && config.url.startsWith('/api')) { // Only add JWT Token to protected /api routes
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


// --- User Routes (Public) ---
// Corresponds to src/routes/users.ts
export const apiRegister = (email, password) => {
  return apiClient.post('/users/register', { email, password });
};

export const apiLogin = (email, password) => {
  return apiClient.post('/users/login', { email, password });
};


// --- Book Routes (Public) ---
// Corresponds to src/routes/books.ts
// Note: Backend API GET /books returns all books, not supporting pagination.
// Adjust this function to match the format expected by the frontend useInfiniteQuery (but only return one page).
export const fetchApiBooks = async ({ query, type }) => {
  const response = await apiClient.get('/books', {
    params: { query, type }
  });
   
   // Convert backend data (price_cents, cover_image_url) to frontend expected format (price, cover)
   const formattedBooks = response.data.map(book => ({
     ...book,
     price: book.price_cents / 100, // Convert cents to dollars
     cover: book.cover_image_url,
     description: book.description || "No description available."
   }));

   return {
     books: formattedBooks,
     nextPage: undefined, // Tell useInfiniteQuery that there is no next page
   };
};

export const fetchApiBooksRaw = async () => {
  const response = await apiClient.get('/books');
  try {
    const response = await apiClient.get('/books');
    return response.data || []; 
  } catch (error) {
    console.error("Failed to get raw books for ZKP:", error);
    return []; 
  }
};


export const fetchApiBookById = async (id) => {
  const response = await apiClient.get(`/books/${id}`);
  const book = response.data;

  // Convert backend data to frontend expected format
  return {
    ...book,
    price: book.price_cents / 100,
    cover: book.cover_image_url,
    description: book.description || "No description available."
  };
};


// --- Order Routes (Protected) ---
// Corresponds to src/routes/orders.ts
export const createOrder = (commitmentHash, priceInCents) => {
  // This will be automatically sent with the Token by the interceptor
  return apiClient.post('/api/orders', { commitmentHash, priceInCents });
};