// src/pages/SearchResultsPage.jsx
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchBooks } from '../api/booksApi';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import SearchResultItem from '../components/SearchResultItem';
import SearchBar from '../components/SearchBar';
import { useInView } from 'react-intersection-observer'; // 引入 useInView

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query') || ''; // 如果没有query参数，则为空字符串
  const type = searchParams.get('type') || 'title'; // 默认类型为title

  // 如果没有搜索参数，自动显示所有书籍
  React.useEffect(() => {
    if (!searchParams.get('query') && !searchParams.get('type')) {
      // 可以在这里添加逻辑来处理空搜索的情况
      console.log('No search parameters provided, showing all books');
    }
  }, [searchParams]);

  // 使用 useInfiniteQuery
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['bookSearch', { query, type }],
    // queryFn现在接收一个包含pageParam的对象
    queryFn: ({ pageParam = 1 }) => fetchBooks({ query, type, pageParam }),
    // getNextPageParam告诉React Query如何获取下一页的参数
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
        <>
          {(() => {
            const allBooks = data?.pages.flatMap(page => page.books) || [];
            return allBooks.map((book) => (
              <SearchResultItem key={book.id} book={book} />
            ));
          })()}

          {/* 这个div是我们的“触发器”，当它滚动到屏幕上时，会加载更多内容 */}
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
        </>
      )}
    </Container>
  );
};

export default SearchResultsPage;