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

  // 使用 useInfiniteQuery 替代 useQuery
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

  // 设置Intersection Observer
  const { ref, inView } = useInView();

  // 当ref元素进入视口时，获取下一页数据
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 从所有页面中提取书籍
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

        {/* 使用一个带有 flexbox 样式的 Box 来作为卡片的容器。 */}
        {!isLoading && allBooks && (
           <Box sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'left',
              gap: 2,
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

        {/* 无限滚动触发器 */}
        <div ref={ref}>
          {isFetchingNextPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </div>

        {/* 显示已加载完所有数据的提示 */}
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