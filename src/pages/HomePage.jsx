// src/pages/HomePage.jsx
import React, { useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchStore } from '../store/useSearchStore';
import { getAllBooks } from '../api/booksApi';
import SearchBar from '../components/SearchBar';
import BookCard from '../components/BookCard';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useInView } from 'react-intersection-observer';

const HomePage = () => {
  const query = '';

  const {
    data,
    error,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['books', query],
    queryFn: ({ pageParam = 1 }) => getAllBooks({ query, type: 'title', pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });


  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allBooks = data?.pages.flatMap(page => page.books) || [];

  return (
    <>
      <SearchBar />
      <Box>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
             <CircularProgress />
          </Box>
        )}

        {error && <Alert severity="error">Error fetching books: {error.message}</Alert>}

        {/* Vertically arrange cards */}
        {!isLoading && allBooks && (
           <Box sx={{
              display: 'flex',
              flexDirection: 'column', // Vertically arrange
              alignItems: 'center', // Horizontally center
              gap: 0, // The gap is controlled by the margin bottom of the card itself
              mt: 2,
           }}>
            {allBooks.length > 0 ? (
              allBooks.map(book => (
                <BookCard key={book.id} book={book} />
              ))
            ) : (
              <Typography sx={{ mt: 4 }}>No books found.</Typography>
            )}
          </Box>
        )}

        {/* ... (infinite scroll trigger and list end hint remain unchanged) ... */}
        <div ref={ref}>
          {isFetchingNextPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </div>

        {!hasNextPage && allBooks.length > 0 && (
          <Typography sx={{ textAlign: 'center', my: 4, color: 'text.secondary' }}>
            End of all books.
          </Typography>
        )}
      </Box>
    </>
  );
};

export default HomePage;