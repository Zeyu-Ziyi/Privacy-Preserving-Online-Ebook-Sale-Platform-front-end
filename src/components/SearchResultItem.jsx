// src/components/SearchResultItem.jsx
import React from 'react';
import { Paper, Grid, Typography, Box, Link as MuiLink } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const SearchResultItem = ({ book }) => {
  return (
    <Paper sx={{ p: 2, mb: 2, flexGrow: 1 }} elevation={2}>
      <Grid container spacing={2}>
        <Grid item xs={3} sm={2}>
          <MuiLink component={RouterLink} to={`/book/${book.id}`}>
            <img src={book.cover} alt={book.title} style={{ width: '100%', height: 'auto', borderRadius: '4px' }} />
          </MuiLink>
        </Grid>
        <Grid item xs={9} sm={10} container direction="column">
          <Box>
            <MuiLink component={RouterLink} to={`/book/${book.id}`} underline="hover" color="inherit">
              <Typography variant="h6" component="h2">{book.title}</Typography>
            </MuiLink>
            <Typography variant="body1" color="text.secondary">by {book.author}</Typography>
          </Box>
          <Typography variant="body2" sx={{ my: 1, display: { xs: 'none', sm: 'block' } }}>
            {book.description.substring(0, 150)}...
          </Typography>
          <Box sx={{ mt: 'auto', textAlign: 'right' }}>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
              ${book.price.toFixed(2)}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SearchResultItem;