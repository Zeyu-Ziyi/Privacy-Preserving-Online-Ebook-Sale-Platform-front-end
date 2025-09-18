// src/components/BookCard.jsx
import React from 'react';
import { Card, CardMedia, CardContent, Typography } from '@mui/material';
import { Link } from 'react-router-dom'; // 引入Link组件

const BookCard = ({ book }) => {
  return (
    // 使用Link组件包裹整个卡片，实现点击跳转
    <Link to={`/book/${book.id}`} style={{ textDecoration: 'none' }}>
      <Card sx={{
          width: 180,
          height: 350, // 增加高度以容纳价格
          m: 1,
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out', // 添加过渡效果
          '&:hover': {
            transform: 'scale(1.05)', // 悬浮时放大
            boxShadow: 6, // 悬浮时显示更深的阴影
          },
        }}
      >
        <CardMedia
          component="img"
          sx={{ height: 220, objectFit: 'cover' }}
          image={book.cover}
          alt={book.title}
        />
        <CardContent sx={{ flexGrow: 1, overflow: 'hidden', p: 1.5, display: 'flex', flexDirection: 'column' }}>
          <Typography
              gutterBottom
              variant="subtitle2"
              component="div"
              title={book.title}
              sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {book.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {book.author}
          </Typography>
          {/* 新增: 显示价格 */}
          <Typography variant="h6" color="primary" sx={{ mt: 'auto', fontWeight: 'bold' }}>
            ${book.price.toFixed(2)}
          </Typography>
        </CardContent>
      </Card>
    </Link>
  );
};

export default BookCard;