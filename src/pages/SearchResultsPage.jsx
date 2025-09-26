// src/pages/SearchResultsPage.jsx
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getAllBooks } from '../api/booksApi';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
// Import BookCard instead of SearchResultItem
import BookCard from '../components/BookCard';
import SearchBar from '../components/SearchBar';
import { useInView } from 'react-intersection-observer';

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query') || '';
  const type = searchParams.get('type') || 'title';

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['bookSearch', { query, type }],
    queryFn: ({ pageParam = 1 }) => getAllBooks({ query, type, pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const searchTitle = query && query.trim() ? `Search results for "${query}"` : 'All Books';

  return (
    <Container>
      <SearchBar />

      <Typography variant="h4" component="h1" gutterBottom>
        {searchTitle}
      </Typography>

      {status === 'loading' ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : status === 'error' ? (
        <Alert severity="error">An error occurred: {error.message}</Alert>
      ) : (
        // Use a vertically arranged Box to display the new BookCard list
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {(() => {
            const allBooks = data?.pages.flatMap(page => page.books) || [];
            // Use BookCard here
            return allBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ));
          })()}

          {/* ... (infinite scroll trigger and other elements remain unchanged) ... */}
          <div ref={ref}>
            {isFetchingNextPage && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress />
              </Box>
            )}
          </div>
          
          {(() => {
            const allBooks = data?.pages.flatMap(page => page.books) || [];
            return !hasNextPage && allBooks.length > 0 ? (
             <Typography sx={{ textAlign: 'center', my: 4, color: 'text.secondary' }}>
                {query && query.trim() ? 'End of search results.' : 'End of all books.'}
             </Typography>
            ) : null;
          })()}

          {(() => {
            const allBooks = data?.pages.flatMap(page => page.books) || [];
            return allBooks.length === 0 ? (
            <Typography sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}>
              {query && query.trim() ? 'No results found for your search.' : 'No books available.'}
            </Typography>
            ) : null;
          })()}
        </Box>
      )}
    </Container>
  );
};

export default SearchResultsPage;