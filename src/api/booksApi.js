// src/api/booksApi.js
import { fetchApiBooks, fetchApiBookById, fetchApiBooksRaw } from './apiService';

// 修改 getBookById 以使用真实的 API 服务
export const getBookById = async (id) => {
  console.log(`Fetching book with id: ${id} from REAL API`);
  return fetchApiBookById(id);
};

// 修改 getAllBooks 以使用真实的 API 服务
// 它将返回所有书籍，并且 nextPage 为 undefined
export const getAllBooks = async ({ pageParam = 1 }) => {
  console.log(`Fetching REAL API books (pageParam ignored, fetching all)`);
  // 我们的后端不支持分页，所以我们只在第一次加载（pageParam=1）时获取数据
  if (pageParam !== 1) {
      return { books: [], nextPage: undefined }; // 如果不是第一页，则不返回任何内容
  }
  return fetchApiBooks();
};

export const getAllBooksRaw = async () => {
  return fetchApiBooksRaw();
};