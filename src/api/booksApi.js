// src/api/booksApi.js
import { fetchApiBooks, fetchApiBookById, fetchApiBooksRaw } from './apiService';

// Modify getBookById to use the real API service
export const getBookById = async (id) => {
  console.log(`Fetching book with id: ${id} from REAL API`);
  return fetchApiBookById(id);
};

// Modify getAllBooks to use the real API service
// It will return all books, and nextPage will be undefined
export const getAllBooks = async ({ query, type, pageParam = 1 }) => {
  console.log(`Fetching REAL API books (query=${query}, type=${type})`);
  if (pageParam !== 1) {
      return { books: [], nextPage: undefined };
  }
  // Pass the parameters down
  return fetchApiBooks({ query, type });
};

export const getAllBooksRaw = async () => {
  return fetchApiBooksRaw();
};