// src/pages/BookPage.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchBookById } from '../api/booksApi';
import { useAuthStore } from '../store/useAuthStore';
import { Container, Grid, Box, Typography, Button, CircularProgress, Alert, Divider } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DownloadIcon from '@mui/icons-material/Download';

const BookPage = () => {
    const { id } = useParams(); // 从URL获取书籍ID
    const navigate = useNavigate();
    const { isAuthenticated, purchaseBook } = useAuthStore();

    const { data: book, error, isLoading } = useQuery({
        queryKey: ['book', id],
        queryFn: () => fetchBookById(id),
    });

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error" sx={{ m: 4 }}>Error: {error.message}</Alert>;
    }

    // const isPurchased = purchasedBooks.includes(book.id); // 暂时注释掉，后续可能会用到

    const handleActionClick = () => {
        if (!isAuthenticated) {
            navigate('/login');
        }
        // 如果已登录，可以在这里处理加入购物车或购买的逻辑
        // 我们先模拟购买
        else {
            purchaseBook(book.id);
            alert(`Thank you for purchasing ${book.title}!`);
        }
    };

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            navigate('/login');
        } else {
            alert(`${book.title} has been added to your cart.`);
        }
    }

    return (
        <Container sx={{ mt: 4 }}>
            <Grid container spacing={4}>
                {/* 左侧: 书籍封面 */}
                <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <img src={book.cover} alt={book.title} style={{ maxWidth: '100%', height: 'auto', maxHeight: '500px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }} />
                </Grid>

                {/* 右侧: 书籍信息和操作按钮 */}
                <Grid item xs={12} md={8}>
                    <Typography variant="h3" component="h1" gutterBottom>
                        {book.title}
                    </Typography>
                    <Typography variant="h5" component="h2" color="text.secondary" gutterBottom>
                        by {book.author} ({book.year})
                    </Typography>
                    <Typography variant="h4" color="primary" sx={{ my: 2, fontWeight: 'bold' }}>
                        ${book.price.toFixed(2)}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body1" paragraph>
                        {book.description}
                    </Typography>

                    <Box sx={{ mt: 4 }}>
              {/* 情况二: 未购买 (无论是否登录，按钮样式相同，但功能不同) */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button variant="contained" size="large" onClick={handleActionClick}>
                                Buy Now
                            </Button>
                            <Button variant="outlined" size="large" startIcon={<ShoppingCartIcon />} onClick={handleAddToCart}>
                                Add to Cart
                            </Button>
                        </Box>

                    </Box>
                </Grid>
            </Grid>
        </Container>
    );
};

export default BookPage;