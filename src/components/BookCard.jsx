// src/components/BookCard.jsx
import React from 'react';
import { Paper, Typography, Box, Grid } from '@mui/material';
import { Link } from 'react-router-dom';

const BookCard = ({ book }) => {
  return (
    // Use Link component to make the entire card clickable and fill the container width
    <Link to={`/book/${book.id}`} style={{ textDecoration: 'none', width: '100%' }}>
      <Paper
        sx={{
          p: 2,
          mb: 2, // Keep the spacing with the next card
          flexGrow: 1,
          width: '100%',
          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
          '&:hover': {
            transform: 'scale(1.02)', // Slightly enlarge when hovering
            boxShadow: 4, // Add shadow when hovering
          },
        }}
        elevation={2}
      >
        <Grid container spacing={2} alignItems="center">
          {/* Book title */}
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" component="h2" title={book.title} noWrap>
              {book.title}
            </Typography>
          </Grid>
          {/* Book author */}
          <Grid item xs={12} sm={3}>
            <Typography variant="body1" color="text.secondary">
              by {book.author}
            </Typography>
          </Grid>
          {/* Book price */}
          <Grid item xs={12} sm={3}>
            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                ${book.price.toFixed(2)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Link>
  );
};

export default BookCard;