// src/api/apiService.js
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// 假设您的后端运行在 http://localhost:3000
const apiClient = axios.create({
  baseURL: 'http://localhost:3000' 
});

// 使用 Axios 拦截器在每个请求中自动附加 JWT Token
apiClient.interceptors.request.use(config => {
  // 从 Zustand store 获取 token
  const token = useAuthStore.getState().token; 
  if (token && config.url.startsWith('/api')) { // 仅为受保护的 /api 路由添加
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


// --- User Routes (公开) ---
// 对应 src/routes/users.ts
export const apiRegister = (email, password) => {
  return apiClient.post('/users/register', { email, password });
};

export const apiLogin = (email, password) => {
  return apiClient.post('/users/login', { email, password });
};


// --- Book Routes (公开) ---
// 对应 src/routes/books.ts
// 注意：您的后端 API GET /books 返回所有书籍，不支持分页。
// 我们将调整此函数以匹配前端 useInfiniteQuery 所期望的格式（但只返回一页）。
export const fetchApiBooks = async () => {
   const response = await apiClient.get('/books');
   
   // 将后端数据 (price_cents, cover_image_url) 转换为前端期望的格式 (price, cover)
   const formattedBooks = response.data.map(book => ({
     ...book,
     price: book.price_cents / 100, // 转换美分为美元
     cover: book.cover_image_url,
     description: book.description || "No description available."
   }));

   return {
     books: formattedBooks,
     nextPage: undefined, // 告知 useInfiniteQuery 没有下一页了
   };
};

// 后端没有 /books/:id 路由。我们必须获取所有书籍并在客户端过滤。
// (对于大型目录效率不高，但这匹配您提供的后端。)
export const fetchApiBookById = async (id) => {
    const { books } = await fetchApiBooks(); // 获取所有书籍
    const book = books.find(b => b.id.toString() === id.toString()); 
    if (!book) {
        throw new Error('Book not found');
    }
    return book;
};


// --- Order Routes (受保护) ---
// 对应 src/routes/orders.ts
export const createOrder = (commitmentHash, priceInCents) => {
  // 这会通过拦截器自动发送 Token
  return apiClient.post('/api/orders', { commitmentHash, priceInCents });
};